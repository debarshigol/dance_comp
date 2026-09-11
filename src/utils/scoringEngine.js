/**
 * Scoring and Calculation Methodology (BRD Section 4)
 * Consumes the unified `scores` table containing both judge criterion evaluations and audience votes.
 * 
 * Criteria (0 to 10):
 * 1. Rhythm & Timing (rhythm)
 * 2. Choreography & Musicality (choreography)
 * 3. Expression & Emotion (expression)
 * 4. Technique & Execution (technique)
 * 5. Stage Presence & Impact (stagePresence)
 */

export const SCORING_CRITERIA = [
  { id: 'rhythm', label: 'Rhythm / Timing', description: 'Beat synchronization, tempo control & musical accents' },
  { id: 'choreography', label: 'Choreography', description: 'Originality, transition flow, composition & complexity' },
  { id: 'expression', label: 'Expression', description: 'Storytelling, emotional engagement & face dynamics' },
  { id: 'technique', label: 'Technique', description: 'Clean lines, posture, balance, footwork & precision' },
  { id: 'stagePresence', label: 'Stage Presence', description: 'Confidence, energy projection & audience connection' },
];

/**
 * Calculates candidate scores for a given round or overall using the unified `scores` table.
 * 
 * @param {Array} candidates - List of candidates / competitors
 * @param {Array} scores - Unified list of scores [{ id, candidateId, roundId, sourceType, judgeId, voterFingerprint, criteria, rawScore, notes }]
 * @param {Object} round - The current or selected round object { id, judgeWeightage, audienceWeightage }
 * @param {Array} judges - List of registered judges
 */
