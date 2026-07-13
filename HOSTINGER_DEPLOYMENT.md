# Déploiement Hostinger

## 1) Frontend (hébergement statique)

1. Installer les dépendances :
   ```bash
   cd frontend
   npm install
   ```
2. Construire le site :
   ```bash
   npm run build
   ```
3. Uploader le contenu du dossier `frontend/dist` sur le répertoire racine de votre hébergement statique Hostinger (par exemple `public_html/`).
4. Vérifier qu’un fichier `.htaccess` est bien présent à la racine. Le projet en fournit un dans `frontend/public/.htaccess`.
5. Définir l’URL API de production dans `frontend/.env` ou via la variable d’environnement de votre panneau :
   ```env
   VITE_API_URL=https://api.votredomaine.com
   ```

## 2) Backend (Node.js)

Le backend est une API Express/Prisma. Il peut tourner sur un plan Node.js / VPS Hostinger, mais pas sur un simple hébergement statique.

1. Déployer le dossier `backend` sur votre environnement Node.
2. Installer les dépendances :
   ```bash
   cd backend
   npm install
   npx prisma generate
   ```
3. Définir les variables d’environnement à partir de `backend/.env.example` ou directement depuis le panneau Hostinger.
4. Démarrer l’API :
   ```bash
   npm start
   ```
5. Vérifier que l’API répond sur le port défini par `PORT` (souvent `5000` ou un port assigné automatiquement par l’hôte).

## 3) Base de données

Le projet utilise Prisma avec PostgreSQL. Si Hostinger propose une base PostgreSQL, branchez-la via `DATABASE_URL`. Sinon, gardez une base externe (par exemple Neon, Supabase ou autre fournisseur PostgreSQL compatible).

## 4) Configuration DNS

- Frontend : `www.votredomaine.com` ou `votredomaine.com`
- API : `api.votredomaine.com`
- Mettre `VITE_API_URL` pour que le frontend pointe vers l’API de production.

## 5) Vérifications finales

- Le frontend doit afficher la page d’accueil sans erreur 404.
- L’API doit répondre sur `/` et `/version`.
- Les uploads fonctionnent si le dossier `backend/uploads` est bien créé et accessible.
