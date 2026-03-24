# FwitterLeague — Architecture de la Base de Données

Ce document décrit la structure de la base de données, les relations entre les tables et comment s'y connecter.

## Technologie

La base de données repose sur **Supabase (PostgreSQL)**. Elle utilise les fonctionnalités suivantes :
- **Authentification :** Gestion des utilisateurs via `auth.users`.
- **RLS (Row Level Security) :** Politiques de sécurité pour restreindre l'accès aux données.
- **Triggers :** (Optionnel) Pour synchroniser automatiquement certaines données (ex: création d'un profil à l'inscription).

---

## Accès et Gestion (Supabase Dashboard)

Pour que tes collègues puissent lire, modifier ou gérer la base de données, ils doivent être invités sur le projet Supabase.

### 1. Accès au Dashboard
L'interface de gestion se trouve ici : [Cliquez sur le lien](https://supabase.com/dashboard/project/lykrrunuztixrmcmvdrk)

### 2. Inviter des collaborateurs
Pour donner l'accès à tes collègues :
1. Va dans **Settings** (icône engrenage en bas à gauche).
2. Clique sur **Team**.
3. Clique sur **Invite** et saisis leur adresse email.
4. Une fois acceptés, ils pourront voir les données, utiliser l'éditeur SQL et modifier la structure.

### 3. Récupérer les clés (URL & Anon Key)
Les informations pour le fichier `.env` se trouvent dans :
- **Settings** > **API**.
- Copier l'**Project URL** et l'**anon public** key (ou `service_role` pour le serveur).

### 4. Outils de gestion internes
- **Table Editor :** Pour voir et modifier les données manuellement (comme un Excel).
- **SQL Editor :** Pour exécuter des scripts de création de table ou des requêtes complexes.
- **Database :** Pour gérer les rôles, les extensions et les sauvegardes.

---

## Architecture des Tables

### 1. `profiles`
Stocke les informations publiques et de jeu des utilisateurs.
- `id` (uuid, PK) : Référence à `auth.users.id`.
- `username` (text) : Nom d'affichage.
- `riot_id` (text) : Format "Nom#TAG".
- `role` (text) : 'user', 'admin', ou 'superadmin'.
- `is_captain` (boolean) : True si l'utilisateur possède une équipe.
- `is_looking_for_team` (boolean) : Statut de recherche de joueur (Free Agent).
- `is_caster` (boolean) : True si l'utilisateur est un caster officiel.
- `bio` (text) : Biographie de l'utilisateur.
- `rank` (text) : Rang LoL synchronisé (ex: "PLATINUM I").
- `winrate` (integer) : Pourcentage de victoire.
- `created_at` (timestamp) : Date de création du compte.

### 2. `teams`
Gère les équipes du tournoi.
- `id` (uuid, PK).
- `name` (text) : Nom complet de l'équipe.
- `tag` (text) : Tag court (max 4 caractères).
- `description` (text).
- `captain_id` (uuid, FK) : Référence au profil du capitaine (`profiles.id`).
- `created_at` (timestamp).

### 3. `team_members`
Table de liaison entre les profils et les équipes (relation Many-to-Many).
- `id` (uuid, PK).
- `team_id` (uuid, FK) : Référence à `teams.id`.
- `profile_id` (uuid, FK) : Référence à `profiles.id`.
- `role` (text) : 'Captain' ou 'Member'.
- `joined_at` (timestamp).

### 4. `applications` (Recrutement)
Gère les candidatures et les invitations.
- `id` (uuid, PK).
- `team_id` (uuid, FK) : L'équipe concernée.
- `sender_id` (uuid, FK) : Le joueur qui postule (si `type='application'`) ou le joueur invité (si `type='offer'`).
- `message` (text) : Message optionnel accompagnant la demande.
- `status` (text) : 'pending', 'accepted', 'rejected'.
- `type` (text) : 'application' (Joueur -> Équipe) ou 'offer' (Équipe -> Joueur).
- `created_at` (timestamp).

### 5. `tournaments`
Gestion des événements.
- `id` (uuid, PK).
- `name` (text).
- `description` (text).
- `max_teams` (integer) : Nombre maximum d'équipes.
- `status` (text) : 'upcoming', 'ongoing', 'finished'.
- `start_date` (timestamp).
- `end_date` (timestamp).
- `created_at` (timestamp).

### 6. `tournament_registrations`
Inscriptions des équipes aux tournois.
- `id` (uuid, PK).
- `tournament_id` (uuid, FK).
- `team_id` (uuid, FK).
- `registered_at` (timestamp).

### 7. `matches`
Suivi des scores.
- `id` (uuid, PK).
- `tournament_id` (uuid, FK).
- `team_1_id` (uuid, FK).
- `team_2_id` (uuid, FK).
- `score_1` (integer).
- `score_2` (integer).
- `scheduled_at` (timestamp).
- `winner_id` (uuid, FK) : L'ID de l'équipe gagnante.
- `created_at` (timestamp).

### 8. `notifications`
- `id` (uuid, PK).
- `user_id` (uuid, FK) : Destinataire de la notification.
- `title` (text).
- `message` (text).
- `type` (text) : 'application', 'offer', 'system'.
- `is_read` (boolean).
- `created_at` (timestamp).

---

## Connexion

### Côté Client (Vue 3)
La connexion se fait via la clé anonyme (anon key) qui respecte les RLS.
- **URL :** `VITE_SUPABASE_URL`
- **Clé :** `VITE_SUPABASE_ANON_KEY`

### Côté Serveur (Node.js)
La connexion se fait via la clé de service (service role key) pour contourner les RLS si nécessaire (ex: suppression d'utilisateur).
- **URL :** `SUPABASE_URL`
- **Clé :** `SUPABASE_SERVICE_ROLE_KEY`

### Configuration locale (`.env`)
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

---

## Sécurité (RLS)

Chaque table doit avoir le RLS activé. Exemples de politiques :
- `profiles` : Tout le monde peut lire, seul le propriétaire peut modifier.
- `teams` : Tout le monde peut lire, seul le capitaine peut modifier/supprimer.
- `notifications` : Seul le destinataire peut lire/modifier.
