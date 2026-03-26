# 🏆 FwitterLeague — Plateforme de Tournois League of Legends

Bienvenue dans le dépôt de **FwitterLeague**, une plateforme complète pour la gestion de tournois LoL, le recrutement de joueurs et le suivi compétitif.

## 📖 Documentation du Projet

*   **[Cahier des Charges (CDC.md)](./CDC.md)** : Vision globale du projet, règles de la ligue, rôles utilisateurs et fonctionnalités détaillées.
*   **[Documentation Backend (Server)](./server/README.md)** : Détails techniques sur l'API, les endpoints et la configuration du serveur.
    *   **[Spécifications API](./server/API.md)** : Liste des routes et formats de données.
    *   **[Base de Données](./server/DB.md)** : Schéma PostgreSQL et politiques de sécurité (RLS).

---

## 🤖 Bot Discord (`bot/`)

Le bot assure la liaison en temps réel entre la plateforme web et votre serveur Discord. Il automatise la gestion de la communauté et synchronise les données de jeu.

### ✨ Fonctionnalités Principales

*   **Synchronisation Automatique** :
    *   **Profils** : Attribution automatique des rôles "Casteur" et "Agent Libre".
    *   **Équipes** : Création automatique d'un rôle (avec couleur aléatoire) et d'un salon textuel privé pour chaque équipe créée.
    *   **Identité** : Mise à jour automatique du pseudo Discord au format `[TAG] Pseudo`.
*   **Nettoyage Intelligent** : Suppression automatique des rôles et salons sur Discord si une équipe ou un profil est supprimé en base de données.
*   **Notifications en Temps Réel** : Un canal dédié (`#fwitter-league`) est automatiquement créé pour annoncer les nouveaux scrims et les patch notes.
*   **Commandes Slash** : Interactions directes pour consulter les données de la ligue.

### ⌨️ Commandes Disponibles

| Commande | Description | Options |
| :--- | :--- | :--- |
| `/help` | Affiche la liste des commandes disponibles | - |
| `/profile` | Affiche la fiche joueur (Rang, Riot ID, rôles, etc.) | `discord_user` ou `plateforme_user` |
| `/team` | Affiche les détails d'une équipe et ses membres | `name` (nom de l'équipe) |
| `/ping` | Teste la latence du bot (Admin uniquement) | - |

---

## 🚀 Installation & Lancement Rapide

... (reste des instructions d'installation) ...

---

## 🔒 Variables d'Environnement

### Bot Discord (`bot/.env`)

| Clé | Description |
| :--- | :--- |
| `DISCORD_TOKEN` | Token secret du bot Discord |
| `CLIENT_ID` | ID de l'application Discord |
| `GUILD_ID` | ID de votre serveur Discord |
| `TEAM_CATEGORY_ID` | (Optionnel) ID de la catégorie pour les salons d'équipe |
| `NOTIFICATION_CHANNEL_ID` | (Optionnel) ID du canal pour les annonces (créé par défaut sinon) |
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique anonyme Supabase |
| `WEBSITE_URL` | URL de la plateforme web (pour les liens dans les embeds) |

---

## 👥 Équipe & Licence
Projet développé dans le cadre de la ligue FwitterLeague.
