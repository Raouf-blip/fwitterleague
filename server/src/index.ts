import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import cron from 'node-cron';
import { syncAllRiotProfiles } from './services/riotSync.service';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 FWITTERLEAGUE Server ready at http://localhost:${port}/api/v1`);

  // Planification: toutes les heures
  cron.schedule('0 0 * * * *', () => {
    console.log('[Cron] Synchronisation horaire Riot');
    syncAllRiotProfiles();
  });
});
