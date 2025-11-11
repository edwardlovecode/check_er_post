// zamaScore.ts

export interface ZamaPostInput {
  likes: number;
  retweets: number;
  quotes: number;
  impressions: number;
  followers: number;
  smartFollowers?: number;
  smartEngagement?: number;
  verifiedFollowers?: number;
}

export interface ZamaScoreResult {
  ER: string; // %
  finalScore: string;
  advice: string[];
}

export function calculateZamaScore({
  likes,
  retweets,
  quotes,
  impressions,
  followers,
  smartFollowers = 0,
  smartEngagement = 0,
  verifiedFollowers = 0,
}: ZamaPostInput): ZamaScoreResult {
  if (impressions <= 0) return { ER: "0.00", finalScore: "0.00", advice: ["Invalid impressions"] };

  // --- 1. Core metrics ---
  const ER = (likes + retweets + quotes) / impressions;
  const SRM = Math.min(1, impressions / 100000);
  const SF = Math.min(Math.log10(smartFollowers + 1), 3.0);
  const VF = Math.min(verifiedFollowers / Math.max(followers, 1), 1.0); // verified ratio cap
  const IMP = Math.sqrt(impressions);
  const qW = 4 + 2 * SRM;
  const ENG = likes + 3 * retweets + qW * quotes;

  // --- 2. Observed engagement ---
  const EngObs = Math.max(ENG, ER * impressions);

  // --- 3. ER cap per reach ---
  const ER_cap = 0.01 + 0.04 * SRM;
  const EffEng = Math.min(EngObs, impressions * ER_cap);
  const Clamp = EffEng / EngObs;

  // --- 4. Smart engagement ---
  const SENG = Math.min(smartEngagement, 0.5 * EffEng);

  // --- 5. Reach efficiency & verified boost ---
  const QE = Math.min(Math.log(1 + impressions / Math.max(followers, 1)), 2.0) * SRM;
  const verifiedBoost = 1 + 0.25 * VF; // up to +25% bonus

  // --- 6. Multipliers ---
  const postMult = 1.02; // +2% single post
  const erMult = 0.9 + 2 * Math.min(ER, 0.05);

  // --- 7. Base score ---
  const engageBlock = ((ENG * 0.7) * Clamp + (SENG * 150)) * Math.pow(SRM, 1.5);
  const baseScore = SF * 500 + IMP * 10 + engageBlock + QE * 120;
  let finalScore = baseScore * erMult * postMult * verifiedBoost;

  // --- 8. Guards & penalties ---
  if (ER > 0.2) finalScore = 0; // DQ
  if (ER > 0.1 && impressions < 50000) finalScore *= 0.3;
  if (ER < 0.001) finalScore *= 0.5;

  // --- 9. Anti-gaming & eligibility ---
  const issues: string[] = [];
  const trustFactor = Math.min(1, Math.max(0.05, smartFollowers / Math.max(followers, 1)) * 0.8);
  const propRatio = (retweets + quotes) / Math.max(impressions, 1);
  const likeRate = likes / Math.max(impressions, 1);

  if (impressions < 1000) {
    issues.push("❗ Impressions dưới 1,000 — không đủ điều kiện hợp lệ.");
    finalScore *= 0.5;
  }

  if (followers < 2000 && impressions > followers * 50) {
    issues.push("⚠️ Reach vượt quá follower 50× — khả năng spike bất thường.");
    finalScore *= 0.6;
  }

  if (propRatio < 0.01 && likeRate > 0.05) {
    issues.push("⚠️ Like quá cao nhưng thiếu repost/quote — khả năng không tự nhiên.");
    finalScore *= 0.7;
  }

  if (likeRate > 0.5) {
    issues.push("❌ Like-rate > 50% — bị loại (DQ).");
    finalScore = 0;
  }

  if (quotes < 1 && retweets < 1 && likes > 50) {
    issues.push("⚠️ Toàn like, không có quote/repost — giảm điểm trust.");
    finalScore *= 0.8;
  }

  // --- 10. Advice ---
  const advice: string[] = [];
  if (ER > 0.08) advice.push("⚠️ ER cao, có thể bị cap hoặc nghi ngờ tương tác giả.");
  else if (ER < 0.03) advice.push("📉 ER thấp, nên tăng repost hoặc quotes tự nhiên.");
  else advice.push("✅ ER trong ngưỡng an toàn.");

  if (trustFactor < 0.5) advice.push("👀 Tỷ lệ smart follower thấp — nên tăng follow chất lượng.");
  if (VF > 0.1) advice.push("💎 Verified follower ratio tốt — tăng độ tin cậy.");
  else advice.push("🔹 Ít verified follower — tăng trust chậm hơn.");

  return {
    ER: (ER * 100).toFixed(2),
    finalScore: finalScore.toFixed(2),
    advice: [...advice, ...issues],
  };
}
