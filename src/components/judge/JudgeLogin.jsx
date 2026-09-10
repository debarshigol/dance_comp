import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { Award, Key, User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function JudgeLogin() {
  const { loginJudge } = useCompetition();
  
  const [identifier, setIdentifier] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('code') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = loginJudge(identifier, password);
    if (!result.success) {
      setError(result.message || 'Invalid Judge ID or Password.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-3 sm:px-4">
      <div className="max-w-md w-full glass-panel-glow p-7 sm:p-8 rounded-3xl relative overflow-hidden border border-indigo-500/40">
        
        {/* Ambient lighting */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-600/30 ring-2 ring-white/20">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Judge Login</h2>
          <p className="text-slate-400 text-xs mt-1">
            Sign in with your judge credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Judge ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. JUDGE-MC99"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
