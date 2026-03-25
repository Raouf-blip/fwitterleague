# 🤖 FwitterLeague Discord Bot

Ce bot est le lien de notification entre la plateforme **FwitterLeague** et Discord.

## 🌟 Fonctionnalités

1.  **🔔 Notifications de Scrims** : Envoie une notification automatique dans un salon Discord dès qu'un scrim est créé sur la plateforme.
2.  **🔗 Redirection Directe** : Chaque notification contient un bouton permettant de se rendre directement sur la page du scrim pour s'inscrire ou voir les détails.

## 🏗️ Architecture

-   **Langage** : TypeScript
-   **Librairie** : Discord.js (v14+)
-   **Realtime** : Utilise Supabase Realtime (CDC) pour écouter les changements de la base de données sans surcharger l'API.

## 🚀 Installation locale

1.  Aller dans le dossier `bot/` :
    ```bash
    cd bot
    ```
2.  Installer les dépendances :
    ```bash
    npm install
    ```
3.  Configurer le fichier `.env` (voir `.env.example`) :
    - `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` (depuis le portail développeur Discord)
    - `SCRIM_CHANNEL_ID` (ID du salon où envoyer les notifs)
    - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
    - `WEBSITE_URL` (URL de votre front-end)

4.  Lancer le bot :
    ```bash
    npm run dev
    ```

---

*FwitterLeague Bot - Développé pour la communauté compétitive League of Legends.*
