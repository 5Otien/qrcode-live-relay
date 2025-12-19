const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Servir les fichiers statiques
app.use(express.static('public'));

// Stats
let stats = {
  scanCount: 0,
  lastScan: null,
  connectedClients: 0
};

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  stats.connectedClients++;
  console.log(`✅ Client connecté (Total: ${stats.connectedClients})`);

  // Envoyer le dernier scan au nouveau client
  if (stats.lastScan) {
    socket.emit('qr-live', stats.lastScan);
  }

  // Envoyer les stats
  socket.emit('stats-update', stats);

  // Réception d'un QR scanné
  socket.on('qr-scanned', (payload) => {
    console.log(`📱 QR scanné: ${payload.value}`);

    stats.scanCount++;
    stats.lastScan = {
      value: payload.value,
      timestamp: Date.now(),
      scanNumber: stats.scanCount
    };

    // Broadcast à tous les clients
    io.emit('qr-live', stats.lastScan);
    io.emit('stats-update', stats);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    stats.connectedClients--;
    console.log(`❌ Client déconnecté (Total: ${stats.connectedClients})`);
    io.emit('stats-update', stats);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`
🚀 QRCode Live Relay démarré !
📡 Serveur : http://localhost:${PORT}
👀 Scanner : http://localhost:${PORT}/scanner.html
🖥️  Viewer  : http://localhost:${PORT}/viewer.html
  `);
});
