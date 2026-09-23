import React, { useState, useEffect } from 'react';
import { MAX_JUDGE_SCORE, extractJudgeScore } from '../../utils/scoringEngine';
import { 
  Award, 
  Check, 
  MessageSquare, 
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
  // Extract existing score or baseline at 40
  const [score, setScore] = useState(() => {
    if (existingScore) {
      const extracted = extractJudgeScore(existingScore);
      if (extracted > 0) return extracted;
    }
    return 40;
  });

  const [notes, setNotes] = useState(() => existingScore?.notes || existingScore?.comment || '');
  const [songName, setSongName] = useState(candidate?.song || '');

  useEffect(() => {
    if (existingScore) {
      const extracted = extractJudgeScore(existingScore);
      if (extracted > 0) setScore(extracted);
      setNotes(existingScore.notes || existingScore.comment || '');
    }
  }, [existingScore]);

  const handleScoreChange = (val) => {
    if (val === '') {
      setScore('');
      return;
    }
    // Allow only numeric digits and up to one decimal
    if (!/^\d*\.?\d*$/.test(val)) return;
    const num = parseFloat(val);
    if (!isNaN(num) && num > MAX_JUDGE_SCORE) return;
    setScore(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;
    const finalScore = score === '' ? 0 : Math.min(MAX_JUDGE_SCORE, Math.max(0, Number(score)));
    onSave({ score: finalScore, criteria: { score: finalScore }, notes, songName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-glow w-full max-w-lg rounded-3xl p-5 sm:p-6 relative max-h-[92vh] flex flex-col justify-between my-auto border border-indigo-500/40 shadow-2xl">
        
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5">
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
              </div>
              <h3 className="font-extrabold text-white text-base leading-tight mt-1">
                {candidate.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked Round Warning */}
        {isLocked && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>This round is locked. Viewing in read-only mode.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* SINGLE SCORING SECTION (OUT OF 50) */}
          <div className="bg-gradient-to-b from-indigo-950/60 via-slate-900/90 to-slate-950 p-5 rounded-2xl border border-indigo-500/30 space-y-3 shadow-inner">
            <label className="block text-sm font-extrabold text-indigo-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-pink-400" />
              <span>Candidate Score (Out of 50)</span>
            </label>

            {/* Clean Single Number Input Field - No Slider, No Spinners */}
            <div>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                disabled={isLocked}
                value={score}
                onChange={(e) => handleScoreChange(e.target.value)}
                placeholder="Enter score (0 - 50)"
                className="w-full px-4 py-3.5 bg-slate-950/90 border border-indigo-500/40 focus:border-pink-500 rounded-2xl text-2xl font-black font-mono text-white focus:outline-none shadow-inner placeholder:text-sm placeholder:font-normal placeholder:font-sans placeholder:text-slate-500 placeholder:tracking-normal transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Feedback Notes */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
            <label className="block text-slate-300 font-bold text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Judge Notes & Commentary (Optional)</span>
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLocked}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
