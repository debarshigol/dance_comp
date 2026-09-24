import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  Layers, 
  Sliders, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Award, 
  Vote, 
  Play,
  Radio
} from 'lucide-react';

export default function RoundManager() {
  const { 
    rounds,
    candidates,
    setRoundActive, 
    toggleRoundLock, 
    toggleAudienceLive,
    updateWeightages, 
    selectedRoundId, 
    setSelectedRoundId,
    showToast 
  } = useCompetition();

  const handleJudgeWeightChange = (roundId, newJudgeVal) => {
    const j = Math.max(0, Math.min(100, Number(newJudgeVal)));
    const a = 100 - j;
    updateWeightages(roundId, j, a);
  };

  const handleAudienceWeightChange = (roundId, newAudienceVal) => {
    const a = Math.max(0, Math.min(100, Number(newAudienceVal)));
    const j = 100 - a;
    updateWeightages(roundId, j, a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>2-Round Weightage</span>
          </h2>
        </div>
      </div>

      {/* 2-Rounds List */}
      <div className="space-y-4">
        {rounds.map((round, index) => {
          const isSelected = selectedRoundId === round.id;
          const isLocked = round.status === 'locked';
          const isActive = round.isCurrent || round.status === 'active';

          return (
            <div
              key={round.id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isSelected
                  ? 'border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Round Info & Badges */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                      ROUND {index + 1}
                    </span>

                    <h3 className="font-extrabold text-white text-base">
                      {round.name}
                    </h3>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Current Live Round
                      </span>
                    )}

                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        <Unlock className="w-3 h-3" /> Submissions Open
                      </span>
                    )}

                    {round.isAudienceLive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                        Audience Voting Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                        Audience Voting Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Round Control Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRoundActive(round.id);
                      setSelectedRoundId(round.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Active Live Stage' : 'Set as Active Round'}</span>
                  </button>

                  {/* Make Audience Live Button */}
                  <button
                    onClick={() => toggleAudienceLive(round.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      round.isAudienceLive
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/30 ring-1 ring-pink-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 hover:border-pink-500/60'
                    }`}
                    title={round.isAudienceLive ? 'Stop audience voting for this round' : 'Make audience voting live for this round'}
                  >
                    <Radio className={`w-3.5 h-3.5 ${round.isAudienceLive ? 'text-white animate-pulse' : 'text-pink-400'}`} />
                    <span>
                      {round.isAudienceLive ? 'Stop Audience Voting' : 'Make Audience Live'}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleRoundLock(round.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLocked
                        ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isLocked ? <Unlock className="w-3.5 h-3.5 text-rose-300" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isLocked ? 'Unlock Submissions' : 'Lock Round Scores'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Weightage Configuration Panel */}
              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sliders & Percentage Allocation */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-pink-400" /> Dynamic Scoring Weightage Ratio
                    </span>
                    <span className="text-[11px] font-mono font-bold text-pink-400 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                      Total: {round.judgeWeightage + round.audienceWeightage}%
                    </span>
                  </div>

                  {/* Dual Bar Representation */}
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex ring-1 ring-white/10">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${round.judgeWeightage}%` }}
                      title={`Judges Weight: ${round.judgeWeightage}%`}
                    />
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${round.audienceWeightage}%` }}
                      title={`Audience Weight: ${round.audienceWeightage}%`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Judge Weight Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-indigo-300 font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3" /> Judges
                        </span>
                        <span className="font-mono font-bold text-white">{round.judgeWeightage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={round.judgeWeightage}
                        onChange={(e) => handleJudgeWeightChange(round.id, e.target.value)}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Audience Weight Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-pink-300 font-semibold flex items-center gap-1">
                          <Vote className="w-3 h-3" /> Audience
                        </span>
                        <span className="font-mono font-bold text-white">{round.audienceWeightage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={round.audienceWeightage}
                        onChange={(e) => handleAudienceWeightChange(round.id, e.target.value)}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Formula Breakdown Details */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Mathematical Cumulative Formula
                    </span>
                    <p className="font-mono text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-white/5">
                      Final Score = (<span className="text-indigo-400">Judge Normalized %</span> × {round.judgeWeightage / 100}) + (<span className="text-pink-400">Audience Vote Share %</span> × {round.audienceWeightage / 100})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
