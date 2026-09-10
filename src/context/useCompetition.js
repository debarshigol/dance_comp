import { useContext, createContext } from 'react';

export const CompetitionContext = createContext(null);

export function useCompetition() {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error('useCompetition must be used within a CompetitionProvider');
  }
  return context;
}
