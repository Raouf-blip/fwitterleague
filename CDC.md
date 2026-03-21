# 📖 Cahier des Charges : Plateforme de Tournoi League of Legends

## 🏆 Concept et Objectifs de la Ligue
La plateforme sert de point central pour gérer la compétition. Elle permet de :
* Afficher le leaderboard (classement) des équipes et des joueurs.
* Suivre les matchs à jouer / en cours.
* Conserver des statistiques globales des matchs, des joueurs et des équipes.
* Servir de "LinkedIn" (Hub) pour la mise en relation entre les joueurs solos (Free Agents) et les capitaines d'équipe.

## ⚖️ Règles d'Équilibrage et Format des Équipes
* **Cap d'inscription :** Un nombre maximum de participants (joueurs/équipes) doit être défini pour chaque tournoi.
* **Format du Roster :** Une équipe doit être composée de **6 joueurs** (5 titulaires et 1 remplaçant) pour anticiper les imprévus.
* **Roster Lock (Verrouillage) :** Une fois qu'une équipe est inscrite à un tournoi et que celui-ci est officiellement lancé, son effectif est verrouillé. Il est strictement impossible d'ajouter, de renvoyer ou de modifier les joueurs jusqu'à la fin de l'événement.

## 👥 Les Rôles Utilisateurs

### 1. Le Joueur (Free Agent)
L'objectif est de rendre les joueurs solos visibles sur le "marché" pour se faire recruter.
* **Exclusivité :** Un Free Agent ne peut pas créer d'équipe. S'il est recruté, il disparaît du marché.
* **Proactivité :** Il peut consulter la liste des équipes incomplètes et envoyer une candidature directe au capitaine.
* **Données automatiques :** À partir de son Riot ID, le système récupère son Rang, ses LP, son Winrate et son nombre de parties jouées.
* **Données manuelles :** Description (rôles, champions, style de jeu), contact Discord (obligatoire) et disponibilités.

### 2. Le Capitaine
Il est le gestionnaire de la structure.
* **Création d'équipe :** Il définit le Nom, le Tag, le Logo et la Description de la team.
* **Objectif de recrutement :** Il doit former un roster complet de 6 joueurs.
* **Recrutement & Gestion :** Il consulte le marché, envoie des offres et reçoit des candidatures. Le recrutement se fait via la validation de la plateforme (Double Accord).

### 3. L'Administrateur (Compte Unique)
Il s'agit d'un **compte unique (Super-Admin)** qui possède tous les droits pour orchestrer la ligue.
* **Création de Tournois :** Il crée les événements, définit les dates et le nombre de places.
* **Gestion Globale :** Il valide manuellement l'inscription des équipes aux tournois pour vérifier l'équilibrage.
* **Arbitrage et Modération :** Il a le pouvoir de supprimer des comptes, de modifier des données en cas de bug, et de trancher lors des litiges de matchs.

## 📩 Hub des Offres et Notifications (Le Mercato)
Chaque utilisateur dispose d'un espace personnel.
* **Offres / Candidatures :** Les joueurs et capitaines reçoivent et envoient des demandes pour rejoindre ou recruter. Ils peuvent **Accepter** ou **Refuser**.
* **La Règle du "Double Accord" :** Pour qu'un joueur rejoigne une équipe, les deux parties doivent valider l'action. Dès l'accord conclu, le joueur intègre le Roster et toutes ses autres offres en cours sont annulées.
* **Alertes :** Notifications générales pour les tournois ou les matchs.

## ⚔️ Espace Tournois et Déclaration des Scores

### Suivi des Tournois
Une page dédiée est générée par l'Admin pour chaque tournoi, affichant :
* **L'état actuel :** Inscriptions ouvertes, En cours, Terminé.
* **Le Classement (Leaderboard) :** Points des équipes mis à jour en temps réel.
* **Le Calendrier et l'Historique :** Matchs à venir et résultats passés.

### Déclaration des Scores (Anti-Triche)
Pour éviter les litiges, le système impose une double validation :
1. **Déclaration :** L'équipe gagnante déclare sa victoire en joignant obligatoirement une **capture d'écran** de fin de partie montrant le tableau des scores.
2. **Confirmation :** Le capitaine perdant reçoit une notification pour valider la défaite.
3. **Litige :** Si le perdant conteste ou ne répond pas, le match passe en "Litige". L'Admin unique intervient alors pour valider manuellement le score grâce à la capture d'écran.

## 🚀 Plan de Lancement
* **Étape 1 :** Ouverture de la plateforme (liste des équipes existantes et marché des Free Agents).
* **Étape 2 :** Si beaucoup de Free Agents (>= 12), organisation d'un mercato/draft pour créer de nouvelles équipes.
* **Étape 3 :** Les capitaines inscrivent leur équipe de 6 joueurs au premier tournoi créé par l'Admin.

## 📝 Contenu des Fiches Publiques

**Fiche d'un Free Agent :**
* Pseudo Riot, liens (op.gg, dpm.lol), Rang, LP, Winrate.
* Description du joueur, disponibilités et contact Discord.

**Fiche d'une Équipe :**
* Nom, Tag, Description, Discord du Capitaine.
* **Postes recherchés :** Rôles manquants pour compléter les 6 places.
* **Le Roster (6 joueurs) :** Top, Jungle, Mid, ADC, Support + Remplaçant (avec leurs rangs respectifs).
* Historique (V/D, Winrate) et position au classement.
