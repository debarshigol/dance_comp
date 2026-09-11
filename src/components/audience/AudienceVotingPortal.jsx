import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  Vote, 
  Heart, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Flame, 
  Music, 
  Tag, 
  Lock, 
  Unlock, 
  BarChart2, 
  Smartphone,
  Eye
} from 'lucide-react';

export default function AudienceVotingPortal() {
  const { 
    candidates, 
    rounds, 
    selectedRoundId, 
    currentRound, 
    votes, 
    castAudienceVote, 
    checkHasVotedInRound, 
    getCandidateVotedInRound,
    currentLeaderboard 
  } = useCompetition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContestantModal, setSelectedContestantModal] = useState(null);
  const [showLiveStandings, setShowLiveStandings] = useState(false);

  const hasVoted = checkHasVotedInRound(selectedRoundId);
  const votedCandidateId = getCandidateVotedInRound(selectedRoundId);
  const isRoundLocked = currentRound?.status === 'locked';

  // Round audience votes
  const roundVotes = votes.filter(v => v.roundId === selectedRoundId);
  const totalVotesCount = roundVotes.length;

  const handleVote = (candidateId, candidateName) => {
    if (isRoundLocked || hasVoted) return;

    const result = castAudienceVote(candidateId, selectedRoundId);
    if (result.success) {
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f43f5e', '#8b5cf6', '#eab308']
        });
      } catch (e) {
        // graceful fallback
      }
    }
  };

  const categories = ['all', 'Solo / Contemporary', 'Solo / Street & Popping', 'Solo / Latin Ballroom', 'Duo / Contemporary', 'Crew / Mega Crew'];

  const filteredCandidates = candidates.filter(cand => {
    if (selectedCategory !== 'all' && !cand.category.toLowerCase().includes(selectedCategory.toLowerCase().split('/')[1]?.trim() || '')) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        cand.name.toLowerCase().includes(q) ||
        cand.candidateNumber.toLowerCase().includes(q) ||
        cand.style.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-2 sm:px-4">

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dancer..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-pink-500"
        />
      </div>

      {/* Contestant Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto">
            <Vote className="w-7 h-7 text-pink-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Dancers Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'No contestants match your search.' : 'Waiting for dancers to be added.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCandidates.map((candidate) => {
          const isVotedForThis = votedCandidateId === candidate.id;
          const candidateVotesCount = roundVotes.filter(v => v.candidateId === candidate.id).length;

          return (
            <div
              key={candidate.id}
              className={`glass-card rounded-3xl overflow-hidden flex flex-col justify-between border transition-all ${
                isVotedForThis 
                  ? 'border-pink-500 ring-2 ring-pink-500/40 bg-pink-950/20' 
                  : 'border-white/10 hover:border-pink-500/30'
              }`}
            >
              <div>
                {/* Photo */}
                <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden">
                  <img
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-extrabold text-white text-sm leading-tight drop-shadow-md truncate">
                      {candidate.name}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 space-y-2 text-xs">
                  {/* ID, Age, Voted badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-pink-600/95 text-white font-mono font-black text-[10px] shadow">
                      {candidate.candidateNumber}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white font-bold text-[10px] border border-white/10">
                      Age: {candidate.age || 20}
                    </span>
                    {isVotedForThis && (
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-[10px] flex items-center gap-0.5 shadow ml-auto">
                        <Heart className="w-3 h-3 fill-white" /> Voted
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

              {/* Vote Button */}
              <div className="p-4 pt-0">
                {isVotedForThis ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Voted for {candidate.name.split(' ')[0]}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleVote(candidate.id, candidate.name)}
                    disabled={isRoundLocked || hasVoted}
                    className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      hasVoted
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        : isRoundLocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 hover:from-pink-500 hover:to-rose-400 text-white shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>
                      {isRoundLocked
                        ? 'Voting Closed'
                        : hasVoted
                        ? 'Already Voted'
                        : `Vote for ${candidate.name.split(' ')[0]}`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
