import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { useTheme } from '../../context/ThemeContext';
import CandidateManager from './CandidateManager';
import JudgeManager from './JudgeManager';
import RoundManager from './RoundManager';
import QRCodeCenter from './QRCodeCenter';
import LeaderboardView from './LeaderboardView';
import VotingAuditCounts from './VotingAuditCounts';
import { 
  Trophy, 
  Users, 
  Award, 
  Layers, 
  QrCode, 
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Trash2,
  BarChart3,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

// Error boundary to prevent any single tab crash from causing a blank screen
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Section Temporarily Unavailable</h3>
            <p className="text-xs text-slate-400 mt-1">
              No data or error occurred in this view. Switch to another tab or click below to retry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard() {
  const { 
    candidates, 
    judges, 
    rounds, 
    scores, 
    currentRound, 
    logoutAdmin,
    resetScoresData
  } = useCompetition();

  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Main primary tabs visible in the navigation bar
  const primaryTabs = [
    { id: 'leaderboard', label: 'Live Leaderboard', icon: Trophy, count: null },
    { id: 'candidates', label: 'Competitors', icon: Users, count: candidates.length },
    { id: 'judges', label: 'Judges Panel', icon: Award, count: judges.length },
    { id: 'counts', label: 'Voting & Scoring Counts', icon: BarChart3, count: null },
  ];

  // Secondary items moved under the 'More' drawer
  const drawerTabs = [
    { id: 'rounds', label: '2-Round Weightage', icon: Layers },
    { id: 'qrcode', label: 'QR Voting Center', icon: QrCode }
  ];

  const isDrawerActive = drawerTabs.some((tab) => tab.id === activeTab);
  const activeDrawerItem = drawerTabs.find((tab) => tab.id === activeTab);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    await resetScoresData();
    setIsResetting(false);
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs & Reset Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-1 ring-pink-400'
                    : isDark
                      ? 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isDark 
                        ? 'bg-slate-800 text-slate-300' 
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* 'More' Drawer Tab Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              isDrawerActive
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 border-pink-400 ring-1 ring-pink-400'
                : isDark
                  ? 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-white/5'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 shadow-sm'
            }`}
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDrawerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Reset Data Button */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border shadow-sm ${
            isDark
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/50'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-rose-200 shadow-rose-50'
          }`}
          title="Reset all judge and audience scores for a fresh start"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>Reset Data</span>
        </button>
      </div>

      {/* Tab Content Display protected by ErrorBoundary */}
      <div className="min-h-[500px]">
        <TabErrorBoundary key={activeTab}>
          {activeTab === 'leaderboard' && <LeaderboardView />}
          {activeTab === 'candidates' && <CandidateManager />}
          {activeTab === 'judges' && <JudgeManager />}
          {activeTab === 'rounds' && <RoundManager />}
          {activeTab === 'counts' && <VotingAuditCounts />}
          {activeTab === 'qrcode' && <QRCodeCenter />}
        </TabErrorBoundary>
      </div>

      {/* 'More' Drawer Slide-out Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Slide-out Panel on Right */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className={`w-screen max-w-md shadow-2xl flex flex-col animate-slide-left border-l ${
              isDark 
                ? 'bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white' 
                : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-900'
            }`}>
              
              {/* Drawer Header */}
              <div className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-white/10' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                    <MoreHorizontal className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">More</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDark 
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-white' 
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body / Options List */}
              <div className="p-6 space-y-3 flex-1 overflow-y-auto">
                {drawerTabs.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 border cursor-pointer group ${
                        isCurrent
                          ? isDark
                            ? 'bg-pink-950/30 border-pink-500/50 ring-1 ring-pink-500/50 shadow-lg shadow-pink-950/40'
                            : 'bg-pink-50/80 border-pink-300 ring-1 ring-pink-400 shadow-md shadow-pink-100'
                          : isDark
                            ? 'bg-slate-800/50 hover:bg-slate-800 border-white/5 hover:border-pink-500/30'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 hover:border-pink-300'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isCurrent
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/40'
                          : isDark
                            ? 'bg-slate-700 text-pink-400'
                            : 'bg-pink-100 text-pink-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-bold tracking-tight ${
                          isCurrent 
                            ? 'text-pink-500' 
                            : isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                          Active
                        </span>
                      )}

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isCurrent 
                          ? 'text-pink-400' 
                          : isDark ? 'text-slate-500' : 'text-slate-400'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirmation Permission Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-7 relative border text-center space-y-4 shadow-2xl ${
            isDark
              ? 'bg-slate-900/95 border-rose-500/40 shadow-rose-950/60 text-white'
              : 'bg-white border-rose-200 shadow-rose-100 text-slate-900'
          }`}>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-rose-400 ${
              isDark ? 'bg-rose-500/15 border border-rose-500/30' : 'bg-rose-50 border border-rose-200'
            }`}>
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black">Reset Competition Data?</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                This will permanently delete <strong className="text-rose-400">all scores given by judges</strong> and <strong className="text-rose-400">all audience votes</strong> across Round 1 and Round 2 to make a fresh start of the application.
              </p>
              <div className={`p-3 rounded-2xl text-left text-xs ${
                isDark ? 'bg-slate-950/80 border border-white/5 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
              }`}>
                <span className="font-bold block text-slate-300 mb-1">What will be retained:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Competitor profiles, photos & registrations</li>
                  <li>Judges credentials & assigned passcodes</li>
                  <li>Round configurations & weightages</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border-slate-200'
                }`}
              >
                No, Keep Scores
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-rose-600/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Reset Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
