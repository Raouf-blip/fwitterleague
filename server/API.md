# FwitterLeague Backend API — v1

API REST de la plateforme FwitterLeague (Node.js + Express + Supabase).

## Base URL

`http://localhost:3000/api/v1`

---

## Authentification

Les routes protégées nécessitent un token JWT dans le header :

`Authorization: Bearer <token>`

Middleware utilisé : `authenticate`.

---

## Rôles d’accès

| Rôle | Description |
| :--- | :--- |
| Public | Accès sans connexion |
| User | Utilisateur connecté |
| Captain | Capitaine d’équipe |
| Admin | Gestion des tournois |
| SuperAdmin | Administration globale |

---

## 1) Profils (`/profiles`)

| Méthode | Route | Accès | Description |
| :--- | :--- | :--- | :--- |
| GET | `/me` | User | Récupère le profil courant + équipe |
| PATCH | `/me` | User | Met à jour le profil (bio, riot_id, etc.) |
| DELETE | `/me` | User | Supprime le compte (dissout l'équipe si capitaine) |
| POST | `/sync-riot` | User | Synchronise les données Riot (rang/winrate) |
| GET | `/me/applications`| User | Liste des candidatures envoyées |
| GET | `/:id` | Public | Détails d'un profil public |
| PATCH | `/:id/role` | SuperAdmin | Change le rôle d’un utilisateur |

### Structures JSON

**Profil complet (`GET /me`)** :
```json
{
  "id": "uuid",
  "username": "Pseudo",
  "riot_id": "Pseudo#TAG",
  "role": "user",
  "rank": "PLATINUM I",
  "winrate": 55,
  "is_captain": false,
  "is_looking_for_team": true,
  "bio": "Ma bio...",
  "last_riot_sync": "2024-03-20T10:00:00Z",
  "team": { "id": "uuid", "name": "Team Name", "tag": "TAG" } // ou null
}
```

**Sync Riot (`POST /sync-riot`)** :
```json
{
  "rank": "GOLD IV",
  "winrate": 52
}
```

---

## 2) Équipes (`/teams`)

| Méthode | Route | Accès | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Public | Liste des équipes |
| GET | `/:id` | Public | Détails d’une équipe + membres |
| POST | `/` | User | Crée une équipe |
| PATCH | `/:id` | Captain | Modifie une équipe |
| DELETE | `/:id` | Captain | Dissout une équipe |
| POST | `/:id/leave` | Member | Quitte une équipe |
| DELETE | `/:id/members/:pId` | Captain | Exclut un membre |

### Structures JSON

**Équipe détaillée (`GET /teams/:id`)** :
```json
{
  "id": "uuid",
  "name": "Team Name",
  "tag": "TAG",
  "description": "...",
  "captain_id": "uuid",
  "is_locked": false,
  "members": [
    {
      "profile_id": "uuid",
      "role": "Member",
      "profile": { "username": "Pseudo", "rank": "SILVER II" }
    }
  ]
}
```

---

## 3) Recrutement (`/recruitment`)

| Méthode | Route | Accès | Description |
| :--- | :--- | :--- | :--- |
| POST | `/apply/:teamId` | User | Postule à une équipe |
| POST | `/invite/:playerId` | Captain | Invite un joueur |
| PATCH | `/:id/respond` | Target | Accepte ou refuse une demande |

### Structures JSON

**Interaction (`POST /apply` ou `/invite`)** :
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "sender_id": "uuid",
  "message": "...",
  "status": "pending",
  "type": "application", // ou 'offer'
  "created_at": "..."
}
```

---

## 4) Tournois & Matchs (`/tournaments`)

| Méthode | Route | Accès | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | Public | Liste des tournois |
| POST | `/` | Admin | Crée un tournoi |
| POST | `/:id/register` | Captain | Inscrit son équipe |
| GET | `/matches` | Public | Liste des matchs |
| POST | `/matches` | Admin | Planifie un match |
| PATCH | `/matches/:id` | Admin | Met à jour/valide un score |

### Structures JSON

**Tournoi (`GET /tournaments`)** :
```json
{
  "id": "uuid",
  "name": "Tournoi d'été",
  "status": "upcoming",
  "max_teams": 16,
  "start_date": "...",
  "registrations": [{ "count": 5 }]
}
```

---

## 5) Social & Notifications (`/social`)

| Méthode | Route | Accès | Description |
| :--- | :--- | :--- | :--- |
| GET | `/agents` | Public | Liste des agents libres |
| GET | `/inbox` | User | Notifications + interactions |
| PATCH | `/notifications/:id` | User | Marque une notification comme lue |

### Structures JSON

**Inbox (`GET /social/inbox`)** :
```json
{
  "notifications": [
    { "id": "uuid", "title": "...", "message": "...", "is_read": false }
  ],
  "interactions": [
    { 
      "id": "uuid", 
      "type": "application", 
      "status": "pending",
      "team": { "name": "...", "tag": "..." },
      "sender": { "username": "...", "rank": "..." }
    }
  ]
}
```

---

## Notes Techniques

- **Limites d'équipe** : Max 7 joueurs par équipe.
- **Verrouillage** : Les équipes inscrites à un tournoi `ongoing` ne peuvent plus être modifiées (membres bloqués).
