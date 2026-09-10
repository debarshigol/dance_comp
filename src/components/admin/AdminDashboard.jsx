import React, { useState } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { useTheme } from '../../context/ThemeContext';
import CandidateManager from './CandidateManager';
import JudgeManager from './JudgeManager';
import RoundManager from './RoundManager';
import QRCodeCenter from './QRCodeCenter';
import LeaderboardView from './LeaderboardView';
import { 
  Trophy, 
  Users, 
  Award, 
  Layers, 
  QrCode, 
  AlertTriangle,
  Sparkles
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
    logoutAdmin 
  } = useCompetition();

  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('leaderboard');

  const tabs = [
    { id: 'leaderboard', label: 'Live Leaderboard', icon: Trophy, count: null },
    { id: 'candidates', label: 'Competitors', icon: Users, count: candidates.length },
    { id: 'judges', label: 'Judges Panel', icon: Award, count: judges.length },
    { id: 'rounds', label: '2-Round Weightage', icon: Layers, count: 2 },
    { id: 'qrcode', label: 'QR Voting Center', icon: QrCode, count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map((tab) => {
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
      </div>

      {/* Tab Content Display protected by ErrorBoundary */}
      <div className="min-h-[500px]">
        <TabErrorBoundary key={activeTab}>
          {activeTab === 'leaderboard' && <LeaderboardView />}
          {activeTab === 'candidates' && <CandidateManager />}
          {activeTab === 'judges' && <JudgeManager />}
          {activeTab === 'rounds' && <RoundManager />}
          {activeTab === 'qrcode' && <QRCodeCenter />}
        </TabErrorBoundary>
      </div>
    </div>
  );
}
