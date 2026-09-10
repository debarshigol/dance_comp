import React from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  ShieldCheck, 
  Award, 
  Vote, 
  Tv, 
  QrCode, 
  Smartphone, 
  UserCheck, 
  ExternalLink 
} from 'lucide-react';

export default function RoleSwitcher() {
  const { 
    activeRole, 
    setActiveRole, 
    activeJudgeId, 
    setActiveJudgeId, 
    judges 
  } = useCompetition();

  return (
    <aside aria-label="Role Switcher" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl p-2.5 flex items-center justify-between gap-2 ring-1 ring-white/10">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
        <button
          onClick={() => setActiveRole('admin')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeRole === 'admin'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Super Admin</span>
        </button>

        {/* Judge Selector & Switcher */}
        <div className="flex items-center bg-slate-800/60 rounded-xl p-0.5 border border-white/5">
          <button
            onClick={() => setActiveRole('judge')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeRole === 'judge'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Judge Portal</span>
          </button>

          {activeRole === 'judge' && (
            <select
              value={activeJudgeId}
              onChange={(e) => setActiveJudgeId(e.target.value)}
              className="bg-transparent text-[11px] font-medium text-indigo-200 px-2 py-1 focus:outline-none cursor-pointer border-l border-white/10"
            >
              {judges.map(j => (
                <option key={j.id} value={j.id} className="bg-slate-900 text-white">
                  {j.name.split(' ')[0]} ({j.status})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => setActiveRole('audience')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeRole === 'audience'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-pink-300" />
          <span>Audience Vote</span>
        </button>

        <button
          onClick={() => setActiveRole('stage')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeRole === 'stage'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Stage Screen</span>
        </button>
      </div>

      <div className="hidden sm:flex items-center text-[10px] text-slate-400 font-mono pl-2 border-l border-white/10 shrink-0">
        Multi-Role Live Test
      </div>
    </aside>
  );
}