export function calculateRoundLeaderboard({ candidates = [], scores = [], round, judges = [] }) {
  if (!candidates || candidates.length === 0) return [];

  const roundId = round?.id || 'round-1';
  const judgeWeightage = Number(round?.judgeWeightage ?? 60);
  const audienceWeightage = Number(round?.audienceWeightage ?? 40);

  // 1. Separate judge scores and audience votes from unified scores table for this round
  const roundScores = scores.filter(s => (s.roundId === roundId || s.round_id === roundId));

  const judgeScoreRecords = roundScores.filter(s => 
    s.sourceType === 'judge' || s.source_type === 'judge' || (s.judgeId || s.judge_id)
  );

  const audienceVoteRecords = roundScores.filter(s => 
    s.sourceType === 'audience' || s.source_type === 'audience' || (!s.judgeId && !s.judge_id && (s.voterFingerprint || s.voter_fingerprint))
  );

  const totalAudienceVotes = audienceVoteRecords.length;

  // Active judges count
  const activeJudges = judges.filter(j => j.status === 'active');
  const activeJudgeCount = activeJudges.length;

  const results = candidates.map(candidate => {
    const candidateId = candidate.id;

    // A. Gather Judge evaluations for this candidate in this round
    const candidateJudgeScores = judgeScoreRecords.filter(s => 
      (s.candidateId || s.candidate_id) === candidateId
    );
    
    let sumCriteriaPoints = 0;
    let totalCriteriaEntries = 0;
    const criterionAverages = {};
    SCORING_CRITERIA.forEach(crit => {
      criterionAverages[crit.id] = { total: 0, count: 0, avg: 0 };
    });

    candidateJudgeScores.forEach(scoreRecord => {
      const critObj = scoreRecord.criteria || {};
      SCORING_CRITERIA.forEach(crit => {
        const val = Number(critObj[crit.id] ?? critObj[crit.id.toLowerCase()] ?? 0);
        if (critObj[crit.id] !== undefined || critObj[crit.id.toLowerCase()] !== undefined) {
          sumCriteriaPoints += val;
          totalCriteriaEntries += 1;
          criterionAverages[crit.id].total += val;
          criterionAverages[crit.id].count += 1;
        }
      });
    });

    SCORING_CRITERIA.forEach(crit => {
      const c = criterionAverages[crit.id];
      c.avg = c.count > 0 ? parseFloat((c.total / c.count).toFixed(2)) : 0;
    });

    // Average score per criterion (out of 10)
    const rawJudgeAverage = totalCriteriaEntries > 0 
      ? (sumCriteriaPoints / totalCriteriaEntries) 
      : 0;
    
    // Normalized Judge Score (0 to 100%)
    const normalizedJudgeScore = parseFloat(((rawJudgeAverage / 10) * 100).toFixed(2));

    // B. Audience Vote Calculation for this candidate in this round
    const candidateVotesCount = audienceVoteRecords.filter(v => 
      (v.candidateId || v.candidate_id) === candidateId
    ).length;

    // Percentage share of total audience votes in round
    const audienceVoteShare = totalAudienceVotes > 0 
      ? parseFloat(((candidateVotesCount / totalAudienceVotes) * 100).toFixed(2))
      : 0;
    const normalizedAudienceScore = audienceVoteShare;

    // C. Final Round Weighted Score Formula:
    // Weighted Judge = Normalized Judge % * (Judge Weightage % / 100)
    // Weighted Audience = Audience Vote Share % * (Audience Weightage % / 100)
    const weightedJudge = parseFloat((normalizedJudgeScore * (judgeWeightage / 100)).toFixed(2));
    const weightedAudience = parseFloat((normalizedAudienceScore * (audienceWeightage / 100)).toFixed(2));
    const finalScore = parseFloat((weightedJudge + weightedAudience).toFixed(2));

    const submittedJudgeIds = candidateJudgeScores.map(s => s.judgeId || s.judge_id);
    const completedJudgesCount = new Set(submittedJudgeIds).size;
    const hasScores = candidateJudgeScores.length > 0 || candidateVotesCount > 0;

    return {
      candidate,
      candidateId: candidate.id,
      candidateNumber: candidate.candidateNumber || candidate.candidate_number,
      name: candidate.name,
      photo: candidate.photo,
      category: candidate.category,
      style: candidate.style,
      roundId,
      judgeWeightage,
      audienceWeightage,
      
      // Scoring Metrics
      rawJudgeAverage: parseFloat(rawJudgeAverage.toFixed(2)), // 0-10 scale
      normalizedJudgeScore, // 0-100%
      weightedJudge, // out of judgeWeightage pts
      
      // Audience Metrics
      candidateVotesCount,
      totalAudienceVotes,
      audienceVoteShare, // 0-100%
      normalizedAudienceScore, // 0-100%
      weightedAudience, // out of audienceWeightage pts

      // Final Round Score
      finalScore, // 0-100 scale
      hasScores,

      // Breakdown Details
      criterionAverages,
      completedJudgesCount,
      activeJudgeCount,
      candidateScores: candidateJudgeScores,
      isFullyScored: activeJudgeCount > 0 && completedJudgesCount >= activeJudgeCount
    };
  });

  // Sort descending by finalScore, break ties by rawJudgeAverage, then votes
  results.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    if (b.rawJudgeAverage !== a.rawJudgeAverage) {
      return b.rawJudgeAverage - a.rawJudgeAverage;
    }
    return b.candidateVotesCount - a.candidateVotesCount;
  });

  // Assign ranks with tie handling
  let currentRank = 1;
  for (let i = 0; i < results.length; i++) {
    if (i > 0 && results[i].finalScore < results[i - 1].finalScore) {
      currentRank = i + 1;
    }
    results[i].rank = currentRank;
  }

  return results;
}

/**
 * Calculates the comprehensive cumulative leaderboard across all competition rounds (Round 1 and Round 2).
 * Accurately aggregates scores with their round-specific weightages.
 */
