import React from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  BarChart3, 
  Flame 
} from 'lucide-react';

export default function VotingAuditCounts() {
  const { 
    candidates,
    round1Candidates,
    round2Candidates,
    judges, 
    rounds, 
    scores, 
    votes 
  } = useCompetition();

  const r1TotalCandidates = round1Candidates?.length || 20;
  const r2TotalCandidates = round2Candidates?.length || 10;

  // 1. Audience Vote Counts per Round
  const r1VotesCount = votes.filter(v => (v.roundId === 'round-1' || v.round_id === 'round-1')).length;
  const r2VotesCount = votes.filter(v => (v.roundId === 'round-2' || v.round_id === 'round-2')).length;
  const totalAudienceVotes = r1VotesCount + r2VotesCount;

  const round1Obj = rounds.find(r => r.id === 'round-1') || rounds[0];
  const round2Obj = rounds.find(r => r.id === 'round-2') || rounds[1];

  // 2. Judge Scoring Counts per Judge & per Round
  const judgeStats = judges.map(judge => {
    // Round 1
    const r1ScoredIds = new Set(
      scores
        .filter(s => 
          (s.judgeId === judge.id || s.judge_id === judge.id) &&
          (s.roundId === 'round-1' || s.round_id === 'round-1') &&
          (s.sourceType === 'judge' || s.judgeId || s.judge_id)
        )
        .map(s => s.candidateId || s.candidate_id)
    );
    const r1Completed = r1ScoredIds.size;
    const r1Pending = Math.max(0, r1TotalCandidates - r1Completed);

    // Round 2
    const r2ScoredIds = new Set(
      scores
        .filter(s => 
          (s.judgeId === judge.id || s.judge_id === judge.id) &&
          (s.roundId === 'round-2' || s.round_id === 'round-2') &&
          (s.sourceType === 'judge' || s.judgeId || s.judge_id)
        )
        .map(s => s.candidateId || s.candidate_id)
    );
    const r2Completed = r2ScoredIds.size;
    const r2Pending = Math.max(0, r2TotalCandidates - r2Completed);

    return {
      judge,
      r1Completed,
      r1Pending,
      r2Completed,
      r2Pending,
      totalCompleted: r1Completed + r2Completed,
      totalPending: r1Pending + r2Pending
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink-400" />
          <span>Live Voting & Scoring Counts</span>
        </h2>
      </div>

      {/* SECTION 1: AUDIENCE VOTE COUNTS (PER ROUND) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Round 1 Card */}
          <div className="glass-panel rounded-2xl p-5 border border-pink-500/20 bg-gradient-to-b from-pink-950/20 to-slate-900/80 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                ROUND 1
              </span>
              {round1Obj?.isAudienceLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                  Voting Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                  Voting Closed
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Preliminary Showcase (20 Competitors)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-white tracking-tight">
                  {r1VotesCount}
                </span>
                <span className="text-xs font-bold text-pink-400">Total Audience Votes</span>
              </div>
            </div>
          </div>

          {/* Round 2 Card */}
          <div className="glass-panel rounded-2xl p-5 border border-pink-500/20 bg-gradient-to-b from-pink-950/20 to-slate-900/80 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-600/30 text-pink-300 font-mono text-xs font-bold border border-pink-500/30">
                ROUND 2
              </span>
              {round2Obj?.isAudienceLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                  Voting Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                  Voting Closed
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Grand Finale Championship (Top 10 Finalists)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-white tracking-tight">
                  {r2VotesCount}
                </span>
                <span className="text-xs font-bold text-pink-400">Total Audience Votes</span>
              </div>
            </div>
          </div>

          {/* Combined Total Card */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/80 space-y-3 shadow-lg sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                ALL ROUNDS
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Flame className="w-3 h-3 text-amber-400" /> Cumulative
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Combined Audience Engagement</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-indigo-300 tracking-tight">
                  {totalAudienceVotes}
                </span>
                <span className="text-xs font-bold text-indigo-300">Total Fan Votes Cast</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: JUDGES SCORING COUNTS (PER JUDGE & PER ROUND) */}
      <div className="pt-2 border-t border-white/10">
        {/* Per-Judge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {judgeStats.map(({ judge, r1Completed, r1Pending, r2Completed, r2Pending, totalCompleted, totalPending }) => (
            <div 
              key={judge.id}
              className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-900/70 space-y-4 shadow-xl"
            >
              {/* Judge Profile Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src={judge.avatar}
                    alt={judge.name}
                    className="w-11 h-11 rounded-xl object-cover border border-indigo-500/40 shadow-md"
                  />
                  <div>
                    <h4 className="font-extrabold text-white text-sm">{judge.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{judge.title}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-500/30 block">
                    {judge.accessCode || judge.id}
                  </span>
                </div>
              </div>

              {/* Round 1 & Round 2 Count Boxes */}
              <div className="grid grid-cols-2 gap-3">
                {/* Round 1 Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Round 1</span>
                    <span className="text-[10px] font-mono text-slate-400">/{r1TotalCandidates}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-xl font-black font-mono text-emerald-300 leading-none">
                        {r1Completed}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-wide">
                        Completed
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-xl font-black font-mono text-amber-300 leading-none">
                        {r1Pending}
                      </div>
                      <div className="text-[10px] font-bold text-amber-400 mt-1 uppercase tracking-wide">
                        Pending
                      </div>
                    </div>
                  </div>
                </div>

                {/* Round 2 Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300">Round 2</span>
                    <span className="text-[10px] font-mono text-slate-400">/{r2TotalCandidates}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-xl font-black font-mono text-emerald-300 leading-none">
                        {r2Completed}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-wide">
                        Completed
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-xl font-black font-mono text-amber-300 leading-none">
                        {r2Pending}
                      </div>
                      <div className="text-[10px] font-bold text-amber-400 mt-1 uppercase tracking-wide">
                        Pending
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Completed vs Pending Footer */}
              <div className="flex items-center justify-between text-xs px-2 pt-1">
                <span className="text-slate-400 font-medium">Total for {judge.name.split(' ')[0]}:</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-300 font-bold">
                    {totalCompleted} Completed
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {totalPending} Pending
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 3: SUMMARY AUDIT TABLE */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-900/60 space-y-3 mt-4">
          <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
            Overall Count Matrix
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Judge Name</th>
                  <th className="py-2.5 px-3 text-center text-indigo-300">R1 Completed</th>
                  <th className="py-2.5 px-3 text-center text-amber-400">R1 Pending</th>
                  <th className="py-2.5 px-3 text-center text-pink-300">R2 Completed</th>
                  <th className="py-2.5 px-3 text-center text-amber-400">R2 Pending</th>
                  <th className="py-2.5 px-3 text-center text-emerald-400">Total Completed</th>
                  <th className="py-2.5 px-3 text-center text-amber-400">Total Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {judgeStats.map(({ judge, r1Completed, r1Pending, r2Completed, r2Pending, totalCompleted, totalPending }) => (
                  <tr key={judge.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-sans font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>{judge.name}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-indigo-300">{r1Completed}</td>
                    <td className="py-3 px-3 text-center text-amber-300">{r1Pending}</td>
                    <td className="py-3 px-3 text-center font-black text-pink-300">{r2Completed}</td>
                    <td className="py-3 px-3 text-center text-amber-300">{r2Pending}</td>
                    <td className="py-3 px-3 text-center font-black text-emerald-400">{totalCompleted}</td>
                    <td className="py-3 px-3 text-center font-black text-amber-400">{totalPending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
