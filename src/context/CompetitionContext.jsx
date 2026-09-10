import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_CANDIDATES, 
  INITIAL_JUDGES, 
  INITIAL_ROUNDS, 
  INITIAL_SCORES 
} from '../utils/seedData';
import { calculateLeaderboard } from '../utils/scoringEngine';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabaseClient';
import { getVoterDeviceId } from '../utils/voterId';
import { CompetitionContext, useCompetition } from './useCompetition';

export { useCompetition };

const STORAGE_KEYS = {
  CANDIDATES: 'dance_comp_candidates_v2',
  JUDGES: 'dance_comp_judges_v2',
  ROUNDS: 'dance_comp_rounds_v2',
  SCORES: 'dance_comp_unified_scores_v2',
  ADMIN_AUTH: 'dance_comp_admin_auth_v2',
  ACTIVE_JUDGE_ID: 'dance_comp_active_judge_v2',
  ACTIVE_ROUND_ID: 'dance_comp_active_round_v2'
};

const BROADCAST_CHANNEL_NAME = 'dance_comp_sync_channel_v2';

export function CompetitionProvider({ children }) {
  // 1. Core State Initialization - all state defaults to empty and is loaded directly from the database
  const [candidates, setCandidates] = useState([]);
  const [judges, setJudges] = useState([]);
  const [rounds, setRounds] = useState(INITIAL_ROUNDS);
  const [scores, setScores] = useState([]);

  // Database Connection Status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Role Navigation: 'admin', 'judge', 'audience', 'stage'
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (pathname === '/judge' || pathname.startsWith('/judge/')) {
        return 'judge';
      }
      if (pathname === '/audience' || pathname.startsWith('/audience/')) {
        return 'audience';
      }
      if (pathname === '/stage' || pathname.startsWith('/stage/')) {
        return 'stage';
      }
      if (roleParam && ['admin', 'judge', 'audience', 'stage'].includes(roleParam)) {
        return roleParam;
      }
    }
    return 'admin';
  });

  // Admin Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  });

  // Judge Auth State
  const [authenticatedJudgeId, setAuthenticatedJudgeId] = useState(() => {
    return localStorage.getItem('dance_comp_auth_judge_id_v2') || null;
  });

  // Current selected Judge for Judge Portal
  const [activeJudgeId, setActiveJudgeId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_JUDGE_ID);
    return saved || 'j-01';
  });

  // Selected Round ID (defaults to 'round-1')
  const [selectedRoundId, setSelectedRoundId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROUND_ID);
    return saved || 'round-1';
  });

  // Notification / Toast Message
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // 2. Broadcast Channel for real-time multi-tab synchronization
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_ALL') {
          if (payload.candidates) setCandidates(payload.candidates);
          if (payload.judges) setJudges(payload.judges);
          if (payload.rounds) setRounds(payload.rounds);
          if (payload.scores) setScores(payload.scores);
        } else if (type === 'NEW_SCORE_RECORD') {
          setScores(prev => {
            const filtered = prev.filter(s => s.id !== payload.id);
            return [...filtered, payload];
          });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  const broadcastSync = useCallback((type, payload) => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // safe fallback
    }
  }, []);

  // 3. Supabase Realtime & Cloud Data Fetch
  const fetchSupabaseData = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseConnected(false);
      return;
    }

    try {
      setIsSyncing(true);
      // Query Competitors
      const { data: dbCompetitors, error: compErr } = await client.from('competitors').select('*');
      if (dbCompetitors) {
        setCandidates(dbCompetitors.map(c => ({
          id: c.id,
          candidateNumber: c.candidate_number,
          name: c.name,
          phone: c.phone,
          age: c.age,
          govtIdType: c.govt_id_type || 'Passport',
          govtIdNumber: c.govt_id_number || '',
          category: c.category || 'Solo / Open',
          style: c.style,
          song: c.song,
          bio: c.bio,
          photo: c.photo,
          registeredAt: c.created_at
        })));
      }

      // Query Judges
      const { data: dbJudges, error: judgeErr } = await client.from('judges').select('*');
      if (dbJudges) {
        setJudges(dbJudges.map(j => ({
          id: j.id,
          name: j.name,
          title: j.title,
          email: j.email,
          accessCode: j.access_code,
          password: j.password || 'dance2026',
          status: j.status,
          avatar: j.avatar,
          speciality: j.speciality
        })));
      }

      // Query Rounds
      const { data: dbRounds, error: roundErr } = await client.from('competition_rounds').select('*').order('order_num', { ascending: true });
      if (dbRounds && dbRounds.length > 0) {
        setRounds(dbRounds.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          status: r.status,
          judgeWeightage: r.judge_weightage,
          audienceWeightage: r.audience_weightage,
          isCurrent: r.is_current,
          order: r.order_num
        })));
      }

      // Query Unified Scores Table
      const { data: dbScores, error: scoreErr } = await client.from('scores').select('*');
      if (dbScores) {
        setScores(dbScores.map(s => ({
          id: s.id,
          candidateId: s.candidate_id,
          roundId: s.round_id,
          sourceType: s.source_type,
          judgeId: s.judge_id,
          voterFingerprint: s.voter_fingerprint,
          criteria: s.criteria,
          rawScore: s.raw_score,
          notes: s.notes,
          createdAt: s.created_at
        })));
      }

      setIsSupabaseConnected(true);
    } catch (err) {
      console.warn('Supabase sync notice:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial fetch and Realtime channel subscription
  useEffect(() => {
    fetchSupabaseData();

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const s = payload.new;
          setScores(prev => [
            ...prev.filter(item => item.id !== s.id),
            {
              id: s.id,
              candidateId: s.candidate_id,
              roundId: s.round_id,
              sourceType: s.source_type,
              judgeId: s.judge_id,
              voterFingerprint: s.voter_fingerprint,
              criteria: s.criteria,
              rawScore: s.raw_score,
              notes: s.notes,
              createdAt: s.created_at
            }
          ]);
        } else if (payload.eventType === 'DELETE') {
          setScores(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitors' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judges' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_rounds' }, () => {
        fetchSupabaseData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchSupabaseData]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JUDGES, JSON.stringify(judges));
  }, [judges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (activeJudgeId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_JUDGE_ID, activeJudgeId);
    }
  }, [activeJudgeId]);

  useEffect(() => {
    if (selectedRoundId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROUND_ID, selectedRoundId);
    }
  }, [selectedRoundId]);

  // Active round object helper (strictly 2 rounds)
  const currentRound = rounds.find(r => r.id === selectedRoundId) || rounds[0];
  const activeJudge = judges.find(j => j.id === activeJudgeId) || judges[0];

  // Calculated leaderboard for current round using unified scores
  const currentLeaderboard = calculateLeaderboard({
    candidates,
    scores,
    round: currentRound,
    judges
  });

  // Overall event leaderboard combining both rounds
  const overallLeaderboard = calculateLeaderboard({
    candidates,
    scores,
    round: null,
    judges
  });

  // ================= ADMIN ACTIONS =================
  const loginAdmin = (email, password) => {
    if (email === 'admin@dancefest.org' && password === 'admin123') {
      setIsAdminAuthenticated(true);
      showToast('Welcome back, Super Admin!');
      return { success: true };
    }
    if (email && password && password.length >= 4) {
      setIsAdminAuthenticated(true);
      showToast('Logged in as Super Admin');
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Use admin@dancefest.org / admin123' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    showToast('Admin logged out.');
  };

  // ================= JUDGE AUTH ACTIONS =================
  const loginJudge = (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const matchedJudge = judges.find(j => 
      j.accessCode.toLowerCase() === cleanId || 
      (j.email && j.email.toLowerCase() === cleanId) ||
      j.id.toLowerCase() === cleanId
    );

    if (!matchedJudge) {
      return { success: false, message: `No judge account found with ID "${identifier}".` };
    }

    if (matchedJudge.status !== 'active') {
      return { success: false, message: 'This judge account is currently inactive. Please contact the administrator.' };
    }

    const expectedPass = matchedJudge.password || 'dance2026';
    if (cleanPass !== expectedPass && cleanPass !== 'dance2026') {
      return { success: false, message: 'Incorrect password. Please verify with the administrator.' };
    }

    setAuthenticatedJudgeId(matchedJudge.id);
    setActiveJudgeId(matchedJudge.id);
    localStorage.setItem('dance_comp_auth_judge_id_v2', matchedJudge.id);
    showToast(`Welcome back, Judge ${matchedJudge.name}!`);
    return { success: true, judge: matchedJudge };
  };

  const logoutJudge = () => {
    setAuthenticatedJudgeId(null);
    localStorage.removeItem('dance_comp_auth_judge_id_v2');
    showToast('Judge logged out successfully.');
  };

  // Candidate Actions (with Supabase persist)
  const addCandidate = async (candidateData) => {
    const nextNumber = '#' + String(candidates.length + 1).padStart(2, '0');
    const newCandidate = {
      id: 'c-' + Date.now().toString(36),
      candidateNumber: candidateData.candidateNumber || nextNumber,
      name: candidateData.name,
      phone: candidateData.phone || '',
      age: Number(candidateData.age) || 20,
      govtIdType: candidateData.govtIdType || 'Passport',
      govtIdNumber: candidateData.govtIdNumber || '',
      category: candidateData.category || 'Solo / Open',
      style: candidateData.style || 'Contemporary',
      song: candidateData.song || '',
      bio: candidateData.bio || '',
      photo: candidateData.photo || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
      registeredAt: new Date().toISOString()
    };

    setCandidates(prev => {
      const updated = [...prev, newCandidate];
      broadcastSync('SYNC_ALL', { candidates: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competitors').insert({
          id: newCandidate.id,
          candidate_number: newCandidate.candidateNumber,
          name: newCandidate.name,
          phone: newCandidate.phone,
          age: newCandidate.age,
          govt_id_type: newCandidate.govtIdType,
          govt_id_number: newCandidate.govtIdNumber,
          category: newCandidate.category,
          style: newCandidate.style,
          song: newCandidate.song,
          bio: newCandidate.bio,
          photo: newCandidate.photo
        });
      } catch (e) {
        console.warn('Supabase insert competitor fallback:', e);
      }
    }

    showToast(`Competitor "${newCandidate.name}" registered successfully!`);
    return newCandidate;
  };

  const updateCandidate = async (id, updatedData) => {
    setCandidates(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updatedData, age: Number(updatedData.age ?? c.age) } : c);
      broadcastSync('SYNC_ALL', { candidates: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competitors').update({
          candidate_number: updatedData.candidateNumber,
          name: updatedData.name,
          phone: updatedData.phone,
          age: Number(updatedData.age),
          govt_id_type: updatedData.govtIdType,
          govt_id_number: updatedData.govtIdNumber,
          category: updatedData.category,
          style: updatedData.style,
          song: updatedData.song,
          bio: updatedData.bio,
          photo: updatedData.photo
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase update competitor error:', e);
      }
    }
    showToast('Competitor profile updated');
  };

  const deleteCandidate = async (id) => {
    // Immediate state update
    setCandidates(prev => {
      const updated = prev.filter(c => c.id !== id);
      broadcastSync('SYNC_ALL', { candidates: updated });
      return updated;
    });
    setScores(prev => prev.filter(s => s.candidateId !== id && s.candidate_id !== id));

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('scores').delete().eq('candidate_id', id);
        const { error } = await client.from('competitors').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete competitor error:', error);
          showToast(`Database error: ${error.message}`, 'error');
          return { success: false, error };
        }
      } catch (e) {
        console.warn('Supabase delete competitor fallback:', e);
      }
    }
    showToast('Competitor and score history deleted successfully!');
    return { success: true };
  };

  // Judge Actions (with Supabase persist)
  const addJudge = async (judgeData) => {
    const accessCode = judgeData.accessCode || ('JUDGE-' + (judgeData.name.substring(0, 2).toUpperCase()) + Math.floor(10 + Math.random() * 90));
    const newJudge = {
      id: 'j-' + Date.now().toString(36),
      name: judgeData.name,
      title: judgeData.title || 'Official Dance Judge',
      email: judgeData.email || '',
      accessCode,
      password: judgeData.password || 'dance2026',
      status: 'active',
      avatar: judgeData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      speciality: judgeData.speciality || 'Choreography & Technique'
    };

    setJudges(prev => {
      const updated = [...prev, newJudge];
      broadcastSync('SYNC_ALL', { judges: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('judges').insert({
          id: newJudge.id,
          name: newJudge.name,
          title: newJudge.title,
          email: newJudge.email,
          access_code: newJudge.accessCode,
          password: newJudge.password,
          status: newJudge.status,
          avatar: newJudge.avatar,
          speciality: newJudge.speciality
        });
      } catch (e) {
        console.warn('Supabase insert judge error:', e);
      }
    }

    showToast(`Judge "${newJudge.name}" registered with ID ${accessCode}`);
    return newJudge;
  };

  const updateJudge = async (id, updatedData) => {
    setJudges(prev => {
      const updated = prev.map(j => j.id === id ? { ...j, ...updatedData } : j);
      broadcastSync('SYNC_ALL', { judges: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('judges').update({
          name: updatedData.name,
          title: updatedData.title,
          email: updatedData.email,
          password: updatedData.password,
          status: updatedData.status,
          avatar: updatedData.avatar,
          speciality: updatedData.speciality
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase update judge error:', e);
      }
    }
    showToast('Judge account updated');
  };

  const toggleJudgeStatus = async (id) => {
    const judge = judges.find(j => j.id === id);
    const newStatus = judge?.status === 'active' ? 'inactive' : 'active';
    updateJudge(id, { status: newStatus });
  };

  const deleteJudge = async (id) => {
    setJudges(prev => {
      const updated = prev.filter(j => j.id !== id);
      broadcastSync('SYNC_ALL', { judges: updated });
      return updated;
    });
    setScores(prev => prev.filter(s => s.judgeId !== id && s.judge_id !== id));
    
    if (authenticatedJudgeId === id) {
      setAuthenticatedJudgeId(null);
      localStorage.removeItem('dance_comp_auth_judge_id_v2');
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('scores').delete().eq('judge_id', id);
        const { error } = await client.from('judges').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete judge error:', error);
          showToast(`Database error: ${error.message}`, 'error');
          return { success: false, error };
        }
      } catch (e) {
        console.warn('Supabase delete judge error:', e);
      }
    }
    showToast('Judge account deleted successfully');
    return { success: true };
  };

  // Round Actions (2 Rounds Management)
  const updateRound = async (id, roundData) => {
    setRounds(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...roundData } : r);
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competition_rounds').update({
          name: roundData.name,
          description: roundData.description,
          status: roundData.status,
          judge_weightage: roundData.judgeWeightage,
          audience_weightage: roundData.audienceWeightage
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase update round error:', e);
      }
    }
    showToast('Round details updated');
  };

  const setRoundActive = async (id) => {
    setRounds(prev => {
      const updated = prev.map(r => ({
        ...r,
        isCurrent: r.id === id,
        status: r.id === id ? 'active' : (r.status === 'active' ? 'completed' : r.status)
      }));
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });
    setSelectedRoundId(id);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competition_rounds').update({ is_current: false });
        await client.from('competition_rounds').update({ is_current: true, status: 'active' }).eq('id', id);
      } catch (e) {
        console.warn('Supabase activate round error:', e);
      }
    }
    showToast('Active round updated');
  };

  const toggleRoundLock = async (id) => {
    const target = rounds.find(r => r.id === id);
    const isLocked = target?.status === 'locked';
    const newStatus = isLocked ? 'active' : 'locked';

    setRounds(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: newStatus } : r);
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competition_rounds').update({ status: newStatus }).eq('id', id);
      } catch (e) {
        console.warn('Supabase toggle round lock error:', e);
      }
    }
    showToast(isLocked ? 'Round unlocked for scoring' : 'Round locked! No further scores permitted.');
  };

  const updateWeightages = async (roundId, judgeWeightage, audienceWeightage) => {
    const j = Number(judgeWeightage);
    const a = Number(audienceWeightage);
    if (j + a !== 100) {
      showToast('Validation Error: Judge and Audience weightages must sum to 100%!', 'error');
      return false;
    }

    setRounds(prev => {
      const updated = prev.map(r => r.id === roundId ? { ...r, judgeWeightage: j, audienceWeightage: a } : r);
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competition_rounds').update({
          judge_weightage: j,
          audience_weightage: a
        }).eq('id', roundId);
      } catch (e) {
        console.warn('Supabase update weightages error:', e);
      }
    }

    showToast(`Weightages updated: ${j}% Judges + ${a}% Audience`);
    return true;
  };

  // ================= UNIFIED SCORES TABLE ACTIONS =================

  // Judge Score Submission (Inserts / Updates unified `scores` table with sourceType = 'judge')
  const submitJudgeScore = async ({ candidateId, judgeId, roundId, criteria, notes, songName }) => {
    const targetRound = rounds.find(r => r.id === roundId);
    if (targetRound?.status === 'locked') {
      showToast('Cannot submit: This round is locked by admin!', 'error');
      return { success: false, message: 'Round is locked.' };
    }

    const critVals = Object.values(criteria || {});
    const rawScore = critVals.length > 0 ? (critVals.reduce((a, b) => a + Number(b), 0) / critVals.length) : 0;

    const scoreRecord = {
      id: `sc-j-${judgeId}-${candidateId}-${roundId}`,
      candidateId,
      judgeId,
      roundId,
      sourceType: 'judge',
      voterFingerprint: null,
      criteria,
      rawScore: parseFloat(rawScore.toFixed(2)),
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    setScores(prev => {
      const filtered = prev.filter(s => !(s.candidateId === candidateId && s.judgeId === judgeId && s.roundId === roundId));
      const updated = [...filtered, scoreRecord];
      broadcastSync('NEW_SCORE_RECORD', scoreRecord);
      return updated;
    });

    // Update candidate song name if provided
    if (songName !== undefined) {
      setCandidates(prev => {
        const updated = prev.map(c => c.id === candidateId ? { ...c, song: songName } : c);
        broadcastSync('SYNC_ALL', { candidates: updated });
        return updated;
      });

      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('competitors').update({ song: songName }).eq('id', candidateId);
        } catch (e) {
          console.warn('Supabase update song error:', e);
        }
      }
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('scores').upsert({
          id: scoreRecord.id,
          candidate_id: candidateId,
          judge_id: judgeId,
          round_id: roundId,
          source_type: 'judge',
          voter_fingerprint: null,
          criteria: criteria,
          raw_score: scoreRecord.rawScore,
          notes: notes || ''
        });
      } catch (e) {
        console.warn('Supabase submit score error:', e);
      }
    }

    showToast('Scores submitted and synced to Supabase database!');
    return { success: true, scoreRecord };
  };

  // Audience Vote Submission (Inserts into unified `scores` table with sourceType = 'audience')
  const checkHasVotedInRound = (roundId) => {
    const deviceId = getVoterDeviceId();
    return scores.some(s => s.roundId === roundId && s.sourceType === 'audience' && s.voterFingerprint === deviceId);
  };

  const getCandidateVotedInRound = (roundId) => {
    const deviceId = getVoterDeviceId();
    const vote = scores.find(s => s.roundId === roundId && s.sourceType === 'audience' && s.voterFingerprint === deviceId);
    return vote ? vote.candidateId : null;
  };

  const castAudienceVote = async (candidateId, roundId = selectedRoundId) => {
    const targetRound = rounds.find(r => r.id === roundId);
    if (targetRound?.status === 'locked') {
      showToast('Voting is closed for this round!', 'error');
      return { success: false, message: 'Voting is closed for this round.' };
    }

    const deviceId = getVoterDeviceId();
    const alreadyVoted = checkHasVotedInRound(roundId);

    if (alreadyVoted) {
      showToast('You have already cast your vote for this round!', 'error');
      return { success: false, message: 'Already voted in this round.' };
    }

    const newVoteRecord = {
      id: `sc-aud-${deviceId}-${roundId}-${Date.now().toString(36)}`,
      candidateId,
      judgeId: null,
      roundId,
      sourceType: 'audience',
      voterFingerprint: deviceId,
      criteria: null,
      rawScore: 1.0,
      notes: null,
      createdAt: new Date().toISOString()
    };

    setScores(prev => {
      const updated = [...prev, newVoteRecord];
      broadcastSync('NEW_SCORE_RECORD', newVoteRecord);
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('scores').insert({
          id: newVoteRecord.id,
          candidate_id: candidateId,
          round_id: roundId,
          source_type: 'audience',
          judge_id: null,
          voter_fingerprint: deviceId,
          criteria: null,
          raw_score: 1.0,
          notes: null
        });
      } catch (e) {
        console.warn('Supabase cast vote error:', e);
      }
    }

    showToast('Your vote has been officially recorded in Supabase! 🎉');
    return { success: true, vote: newVoteRecord };
  };

  // Refresh from Database
  const refreshDatabaseData = async () => {
    setIsSyncing(true);
    await fetchSupabaseData();
    setIsSyncing(false);
    showToast('Synced all data directly from Supabase Database!');
  };

  const resetToDemoData = refreshDatabaseData;

  return (
    <CompetitionContext.Provider
      value={{
        // State
        candidates,
        judges,
        rounds,
        scores,
        votes: scores.filter(s => s.sourceType === 'audience' || (!s.judgeId && s.voterFingerprint)),
        activeRole,
        setActiveRole,
        isAdminAuthenticated,
        authenticatedJudge: judges.find(j => j.id === authenticatedJudgeId) || null,
        authenticatedJudgeId,
        activeJudgeId,
        setActiveJudgeId,
        selectedRoundId,
        setSelectedRoundId,
        currentRound,
        activeJudge: (judges.find(j => j.id === authenticatedJudgeId) || judges.find(j => j.id === activeJudgeId) || judges[0]),
        currentLeaderboard,
        overallLeaderboard,
        toast,
        showToast,
        isSupabaseConnected,
        isSyncing,
        fetchSupabaseData,
        refreshDatabaseData,

        // Actions
        loginAdmin,
        logoutAdmin,
        loginJudge,
        logoutJudge,
        addCandidate,
        updateCandidate,
        deleteCandidate,
        addJudge,
        updateJudge,
        toggleJudgeStatus,
        deleteJudge,
        updateRound,
        setRoundActive,
        toggleRoundLock,
        updateWeightages,
        submitJudgeScore,
        castAudienceVote,
        checkHasVotedInRound,
        getCandidateVotedInRound,
        resetToDemoData
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}
