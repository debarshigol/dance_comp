/**
 * Scoring and Calculation Methodology
 * Consumes the unified `scores` table containing single 50-point judge evaluations and audience votes.
 *
 * Scoring Rules:
 * 1. Judge Scoring: Single section per candidate in any round, score out of 50.
 * 2. Average Judge Score (0-50): Average of evaluations across active judges who scored.
 * 3. Normalized Judge Score (%): (Average Judge Score / 50) * 100.
 * 4. Weighted Judge Points: Normalized Judge % * (Judge Weightage % / 100).
 * 5. Weighted Audience Points: Audience Vote Share % * (Audience Weightage % / 100).
 * 6. Final Round Score (0-100): Weighted Judge Points + Weighted Audience Points.
 * 7. Advancement Rule: Top 10 candidates from Round 1 advance to Round 2.
 */

export const MAX_JUDGE_SCORE = 50;
export const SCORING_CRITERIA = [];

/**
 * Extracts numeric judge score (0 to 50) from score record with backward compatibility.
 */
export function extractJudgeScore(scoreRecord) {
  if (!scoreRecord) return 0;

  // Single score in criteria object: { score: 42.5 }
  if (scoreRecord.criteria?.score !== undefined) {
    return Math.max(0, Math.min(MAX_JUDGE_SCORE, Number(scoreRecord.criteria.score) || 0));
  }

  // Direct rawScore
  if (scoreRecord.rawScore !== undefined && scoreRecord.rawScore !== null) {
    const raw = Number(scoreRecord.rawScore);
    // Backward compatibility: If an old evaluation was stored on 0-10 scale with 5 criteria
    if (raw <= 10 && scoreRecord.criteria && Object.keys(scoreRecord.criteria).length > 1) {
      return Math.max(0, Math.min(MAX_JUDGE_SCORE, raw * 5));
    }
    return Math.max(0, Math.min(MAX_JUDGE_SCORE, raw));
  }

  // Legacy multi-criteria fallback: sum of 5 criteria (each 0-10 = 50 total)
  if (scoreRecord.criteria && typeof scoreRecord.criteria === 'object') {
    const vals = Object.values(scoreRecord.criteria).map(Number).filter(n => !isNaN(n));
    if (vals.length > 0) {
      return Math.max(0, Math.min(MAX_JUDGE_SCORE, vals.reduce((a, b) => a + b, 0)));
    }
  }

  return 0;
}

/**
 * Calculates candidate scores for a given round using single 50-point judge scoring.
 */
