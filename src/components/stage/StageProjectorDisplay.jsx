import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  Trophy, 
  Crown, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';

export default function StageProjectorDisplay() {
  const { 
    currentLeaderboard, 
    cumulativeLeaderboard, 
    round1Leaderboard, 
    round2Leaderboard, 
    rounds 
  } = useCompetition();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);

  const round1 = (rounds || []).find(r => r.order === 1 || r.id === 'round-1') || rounds?.[0];
  const round2 = (rounds || []).find(r => r.order === 2 || r.id === 'round-2') || rounds?.[1];

  // Determine if both rounds are completed or have recorded scores
  const isRound1Done = round1?.status === 'locked' || round1?.status === 'completed';
  const isRound2Done = round2?.status === 'locked' || round2?.status === 'completed';
  const bothRoundsLocked = isRound1Done && isRound2Done;
  const hasBothRoundsScores = (round1Leaderboard || []).some(c => c.hasScores) && (round2Leaderboard || []).some(c => c.hasScores);
  const areBothRoundsCompleted = bothRoundsLocked || (hasBothRoundsScores && isRound1Done);

  // Active dataset: cumulative when both completed/scored, else current
  const activeLeaderboard = areBothRoundsCompleted ? (cumulativeLeaderboard || []) : (currentLeaderboard || []);
  const topThree = activeLeaderboard.slice(0, 3);

  const triggerCelebrationConfetti = () => {
    try {
      const count = 250;
      const defaults = { origin: { y: 0.65 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#eab308', '#ca8a04', '#fef08a'] });
      fire(0.2, { spread: 60, colors: ['#ec4899', '#f43f5e'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    if (areBothRoundsCompleted && !confettiFired && topThree.length > 0) {
      triggerCelebrationConfetti();
      setConfettiFired(true);
    }
  }, [areBothRoundsCompleted, confettiFired, topThree.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getCandidateScore = (c) => {
    if (!c) return '0.00';
    if (typeof c.cumulativeScore === 'number') return c.cumulativeScore.toFixed(2);
    if (typeof c.finalScore === 'number') return c.finalScore.toFixed(2);
    return '0.00';
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
      {/* Background Stage Lighting Atmosphere */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-72 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Stage Screen Top Header */}
      <div className="relative z-10 flex items-center justify-between pb-6 border-b border-white/10">
        {/* Left balance spacer */}
        <div className="w-10" />

        {/* Top-Middle Heading */}
        <div className="text-center flex-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(245,158,11,0.45)]">
            Final score
          </h1>
        </div>

        {/* Corner Fullscreen Button */}
        <div className="w-10 flex justify-end">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all text-xs cursor-pointer shadow-md"
            title="Toggle Stage Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Showcase Stage Area: Top 3 Candidates Only (Photo, Name, Final Score) */}
      <div className="relative z-10 py-8 my-auto">
        {topThree.length === 0 ? (
          <div className="py-20 text-center text-slate-400 max-w-md mx-auto">
            <Trophy className="w-14 h-14 mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white">Scores Pending</h3>
            <p className="text-sm text-slate-500 mt-1">
              Final evaluations will appear here on the stage display.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
            {/* 2nd Place Candidate */}
            {topThree[1] && (
              <div className="md:order-1 flex flex-col items-center animate-float" style={{ animationDelay: '0.2s' }}>
                {/* Photo */}
                <div className="relative mb-5 group">
                  <img
                    src={topThree[1].photo}
                    alt={topThree[1].name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-slate-300 shadow-2xl shadow-slate-400/20"
                  />
                  <span className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg">
                    #2
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-black text-xl sm:text-2xl text-white leading-tight mb-4 text-center">
                  {topThree[1].name}
                </h3>

                {/* Final Score Card */}
                <div className="w-full max-w-[240px] bg-gradient-to-b from-slate-700/80 to-slate-900/90 rounded-3xl py-6 px-4 border border-slate-400/30 text-center shadow-xl">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-slate-100">
                    {getCandidateScore(topThree[1])}
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place Candidate */}
            {topThree[0] && (
              <div className="md:order-2 flex flex-col items-center animate-float">
                {/* Photo with Crown */}
                <div className="relative mb-6 group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <Crown className="w-10 h-10 text-amber-400 animate-bounce" />
                  </div>
                  <img
                    src={topThree[0].photo}
                    alt={topThree[0].name}
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl object-cover ring-4 ring-amber-400 shadow-2xl shadow-amber-500/40"
                  />
                  <span className="absolute -top-3 -right-3 w-11 h-11 rounded-full bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-xl">
                    #1
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-black text-2xl sm:text-3xl text-white leading-tight mb-4 text-center">
                  {topThree[0].name}
                </h3>

                {/* Final Score Card */}
                <div className="w-full max-w-[280px] bg-gradient-to-b from-amber-500/25 via-amber-600/15 to-slate-900/95 rounded-3xl py-7 px-4 border-2 border-amber-400/60 text-center shadow-2xl shadow-amber-500/20">
                  <span className="text-5xl sm:text-6xl font-black font-mono text-amber-400">
                    {getCandidateScore(topThree[0])}
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place Candidate */}
            {topThree[2] && (
              <div className="md:order-3 flex flex-col items-center animate-float" style={{ animationDelay: '0.4s' }}>
                {/* Photo */}
                <div className="relative mb-5 group">
                  <img
                    src={topThree[2].photo}
                    alt={topThree[2].name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-amber-700 shadow-2xl shadow-amber-700/20"
                  />
                  <span className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-lg">
                    #3
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-black text-xl sm:text-2xl text-white leading-tight mb-4 text-center">
                  {topThree[2].name}
                </h3>

                {/* Final Score Card */}
                <div className="w-full max-w-[240px] bg-gradient-to-b from-amber-800/40 to-slate-900/90 rounded-3xl py-6 px-4 border border-amber-700/40 text-center shadow-xl">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-amber-200">
                    {getCandidateScore(topThree[2])}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
