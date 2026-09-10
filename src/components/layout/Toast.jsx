import React from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useCompetition();

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm animate-bounce-short">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all ${
          isError 
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-900/40' 
            : isInfo
            ? 'bg-sky-950/90 border-sky-500/50 text-sky-100 shadow-sky-900/40'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-900/40'
        }`}
      >
        {isError ? (
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-sky-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
