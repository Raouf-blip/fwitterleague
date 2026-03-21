# 🏆 FwitterLeague — Plateforme de Tournois League of Legends

Bienvenue dans le dépôt de **FwitterLeague**, une plateforme complète pour la gestion de tournois LoL, le recrutement de joueurs et le suivi compétitif.

## 📖 Documentation du Projet

*   **[Cahier des Charges (CDC.md)](./CDC.md)** : Vision globale du projet, règles de la ligue, rôles utilisateurs et fonctionnalités détaillées.
*   **[Documentation Backend (Server)](./server/README.md)** : Détails techniques sur l'API, les endpoints et la configuration du serveur.
    *   **[Spécifications API](./server/API.md)** : Liste des routes et formats de données.
    *   **[Base de Données](./server/DB.md)** : Schéma PostgreSQL et politiques de sécurité (RLS).

---

## 🛠️ Architecture du Projet

Le projet est divisé en deux parties principales :

1.  **Client (Frontend)** : Interface utilisateur construite avec **Vue 3 (Vite + TypeScript)** et stylisée aux couleurs de l'univers League of Legends.
2.  **Server (Backend)** : API REST construite avec **Node.js (Express + TypeScript)** utilisant **Supabase** comme base de données et système d'authentification.

---

## 🚀 Installation & Lancement Rapide

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd fwitterleague
```

### 2. Configurer le Backend
Rends-toi dans le dossier `server`, installe les dépendances et configure ton `.env` :
```bash
cd server
npm install
cp .env.example .env
# Remplis le fichier .env avec tes clés Supabase
npm run dev
```
*Le serveur sera lancé par défaut sur [http://localhost:3000](http://localhost:3000).*

### 3. Configurer le Frontend
Dans un autre terminal, rends-toi dans le dossier `client`, installe les dépendances et lance Vite :
```bash
cd client
npm install
cp .env.example .env
# Remplis le fichier .env avec l'URL de ton API et les clés Supabase
npm run dev
```
*L'interface sera accessible sur [http://localhost:5173](http://localhost:5173).*

---

## 🔒 Variables d'Environnement

Assure-toi de configurer les fichiers `.env` dans `client/` et `server/` avec les informations suivantes de ton projet Supabase :
*   `SUPABASE_URL`
*   `SUPABASE_ANON_KEY`
*   `SUPABASE_SERVICE_ROLE_KEY` (Serveur uniquement)

---

## 👥 Équipe & Licence
Projet développé dans le cadre de la ligue FwitterLeague.
