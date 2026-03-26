# 🤖 FwitterBot - FwitterLeague Discord Companion

FwitterBot est le compagnon Discord officiel de la plateforme **FwitterLeague**. Il assure la synchronisation en temps réel entre la plateforme web (Supabase) et votre serveur Discord, tout en automatisant la gestion des équipes et les notifications.

## 🚀 Fonctionnalités Principales

### 🔄 Synchronisation Automatique
Le bot maintient votre serveur Discord à jour avec les données de la plateforme :
- **Rôles de Joueurs :** Attribution automatique des rôles `Casteur` et `Agent Libre` selon le profil de l'utilisateur.
- **Gestion d'Équipes :**
    - Création automatique d'un **Rôle** unique pour chaque équipe.
    - Création d'un **Salon Textuel Privé** dédié à chaque équipe, accessible uniquement par ses membres.
    - Mise à jour des **Pseudonymes** Discord avec le tag de l'équipe (ex: `[TAG] Pseudo`).
    - Attribution des couleurs de rôles personnalisables par équipe.

### 📢 Système de Notifications
Notifications automatiques dans des salons dédiés :
- **Scrims :** Annonces des nouveaux scrims ouverts et des défis lancés entre équipes.
- **Patch Notes :** Diffusion des mises à jour et nouveautés de la plateforme FwitterLeague.

### 🛠️ Administration Dynamique
Plus besoin de toucher aux fichiers de configuration manuellement pour les réglages courants :
- **Auto-Installation :** Au premier démarrage, le bot crée automatiquement la catégorie "FWITTER LEAGUE" et les salons de notifications nécessaires.
- **Commande `/config` :** Permet aux administrateurs de modifier les salons cibles, la catégorie parente ou les couleurs des équipes directement depuis Discord.

---

## 🎮 Commandes Utilisateurs

| Commande | Description |
| :--- | :--- |
| `/profile` | Affiche votre profil FwitterLeague ou celui d'un autre joueur (Rang, LP, Winrate, Riot ID, etc.). |
| `/team` | Affiche les détails d'une équipe (Membres, Capitaine, Logo, Description). |
| `/help` | Liste toutes les commandes disponibles. |
| `/ping` | Vérifie la latence du bot. |

## ⚙️ Commandes Administrateur (Permission: Administrateur)

| Sous-commande `/config` | Description |
| :--- | :--- |
| `show` | Affiche la configuration actuelle (IDs des salons, catégorie, etc.). |
| `set_guild` | Définit l'ID du serveur Discord cible. |
| `set_category` | Définit la catégorie où seront créés les salons d'équipe. |
| `set_scrim_channel` | Définit le salon pour les annonces de scrims. |
| `set_patch_channel` | Définit le salon pour les notes de mise à jour. |
| `set_team_color` | Assigne une couleur hexadécimale spécifique au rôle d'une équipe via son ID. |

---

## 🛠️ Installation et Configuration

### Pré-requis
- Node.js (v18+)
- Un projet **Supabase** (URL et Clé API)
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### Installation
1. Clonez le dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Copiez le fichier `.env.example` vers `.env` et remplissez les informations :
   ```env
   DISCORD_TOKEN=votre_token
   CLIENT_ID=votre_client_id
   SUPABASE_URL=votre_url_supabase
   SUPABASE_ANON_KEY=votre_cle_anon
   WEBSITE_URL=https://fwitterleague.fr
   ```

### Lancement
- **Développement :** `npm run dev`
- **Production :** 
  ```bash
  npm run build
  npm start
  ```

### Configuration Initiale
Une fois le bot en ligne, il créera automatiquement une structure de base. Utilisez `/config show` pour vérifier les réglages et `/config set_...` pour les ajuster selon vos besoins.

---

## 📂 Structure du Projet
- `src/commands/` : Définition des commandes Slash.
- `src/events/` : Gestion des événements Discord (Ready, Interactions).
- `src/services/` : Logique métier (Synchronisation, Configuration, Supabase).
- `src/utils/` : Systèmes de notifications et utilitaires.
- `config.json` : Stockage dynamique des paramètres modifiables par les admins.

---
*FwitterBot est développé pour la communauté FwitterLeague.*
