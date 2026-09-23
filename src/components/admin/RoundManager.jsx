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
  Play
} from 'lucide-react';

export default function RoundManager() {
  const { 
    rounds,
    candidates,
    round1Candidates,
    round2Candidates,
    round1Leaderboard,
    setRoundActive, 
    toggleRoundLock, 
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
            <span>Rounds, Weightages & 20-to-10 Advancement</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Round 1 features all 20 competitors. Top 10 advance to Round 2 based on Round 1 score.
          </p>
        </div>
      </div>

      {/* 20 -> 10 Candidate Flow Summary Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-pink-950/70 border border-indigo-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">
              Official Competition Advancement Rules
            </span>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Round 1 (20 Competitors) ➔ Top 10 Finalists ➔ Round 2 Grand Finale
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
              Round 1: {round1Candidates?.length || 20} Competitors
            </span>
            <span className="text-slate-400">➔</span>
            <span className="px-3 py-1 rounded-xl bg-pink-600/30 text-pink-300 font-mono text-xs font-bold border border-pink-500/30">
              Round 2: {round2Candidates?.length || 10} Finalists
            </span>
          </div>
        </div>

        {/* Top 10 Qualified Finalists Preview */}
        <div>
          <span className="text-xs font-bold text-slate-300 block mb-2">
            Round 2 Qualified Finalists (Top 10 from Round 1):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(round2Candidates || []).slice(0, 10).map((cand, idx) => {
              const r1Item = round1Leaderboard.find(l => l.candidateId === cand.id);
              return (
                <div 
                  key={cand.id} 
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs"
                >
                  <img 
                    src={cand.photo} 
                    alt={cand.name} 
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-pink-500/40 shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-pink-400 font-bold text-[10px]">{cand.candidateNumber}</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">#{idx + 1}</span>
                    </div>
                    <span className="font-bold text-white text-[11px] truncate block">{cand.name}</span>
                    {r1Item?.hasScores && (
                      <span className="text-[10px] text-slate-400 font-mono">{r1Item.finalScore} pts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  </div>

                  {round.description && (
                    <p className="text-xs text-slate-400">
                      {round.description}
                    </p>
                  )}
                </div>

                {/* Round Control Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRoundActive(round.id);
                      setSelectedRoundId(round.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Active Live Stage' : 'Set as Active Round'}</span>
                  </button>

                  <button
                    onClick={() => toggleRoundLock(round.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Quick Ratios:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateWeightages(round.id, 60, 40)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                      >
                        60/40
                      </button>
                      <button
                        onClick={() => updateWeightages(round.id, 50, 50)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                      >
                        50/50
                      </button>
                      <button
                        onClick={() => updateWeightages(round.id, 70, 30)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                      >
                        70/30
                      </button>
                    </div>
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
