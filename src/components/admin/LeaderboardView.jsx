import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { SCORING_CRITERIA } from '../../utils/scoringEngine';
import { 
  Trophy, 
  Crown, 
  Award, 
  Vote, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function LeaderboardView() {
  const { currentLeaderboard, currentRound, judges, showToast } = useCompetition();
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  const topThree = currentLeaderboard.slice(0, 3);
  const remaining = currentLeaderboard.slice(3);

  const toggleExpand = (id) => {
    setExpandedCandidateId(prev => prev === id ? null : id);
  };

  const handleExportCSV = () => {
    if (currentLeaderboard.length === 0) return;

    const headers = [
      'Rank',
      'Candidate Number',
      'Name',
      'Category',
      'Judge Raw Average (0-10)',
      'Normalized Judge Score (%)',
      'Audience Votes Count',
      'Audience Share (%)',
      'Final Cumulative Score (0-100)'
    ];

    const rows = currentLeaderboard.map(c => [
      c.rank,
      `"${c.candidateNumber}"`,
      `"${c.name}"`,
      `"${c.category}"`,
      c.rawJudgeAverage,
      `${c.normalizedJudgeScore}%`,
      c.candidateVotesCount,
      `${c.audienceVoteShare}%`,
      c.finalScore
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DanceFest-Leaderboard-${currentRound?.id || 'round'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leaderboard CSV exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentRound?.name} ({currentRound?.judgeWeightage}% Judges : {currentRound?.audienceWeightage}% Audience)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1st Place - Gold */}
          {topThree[0] && (
            <div className="glass-panel rounded-3xl p-5 border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-950 relative overflow-hidden shadow-xl shadow-amber-500/10 md:order-2">
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>1ST PLACE</span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="relative">
                  <img
                    src={topThree[0].photo}
                    alt={topThree[0].name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                    #1
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-amber-400">{topThree[0].candidateNumber}</span>
                  <h3 className="text-base font-extrabold text-white leading-snug">{topThree[0].name}</h3>
                  <span className="text-[11px] text-slate-400">{topThree[0].category}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Cumulative Score:</span>
                  <span className="text-2xl font-black gradient-gold font-mono">{topThree[0].finalScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                  <div>
                    <span className="text-slate-400 block">Judge Avg:</span>
                    <span className="font-bold text-indigo-300">{topThree[0].rawJudgeAverage} / 10 ({topThree[0].normalizedJudgeScore}%)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Audience Votes:</span>
                    <span className="font-bold text-pink-300">{topThree[0].candidateVotesCount} ({topThree[0].audienceVoteShare}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2nd Place - Silver */}
          {topThree[1] && (
            <div className="glass-panel rounded-3xl p-5 border border-slate-400/30 bg-gradient-to-b from-slate-400/10 via-slate-900/80 to-slate-950 relative overflow-hidden md:order-1">
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/30 text-xs font-black">
                <Trophy className="w-3.5 h-3.5 text-slate-300" />
                <span>2ND PLACE</span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="relative">
                  <img
                    src={topThree[1].photo}
                    alt={topThree[1].name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-300 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-slate-300 text-slate-950 font-black text-[10px]">
                    #2
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-slate-300">{topThree[1].candidateNumber}</span>
                  <h3 className="text-sm font-extrabold text-white leading-snug">{topThree[1].name}</h3>
                  <span className="text-[11px] text-slate-400">{topThree[1].category}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Cumulative Score:</span>
                  <span className="text-xl font-black gradient-silver font-mono">{topThree[1].finalScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                  <div>
                    <span className="text-slate-400 block">Judge Avg:</span>
                    <span className="font-bold text-indigo-300">{topThree[1].rawJudgeAverage} / 10</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Audience Votes:</span>
                    <span className="font-bold text-pink-300">{topThree[1].candidateVotesCount} ({topThree[1].audienceVoteShare}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place - Bronze */}
          {topThree[2] && (
            <div className="glass-panel rounded-3xl p-5 border border-amber-700/30 bg-gradient-to-b from-amber-700/10 via-slate-900/80 to-slate-950 relative overflow-hidden md:order-3">
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-700/20 text-amber-200 border border-amber-700/30 text-xs font-black">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>3RD PLACE</span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="relative">
                  <img
                    src={topThree[2].photo}
                    alt={topThree[2].name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-600 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-amber-600 text-white font-black text-[10px]">
                    #3
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-amber-500">{topThree[2].candidateNumber}</span>
                  <h3 className="text-sm font-extrabold text-white leading-snug">{topThree[2].name}</h3>
                  <span className="text-[11px] text-slate-400">{topThree[2].category}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Cumulative Score:</span>
                  <span className="text-xl font-black gradient-bronze font-mono">{topThree[2].finalScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                  <div>
                    <span className="text-slate-400 block">Judge Avg:</span>
                    <span className="font-bold text-indigo-300">{topThree[2].rawJudgeAverage} / 10</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Audience Votes:</span>
                    <span className="font-bold text-pink-300">{topThree[2].candidateVotesCount} ({topThree[2].audienceVoteShare}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Leaderboard Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <span>Complete Candidate Standings & Metric Breakdown</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Click candidate row to expand 5-criterion details & judge notes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Contestant</th>
                <th className="py-3 px-4 text-center">Judge Avg (0-10)</th>
                <th className="py-3 px-4 text-center">Normalized Judge</th>
                <th className="py-3 px-4 text-center">Audience Votes</th>
                <th className="py-3 px-4 text-center">Vote Share</th>
                <th className="py-3 px-4 text-right">Final Score</th>
                <th className="py-3 px-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trophy className="w-8 h-8 text-slate-600" />
                      <p className="font-bold text-slate-300">No competition scores recorded yet</p>
                      <p className="text-[11px] text-slate-500">Scores submitted by judges and audience votes will appear on the leaderboard in real-time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLeaderboard.map((item) => {
                const isExpanded = expandedCandidateId === item.candidateId;
                const isFirst = item.rank === 1;
                const isSecond = item.rank === 2;
                const isThird = item.rank === 3;

                return (
                  <React.Fragment key={item.candidateId}>
                    <tr 
                      onClick={() => toggleExpand(item.candidateId)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isFirst ? 'bg-amber-500/5' : isSecond ? 'bg-slate-300/5' : isThird ? 'bg-amber-700/5' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono text-xs ${
                          isFirst ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30' :
                          isSecond ? 'bg-slate-300 text-slate-950 font-black' :
                          isThird ? 'bg-amber-600 text-white font-black' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          #{item.rank}
                        </span>
                      </td>

                      {/* Contestant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-pink-400 font-bold text-[11px]">{item.candidateNumber}</span>
                              <span className="font-bold text-white text-sm">{item.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">{item.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Judge Avg */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-300">
                        {item.rawJudgeAverage.toFixed(2)}
                      </td>

                      {/* Normalized Judge */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                          {item.normalizedJudgeScore}%
                        </span>
                      </td>

                      {/* Audience Votes */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-pink-300">
                        {item.candidateVotesCount}
                      </td>

                      {/* Vote Share */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20 font-bold">
                          {item.audienceVoteShare}%
                        </span>
                      </td>

                      {/* Final Score */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-extrabold text-base ${
                          isFirst ? 'text-amber-300 text-lg' : isSecond ? 'text-slate-200' : isThird ? 'text-amber-400' : 'text-white'
                        }`}>
                          {item.finalScore}
                        </span>
                      </td>

                      {/* Chevron */}
                      <td className="py-3.5 px-3 text-center text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                      </td>
                    </tr>

                    {/* Expanded Detail Accordion */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-y border-white/10">
                        <td colSpan={8} className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                              <span>5-Criterion Breakdown (Averaged across evaluating judges)</span>
                            </h4>

                            {/* 5-Criteria Progress Bars */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                              {SCORING_CRITERIA.map(crit => {
                                const avg = item.criterionAverages[crit.id]?.avg || 0;
                                const pct = (avg / 10) * 100;
                                return (
                                  <div key={crit.id} className="bg-slate-900 p-3 rounded-xl border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300 font-medium truncate">{crit.label}</span>
                                      <span className="font-mono font-bold text-indigo-300">{avg} / 10</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Individual Judge Scorecards & Notes */}
                            {item.candidateScores.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                <span className="text-xs font-semibold text-slate-400">Judge Feedback & Remarks:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {item.candidateScores.map(scoreRec => {
                                    const judgeObj = judges.find(j => j.id === scoreRec.judgeId);
                                    return (
                                      <div key={scoreRec.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-bold text-white">{judgeObj?.name || 'Judge'}</span>
                                          <span className="text-[10px] font-mono text-slate-400">{new Date(scoreRec.submittedAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-slate-300 text-[11px] italic">"{scoreRec.notes || 'No written comment provided.'}"</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
