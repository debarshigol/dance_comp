import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { ShieldCheck, Lock, Mail, Key } from 'lucide-react';

export default function AdminLogin() {
  const { loginAdmin } = useCompetition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = loginAdmin(email, password);
    if (!result.success) {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-panel-glow p-8 rounded-3xl relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-pink-500/30 ring-1 ring-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h2>
          <p className="text-slate-400 text-sm mt-1">
            Secure control panel for competition organizers & event supervisors
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Authenticate Admin Session</span>
          </button>
        </form>
      </div>
    </div>
  );
}
