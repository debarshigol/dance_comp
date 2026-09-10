import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  UserCheck, 
  UserX, 
  Award, 
  Plus, 
  Key, 
  Mail, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Copy, 
  Trash2, 
  Edit3,
  X,
  Check,
  Share2,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export default function JudgeManager() {
  const { 
    judges, 
    addJudge, 
    updateJudge, 
    toggleJudgeStatus, 
    deleteJudge, 
    candidates, 
    scores, 
    selectedRoundId, 
    currentRound, 
    setActiveRole, 
    loginJudge,
    showToast 
  } = useCompetition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState(null);
  const [editingJudge, setEditingJudge] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    accessCode: '',
    password: '',
    title: '',
    email: '',
    speciality: '',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  });

  const generateCredentials = (name) => {
    const code = 'JUDGE-' + (name ? name.substring(0, 2).toUpperCase() : 'JD') + Math.floor(10 + Math.random() * 90);
    const pass = 'dance' + Math.floor(1000 + Math.random() * 9000);
    return { code, pass };
  };

  const handleOpenAdd = () => {
    setEditingJudge(null);
    const { code, pass } = generateCredentials('Marcus');
    setFormData({
      name: '',
      accessCode: code,
      password: pass,
      title: 'Senior Dance Adjudicator',
      email: '',
      speciality: 'Choreography & Precision',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (judge) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      accessCode: judge.accessCode,
      password: judge.password || 'dance2026',
      title: judge.title,
      email: judge.email,
      speciality: judge.speciality,
      avatar: judge.avatar
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Judge name is required', 'error');
      return;
    }

    if (editingJudge) {
      updateJudge(editingJudge.id, formData);
    } else {
      addJudge(formData);
    }
    setIsModalOpen(false);
  };

  const shareJudgeCredentials = (judge) => {
    const portalUrl = `${window.location.origin}/judge?code=${judge.accessCode}`;
    const message = `🏆 *Dance Competition Adjudicator Access* 🏆\n\nDear Judge ${judge.name},\nHere are your official evaluation credentials for the competition:\n\n• *Login ID / Code:* ${judge.accessCode}\n• *Security Password:* ${judge.password || 'dance2026'}\n• *Portal URL:* ${portalUrl}\n\nPlease keep these credentials secure during the live event.`;
    
    navigator.clipboard.writeText(message);
    showToast(`Credentials copied for Judge ${judge.name}! Ready to share via WhatsApp / SMS.`);
  };

  const togglePasswordReveal = (judgeId) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [judgeId]: !prev[judgeId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>Judges Panel</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              {judges.filter(j => j.status === 'active').length} / {judges.length} Active
            </span>
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Judge</span>
        </button>
      </div>

      {/* Judges Grid */}
      {judges.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Judges Registered</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no official judges in the database yet. Click below to create a judge account with secure access credentials.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Judge</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.map((judge) => {
          const roundScores = scores.filter(s => (s.roundId === selectedRoundId || s.round_id === selectedRoundId) && (s.judgeId === judge.id || s.judge_id === judge.id));
          const scoredCount = roundScores.length;
          const totalCandidatesCount = candidates.length;
          const isComplete = scoredCount >= totalCandidatesCount && totalCandidatesCount > 0;
          const progressPct = totalCandidatesCount > 0 ? Math.round((scoredCount / totalCandidatesCount) * 100) : 0;
          const isPasswordVisible = !!revealedPasswords[judge.id];

          return (
            <div 
              key={judge.id}
              className={`glass-card rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                judge.status === 'active' 
                  ? 'border-indigo-500/30 bg-slate-900/60' 
                  : 'border-slate-800 bg-slate-950/40 opacity-70'
              }`}
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={judge.avatar}
                      alt={judge.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                        {judge.name}
                      </h3>
                      <p className="text-[11px] text-indigo-300 font-medium line-clamp-1">
                        {judge.title}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    judge.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                      : 'bg-slate-700/30 text-slate-400 border-slate-700'
                  }`}>
                    {judge.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Credentials Box for Admin Sharing */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" /> Judge Login ID:
                    </span>
                    <span className="font-mono font-black text-amber-300 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {judge.accessCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-pink-400" /> Password:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-200">
                        {isPasswordVisible ? (judge.password || 'dance2026') : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordReveal(judge.id)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Toggle password visibility"
                      >
                        {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {judge.email && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> Email:
                      </span>
                      <span className="text-slate-300 truncate max-w-[140px] font-mono text-[11px]">{judge.email}</span>
                    </div>
                  )}
                </div>

                {/* Scoring Progress in Current Round */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Round Progress:</span>
                    <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-indigo-300'}`}>
                      {scoredCount} of {totalCandidatesCount} evaluated ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Share Credentials Button */}
                  <button
                    onClick={() => shareJudgeCredentials(judge)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1 transition-all border border-emerald-500/30"
                    title="Copy formatted credentials to share with Judge"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share Credentials</span>
                  </button>

                  <button
                    onClick={() => {
                      loginJudge(judge.accessCode, judge.password || 'dance2026');
                      setActiveRole('judge');
                    }}
                    className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-all text-xs"
                    title="Open portal as this judge"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(judge)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="Edit Judge"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleJudgeStatus(judge.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                      judge.status === 'active' 
                        ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300' 
                        : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300'
                    }`}
                    title={judge.status === 'active' ? 'Deactivate Judge' : 'Activate Judge'}
                  >
                    {judge.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setJudgeToDelete(judge)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-all"
                    title="Delete Judge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit Judge Modal with ID and Password Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>{editingJudge ? 'Edit Judge & Credentials' : 'Register Official Judge'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judge Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: val,
                      accessCode: !editingJudge && val.length >= 2 ? ('JUDGE-' + val.substring(0, 2).toUpperCase() + Math.floor(10 + Math.random() * 90)) : prev.accessCode
                    }));
                  }}
                  placeholder="e.g. Marcus Chen"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Login ID and Password Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-xl border border-indigo-500/20">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Login ID / Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                    placeholder="JUDGE-MC99"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-amber-300 font-mono text-xs uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-pink-300 font-bold mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Security Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="dance2026"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Professional Title & Accolades
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Head Choreography Master & World Dance Judge"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="judge@dancefest.org"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Primary Adjudication Focus
                </label>
                <input
                  type="text"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  placeholder="e.g. Classical Technique & Choreography"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingJudge ? 'Save Credentials' : 'Create Judge Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup Modal */}
      {judgeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl p-6 relative border border-rose-500/30 text-center space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                Do you really want to delete?
              </h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete judge <span className="text-indigo-300 font-bold">"{judgeToDelete.name}"</span> ({judgeToDelete.accessCode})?
              </p>
              <p className="text-[11px] text-rose-400/90 font-medium bg-rose-950/30 p-2 rounded-xl border border-rose-500/20">
                This action will permanently delete their login credentials and associated judge scores from the database.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJudgeToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all border border-white/10"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = judgeToDelete;
                  setJudgeToDelete(null);
                  await deleteJudge(target.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
