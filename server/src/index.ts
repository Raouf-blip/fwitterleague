import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import cron from 'node-cron';
import { syncAllRiotProfiles } from './services/riotSync.service';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 FWITTERLEAGUE Server ready at http://localhost:${port}/api/v1`);

  // Planification: tous les jours à 23:59:59
  cron.schedule('59 59 23 * * *', () => {
    console.log('[Cron] Exécution de la tâche journalière : syncAllRiotProfiles');
    syncAllRiotProfiles();
  });
});
