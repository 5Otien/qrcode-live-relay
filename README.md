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

- **Backend** : Node.js + Express + Socket.IO
- **Frontend** : HTML/CSS/JavaScript vanilla
- **Scanner QR** : html5-qrcode
- **Génération QR** : qrcode.js

## Déploiement

Déployable sur Render, Railway, Fly.io, etc.

## License

MIT
