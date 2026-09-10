import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Flame, 
  QrCode, 
  Award, 
  Vote, 
  PartyPopper,
  Volume2
} from 'lucide-react';

export default function StageProjectorDisplay() {
  const { currentLeaderboard, currentRound, votes } = useCompetition();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revealPodium, setRevealPodium] = useState(true);

  const topThree = currentLeaderboard.slice(0, 3);
  const others = currentLeaderboard.slice(3, 8);

  const votingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/audience`
    : 'https://dancefest.live/audience';

  const triggerCelebrationConfetti = () => {
    try {
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
      {/* Background Stage Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Stage Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-pink-500/40 ring-2 ring-white/20">
            <Flame className="w-6 h-6 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                LIVE AUDITORIUM STAGE FEED
              </span>
              <span className="font-mono text-xs text-slate-400">
                Total Live Votes: <strong className="text-pink-300">{votes.length}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1 drop-shadow-lg">
              {currentRound?.name}
            </h1>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerCelebrationConfetti}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all"
          >
            <PartyPopper className="w-4 h-4" />
            <span>Confetti Cannon</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all text-xs"
            title="Toggle Stage Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Showcase Stage Area: Podium Standings */}
      <div className="relative z-10 py-6 my-auto">
        {/* Top 3 Podium Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-end">
          
          {/* 2nd Place Podium */}
          {topThree[1] && (
            <div className="md:order-1 flex flex-col items-center animate-float" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-3 group">
                <img
                  src={topThree[1].photo}
                  alt={topThree[1].name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-slate-300 shadow-2xl shadow-slate-400/20"
                />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg">
                  #2
                </span>
              </div>

              <div className="text-center mb-3">
                <span className="font-mono text-xs font-bold text-slate-400">{topThree[1].candidateNumber}</span>
                <h3 className="font-black text-lg text-white leading-tight">{topThree[1].name}</h3>
                <span className="text-xs text-slate-400">{topThree[1].category}</span>
              </div>

              {/* Podium Column Base */}
              <div className="w-full bg-gradient-to-b from-slate-700/80 to-slate-900/90 rounded-3xl p-4 border border-slate-400/30 text-center shadow-xl min-h-[160px] flex flex-col justify-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Final Cumulative Score</span>
                <span className="text-3xl sm:text-4xl font-black font-mono gradient-silver my-1">{topThree[1].finalScore}</span>
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-300 font-mono">
                  <span>J: {topThree[1].normalizedJudgeScore}%</span>
                  <span>•</span>
                  <span>A: {topThree[1].audienceVoteShare}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place Podium (Grand Champion) */}
          {topThree[0] && (
            <div className="md:order-2 flex flex-col items-center animate-float">
              <div className="relative mb-4 group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
                <img
                  src={topThree[0].photo}
                  alt={topThree[0].name}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-amber-400 shadow-2xl shadow-amber-500/40"
                />
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-xl">
                  #1
                </span>
              </div>

              <div className="text-center mb-3">
                <span className="font-mono text-xs font-bold text-amber-400">{topThree[0].candidateNumber}</span>
                <h3 className="font-black text-xl sm:text-2xl text-white leading-tight">{topThree[0].name}</h3>
                <span className="text-xs text-amber-300/80">{topThree[0].category}</span>
              </div>

              {/* Podium Column Base */}
              <div className="w-full bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-slate-900/95 rounded-3xl p-5 border-2 border-amber-400/60 text-center shadow-2xl shadow-amber-500/20 min-h-[200px] flex flex-col justify-center">
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Grand Champion</span>
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono gradient-gold my-1.5">{topThree[0].finalScore}</span>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-200 font-mono">
                  <span className="font-bold text-indigo-300">Judges: {topThree[0].normalizedJudgeScore}%</span>
                  <span>•</span>
                  <span className="font-bold text-pink-300">Votes: {topThree[0].audienceVoteShare}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place Podium */}
          {topThree[2] && (
            <div className="md:order-3 flex flex-col items-center animate-float" style={{ animationDelay: '0.4s' }}>
              <div className="relative mb-3 group">
                <img
                  src={topThree[2].photo}
                  alt={topThree[2].name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-amber-700 shadow-2xl shadow-amber-700/20"
                />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-lg">
                  #3
                </span>
              </div>

              <div className="text-center mb-3">
                <span className="font-mono text-xs font-bold text-amber-600">{topThree[2].candidateNumber}</span>
                <h3 className="font-black text-lg text-white leading-tight">{topThree[2].name}</h3>
                <span className="text-xs text-slate-400">{topThree[2].category}</span>
              </div>

              {/* Podium Column Base */}
              <div className="w-full bg-gradient-to-b from-amber-800/40 to-slate-900/90 rounded-3xl p-4 border border-amber-700/40 text-center shadow-xl min-h-[140px] flex flex-col justify-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Final Cumulative Score</span>
                <span className="text-3xl sm:text-4xl font-black font-mono gradient-bronze my-1">{topThree[2].finalScore}</span>
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-300 font-mono">
                  <span>J: {topThree[2].normalizedJudgeScore}%</span>
                  <span>•</span>
                  <span>A: {topThree[2].audienceVoteShare}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage Bottom Footer: Live Stage QR Code + Score Bar Marquee */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          {/* Small On-Screen Live QR Code */}
          <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
            <QRCodeSVG value={votingUrl} size={64} level="M" />
          </div>
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-pink-400" />
              <span>Scan to Cast Live Audience Vote</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instant mobile voting via camera scan • Every vote powers the live board
            </p>
          </div>
        </div>

        {/* Live Weightage Ratio Pill */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 px-4 py-2 rounded-xl border border-white/10">
          <span className="text-slate-400">Calculation Weight:</span>
          <span className="text-indigo-400 font-bold">{currentRound?.judgeWeightage}% Judges</span>
          <span className="text-slate-500">+</span>
          <span className="text-pink-400 font-bold">{currentRound?.audienceWeightage}% Audience</span>
        </div>
      </div>
    </div>
  );
}
