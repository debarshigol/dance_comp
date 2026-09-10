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
export function calculateLeaderboard({ candidates, scores = [], round, judges = [] }) {
  if (!candidates || candidates.length === 0) return [];

  const roundId = round?.id;
  const judgeWeightage = Number(round?.judgeWeightage ?? 60);
  const audienceWeightage = Number(round?.audienceWeightage ?? 40);

  // 1. Separate judge scores and audience votes from unified scores table
  const roundScores = roundId ? scores.filter(s => s.roundId === roundId || s.round_id === roundId) : scores;

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

    // A. Gather Judge evaluations for this candidate
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

    // B. Audience Vote Calculation for this candidate
    const candidateVotesCount = audienceVoteRecords.filter(v => 
      (v.candidateId || v.candidate_id) === candidateId
    ).length;

    // Percentage share of total audience votes in round
    const audienceVoteShare = totalAudienceVotes > 0 
      ? parseFloat(((candidateVotesCount / totalAudienceVotes) * 100).toFixed(2))
      : 0;
    const normalizedAudienceScore = audienceVoteShare;

    // C. Final Cumulative Score Formula:
    // Final Score = (Normalized Judge Score * Judge Weightage %) + (Normalized Audience Score * Viewer Weightage %)
    const weightedJudge = (normalizedJudgeScore * (judgeWeightage / 100));
    const weightedAudience = (normalizedAudienceScore * (audienceWeightage / 100));
    const finalScore = parseFloat((weightedJudge + weightedAudience).toFixed(2));

    const submittedJudgeIds = candidateJudgeScores.map(s => s.judgeId || s.judge_id);
    const completedJudgesCount = new Set(submittedJudgeIds).size;

    return {
      candidate,
      candidateId: candidate.id,
      candidateNumber: candidate.candidateNumber || candidate.candidate_number,
      name: candidate.name,
      photo: candidate.photo,
      category: candidate.category,
      style: candidate.style,
      
      // Scoring Metrics
      rawJudgeAverage: parseFloat(rawJudgeAverage.toFixed(2)), // 0-10 scale
      normalizedJudgeScore, // 0-100%
      weightedJudge: parseFloat(weightedJudge.toFixed(2)),
      
      // Audience Metrics
      candidateVotesCount,
      totalAudienceVotes,
      audienceVoteShare, // 0-100%
      normalizedAudienceScore, // 0-100%
      weightedAudience: parseFloat(weightedAudience.toFixed(2)),

      // Final Cumulative
      finalScore, // 0-100 scale

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
