# QRCode Live Relay

Système de diffusion temps réel de QR codes scannés.

## Concept

- **Scanner** : Scannez un QR code avec votre caméra
- **Viewer** : Visualisez les QR codes scannés en temps réel
- **Diffusion instantanée** via WebSocket (Socket.IO)

## Installation

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`

## Utilisation

1. Ouvrez `http://localhost:3000` dans votre navigateur
2. Choisissez "Scanner" sur un appareil (avec caméra)
3. Choisissez "Viewer" sur d'autres appareils
4. Scannez un QR code et voyez-le apparaître instantanément sur tous les viewers

## Technologies

### Solution Web (JavaScript)
- **Backend** : Node.js + Express + Socket.IO
- **Frontend** : HTML/CSS/JavaScript vanilla
- **Scanner QR** : html5-qrcode + ZXing
- **Génération QR** : qrcode.js

### Solution Desktop (Python) - RECOMMANDÉE pour petits QR codes
- **Scanner** : OpenCV + pyzbar
- **Traitement d'image** : Égalisation, netteté, binarisation adaptative
- **Performance** : >30 FPS, détection ultra-robuste
- **Intégration** : Socket.IO vers serveur Node.js

## Scanner Python (Haute Performance)

Pour une détection optimale des petits QR codes :

```bash
# Installer les dépendances
pip install -r requirements.txt

# Démarrer le scanner
python3 scanner_python.py

# Avec options
python3 scanner_python.py --camera 1 --show-processing
```

Avantages :
- Détecte les QR codes même très petits
- Traitement d'image avancé
- Haute résolution (Full HD)
- Fonctionne en local ou connecté au serveur

## Déploiement

Déployable sur Render, Railway, Fly.io, etc.

## License

MIT
