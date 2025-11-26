# Team Task Manager

Application de gestion de tâches collaborative avec Backend Node.js/Express et Frontend Vanilla JS.

## Fonctionnalités

- **Gestion des tâches (CRUD)** : Créer, lire, mettre à jour, supprimer.
- **Gestion des membres** : Assigner des tâches aux membres.
- **Workflow** : Statuts (À faire, En cours, Terminé) et Priorités (Basse, Moyenne, Haute).
- **Filtres** : Filtrer les tâches par statut.

## Prérequis

- Node.js installé
- MongoDB installé et en cours d'exécution (ou une URI MongoDB Atlas)

## Installation

1. Cloner le dépôt ou télécharger les fichiers.
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer la base de données :
   - Par défaut, l'application utilise `mongodb://localhost:27017/team-task-manager`.
   - Vous pouvez créer un fichier `.env` à la racine avec `MONGO_URI=votre_uri_mongodb`.

## Lancement

1. Peupler la base de données avec des données de test :

   ```bash
   npm run seed
   ```

2. Démarrer le serveur :

   ```bash
   npm start
   ```

   Ou pour le développement (avec redémarrage automatique) :

   ```bash
   npm run dev
   ```

3. Ouvrir le navigateur à l'adresse : `http://localhost:3000`

## Structure du Projet

- `server.js` : Point d'entrée du serveur.
- `config/db.js` : Configuration de la connexion MongoDB.
- `models/` : Modèles Mongoose (Task, Member).
- `routes/` : Routes API (tasks.js, members.js).
- `public/` : Frontend (HTML, CSS, JS).
- `seed.js` : Script pour initialiser la base de données.
