# Spécifications Fonctionnelles - Module Scrim (v1)

Ce document décrit les fonctionnalités et l'implémentation technique du module de Scrim pour FwitterLeague.

## 1. Types de Scrims

Le système doit supporter deux modes de jeu distincts :

### A. Scrim "Équipe vs Équipe" (Challenge)

- **Concept :** Une équipe défie une autre équipe spécifique.
- **Création :** Un capitaine d'équipe crée le scrim et sélectionne une équipe adverse.
- **Workflow :**
  1. Le Capitaine A envoie une invitation au Capitaine B.
  2. **Notification :** Inscription dans la table `notifications` pour le Capitaine B.
  3. Le Capitaine B accepte ou refuse via son tableau de bord.
  4. Si accepté, le match est planifié.

### B. Scrim "Ouvert" (Public / Pick-up)

- **Concept :** Un joueur crée un lobby de scrim ouvert à tous.
- **Création :** N'importe quel joueur authentifié peut créer un scrim ouvert (définir date/heure).
- **Workflow :**
  1. Le scrim apparaît dans la liste des "Scrims Ouverts".
  2. N'importe quel joueur peut rejoindre un slot libre (Lobby de 10 joueurs).
  3. Pas de restriction d'équipe ("Free for all" ou mélange de joueurs).

## 2. Statistiques et Résultat

- **Individuel uniquement :** Aucune statistique d'équipe ne sera calculée ou stockée pour les scrims. Seules les performances individuelles des joueurs (seulement le KDA et un calcul des CS grace au nombre de cs tué et au temps de la partie) sont conservées.
- **Saisie des résultats :**
  - À la fin du match, un participant upload une capture d'écran du tableau des scores.
  - **OCR Côté Client :** L'analyse de l'image (extraction des textes/chiffres) se fait **dans le navigateur** du client (via Tesseract.js ou équivalent) pour ne pas surcharger le serveur.
  - **Validation :** L'utilisateur vérifie et corrige les données lues par l'OCR avant de valider l'envoi au serveur.

## 3. Architecture Technique

### Base de Données (Supabase)

Il faudra créer les tables suivantes (nommage suggéré) :

- `scrims` : Info générale (type, date, créateur, statut).
- `scrim_slots` : Liste des joueurs inscrits dans un scrim (particulièrement pour le mode Ouvert).
- `scrim_requests` : Pour les défis Équipe vs Équipe (en attente/accepté).
- `scrim_stats` : Stats individuelles (player_id, scrim_id, kills, deaths, assists, cs...).

### Backend (Node/Express)

- Utilisation de la table existante `notifications` pour alerter les utilisateurs.
- Routes API pour :
  - CRUD Scrims.
  - Rejoindre/Quitter un scrim.
  - Poster les résultats (stats).

### Frontend (Vue 3)

- **Vues :**
  - Liste des Scrims (Filtre : Ouvert / Mes défis).
  - Détail d'un Scrim (Lobby).
- **Composants :**
  - Modal de création (Choix du type).
  - Uploader d'image + Interface de correction OCR.
