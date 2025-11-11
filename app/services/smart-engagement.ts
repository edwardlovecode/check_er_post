// smartEngagement.ts

/**
 *
 * @param ENG tổng engagement thô = likes + 3*retweets + qW*quotes
 * @param smartFollowers số follower đáng tin cậy
 * @param followers tổng follower
 * @returns Smart engagement ước lượng
 */

export function estimateSmartEngagement(
  ENG: number,
  smartFollowers: number,
  followers: number
): number {
  if (followers <= 0) return 0;
  return ENG * (smartFollowers / followers);
}
