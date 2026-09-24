import React, { useEffect, useRef } from 'react';
import { useCompetition } from './context/CompetitionContext';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Toast from './components/layout/Toast';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import JudgePortal from './components/judge/JudgePortal';
import AudienceVotingPortal from './components/audience/AudienceVotingPortal';
import StageProjectorDisplay from './components/stage/StageProjectorDisplay';

export function AppContent() {
  const {
    activeRole,
    setActiveRole,
    isAdminAuthenticated,
    judges,
    setActiveJudgeId,
    setSelectedRoundId
  } = useCompetition();

  const isInitialMount = useRef(true);

  // Synchronize route on initial load and on popstate (browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = () => {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const codeParam = params.get('code');
      const roundParam = params.get('round');

      if (roleParam && ['admin', 'judge', 'audience', 'stage'].includes(roleParam.toLowerCase())) {
        setActiveRole(roleParam.toLowerCase());
      } else if (pathname === '/judge' || pathname.startsWith('/judge/') || pathname.includes('judge')) {
        setActiveRole('judge');
      } else if (pathname === '/audience' || pathname.startsWith('/audience/') || pathname.includes('audience')) {
        setActiveRole('audience');
      } else if (pathname === '/stage' || pathname.startsWith('/stage/') || pathname.includes('stage')) {
        setActiveRole('stage');
      } else if (pathname === '/' && !roleParam) {
        setActiveRole('admin');
      }

      if (roundParam && ['round-1', 'round-2'].includes(roundParam.toLowerCase())) {
        setSelectedRoundId(roundParam.toLowerCase());
      }

      if (codeParam && judges.length > 0) {
        const matchJudge = judges.find(j => j.accessCode.toLowerCase() === codeParam.toLowerCase());
        if (matchJudge) {
          setActiveJudgeId(matchJudge.id);
          setActiveRole('judge');
        }
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [judges, setActiveJudgeId, setActiveRole, setSelectedRoundId]);

  // Update browser URL bar on user role changes (skipping initial mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentPath = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (activeRole === 'judge') {
      const targetUrl = codeParam ? `/judge?code=${codeParam}` : '/judge';
      if (currentPath !== '/judge') {
        window.history.pushState({ role: 'judge' }, '', targetUrl);
      }
    } else if (activeRole === 'audience') {
      if (currentPath !== '/audience') {
        window.history.pushState({ role: 'audience' }, '', '/audience');
      }
    } else if (activeRole === 'stage') {
      if (currentPath !== '/stage') {
        window.history.pushState({ role: 'stage' }, '', '/stage');
      }
    } else if (activeRole === 'admin') {
      if (currentPath !== '/' || window.location.search) {
        window.history.pushState({ role: 'admin' }, '', '/');
      }
    }
  }, [activeRole]);

  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col selection:bg-pink-500 selection:text-white transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />
      <Toast />

      {/* Main Interactive Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRole === 'admin' && (
          isAdminAuthenticated ? <AdminDashboard /> : <AdminLogin />
        )}

        {activeRole === 'judge' && (
          <JudgePortal />
        )}

        {activeRole === 'audience' && (
          <AudienceVotingPortal />
        )}

        {activeRole === 'stage' && (
          <StageProjectorDisplay />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
