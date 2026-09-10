import React, { useState, useEffect } from 'react';
import { SCORING_CRITERIA } from '../../utils/scoringEngine';
import { 
  Award, 
  Check, 
  Sliders, 
  Sparkles, 
  Music, 
  User, 
  MessageSquare, 
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react';

export default function ScoringCard({ 
  candidate, 
  existingScore, 
  onSave, 
  onClose, 
  isLocked,
  judgeName,
  roundName
}) {
  // Initial criteria state (default 8.0 for intuitive starting baseline if no prior score)
  const [criteria, setCriteria] = useState(() => {
    if (existingScore?.criteria) {
      return { ...existingScore.criteria };
    }
    const init = {};
    SCORING_CRITERIA.forEach(c => {
      init[c.id] = 8.5;
    });
    return init;
  });

  const [notes, setNotes] = useState(existingScore?.notes || '');
  const [songName, setSongName] = useState(candidate?.song || '');

  // Calculate live average of these 5 criteria
  const sumPoints = Object.values(criteria).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const liveAverage = SCORING_CRITERIA.length > 0 ? (sumPoints / SCORING_CRITERIA.length) : 0;
  const normalizedPct = ((liveAverage / 10) * 100).toFixed(1);

  const handleScoreChange = (criterionId, val) => {
    const num = Math.max(0, Math.min(10, parseFloat(val) || 0));
    setCriteria(prev => ({ ...prev, [criterionId]: parseFloat(num.toFixed(1)) }));
  };

  const adjustScore = (criterionId, delta) => {
    setCriteria(prev => {
      const current = prev[criterionId] || 0;
      const next = Math.max(0, Math.min(10, parseFloat((current + delta).toFixed(1))));
      return { ...prev, [criterionId]: next };
    });
  };

  const handlePreset = (criterionId, scoreVal) => {
    setCriteria(prev => ({ ...prev, [criterionId]: scoreVal }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;
    onSave({ criteria, notes, songName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-glow w-full max-w-2xl rounded-3xl p-5 sm:p-6 relative max-h-[92vh] flex flex-col justify-between my-auto border border-indigo-500/40">
        
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-pink-400 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                  {candidate.candidateNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold border border-white/10">
                  Age: {candidate.age || 20}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base leading-tight mt-1">
                {candidate.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Song Name Input */}
        <div className="my-3 bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-2 shrink-0">
          <label className="block text-slate-300 font-bold text-xs flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span>Song / Performance Track</span>
          </label>
          <input
            type="text"
            disabled={isLocked}
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Enter the song name..."
            className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500 disabled:opacity-50 placeholder-slate-500"
          />
        </div>

        {/* Live Score Counter Banner */}
        <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-pink-950/80 border border-indigo-500/30 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-indigo-300 font-semibold">
              Judge Score
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {liveAverage.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 10</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-pink-400">
              {normalizedPct}%
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>This round is locked. Viewing in read-only mode.</span>
          </div>
        )}

        {/* 5-Criteria Sliders & Fine Steppers */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-3.5">
            {SCORING_CRITERIA.map((crit) => {
              const currentVal = criteria[crit.id] ?? 8.0;

              return (
                <div 
                  key={crit.id}
                  className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{crit.label}</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                        {currentVal.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Slider & Quick Preset Chips */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => adjustScore(crit.id, -0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black disabled:opacity-40"
                    >
                      -0.5
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      disabled={isLocked}
                      value={currentVal}
                      onChange={(e) => handleScoreChange(crit.id, e.target.value)}
                      className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
                    />

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => adjustScore(crit.id, +0.5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black disabled:opacity-40"
                    >
                      +0.5
                    </button>
                  </div>

                  {/* Quick Score Chips */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    {[6.0, 7.5, 8.5, 9.0, 9.5, 10.0].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handlePreset(crit.id, chip)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all disabled:opacity-40 ${
                          currentVal === chip
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {chip.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Notes */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-2">
            <label className="block text-slate-300 font-bold text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add feedback or commentary..."
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLocked}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Save Score</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
