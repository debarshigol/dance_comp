import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Vote, 
  Tv, 
  RefreshCw, 
  Layers, 
  Flame, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Database,
  LogOut,
  AlertTriangle,
  Sun,
  Moon,
  X
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeRole, 
    isAdminAuthenticated,
    logoutAdmin,
    authenticatedJudge,
    logoutJudge,
    currentRound,
    selectedRoundId,
    refreshDatabaseData, 
    isSupabaseConnected, 
    isSyncing 
  } = useCompetition();

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [isLeftSliderOpen, setIsLeftSliderOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (activeRole === 'admin') {
      logoutAdmin();
    } else if (activeRole === 'judge') {
      logoutJudge();
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors duration-300 ${
      isDark
        ? 'border-white/10 bg-slate-950/80'
        : 'border-slate-200 bg-white/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Title (Clickable for Judge to open Left Slider) */}
        <button
          type="button"
          onClick={() => {
            if (activeRole === 'judge') {
              setIsLeftSliderOpen(true);
            }
          }}
          className={`flex items-center gap-3 text-left transition-all ${
            activeRole === 'judge'
              ? 'cursor-pointer group hover:opacity-90 active:scale-95'
              : ''
          }`}
          title={activeRole === 'judge' ? 'Tap logo to open menu' : undefined}
          aria-label={activeRole === 'judge' ? 'Open Judge Menu' : 'Nritya Logo'}
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600/20 via-rose-500/20 to-amber-500/20 border flex items-center justify-center shadow-lg p-0.5 overflow-hidden transition-all ${
            activeRole === 'judge'
              ? 'group-hover:scale-105 group-hover:border-indigo-400/50 group-hover:ring-2 group-hover:ring-indigo-500/30'
              : ''
          } ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <img 
              src="/nritya-logo.png" 
              alt="Nritya Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-xl tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
                isDark
                  ? 'from-white via-pink-100 to-amber-300'
                  : 'from-slate-800 via-pink-600 to-amber-600'
              }`}>
                Nritya
              </span>
            </div>
          </div>
        </button>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Admin Badge */}
          {activeRole === 'admin' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
              isDark
                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                : 'bg-pink-50 text-pink-600 border border-pink-200'
            }`}>
              <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-pink-400' : 'text-pink-500'}`} />
              <span>{isAdminAuthenticated ? 'Admin' : 'Admin Portal'}</span>
            </div>
          )}

          {/* Judge: ONLY Active Round Badge (Round 1 / Round 2) on header */}
          {activeRole === 'judge' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-sm ${
              currentRound?.status === 'locked'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : isDark
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span>{currentRound?.order ? `Round ${currentRound.order}` : (currentRound?.name?.toLowerCase().includes('round 2') || selectedRoundId === 'round-2' ? 'Round 2' : 'Round 1')}</span>
              {currentRound?.status === 'locked' && (
                <span className="text-[10px] uppercase font-bold text-rose-400/90">(Locked)</span>
              )}
            </div>
          )}

          {/* Audience: Display active round as Round 1 or Round 2 on the header */}
          {activeRole === 'audience' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-sm ${
              currentRound?.status === 'locked'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : isDark
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
              <span>{currentRound?.order ? `Round ${currentRound.order}` : (currentRound?.name?.toLowerCase().includes('round 2') || selectedRoundId === 'round-2' ? 'Round 2' : 'Round 1')}</span>
              {currentRound?.status === 'locked' && (
                <span className="text-[10px] uppercase font-bold text-rose-400/90">(Locked)</span>
              )}
            </div>
          )}

          {/* Stage Badge */}
          {activeRole === 'stage' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
              isDark
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <Tv className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <span>Stage</span>
            </div>
          )}

          {/* Theme Toggle Button (Shown on header for Admin, Audience, Stage; moved to left slider for Judge) */}
          {activeRole !== 'judge' && (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border border-white/10'
                  : 'bg-amber-100 border border-amber-300'
              }`}
            >
              <div className={`absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isDark
                  ? 'translate-x-7.5 bg-indigo-500'
                  : 'translate-x-1 bg-amber-400'
              }`}>
                {isDark
                  ? <Moon className="w-3 h-3 text-white" />
                  : <Sun className="w-3 h-3 text-white" />
                }
              </div>
            </button>
          )}

          {/* Supabase DB Sync Button (Admin Only) */}
          {activeRole === 'admin' && (
            <button
              type="button"
              onClick={refreshDatabaseData}
              title={isSupabaseConnected ? "Synced with Supabase Cloud DB. Click to refresh." : "Click to refresh from database"}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-white/10'
                  : 'text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pink-400' : (isSupabaseConnected ? 'text-emerald-400' : 'text-slate-400')}`} />
              <span className={`hidden xl:inline text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                {isSyncing ? 'Syncing...' : (isSupabaseConnected ? 'DB Live' : 'Refresh DB')}
              </span>
            </button>
          )}

          {/* Logout Button in header (Admin only; Judge logout moved to left slider) */}
          {activeRole === 'admin' && isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/10'
                  : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Left Slider Drawer for Judge */}
      {activeRole === 'judge' && (
        <>
          {/* Full Height Backdrop Overlay */}
          <div
            onClick={() => setIsLeftSliderOpen(false)}
            className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
              isLeftSliderOpen 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
          />

          {/* Left Slider with Complete View Height */}
          <div
            className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 h-screen max-h-screen border-r shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between ${
              isLeftSliderOpen ? 'translate-x-0' : '-translate-x-full'
            } ${
              isDark
                ? 'bg-slate-950 border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Slider Top Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-white/10' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600/20 via-rose-500/20 to-amber-500/20 border flex items-center justify-center p-0.5 overflow-hidden ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <img 
                    src="/nritya-logo.png" 
                    alt="Nritya Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className={`font-black text-lg tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${
                    isDark
                      ? 'from-white via-pink-100 to-amber-300'
                      : 'from-slate-800 via-pink-600 to-amber-600'
                  }`}>
                    Nritya
                  </span>
                  <span className="block text-[11px] font-bold text-indigo-400">Judge Panel</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLeftSliderOpen(false)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slider Body: User Name & Mode Change */}
            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
              {/* User Name Section */}
              <div className="space-y-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Logged In Judge
                </span>
                <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-sm ${
                  isDark
                    ? 'bg-slate-900/90 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                    isDark
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                  }`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className={`font-black text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {authenticatedJudge ? authenticatedJudge.name : 'Judge'}
                    </h4>
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Official Judge
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode Change Button Section */}
              <div className="space-y-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Mode & Theme
                </span>
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                  isDark
                    ? 'bg-slate-900/90 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark
                        ? 'bg-slate-800 text-indigo-400 border border-white/10'
                        : 'bg-amber-100 text-amber-600 border border-amber-200'
                    }`}>
                      {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Switch display theme
                      </span>
                    </div>
                  </div>

                  {/* Mode Change Switch */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center shrink-0 cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border border-white/10'
                        : 'bg-amber-100 border border-amber-300'
                    }`}
                  >
                    <div className={`absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                      isDark
                        ? 'translate-x-7.5 bg-indigo-500'
                        : 'translate-x-1 bg-amber-400'
                    }`}>
                      {isDark
                        ? <Moon className="w-3 h-3 text-white" />
                        : <Sun className="w-3 h-3 text-white" />
                      }
                    </div>
                  </button>
                </div>
              </div>

              {/* Logout Button positioned directly below Mode Switch */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLeftSliderOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/30'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-rose-200'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-6 relative border text-center space-y-4 shadow-2xl ${
            isDark
              ? 'glass-panel-glow border-rose-500/30 shadow-rose-950/50'
              : 'bg-white border-rose-200 shadow-rose-100/50'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-rose-400 ${
              isDark ? 'bg-rose-500/15 border border-rose-500/30' : 'bg-rose-50 border border-rose-200'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Do you really want to logout?</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeRole === 'admin'
                  ? 'You will be signed out of the Admin Console.'
                  : `You will be signed out of Judge account (${authenticatedJudge?.name}).`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border-slate-200'
                }`}
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
