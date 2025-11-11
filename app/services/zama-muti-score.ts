export interface PostInput {
  likes: number;
  retweets: number;
  quotes: number;
  impressions: number;
}

export interface MultiPostInput {
  posts: PostInput[];
  followers: number;
  smartFollowers?: number;
  verifiedFollowers?: number;
}

export interface PostResult {
  ER: number;                // Engagement Rate %
  finalScore: number;        // Final calculated score
  smartEngagement: number;   // Engagement attributed to smart followers
  advice: string[];
}

export interface MultiPostResult {
  totalER: number;
  totalScore: number;
  perPost: PostResult[];
  advice: string[];
}

export function calculateMultiPostScore(input: MultiPostInput): MultiPostResult {
  const { posts, followers, smartFollowers = 0, verifiedFollowers = 0 } = input;
  const results: PostResult[] = [];
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalQuotes = 0;
  let totalImpressions = 0;
  let totalFinalScore = 0;

  posts.forEach((post) => {
    const { likes, retweets, quotes, impressions } = post;

    if (impressions < 1000) {
      results.push({
        ER: 0,
        finalScore: 0,
        smartEngagement: 0,
        advice: ["⚠️ Impressions < 1000, post bị loại"],
      });
      return;
    }

    // --- 1. SRM ---
    const SRM = Math.min(1, impressions / 100000);
    const qW = 4 + 2 * SRM;

    // --- 2. Engagement ---
    const ENG = likes + 3 * retweets + qW * quotes;

    // --- 3. Smart Engagement ---
    const smartEngagement = followers > 0 ? ENG * (smartFollowers / followers) : 0;

    // --- 4. ER ---
    const ER = (likes + retweets + quotes) / impressions;

    // --- 5. SF, VF, IMP ---
    const SF = Math.min(Math.log10(smartFollowers + 1), 3.0);
    const VF = Math.min(verifiedFollowers / Math.max(followers, 1), 1.0);
    const IMP = Math.sqrt(impressions);

    // --- 6. Observed Engagement ---
    const EngObs = Math.max(ENG, ER * impressions);

    // --- 7. ER cap & effective engagement ---
    const ER_cap = 0.01 + 0.04 * SRM;
    const EffEng = Math.min(EngObs, impressions * ER_cap);
    const Clamp = EffEng / EngObs;

    // --- 8. SENG ---
    const SENG = Math.min(smartEngagement, 0.5 * EffEng);

    // --- 9. Multipliers ---
    const QE = Math.min(Math.log(1 + impressions / Math.max(followers, 1)), 2.0) * SRM;
    const verifiedBoost = 1 + 0.25 * VF;
    const postMult = 1.02;
    const erMult = 0.9 + 2 * Math.min(ER, 0.05);

    // --- 10. Base score ---
    const engageBlock = ((ENG * 0.7) * Clamp + (SENG * 150)) * Math.pow(SRM, 1.5);
    const baseScore = SF * 500 + IMP * 10 + engageBlock + QE * 120;
    let finalScore = baseScore * erMult * postMult * verifiedBoost;

    // --- 11. Guards ---
    if (ER > 0.2) finalScore = 0;
    if (ER > 0.1 && impressions < 50000) finalScore *= 0.3;
    if (ER < 0.001) finalScore *= 0.5;

    // --- 12. Advice ---
    const advice: string[] = [];
    if (ER > 0.08) advice.push("⚠️ ER cao, có thể bị cap hoặc nghi ngờ tương tác giả.");
    else if (ER < 0.03) advice.push("📉 ER thấp, nên tăng repost hoặc quotes tự nhiên.");
    else advice.push("✅ ER trong ngưỡng an toàn.");

    if (followers > 0 && smartFollowers / followers < 0.2) advice.push("👀 Tỷ lệ smart follower thấp — nên tăng follower chất lượng.");
    if (VF > 0.1) advice.push("💎 Verified follower ratio tốt — tăng độ tin cậy.");

    results.push({
      ER: parseFloat((ER * 100).toFixed(2)),
      finalScore: parseFloat(finalScore.toFixed(2)),
      smartEngagement: parseFloat(smartEngagement.toFixed(2)),
      advice,
    });

    totalLikes += likes;
    totalRetweets += retweets;
    totalQuotes += quotes;
    totalImpressions += impressions;
    totalFinalScore += finalScore;
  });

  const totalER = totalImpressions > 0
    ? parseFloat(((totalLikes + totalRetweets + totalQuotes) / totalImpressions * 100).toFixed(2))
    : 0;

  const totalAdvice: string[] = [];
  if (totalER > 8) totalAdvice.push("⚠️ Tổng ER cao, cân nhắc tăng tương tác tự nhiên.");
  else if (totalER < 3) totalAdvice.push("📉 Tổng ER thấp, tăng repost/quotes tự nhiên.");
  else totalAdvice.push("✅ Tổng ER trong ngưỡng an toàn.");

  return {
    totalER,
    totalScore: parseFloat(totalFinalScore.toFixed(2)),
    perPost: results,
    advice: totalAdvice,
  };
}