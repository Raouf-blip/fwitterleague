import { supabase } from '../config/supabase';

// Helper to delay requests to prevent hitting Riot API limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function syncAllRiotProfiles() {
  console.log('[RiotSync Cron] Démarrage de la synchronisation de tous les profils...');

  // 1. Fetch all users with a configured riot_id
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, riot_id')
    .not('riot_id', 'is', null)
    .neq('riot_id', '');

  if (error) {
    console.error('[RiotSync Cron] Erreur fetch profiles:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('[RiotSync Cron] Aucun profil à synchroniser.');
    return;
  }

  const RIOT_API_KEY = process.env.VITE_RIOT_API_KEY || process.env.RIOT_API_KEY;
  if (!RIOT_API_KEY) {
    console.error('[RiotSync Cron] Erreur: Clé API manquante.');
    return;
  }

  let successCount = 0;

  for (const profile of profiles) {
    try {
      if (!profile.riot_id.includes('#')) continue;
      const [name, tag] = profile.riot_id.split('#');

      // Account API
      const accRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?api_key=${RIOT_API_KEY}`);
      if (!accRes.ok) throw new Error(`Account API Error: ${accRes.status}`);
      const accData: any = await accRes.json();

      // League API
      const leaRes = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${accData.puuid}?api_key=${RIOT_API_KEY}`);
      if (!leaRes.ok) throw new Error(`League API Error: ${leaRes.status}`);
      const leaData: any = await leaRes.json();

      const soloQ = leaData.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
      const rank = soloQ ? `${soloQ.tier} ${soloQ.rank}` : 'Unranked';
      const winrate = (!soloQ || soloQ.inactive) ? 0 : Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100);
      const lp = soloQ ? soloQ.leaguePoints : null;

      // Update Database with LP included
      await supabase.from('profiles').update({
        rank,
        winrate,
        lp,
        last_riot_sync: new Date().toISOString()
      }).eq('id', profile.id);

      successCount++;
    } catch (e: any) {
      console.warn(`[RiotSync Cron] Échec pour ${profile.riot_id}: ${e.message}`);
    }

    // Sleep for 100ms to avoid Riot rate limit (100 req per 2 mins = max ~0.8 req/sec, we will naturally be limited by DB+Fetch latency, but a 100ms cushion is safe)
    await delay(100);
  }

  console.log(`[RiotSync Cron] Fin de la synchronisation. ${successCount}/${profiles.length} effectués avec succès.`);
}
