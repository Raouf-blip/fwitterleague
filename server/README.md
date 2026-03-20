# FwitterLeague — Backend Server

Ce dossier contient l'API REST de la plateforme FwitterLeague, propulsée par **Node.js**, **Express** et **Supabase**.

## 📑 Documentation Complète

Pour plus de détails sur des sujets spécifiques, consulte les guides suivants :
*   **[Documentation API (Endpoints)](./API.md)** : Liste de toutes les routes, paramètres et formats de réponse.
*   **[Architecture de la Base de Données](./DB.md)** : Schéma des tables, relations et accès au dashboard Supabase.

---

## 🛠️ Technologies & Services

*   **Runtime** : Node.js (v18+)
*   **Framework** : Express (TypeScript)
*   **Base de Données & Auth** : Supabase (PostgreSQL + RLS)
*   **Intégration Tierce** : Riot Games API (Sync des rangs et winrates)

---

## 🚀 Installation & Lancement

### 1. Pré-requis
*   Avoir installé [Node.js](https://nodejs.org/)
*   Avoir accès au projet Supabase (voir [DB.md](./DB.md) pour les accès)

### 2. Configuration (`.env`)
Crée ton fichier de configuration local à partir de l'exemple :
```bash
cp .env.example .env
```
Remplis ensuite les variables dans le `.env` avec tes clés récupérées sur le dashboard Supabase.

### 3. Installation des dépendances
```bash
npm install
```

### 4. Lancement
*   **Développement (avec auto-reload)** :
    ```bash
    npm run dev
    ```
*   **Production** :
    ```bash
    npm run build
    npm start
    ```

---

## 📁 Structure du Projet

*   `src/config/` : Configuration des clients (Supabase, etc.).
*   `src/routes/` : Définition des points d'entrée de l'API par module (Profils, Équipes, Tournois...).
*   `src/middlewares/` : Logique d'authentification et de gestion des rôles (Admin/User).
*   `src/app.ts` : Point d'entrée principal de l'application Express.

---

## 🔒 Sécurité

Le serveur utilise la **Service Role Key** de Supabase pour effectuer des opérations administratives. 
**Attention** : Ne committe jamais ton fichier `.env` et ne partage pas cette clé. Elle contourne toutes les sécurités (RLS) de la base de données.
