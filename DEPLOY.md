# Guide de Déploiement - Render.io

## Étape 1 : Push sur GitHub

1. Crée un nouveau repo sur https://github.com/new
   - Nom: `qrcode-live-relay`
   - Public
   - NE PAS initialiser avec README

2. Execute:
```bash
git remote add origin https://github.com/TON_USERNAME/qrcode-live-relay.git
git branch -M main
git push -u origin main
```

## Étape 2 : Déployer sur Render.io

1. Va sur https://render.com (gratuit, pas de carte bancaire)

2. Clique "Get Started for Free" et connecte-toi avec GitHub

3. Clique "New +" → "Web Service"

4. Connecte ton repo GitHub `qrcode-live-relay`

5. Configuration:
   - **Name**: qrcode-live-relay
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (0$)

6. Clique "Create Web Service"

7. Attends 2-3 minutes... BOOM ! Ton app est live sur:
   ```
   https://qrcode-live-relay.onrender.com
   ```

## Étape 3 : Utiliser l'app

- Scanner: https://qrcode-live-relay.onrender.com/scanner.html
- Viewer: https://qrcode-live-relay.onrender.com/viewer.html

## Note importante

Render.io free tier:
- L'app s'endort après 15 min d'inactivité
- Premier chargement peut prendre 30-60 secondes
- Après, c'est instantané !

## Alternatives gratuites

- **Railway.app** (500h/mois gratuit)
- **Fly.io** (3 apps gratuites)
- **Vercel** (avec adaptation pour serverless)
