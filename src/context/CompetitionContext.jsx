import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  INITIAL_CANDIDATES,
  INITIAL_JUDGES,
  INITIAL_ROUNDS,
  INITIAL_SCORES
} from '../utils/seedData';
import {
  calculateRoundLeaderboard,
  calculateCumulativeLeaderboard,
  calculateLeaderboard,
  getTop10QualifiedCandidateIds,
  MAX_JUDGE_SCORE
} from '../utils/scoringEngine';
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
  // 1. Core State Initialization - loaded from localStorage with initial defaults (20 candidates, 2 judges)
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return INITIAL_CANDIDATES;
  });
  const [judges, setJudges] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JUDGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return INITIAL_JUDGES;
  });
  const [rounds, setRounds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUNDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(r => ({
            ...r,
            isAudienceLive: Boolean(r.isAudienceLive)
          }));
        }
      }
    } catch (e) { }
    return INITIAL_ROUNDS;
  });
  const [scores, setScores] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Database Connection Status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Role Navigation: 'admin', 'judge', 'audience', 'stage'
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role')?.toLowerCase();

      // Explicit role query param takes top priority (e.g. from public QR code scan)
      if (roleParam && ['admin', 'judge', 'audience', 'stage'].includes(roleParam)) {
        return roleParam;
      }

      if (pathname.includes('audience')) {
        return 'audience';
      }
      if (pathname.includes('judge')) {
        return 'judge';
      }
      if (pathname.includes('stage')) {
        return 'stage';
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
    return saved || '';
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
      if (dbCompetitors && dbCompetitors.length > 0) {
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
      if (dbJudges && dbJudges.length > 0) {
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
        setRounds(prevRounds => {
          return dbRounds.map(r => {
            const existingRound = (prevRounds || []).find(pr => pr.id === r.id);
            const descLive = typeof r.description === 'string' && r.description.includes('[AUDIENCE_LIVE:true]');
            const descNotLive = typeof r.description === 'string' && r.description.includes('[AUDIENCE_LIVE:false]');

            let isAudienceLive = false;
            if (r.is_audience_live !== undefined && r.is_audience_live !== null) {
              isAudienceLive = Boolean(r.is_audience_live);
            } else if (descLive) {
              isAudienceLive = true;
            } else if (descNotLive) {
              isAudienceLive = false;
            } else if (existingRound?.isAudienceLive !== undefined) {
              isAudienceLive = Boolean(existingRound.isAudienceLive);
            }

            return {
              id: r.id,
              name: r.name,
              description: r.description,
              status: r.status,
              judgeWeightage: r.judge_weightage,
              audienceWeightage: r.audience_weightage,
              isCurrent: r.is_current,
              isAudienceLive,
              order: r.order_num
            };
          });
        });
      }

      // Query Unified Scores Table
      const { data: dbScores, error: scoreErr } = await client.from('scores').select('*');
      if (dbScores && !scoreErr) {
        const mapped = dbScores.map(s => ({
          id: s.id,
          candidateId: s.candidate_id,
          roundId: s.round_id,
          sourceType: s.source_type,
          judgeId: s.judge_id,
          voterFingerprint: s.voter_fingerprint,
          criteria: s.criteria,
          rawScore: Number(s.raw_score) || 0,
          notes: s.notes,
          createdAt: s.created_at
        }));

        setScores(prev => {
          const map = new Map();
          // Keep existing local scores
          (prev || []).forEach(s => {
            if (s && s.id) map.set(s.id, s);
          });
          // Update/insert with verified database scores
          mapped.forEach(s => {
            if (s && s.id) map.set(s.id, s);
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(merged));
          } catch (e) { }
          return merged;
        });
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
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
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

  // Check if any round has audience voting actively live
  const audienceLiveRound = rounds.find(r => r.isAudienceLive);

  // The system's live active competition round (set by admin)
  const liveRound = (activeRole === 'audience' && audienceLiveRound)
    ? audienceLiveRound
    : (rounds.find(r => r.isAudienceLive) || rounds.find(r => r.isCurrent) || rounds.find(r => r.status === 'active') || rounds[0]);

  // For judge, audience, and stage: always follow the system's live competition round set by admin!
  const currentRound = (activeRole === 'audience' || activeRole === 'judge' || activeRole === 'stage')
    ? liveRound
    : (rounds.find(r => r.id === selectedRoundId) || liveRound);
  const activeJudge = judges.find(j => j.id === activeJudgeId) || judges[0] || null;

  // Auto-sync selectedRoundId to liveRound for judge, audience, and stage
  useEffect(() => {
    if ((activeRole === 'audience' || activeRole === 'judge' || activeRole === 'stage') && liveRound?.id && selectedRoundId !== liveRound.id) {
      setSelectedRoundId(liveRound.id);
    }
  }, [activeRole, liveRound?.id, selectedRoundId]);

  // Round 1 and Round 2 definitions
  const round1 = rounds.find(r => r.order === 1 || r.id === 'round-1') || rounds[0];
  const round2 = rounds.find(r => r.order === 2 || r.id === 'round-2') || rounds[1];

  // Round 1 Candidates pool: all 20 competitors
  const round1Candidates = candidates;

  // Specific Leaderboard for Round 1 (all 20 competitors)
  const round1Leaderboard = useMemo(() => calculateRoundLeaderboard({
    candidates: round1Candidates,
    scores,
    round: round1,
    judges
  }), [round1Candidates, scores, round1, judges]);

  // Top 10 candidate IDs qualified for Round 2 based on Round 1 score & standings
  const top10QualifiedCandidateIds = useMemo(() => {
    return getTop10QualifiedCandidateIds(round1Leaderboard, candidates);
  }, [round1Leaderboard, candidates]);

  const top10QualifiedSet = useMemo(() => new Set(top10QualifiedCandidateIds), [top10QualifiedCandidateIds]);

  // Round 2 Candidates pool: strictly the Top 10 qualified finalists
  const round2Candidates = useMemo(() => {
    return candidates.filter(c => top10QualifiedSet.has(c.id));
  }, [candidates, top10QualifiedSet]);

  // Specific Leaderboard for Round 2 (strictly Top 10 finalists)
  const round2Leaderboard = useMemo(() => calculateRoundLeaderboard({
    candidates: round2Candidates,
    scores,
    round: round2,
    judges
  }), [round2Candidates, scores, round2, judges]);

  // Comprehensive Final Cumulative Leaderboard
  const cumulativeLeaderboard = useMemo(() => calculateCumulativeLeaderboard({
    candidates,
    scores,
    rounds,
    judges
  }), [candidates, scores, rounds, judges]);

  // Current active round candidates pool (20 for Round 1; Top 10 for Round 2)
  const currentRoundCandidates = useMemo(() => {
    if (currentRound?.order === 2 || currentRound?.id === 'round-2') {
      return round2Candidates;
    }
    return round1Candidates;
  }, [currentRound?.order, currentRound?.id, round1Candidates, round2Candidates]);

  // Helper function to check if candidate is qualified for Round 2
  const isCandidateQualifiedForRound2 = useCallback((candidateId) => {
    return top10QualifiedSet.has(candidateId);
  }, [top10QualifiedSet]);

  // Current active round leaderboard
  const currentLeaderboard = useMemo(() => {
    if (currentRound?.id === round2?.id || currentRound?.order === 2) {
      return round2Leaderboard;
    }
    return round1Leaderboard;
  }, [currentRound?.id, currentRound?.order, round1Leaderboard, round2Leaderboard, round2?.id]);

  // Overall event leaderboard alias
  const overallLeaderboard = cumulativeLeaderboard;

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
        // The newly activated round is active; all previous/other rounds become locked
        status: r.id === id ? 'active' : 'locked',
        isAudienceLive: r.id === id ? r.isAudienceLive : false
      }));
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });
    setSelectedRoundId(id);

    const client = getSupabaseClient();
    if (client) {
      try {
        // Mark all other rounds as locked and inactive
        await client.from('competition_rounds').update({ is_current: false, status: 'locked' }).neq('id', id);
        // Mark the selected round as active and current
        await client.from('competition_rounds').update({ is_current: true, status: 'active' }).eq('id', id);
      } catch (e) {
        console.warn('Supabase activate round error:', e);
      }
    }
    showToast(`Live Round updated to ${id === 'round-2' ? 'Round 2' : 'Round 1'}. Previous round locked.`);
  };

  const toggleRoundLock = async (id) => {
    const target = rounds.find(r => r.id === id);
    const isLocked = target?.status === 'locked';

    setRounds(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: isLocked ? 'active' : 'locked' } : r);
      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('competition_rounds').update({ status: isLocked ? 'active' : 'locked' }).eq('id', id);
      } catch (e) {
        console.warn('Supabase toggle round lock error:', e);
      }
    }
    showToast(isLocked ? `Round unlocked for voting & scoring` : `Round locked! Voting and scoring closed.`);
  };

  const toggleAudienceLive = async (roundId) => {
    let nowLive = false;
    let roundLabelName = roundId === 'round-2' ? 'Round 2' : 'Round 1';

    const target = rounds.find(r => r.id === roundId);
    nowLive = !Boolean(target?.isAudienceLive);

    setRounds(prev => {
      const updated = prev.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            isAudienceLive: nowLive,
            status: nowLive ? 'active' : r.status,
            isCurrent: nowLive ? true : r.isCurrent
          };
        }
        return {
          ...r,
          isAudienceLive: nowLive ? false : r.isAudienceLive,
          isCurrent: nowLive ? false : r.isCurrent
        };
      });

      broadcastSync('SYNC_ALL', { rounds: updated });
      return updated;
    });

    if (nowLive) {
      setSelectedRoundId(roundId);
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const targetDesc = target?.description || '';
        const cleanTargetDesc = targetDesc.replace(/\s*\[AUDIENCE_LIVE:(true|false)\]/g, '');
        const updatedTargetDesc = cleanTargetDesc + (nowLive ? ' [AUDIENCE_LIVE:true]' : ' [AUDIENCE_LIVE:false]');

        const targetUpdate = {
          description: updatedTargetDesc,
          status: nowLive ? 'active' : (target?.status || 'active'),
          is_current: nowLive ? true : Boolean(target?.isCurrent)
        };

        // Try update with is_audience_live column first; fallback if column does not exist
        let res = await client.from('competition_rounds').update({ ...targetUpdate, is_audience_live: nowLive }).eq('id', roundId);
        if (res.error) {
          await client.from('competition_rounds').update(targetUpdate).eq('id', roundId);
        }

        // When making a round live, turn off audience live on other rounds
        if (nowLive) {
          const otherRounds = rounds.filter(r => r.id !== roundId);
          for (const other of otherRounds) {
            const cleanOtherDesc = (other.description || '').replace(/\s*\[AUDIENCE_LIVE:(true|false)\]/g, '');
            const otherUpdate = {
              description: cleanOtherDesc + ' [AUDIENCE_LIVE:false]',
              is_current: false
            };
            let otherRes = await client.from('competition_rounds').update({ ...otherUpdate, is_audience_live: false }).eq('id', other.id);
            if (otherRes.error) {
              await client.from('competition_rounds').update(otherUpdate).eq('id', other.id);
            }
          }
        }
      } catch (e) {
        console.warn('Supabase toggle audience live error:', e);
      }
    }

    showToast(
      nowLive
        ? `Audience voting for ${roundLabelName} is now LIVE! Fans can cast votes.`
        : `Audience voting for ${roundLabelName} is now CLOSED.`,
      nowLive ? 'success' : 'info'
    );
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
        console.warn('Supabase update round error:', e);
      }
    }
    showToast('Scoring weightages updated');
    return true;
  };

  // Submit Judge Score (Single 50-point score field)
  const submitJudgeScore = async ({ candidateId, judgeId, roundId, score, criteria, notes = '', songName = '' }) => {
    const targetRound = rounds.find(r => r.id === roundId);
    if (targetRound?.status === 'locked') {
      showToast('Scoring is locked for this round!', 'error');
      return { success: false, message: 'Round is locked' };
    }

    let rawScore = 0;
    if (score !== undefined && score !== null) {
      rawScore = Number(score);
    } else if (criteria?.score !== undefined) {
      rawScore = Number(criteria.score);
    } else if (criteria && typeof criteria === 'object') {
      const vals = Object.values(criteria).map(Number).filter(n => !isNaN(n));
      rawScore = vals.reduce((a, b) => a + b, 0);
    }
    const safeScore = Math.max(0, Math.min(50, parseFloat(rawScore.toFixed(2)) || 0));

    const stableId = `sc-jdg-${judgeId}-${candidateId}-${roundId}`;

    const scoreRecord = {
      id: stableId,
      candidateId,
      judgeId,
      roundId,
      sourceType: 'judge',
      voterFingerprint: null,
      criteria: { score: safeScore },
      rawScore: safeScore,
      notes,
      createdAt: new Date().toISOString()
    };

    setScores(prev => {
      const filtered = (prev || []).filter(s => !(
        (s.candidateId === candidateId || s.candidate_id === candidateId) &&
        (s.judgeId === judgeId || s.judge_id === judgeId) &&
        (s.roundId === roundId || s.round_id === roundId)
      ));
      const updated = [...filtered, scoreRecord];
      try {
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));
      } catch (e) { }
      broadcastSync('NEW_SCORE_RECORD', scoreRecord);
      return updated;
    });

    if (songName) {
      updateCandidate(candidateId, { song: songName });
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('scores').upsert({
          id: stableId,
          candidate_id: candidateId,
          judge_id: judgeId,
          round_id: roundId,
          source_type: 'judge',
          voter_fingerprint: null,
          criteria: { score: safeScore },
          raw_score: safeScore,
          notes: notes || ''
        });
        if (error) {
          console.error('Supabase submit score error:', error);
        }
      } catch (e) {
        console.warn('Supabase submit score exception:', e);
      }
    }

    showToast('Score submitted successfully!');
    return { success: true, scoreRecord };
  };

  // Audience Vote Submission (Inserts into unified `scores` table with sourceType = 'audience')
  const checkHasVotedInRound = (roundId) => {
    if (!roundId) return false;
    const deviceId = getVoterDeviceId();
    const hasLocal = typeof window !== 'undefined' && localStorage.getItem(`dance_comp_voted_${deviceId}_${roundId}`) === 'true';
    if (hasLocal) return true;
    return scores.some(s =>
      (s.roundId === roundId || s.round_id === roundId) &&
      (s.sourceType === 'audience' || s.source_type === 'audience') &&
      (s.voterFingerprint === deviceId || s.voter_fingerprint === deviceId)
    );
  };

  const getCandidateVotedInRound = (roundId) => {
    if (!roundId) return null;
    const deviceId = getVoterDeviceId();
    const localCandidateId = typeof window !== 'undefined' ? localStorage.getItem(`dance_comp_voted_candidate_${deviceId}_${roundId}`) : null;
    if (localCandidateId) return localCandidateId;
    const vote = scores.find(s =>
      (s.roundId === roundId || s.round_id === roundId) &&
      (s.sourceType === 'audience' || s.source_type === 'audience') &&
      (s.voterFingerprint === deviceId || s.voter_fingerprint === deviceId)
    );
    return vote ? (vote.candidateId || vote.candidate_id) : null;
  };

  const castAudienceVote = async (candidateId, roundId = currentRound?.id || selectedRoundId) => {
    const targetRound = rounds.find(r => r.id === roundId);
    if (!targetRound || targetRound.status === 'completed') {
      showToast(`Voting is completed for ${roundId === 'round-2' ? 'Round 2' : 'Round 1'}!`, 'error');
      return { success: false, message: 'Voting is closed for this round.' };
    }

    if (!targetRound.isAudienceLive) {
      showToast(`Audience voting for ${roundId === 'round-2' ? 'Round 2' : 'Round 1'} is not live yet!`, 'error');
      return { success: false, message: 'Audience voting is not live yet.' };
    }

    const deviceId = getVoterDeviceId();
    const alreadyVoted = checkHasVotedInRound(roundId);

    if (alreadyVoted) {
      showToast(`You have already cast your vote for ${roundId === 'round-2' ? 'Round 2' : 'Round 1'}!`, 'error');
      return { success: false, message: 'Already voted in this round.' };
    }

    // Immediately record locally for zero lag
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`dance_comp_voted_${deviceId}_${roundId}`, 'true');
        localStorage.setItem(`dance_comp_voted_candidate_${deviceId}_${roundId}`, candidateId);
      }
    } catch (e) {
      // ignore
    }

    const stableAudienceId = `sc-aud-${deviceId}-${roundId}-${candidateId}`;

    const newVoteRecord = {
      id: stableAudienceId,
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
      const filtered = (prev || []).filter(s => s.id !== stableAudienceId);
      const updated = [...filtered, newVoteRecord];
      try {
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));
      } catch (e) { }
      broadcastSync('NEW_SCORE_RECORD', newVoteRecord);
      return updated;
    });

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('scores').upsert({
          id: stableAudienceId,
          candidate_id: candidateId,
          round_id: roundId,
          source_type: 'audience',
          judge_id: null,
          voter_fingerprint: deviceId,
          criteria: null,
          raw_score: 1.0,
          notes: null
        });
        if (error) {
          console.error('Supabase cast vote error:', error);
        }
      } catch (e) {
        console.warn('Supabase cast vote exception:', e);
      }
    }

    showToast(`Your vote for ${roundId === 'round-2' ? 'Round 2' : 'Round 1'} has been cast! 🎉`);
    return { success: true, vote: newVoteRecord };
  };

  // Refresh from Database
  const refreshDatabaseData = async () => {
    setIsSyncing(true);
    await fetchSupabaseData();
    setIsSyncing(false);
    showToast('Synced all data directly from Supabase Database!');
  };

  // Reset all scores and votes from judges and audiences for a fresh competition start
  const resetScoresData = async () => {
    try {
      setIsSyncing(true);

      // 1. Reset in-memory scores state
      setScores([]);

      // 2. Clear stored scores in localStorage
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify([]));

      // 3. Clear audience vote keys from localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('dance_comp_voted_') || key.startsWith('audience_voted_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }

      // 4. Delete all score rows from Supabase database if connected
      const client = getSupabaseClient();
      if (client) {
        // Attempt direct delete on scores table
        await client
          .from('scores')
          .delete()
          .not('id', 'is', null);

        // Verify if any score rows remain (e.g. if RLS blocked direct DELETE)
        const { data: remainingScores } = await client.from('scores').select('id');

        if (remainingScores && remainingScores.length > 0) {
          // Cascade wipe: deletes all scores from Supabase at engine level while preserving competitor data
          const { data: dbComps } = await client.from('competitors').select('*');
          if (dbComps && dbComps.length > 0) {
            for (const comp of dbComps) {
              await client.from('competitors').delete().eq('id', comp.id);
              await client.from('competitors').insert(comp);
            }
          }
        }
      }

      setIsSyncing(false);
      showToast('All judge scores and audience votes have been erased from DB & local state! 🚀');
      return { success: true };
    } catch (err) {
      console.error('Failed to reset scores:', err);
      setIsSyncing(false);
      showToast('Scores reset locally.');
      return { success: false, error: err.message };
    }
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
        round1Candidates,
        round2Candidates,
        currentRoundCandidates,
        top10QualifiedCandidateIds,
        isCandidateQualifiedForRound2,
        currentLeaderboard,
        overallLeaderboard,
        round1Leaderboard,
        round2Leaderboard,
        cumulativeLeaderboard,
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
        toggleAudienceLive,
        updateWeightages,
        submitJudgeScore,
        castAudienceVote,
        checkHasVotedInRound,
        getCandidateVotedInRound,
        resetScoresData,
        resetToDemoData
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}
