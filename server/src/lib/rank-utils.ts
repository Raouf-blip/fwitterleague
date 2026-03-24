/**
 * Utility to calculate absolute LP based on Riot Rank and current LP.
 */

const TIER_BASES: Record<string, number> = {
  'IRON': 0,
  'BRONZE': 400,
  'SILVER': 800,
  'GOLD': 1200,
  'PLATINUM': 1600,
  'EMERALD': 2000,
  'DIAMOND': 2400,
  'MASTER': 2800,
  'GRANDMASTER': 3200,
  'CHALLENGER': 3600,
};

const DIVISION_ADDONS: Record<string, number> = {
  'IV': 0,
  'III': 100,
  'II': 200,
  'I': 300,
};

function calculateAbsoluteLP(rankString: string | null, lp: number = 0): number {
  if (!rankString) return 0;

  const parts = rankString.toUpperCase().split(' ');
  const tier = parts[0];
  const division = parts[1];

  const baseLP = TIER_BASES[tier] ?? 0;
  const divisionAddon = DIVISION_ADDONS[division] ?? 0;

  return baseLP + divisionAddon + (lp || 0);
}

function getRankFromLP(lp: number): string {
  if (lp <= 0) return '';

  let tier = 'IRON';
  if (lp >= 3600) tier = 'CHALLENGER';
  else if (lp >= 3200) tier = 'GRANDMASTER';
  else if (lp >= 2800) tier = 'MASTER';
  else if (lp >= 2400) tier = 'DIAMOND';
  else if (lp >= 2000) tier = 'EMERALD';
  else if (lp >= 1600) tier = 'PLATINUM';
  else if (lp >= 1200) tier = 'GOLD';
  else if (lp >= 800) tier = 'SILVER';
  else if (lp >= 400) tier = 'BRONZE';

  // High elo (Master+) doesn't have divisions
  if (lp >= 2800) return tier;

  // Division calculation
  const remainder = Math.floor(lp % 400);
  let division = 'IV';
  if (remainder >= 300) division = 'I';
  else if (remainder >= 200) division = 'II';
  else if (remainder >= 100) division = 'III';

  return `${tier} ${division}`;
}

export { calculateAbsoluteLP, getRankFromLP };