export function calculateCumulativeLeaderboard({ candidates = [], scores = [], rounds = [], judges = [] }) {
  if (!candidates || candidates.length === 0) return [];

  const round1 = rounds.find(r => r.order === 1 || r.id === 'round-1') || rounds[0] || { id: 'round-1', judgeWeightage: 70, audienceWeightage: 30 };
  const round2 = rounds.find(r => r.order === 2 || r.id === 'round-2') || rounds[1] || { id: 'round-2', judgeWeightage: 50, audienceWeightage: 50 };

  const round1Results = calculateRoundLeaderboard({ candidates, scores, round: round1, judges });
  const round2Results = calculateRoundLeaderboard({ candidates, scores, round: round2, judges });

  const r1Map = new Map(round1Results.map(r => [r.candidateId, r]));
  const r2Map = new Map(round2Results.map(r => [r.candidateId, r]));

  // Check which rounds have any recorded evaluations or votes
  const round1HasActivity = round1Results.some(r => r.hasScores);
  const round2HasActivity = round2Results.some(r => r.hasScores);

  const results = candidates.map(candidate => {
    const candidateId = candidate.id;
    const r1 = r1Map.get(candidateId);
    const r2 = r2Map.get(candidateId);

    const r1Score = r1 ? r1.finalScore : 0;
    const r2Score = r2 ? r2.finalScore : 0;

    let cumulativeScore = 0;
    let totalCumulativePoints = 0;

    if (round1HasActivity && round2HasActivity) {
      // Both rounds have taken place: Composite cumulative average (0-100)
      cumulativeScore = parseFloat(((r1Score + r2Score) / 2).toFixed(2));
      totalCumulativePoints = parseFloat((r1Score + r2Score).toFixed(2));
    } else if (round2HasActivity) {
      cumulativeScore = r2Score;
      totalCumulativePoints = r2Score;
    } else if (round1HasActivity) {
      cumulativeScore = r1Score;
      totalCumulativePoints = r1Score;
    } else {
      cumulativeScore = 0;
      totalCumulativePoints = 0;
    }

    const totalVotes = (r1?.candidateVotesCount || 0) + (r2?.candidateVotesCount || 0);

    return {
      candidate,
      candidateId: candidate.id,
      candidateNumber: candidate.candidateNumber || candidate.candidate_number,
      name: candidate.name,
      photo: candidate.photo,
      category: candidate.category,
      style: candidate.style,

      // Round 1 Specifics
      round1: r1,
      round1Score: r1Score,

      // Round 2 Specifics
      round2: r2,
      round2Score: r2Score,

      // Cumulative Totals
      cumulativeScore,
      totalCumulativePoints,
      totalVotes,
      hasScores: (r1?.hasScores || false) || (r2?.hasScores || false),

      // Retain compatibility fields for generic display
      finalScore: cumulativeScore,
      rawJudgeAverage: r2?.hasScores ? r2.rawJudgeAverage : (r1?.rawJudgeAverage || 0),
      normalizedJudgeScore: r2?.hasScores ? r2.normalizedJudgeScore : (r1?.normalizedJudgeScore || 0),
      candidateVotesCount: totalVotes,
      audienceVoteShare: r2?.hasScores ? r2.audienceVoteShare : (r1?.audienceVoteShare || 0),
      criterionAverages: r2?.hasScores ? r2.criterionAverages : (r1?.criterionAverages || {}),
      candidateScores: [...(r1?.candidateScores || []), ...(r2?.candidateScores || [])]
    };
  });

  // Sort descending by cumulativeScore, break ties by Round 2 score, Round 1 score, then votes
  results.sort((a, b) => {
    if (b.cumulativeScore !== a.cumulativeScore) {
      return b.cumulativeScore - a.cumulativeScore;
    }
    if (b.round2Score !== a.round2Score) {
      return b.round2Score - a.round2Score;
    }
    if (b.round1Score !== a.round1Score) {
      return b.round1Score - a.round1Score;
    }
    return b.totalVotes - a.totalVotes;
  });

  // Assign ranks with tie handling
  let currentRank = 1;
  for (let i = 0; i < results.length; i++) {
    if (i > 0 && results[i].cumulativeScore < results[i - 1].cumulativeScore) {
      currentRank = i + 1;
    }
    results[i].rank = currentRank;
  }

  return results;
}

/**
 * Backward compatibility alias for single round or overall
 */
export function calculateLeaderboard({ candidates, scores = [], round, judges = [] }) {
  if (round) {
    return calculateRoundLeaderboard({ candidates, scores, round, judges });
  }
  return calculateCumulativeLeaderboard({ candidates, scores, rounds: [], judges });
}
