import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import ScoringCard from './ScoringCard';
import JudgeLogin from './JudgeLogin';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sliders, 
  User, 
  Lock, 
  Unlock, 
  Music, 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  LogOut, 
  Key 
} from 'lucide-react';

export default function JudgePortal() {
  const { 
    candidates,
    round1Candidates,
    round2Candidates,
    currentRoundCandidates,
    judges, 
    authenticatedJudge, 
    activeJudge, 
    logoutJudge, 
    rounds, 
    selectedRoundId, 
    setSelectedRoundId, 
    currentRound, 
    scores, 
    submitJudgeScore 
  } = useCompetition();

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterState, setFilterState] = useState('all'); // 'all', 'pending', 'scored'
  const [searchQuery, setSearchQuery] = useState('');

  // If judge is not authenticated, show JudgeLogin screen
  if (!authenticatedJudge) {
    return <JudgeLogin />;
  }

  const currentJudge = authenticatedJudge;

  // Active round is ALWAYS the system live round set by admin!
  const activeRound = currentRound;
  const activeRoundId = activeRound?.id || selectedRoundId || 'round-1';
  const isRoundLocked = activeRound?.status === 'locked' || activeRound?.status === 'completed';
  const isRound2 = activeRoundId === 'round-2' || activeRound?.order === 2;
  const roundLabel = isRound2 ? 'Round 2' : 'Round 1';

  // Candidate pool: All 20 competitors for Round 1; Top 10 qualified for Round 2
  const candidatePool = isRound2 ? (round2Candidates || []) : (round1Candidates || candidates);

  // Scores submitted by this judge in this active round
  const myRoundScores = scores.filter(s => 
    (s.judgeId === currentJudge?.id || s.judge_id === currentJudge?.id) && 
    (s.roundId === activeRoundId || s.round_id === activeRoundId)
  );

  const scoredCandidateIds = new Set(myRoundScores.map(s => s.candidateId || s.candidate_id));
  const totalCandidates = candidatePool.length;
  const scoredCount = candidatePool.filter(c => scoredCandidateIds.has(c.id)).length;
  const progressPct = totalCandidates > 0 ? Math.round((scoredCount / totalCandidates) * 100) : 0;

  const handleOpenScore = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleSaveScore = ({ score, criteria, notes, songName }) => {
    if (!selectedCandidate || !currentJudge || isRoundLocked) return;

    submitJudgeScore({
      candidateId: selectedCandidate.id,
      judgeId: currentJudge.id,
      roundId: activeRoundId,
      score,
      criteria,
      notes,
      songName
    });

    setSelectedCandidate(null);
  };

  // Filter candidates from round pool
  const filteredCandidates = candidatePool.filter(cand => {
    const isScored = scoredCandidateIds.has(cand.id);
    if (filterState === 'pending' && isScored) return false;
    if (filterState === 'scored' && !isScored) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        cand.name.toLowerCase().includes(q) ||
        cand.candidateNumber.toLowerCase().includes(q) ||
        cand.category.toLowerCase().includes(q) ||
        cand.style.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Round Locked Notice for Judge */}
      {isRoundLocked && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 font-bold text-center shadow-lg">
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{roundLabel} is locked by admin. Scoring for {roundLabel} is paused until the next round goes live.</span>
        </div>
      )}



      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterState === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({totalCandidates})
          </button>
          <button
            onClick={() => setFilterState('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterState === 'pending'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({Math.max(0, totalCandidates - scoredCount)})
          </button>
          <button
            onClick={() => setFilterState('scored')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterState === 'scored'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scored ({scoredCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dancer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Candidate Scoring Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Competitors Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'No dancers match your search.' : 'Waiting for competitors to be registered.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
          {filteredCandidates.map((candidate) => {
            const hasScored = scoredCandidateIds.has(candidate.id);
            const scoreRecord = myRoundScores.find(s => (s.candidateId || s.candidate_id) === candidate.id);

            return (
              <div
                key={candidate.id}
                className={`glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border transition-all ${
                  hasScored 
                    ? 'border-indigo-500/40 bg-indigo-950/20 shadow-lg shadow-indigo-950/30' 
                    : 'border-white/10 hover:border-indigo-500/30'
                }`}
              >
                <div 
                  onClick={() => !isRoundLocked && handleOpenScore(candidate)}
                  className="cursor-pointer"
                >
                  {/* Photo Frame */}
                  <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden">
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    
                    {/* Floating Candidate Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-extrabold text-white text-sm truncate drop-shadow-md">
                        {candidate.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Details: Info placed below image */}
                  <div className="p-2.5 sm:p-3 space-y-2 text-xs">
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-black text-[10px] shadow shrink-0">
                          {candidate.candidateNumber}
                        </span>
                        <span className="px-1 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold border border-white/10 shrink-0">
                          Age: {candidate.age || 21}
                        </span>
                      </div>
                      {hasScored ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5" /> Scored
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Song */}
                    {candidate.song && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span className="truncate font-medium">{candidate.song}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-2.5 sm:p-4 pt-0">
                  <button
                    onClick={() => !isRoundLocked && handleOpenScore(candidate)}
                    disabled={isRoundLocked}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isRoundLocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        : hasScored
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-indigo-500/30 cursor-pointer'
                        : 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30 cursor-pointer'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>
                      {isRoundLocked
                        ? `${roundLabel} Locked`
                        : hasScored
                        ? `Edit ${roundLabel} Score`
                        : `Score ${roundLabel}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring Modal Dialog */}
      {selectedCandidate && (
        <ScoringCard
          candidate={selectedCandidate}
          existingScore={myRoundScores.find(s => (s.candidateId || s.candidate_id) === selectedCandidate.id)}
          onSave={handleSaveScore}
          onClose={() => setSelectedCandidate(null)}
          isLocked={isRoundLocked}
          judgeName={currentJudge?.name || activeJudge?.name}
          roundName={roundLabel}
        />
      )}
    </div>
  );
}
