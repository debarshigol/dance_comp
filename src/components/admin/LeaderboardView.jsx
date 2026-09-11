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
  AlertCircle,
  Layers,
  Flame,
  Check,
  Clock,
  Music
} from 'lucide-react';

export default function LeaderboardView() {
  const { 
    rounds, 
    round1Leaderboard, 
    round2Leaderboard, 
    cumulativeLeaderboard, 
    currentRound, 
    judges, 
    showToast 
  } = useCompetition();

  // Active view: 'cumulative' | 'round-1' | 'round-2'
  const [activeView, setActiveView] = useState(() => {
    try {
      return localStorage.getItem('dance_comp_admin_leaderboard_view') || 'cumulative';
    } catch (e) {
      return 'cumulative';
    }
  });

  const handleViewChange = (view) => {
    setActiveView(view);
    try {
      localStorage.setItem('dance_comp_admin_leaderboard_view', view);
    } catch (e) {}
  };

  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  const round1 = rounds.find(r => r.order === 1 || r.id === 'round-1') || rounds[0] || {
    id: 'round-1',
    name: 'Round 1: Preliminary Showcase',
    judgeWeightage: 70,
    audienceWeightage: 30
  };

  const round2 = rounds.find(r => r.order === 2 || r.id === 'round-2') || rounds[1] || {
    id: 'round-2',
    name: 'Round 2: Grand Finale',
    judgeWeightage: 50,
    audienceWeightage: 50
  };

  // Determine which dataset to display
  let displayedLeaderboard = cumulativeLeaderboard;
  let currentViewRound = null;

  if (activeView === 'round-1') {
    displayedLeaderboard = round1Leaderboard;
    currentViewRound = round1;
  } else if (activeView === 'round-2') {
    displayedLeaderboard = round2Leaderboard;
    currentViewRound = round2;
  }

  const topThree = (displayedLeaderboard || []).slice(0, 3);

  const toggleExpand = (id) => {
    setExpandedCandidateId(prev => prev === id ? null : id);
  };

  const handleExportCSV = () => {
    if (!displayedLeaderboard || displayedLeaderboard.length === 0) return;

    let headers = [];
    let rows = [];

    if (activeView === 'cumulative') {
      headers = [
        'Overall Rank',
        'Candidate Number',
        'Name',
        `Round 1 Score (${round1.judgeWeightage}% J : ${round1.audienceWeightage}% A)`,
        `Round 2 Score (${round2.judgeWeightage}% J : ${round2.audienceWeightage}% A)`,
        'Total Points (/200)',
        'Final Cumulative Score (0-100)'
      ];

      rows = displayedLeaderboard.map(c => [
        c.rank,
        `"${c.candidateNumber}"`,
        `"${c.name}"`,
        c.round1Score,
        c.round2Score,
        c.totalCumulativePoints,
        c.cumulativeScore
      ]);
    } else {
      const activeRoundObj = activeView === 'round-1' ? round1 : round2;
      headers = [
        'Round Rank',
        'Candidate Number',
        'Name',
        'Judge Raw Average (0-10)',
        'Normalized Judge Score (%)',
        `Judge Weighted Points (${activeRoundObj.judgeWeightage}%)`,
        'Audience Votes Count',
        'Audience Share (%)',
        `Audience Weighted Points (${activeRoundObj.audienceWeightage}%)`,
        'Round Final Score (0-100)'
      ];

      rows = displayedLeaderboard.map(c => [
        c.rank,
        `"${c.candidateNumber}"`,
        `"${c.name}"`,
        c.rawJudgeAverage,
        `${c.normalizedJudgeScore}%`,
        c.weightedJudge,
        c.candidateVotesCount,
        `${c.audienceVoteShare}%`,
        c.weightedAudience,
        c.finalScore
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DanceFest-${activeView}-Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${activeView === 'cumulative' ? 'Cumulative' : activeView.toUpperCase()} leaderboard CSV exported successfully!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Leaderboard & Competition Standings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeView === 'cumulative' 
              ? 'Comprehensive cumulative standings combining Round 1 & Round 2 scores weighted accurately'
              : `${currentViewRound?.name} (${currentViewRound?.judgeWeightage}% Judges : ${currentViewRound?.audienceWeightage}% Audience)`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Round / Cumulative View Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
        {/* Cumulative Tab */}
        <button
          onClick={() => handleViewChange('cumulative')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeView === 'cumulative'
              ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span>Final Cumulative Leaderboard</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
            R1 + R2 Combined
          </span>
        </button>

        {/* Round 1 Tab */}
        <button
          onClick={() => handleViewChange('round-1')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeView === 'round-1'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-300" />
          <span>Round 1 Leaderboard</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
            {round1.judgeWeightage}J : {round1.audienceWeightage}A
          </span>
          {round1.status === 'active' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Round 2 Tab */}
        <button
          onClick={() => handleViewChange('round-2')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeView === 'round-2'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-1 ring-pink-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-pink-300" />
          <span>Round 2 Leaderboard</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
            {round2.judgeWeightage}J : {round2.audienceWeightage}A
          </span>
          {round2.status === 'active' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Podium Cards for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1st Place - Gold */}
          {topThree[0] && (
            <div className="glass-panel rounded-3xl p-5 border border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-slate-900/80 to-slate-950 relative overflow-hidden shadow-xl shadow-amber-500/10 md:order-2">
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
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {activeView === 'cumulative' ? 'Cumulative Final Score:' : 'Round Final Score:'}
                  </span>
                  <span className="text-2xl font-black gradient-gold font-mono">
                    {activeView === 'cumulative' ? topThree[0].cumulativeScore : topThree[0].finalScore}
                  </span>
                </div>

                {activeView === 'cumulative' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Round 1 Score:</span>
                      <span className="font-bold text-indigo-300">{topThree[0].round1Score} pts</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Round 2 Score:</span>
                      <span className="font-bold text-pink-300">{topThree[0].round2Score} pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Judges ({currentViewRound?.judgeWeightage}%):</span>
                      <span className="font-bold text-indigo-300">{topThree[0].weightedJudge} pts ({topThree[0].rawJudgeAverage}/10)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Audience ({currentViewRound?.audienceWeightage}%):</span>
                      <span className="font-bold text-pink-300">{topThree[0].weightedAudience} pts ({topThree[0].candidateVotesCount} votes)</span>
                    </div>
                  </div>
                )}
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
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {activeView === 'cumulative' ? 'Cumulative Final Score:' : 'Round Final Score:'}
                  </span>
                  <span className="text-xl font-black gradient-silver font-mono">
                    {activeView === 'cumulative' ? topThree[1].cumulativeScore : topThree[1].finalScore}
                  </span>
                </div>

                {activeView === 'cumulative' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Round 1 Score:</span>
                      <span className="font-bold text-indigo-300">{topThree[1].round1Score} pts</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Round 2 Score:</span>
                      <span className="font-bold text-pink-300">{topThree[1].round2Score} pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Judges ({currentViewRound?.judgeWeightage}%):</span>
                      <span className="font-bold text-indigo-300">{topThree[1].weightedJudge} pts ({topThree[1].rawJudgeAverage}/10)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Audience ({currentViewRound?.audienceWeightage}%):</span>
                      <span className="font-bold text-pink-300">{topThree[1].weightedAudience} pts ({topThree[1].candidateVotesCount} votes)</span>
                    </div>
                  </div>
                )}
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
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {activeView === 'cumulative' ? 'Cumulative Final Score:' : 'Round Final Score:'}
                  </span>
                  <span className="text-xl font-black gradient-bronze font-mono">
                    {activeView === 'cumulative' ? topThree[2].cumulativeScore : topThree[2].finalScore}
                  </span>
                </div>

                {activeView === 'cumulative' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Round 1 Score:</span>
                      <span className="font-bold text-indigo-300">{topThree[2].round1Score} pts</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Round 2 Score:</span>
                      <span className="font-bold text-pink-300">{topThree[2].round2Score} pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-white/5">
                    <div>
                      <span className="text-slate-400 block">Judges ({currentViewRound?.judgeWeightage}%):</span>
                      <span className="font-bold text-indigo-300">{topThree[2].weightedJudge} pts ({topThree[2].rawJudgeAverage}/10)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Audience ({currentViewRound?.audienceWeightage}%):</span>
                      <span className="font-bold text-pink-300">{topThree[2].weightedAudience} pts ({topThree[2].candidateVotesCount} votes)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 bg-slate-900/80 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-400" />
            <span>
              {activeView === 'cumulative'
                ? 'Complete Final Standings (Round 1 + Round 2 Cumulative Score)'
                : `${currentViewRound?.name} Complete Standings`}
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            Click candidate row to view detailed round breakdown & criteria evaluations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header: Cumulative View vs Single Round View */}
            {activeView === 'cumulative' ? (
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Contestant</th>
                  <th className="py-3 px-4 text-center">
                    Round 1 ({round1.judgeWeightage}J : {round1.audienceWeightage}A)
                  </th>
                  <th className="py-3 px-4 text-center">
                    Round 2 ({round2.judgeWeightage}J : {round2.audienceWeightage}A)
                  </th>
                  <th className="py-3 px-4 text-center">Total Points (/200)</th>
                  <th className="py-3 px-4 text-right">Cumulative Score (0-100)</th>
                  <th className="py-3 px-3 text-center">Details</th>
                </tr>
              </thead>
            ) : (
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Contestant</th>
                  <th className="py-3 px-4 text-center">Judge Avg (0-10)</th>
                  <th className="py-3 px-4 text-center">Judge Weighted ({currentViewRound?.judgeWeightage}%)</th>
                  <th className="py-3 px-4 text-center">Audience Votes</th>
                  <th className="py-3 px-4 text-center">Audience Share (%)</th>
                  <th className="py-3 px-4 text-center">Audience Weighted ({currentViewRound?.audienceWeightage}%)</th>
                  <th className="py-3 px-4 text-right">Round Score</th>
                  <th className="py-3 px-3 text-center">Details</th>
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-white/5">
              {!displayedLeaderboard || displayedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={activeView === 'cumulative' ? 7 : 9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trophy className="w-8 h-8 text-slate-600" />
                      <p className="font-bold text-slate-300">No competition scores recorded yet</p>
                      <p className="text-[11px] text-slate-500">
                        Scores submitted by judges and audience votes will appear on the leaderboard in real-time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedLeaderboard.map((item) => {
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
                            </div>
                          </div>
                        </td>

                        {/* Cumulative View Columns */}
                        {activeView === 'cumulative' ? (
                          <>
                            {/* Round 1 Score */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`font-mono font-bold px-2.5 py-1 rounded-xl text-xs border ${
                                item.round1?.hasScores
                                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                  : 'bg-slate-800/50 text-slate-500 border-white/5'
                              }`}>
                                {item.round1Score.toFixed(2)} pts
                              </span>
                            </td>

                            {/* Round 2 Score */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`font-mono font-bold px-2.5 py-1 rounded-xl text-xs border ${
                                item.round2?.hasScores
                                  ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                                  : 'bg-slate-800/50 text-slate-500 border-white/5'
                              }`}>
                                {item.round2Score.toFixed(2)} pts
                              </span>
                            </td>

                            {/* Total Cumulative Points */}
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                              {item.totalCumulativePoints.toFixed(2)} / 200
                            </td>

                            {/* Cumulative Final Score */}
                            <td className="py-3.5 px-4 text-right">
                              <span className={`font-mono font-extrabold text-base ${
                                isFirst ? 'text-amber-300 text-lg' : isSecond ? 'text-slate-200' : isThird ? 'text-amber-400' : 'text-white'
                              }`}>
                                {item.cumulativeScore.toFixed(2)}
                              </span>
                            </td>
                          </>
                        ) : (
                          /* Round 1 or Round 2 View Columns */
                          <>
                            {/* Judge Avg */}
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-300">
                              {item.rawJudgeAverage.toFixed(2)} / 10
                            </td>

                            {/* Judge Weighted */}
                            <td className="py-3.5 px-4 text-center font-mono">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                                {item.weightedJudge.toFixed(2)} / {currentViewRound?.judgeWeightage} pts
                              </span>
                            </td>

                            {/* Audience Votes */}
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-pink-300">
                              {item.candidateVotesCount}
                            </td>

                            {/* Audience Share */}
                            <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                              {item.audienceVoteShare.toFixed(1)}%
                            </td>

                            {/* Audience Weighted */}
                            <td className="py-3.5 px-4 text-center font-mono">
                              <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20 font-bold">
                                {item.weightedAudience.toFixed(2)} / {currentViewRound?.audienceWeightage} pts
                              </span>
                            </td>

                            {/* Round Score */}
                            <td className="py-3.5 px-4 text-right">
                              <span className={`font-mono font-extrabold text-base ${
                                isFirst ? 'text-amber-300 text-lg' : isSecond ? 'text-slate-200' : isThird ? 'text-amber-400' : 'text-white'
                              }`}>
                                {item.finalScore.toFixed(2)}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Chevron */}
                        <td className="py-3.5 px-3 text-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                        </td>
                      </tr>

                      {/* Expanded Accordion Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-y border-white/10">
                          <td colSpan={activeView === 'cumulative' ? 7 : 9} className="p-4 sm:p-6">
                            {activeView === 'cumulative' ? (
                              /* CUMULATIVE EXPANDED BREAKDOWN: Side-by-Side Round 1 & Round 2 Details */
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Round 1 Card */}
                                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Round 1: Preliminary Showcase</span>
                                      </span>
                                      <span className="font-mono font-black text-indigo-300 text-xs px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                                        R1 Total: {item.round1Score.toFixed(2)} pts
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="p-2 bg-slate-950/70 rounded-xl border border-white/5">
                                        <span className="text-slate-400 block text-[11px]">Judge Average ({round1.judgeWeightage}%):</span>
                                        <span className="font-mono font-bold text-indigo-300">
                                          {item.round1?.rawJudgeAverage.toFixed(2)} / 10 ({item.round1?.normalizedJudgeScore}%)
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">
                                          Weighted: {item.round1?.weightedJudge.toFixed(2)} / {round1.judgeWeightage} pts
                                        </span>
                                      </div>

                                      <div className="p-2 bg-slate-950/70 rounded-xl border border-white/5">
                                        <span className="text-slate-400 block text-[11px]">Audience Votes ({round1.audienceWeightage}%):</span>
                                        <span className="font-mono font-bold text-pink-300">
                                          {item.round1?.candidateVotesCount} votes ({item.round1?.audienceVoteShare}%)
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">
                                          Weighted: {item.round1?.weightedAudience.toFixed(2)} / {round1.audienceWeightage} pts
                                        </span>
                                      </div>
                                    </div>

                                    {/* 5-Criteria Bars for Round 1 */}
                                    {item.round1?.criterionAverages && (
                                      <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                                          Round 1 Criteria Scores:
                                        </span>
                                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                                          {SCORING_CRITERIA.map(c => (
                                            <div key={c.id} className="p-1 bg-slate-950 rounded text-center">
                                              <span className="text-slate-400 block truncate">{c.label.split('/')[0]}</span>
                                              <span className="font-mono font-bold text-indigo-300">
                                                {item.round1.criterionAverages[c.id]?.avg || 0}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Round 2 Card */}
                                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-pink-500/30 space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-pink-400" />
                                        <span>Round 2: Grand Finale</span>
                                      </span>
                                      <span className="font-mono font-black text-pink-300 text-xs px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/30">
                                        R2 Total: {item.round2Score.toFixed(2)} pts
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="p-2 bg-slate-950/70 rounded-xl border border-white/5">
                                        <span className="text-slate-400 block text-[11px]">Judge Average ({round2.judgeWeightage}%):</span>
                                        <span className="font-mono font-bold text-indigo-300">
                                          {item.round2?.rawJudgeAverage.toFixed(2)} / 10 ({item.round2?.normalizedJudgeScore}%)
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">
                                          Weighted: {item.round2?.weightedJudge.toFixed(2)} / {round2.judgeWeightage} pts
                                        </span>
                                      </div>

                                      <div className="p-2 bg-slate-950/70 rounded-xl border border-white/5">
                                        <span className="text-slate-400 block text-[11px]">Audience Votes ({round2.audienceWeightage}%):</span>
                                        <span className="font-mono font-bold text-pink-300">
                                          {item.round2?.candidateVotesCount} votes ({item.round2?.audienceVoteShare}%)
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">
                                          Weighted: {item.round2?.weightedAudience.toFixed(2)} / {round2.audienceWeightage} pts
                                        </span>
                                      </div>
                                    </div>

                                    {/* 5-Criteria Bars for Round 2 */}
                                    {item.round2?.criterionAverages && (
                                      <div className="space-y-1.5 pt-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                                          Round 2 Criteria Scores:
                                        </span>
                                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                                          {SCORING_CRITERIA.map(c => (
                                            <div key={c.id} className="p-1 bg-slate-950 rounded text-center">
                                              <span className="text-slate-400 block truncate">{c.label.split('/')[0]}</span>
                                              <span className="font-mono font-bold text-pink-300">
                                                {item.round2.criterionAverages[c.id]?.avg || 0}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Cumulative Formula Explanation Card */}
                                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span className="text-slate-300">
                                      Cumulative Final Score = <strong>(Round 1: {item.round1Score} pts + Round 2: {item.round2Score} pts) ÷ 2</strong> = <strong className="text-amber-300 font-mono text-sm">{item.cumulativeScore.toFixed(2)} / 100</strong>
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Total Combined Points: {item.totalCumulativePoints.toFixed(2)} / 200
                                  </span>
                                </div>
                              </div>
                            ) : (
                              /* SINGLE ROUND EXPANDED BREAKDOWN */
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
                                {item.candidateScores && item.candidateScores.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                    <span className="text-xs font-semibold text-slate-400">Judge Feedback & Remarks:</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {item.candidateScores.map(scoreRec => {
                                        const judgeObj = judges.find(j => j.id === scoreRec.judgeId);
                                        return (
                                          <div key={scoreRec.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-bold text-white">{judgeObj?.name || 'Judge'}</span>
                                              <span className="text-[10px] font-mono text-slate-400">
                                                {new Date(scoreRec.createdAt || scoreRec.created_at || Date.now()).toLocaleTimeString()}
                                              </span>
                                            </div>
                                            <p className="text-slate-300 text-[11px] italic">
                                              "{scoreRec.notes || 'No written comment provided.'}"
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
