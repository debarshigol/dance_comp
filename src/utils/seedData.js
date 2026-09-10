export const INITIAL_CANDIDATES = [];

export const INITIAL_JUDGES = [];

export const INITIAL_ROUNDS = [
  {
    id: 'round-1',
    name: 'Round 1: Preliminary Showcase & Technique',
    description: 'Initial performance round evaluating technical execution, rhythm, musicality, and stage presence.',
    status: 'active',
    judgeWeightage: 70,
    audienceWeightage: 30,
    isCurrent: true,
    order: 1
  },
  {
    id: 'round-2',
    name: 'Round 2: Grand Finale Championship',
    description: 'Championship round for top finalists featuring high-difficulty choreography and audience fan voting.',
    status: 'pending',
    judgeWeightage: 50,
    audienceWeightage: 50,
    isCurrent: false,
    order: 2
  }
];

export const INITIAL_SCORES = [];
