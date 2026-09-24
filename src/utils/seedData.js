export const INITIAL_CANDIDATES = [];

export const INITIAL_JUDGES = [];

export const INITIAL_ROUNDS = [
  {
    id: 'round-1',
    name: 'Round 1: Preliminary Showcase',
    description: 'Initial performance round evaluated out of 50 by both judges and fan audience voting. Top qualifiers advance.',
    status: 'active',
    judgeWeightage: 70,
    audienceWeightage: 30,
    isCurrent: true,
    isAudienceLive: false,
    order: 1
  },
  {
    id: 'round-2',
    name: 'Round 2: Grand Finale Championship',
    description: 'Championship round for qualified finalists from Round 1. Scored out of 50 by both judges and audience.',
    status: 'pending',
    judgeWeightage: 50,
    audienceWeightage: 50,
    isCurrent: false,
    isAudienceLive: false,
    order: 2
  }
];

export const INITIAL_SCORES = [];
