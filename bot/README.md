# 🤖 FwitterLeague Discord Bot

Ce bot est le lien de notification et de synchronisation entre la plateforme **FwitterLeague** et Discord.

## 🌟 Fonctionnalités

1.  **🔔 Notifications de Scrims** : Envoie une notification automatique dans un salon Discord dès qu'un scrim est créé sur la plateforme.
2.  **🚀 Notifications de Patch Notes** : Alerte la communauté lors de la sortie d'une nouvelle mise à jour de la plateforme.
3.  **🛡️ Synchronisation des Rôles & Salons** :
    - **Équipes** : Crée automatiquement un rôle Discord pour chaque équipe et un salon textuel dédié, accessible uniquement aux membres de l'équipe.
    - **Gestion des Membres** : Ajoute ou retire dynamiquement les joueurs des rôles d'équipe en fonction des changements dans la base de données.
    - **Agents Libres** : Assigne automatiquement un rôle "Agent Libre" aux joueurs qui recherchent une équipe.
    - **Casteurs** : Assigne un rôle "Casteur" aux profils identifiés comme tels.
    - **Identification** : Utilise le `discord_id` enregistré en base de données pour identifier les utilisateurs sur le serveur. Si aucun ID n'est présent, l'utilisateur conserve son rôle par défaut.

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
