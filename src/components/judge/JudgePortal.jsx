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

  // Scores submitted by this judge in the current round
  const myRoundScores = scores.filter(s => s.judgeId === currentJudge?.id && s.roundId === selectedRoundId);

  const isRoundLocked = currentRound?.status === 'locked';

  const scoredCandidateIds = new Set(myRoundScores.map(s => s.candidateId));
  const totalCandidates = candidates.length;
  const scoredCount = scoredCandidateIds.size;
  const progressPct = totalCandidates > 0 ? Math.round((scoredCount / totalCandidates) * 100) : 0;

  const handleOpenScore = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleSaveScore = ({ criteria, notes, songName }) => {
    if (!selectedCandidate || !currentJudge) return;

    submitJudgeScore({
      candidateId: selectedCandidate.id,
      judgeId: currentJudge.id,
      roundId: selectedRoundId,
      criteria,
      notes,
      songName
    });

    setSelectedCandidate(null);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(cand => {
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
      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterState === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setFilterState('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterState === 'pending'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({candidates.length - scoredCount})
          </button>
          <button
            onClick={() => setFilterState('scored')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
          <h3 className="text-base font-bold text-white">No Dancers</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'No contestants match your search.' : 'Waiting for dancers to be added.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredCandidates.map((candidate) => {
          const scoreRecord = myRoundScores.find(s => s.candidateId === candidate.id);
          const hasScored = !!scoreRecord;
          
          let myAvgScore = 0;
          if (hasScored && scoreRecord.criteria) {
            const vals = Object.values(scoreRecord.criteria);
            myAvgScore = vals.reduce((a, b) => a + Number(b), 0) / vals.length;
          }

          return (
            <div
              key={candidate.id}
              className={`glass-card rounded-2xl overflow-hidden flex flex-col justify-between border transition-all ${
                hasScored 
                  ? 'border-indigo-500/40 bg-slate-900/70' 
                  : 'border-white/10 hover:border-indigo-500/40'
              }`}
            >
              <div>
                {/* Photo */}
                <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-extrabold text-white text-sm truncate">
                      {candidate.name}
                    </h3>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="p-3 space-y-2 text-xs">
                  {/* ID, Age, Status badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 text-white font-mono font-black text-[10px] shadow">
                      {candidate.candidateNumber}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold border border-white/10">
                      Age: {candidate.age || 20}
                    </span>
                    {hasScored ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-slate-950 font-black text-[10px] flex items-center gap-0.5 shadow ml-auto">
                        <CheckCircle2 className="w-3 h-3" /> {myAvgScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-slate-950 font-bold text-[10px] flex items-center gap-0.5 shadow ml-auto">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>

                  {/* Song */}
                  {candidate.song && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate font-medium">{candidate.song}</span>
                    </div>
                  )}
                  {scoreRecord?.notes && (
                    <p className="text-[11px] text-indigo-200 bg-indigo-950/40 p-2 rounded-lg border border-indigo-500/20 italic line-clamp-2">
                      "{scoreRecord.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => handleOpenScore(candidate)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    hasScored
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-indigo-500/30'
                      : 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{hasScored ? 'Edit Score' : 'Score (0-10)'}</span>
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
          existingScore={myRoundScores.find(s => s.candidateId === selectedCandidate.id)}
          onSave={handleSaveScore}
          onClose={() => setSelectedCandidate(null)}
          isLocked={isRoundLocked}
          judgeName={activeJudge?.name}
          roundName={currentRound?.name}
        />
      )}
    </div>
  );
}