export function calculateRoundLeaderboard({ candidates = [], scores = [], round, judges = [] }) {
  if (!candidates || candidates.length === 0) return [];

  const roundId = round?.id || 'round-1';
  const judgeWeightage = Number(round?.judgeWeightage ?? 70);
  const audienceWeightage = Number(round?.audienceWeightage ?? 30);

  // 1. Filter round-specific scores
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
  const activeJudgeCount = activeJudges.length > 0 ? activeJudges.length : 2;

  const results = candidates.map(candidate => {
    const candidateId = candidate.id;

    // A. Gather Judge evaluations for this candidate in this round
    const candidateJudgeScores = judgeScoreRecords.filter(s => 
      (s.candidateId || s.candidate_id) === candidateId
    );

    let sumJudgePoints = 0;
    const individualJudgeScores = {};

    candidateJudgeScores.forEach(scoreRecord => {
      const jId = scoreRecord.judgeId || scoreRecord.judge_id;
      const scoreVal = extractJudgeScore(scoreRecord);
      sumJudgePoints += scoreVal;
      if (jId) {
        individualJudgeScores[jId] = scoreVal;
      }
    });

    const completedJudgesCount = candidateJudgeScores.length;

    // Average score out of 50
    const rawJudgeAverage = completedJudgesCount > 0 
      ? (sumJudgePoints / completedJudgesCount) 
      : 0;

    // Normalized Judge Score (0 to 100%)
    const normalizedJudgeScore = parseFloat(((rawJudgeAverage / MAX_JUDGE_SCORE) * 100).toFixed(2));

    // B. Audience Vote Calculation
    const candidateVotesCount = audienceVoteRecords.filter(v => 
      (v.candidateId || v.candidate_id) === candidateId
    ).length;

    const audienceVoteShare = totalAudienceVotes > 0 
      ? parseFloat(((candidateVotesCount / totalAudienceVotes) * 100).toFixed(2))
      : 0;
    const normalizedAudienceScore = audienceVoteShare;

    // C. Final Round Weighted Score Formula:
    const weightedJudge = parseFloat((normalizedJudgeScore * (judgeWeightage / 100)).toFixed(2));
    const weightedAudience = parseFloat((normalizedAudienceScore * (audienceWeightage / 100)).toFixed(2));
    const finalScore = parseFloat((weightedJudge + weightedAudience).toFixed(2));

    const hasScores = candidateJudgeScores.length > 0 || candidateVotesCount > 0;

    return {
      candidate,
      candidateId: candidate.id,
      candidateNumber: candidate.candidateNumber || candidate.candidate_number,
      name: candidate.name,
      photo: candidate.photo,
      category: candidate.category,
      style: candidate.style,
      song: candidate.song,
      roundId,
      judgeWeightage,
      audienceWeightage,
      
      // Scoring Metrics (out of 50)
      rawJudgeAverage: parseFloat(rawJudgeAverage.toFixed(2)), // 0-50 scale
      judgeScoreOutOf50: parseFloat(rawJudgeAverage.toFixed(2)),
      maxJudgeScore: MAX_JUDGE_SCORE,
      normalizedJudgeScore, // 0-100%
      weightedJudge, // out of judgeWeightage pts
      individualJudgeScores,
      
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
    // Mark Top 10 qualification
    results[i].isTop10Qualified = (i < 10);
  }

  return results;
}

/**
 * Calculates the comprehensive cumulative leaderboard across all competition rounds (Round 1 and Round 2).
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
      // Both rounds: Composite cumulative average (0-100)
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
      song: candidate.song,

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
      isTop10Qualified: r1?.isTop10Qualified ?? false,

      // Compatibility fields
      finalScore: cumulativeScore,
      rawJudgeAverage: r2?.hasScores ? r2.rawJudgeAverage : (r1?.rawJudgeAverage || 0),
      judgeScoreOutOf50: r2?.hasScores ? r2.rawJudgeAverage : (r1?.rawJudgeAverage || 0),
      maxJudgeScore: MAX_JUDGE_SCORE,
      normalizedJudgeScore: r2?.hasScores ? r2.normalizedJudgeScore : (r1?.normalizedJudgeScore || 0),
      candidateVotesCount: totalVotes,
      audienceVoteShare: r2?.hasScores ? r2.audienceVoteShare : (r1?.audienceVoteShare || 0),
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
 * Helper to get the top 10 qualified candidate IDs from Round 1 standings
 */
export function getTop10QualifiedCandidateIds(round1Leaderboard = [], allCandidates = []) {
  if (round1Leaderboard && round1Leaderboard.length >= 10) {
    return round1Leaderboard.slice(0, 10).map(c => c.candidateId);
  }
  if (round1Leaderboard && round1Leaderboard.length > 0) {
    const scoredIds = round1Leaderboard.map(c => c.candidateId);
    const remaining = allCandidates
      .filter(c => !scoredIds.includes(c.id))
      .map(c => c.id);
    return [...scoredIds, ...remaining].slice(0, 10);
  }
  return allCandidates.slice(0, 10).map(c => c.id);
}

export function calculateLeaderboard({ candidates, scores = [], round, judges = [] }) {
  if (round) {
    return calculateRoundLeaderboard({ candidates, scores, round, judges });
  }
  return calculateCumulativeLeaderboard({ candidates, scores, rounds: [], judges });
}
