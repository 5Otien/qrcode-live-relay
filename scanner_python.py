#!/usr/bin/env python3
"""
Scanner QR Code Python avec OpenCV et pyzbar
Détection robuste des petits QR codes avec traitement d'image avancé
"""

import cv2
import numpy as np
from pyzbar import pyzbar
import socketio
import time
from datetime import datetime
import argparse

# Configuration Socket.IO
sio = socketio.Client()
SERVER_URL = "http://localhost:3000"

# Variables globales
last_scan = None
scan_cooldown = 2.0  # secondes entre chaque scan du même QR


def enhance_image_for_qr(frame):
    """
    Améliore l'image pour une meilleure détection des QR codes
    - Augmente le contraste
    - Netteté
    - Binarisation adaptative
    """
    # Convertir en niveaux de gris
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Égalisation d'histogramme pour améliorer le contraste
    enhanced = cv2.equalizeHist(gray)

    # Augmentation de la netteté
    kernel_sharpening = np.array([[-1,-1,-1],
                                   [-1, 9,-1],
                                   [-1,-1,-1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel_sharpening)

    # Binarisation adaptative
    binary = cv2.adaptiveThreshold(
        sharpened, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    return gray, enhanced, sharpened, binary


def detect_qr_codes(frame):
    """
    Détecte les QR codes avec plusieurs techniques de traitement d'image
    """
    # Obtenir différentes versions de l'image
    gray, enhanced, sharpened, binary = enhance_image_for_qr(frame)

    # Essayer la détection sur différentes versions
    images_to_try = [
        ("Original", gray),
        ("Enhanced", enhanced),
        ("Sharpened", sharpened),
        ("Binary", binary)
    ]

    for name, img in images_to_try:
        decoded_objects = pyzbar.decode(img)
        if decoded_objects:
            print(f"✅ QR détecté avec méthode: {name}")
            return decoded_objects, img

    return [], gray


def draw_qr_code(frame, decoded_obj):
    """
    Dessine un rectangle autour du QR code détecté
    """
    points = decoded_obj.polygon

    # Si le QR code est détecté, dessiner le contour
    if len(points) > 4:
        hull = cv2.convexHull(np.array([point for point in points], dtype=np.float32))
        hull = list(map(tuple, np.squeeze(hull)))
    else:
        hull = list(map(tuple, points))

    # Dessiner le contour en vert
    n = len(hull)
    for j in range(n):
        cv2.line(frame, hull[j], hull[(j+1) % n], (0, 255, 0), 3)

    # Afficher le contenu du QR code
    x = decoded_obj.rect.left
    y = decoded_obj.rect.top

    qr_data = decoded_obj.data.decode('utf-8')
    display_text = qr_data if len(qr_data) < 40 else qr_data[:37] + "..."

    # Fond noir pour le texte
    cv2.rectangle(frame, (x, y - 40), (x + 400, y), (0, 0, 0), -1)
    cv2.putText(frame, display_text, (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    return qr_data


def send_to_server(qr_data):
    """
    Envoie le QR code scanné au serveur via Socket.IO
    """
    global last_scan

    current_time = time.time()

    # Vérifier le cooldown
    if last_scan and last_scan['data'] == qr_data:
        if current_time - last_scan['time'] < scan_cooldown:
            return False

    # Envoyer au serveur
    try:
        sio.emit('qr-scanned', {
            'value': qr_data,
            'timestamp': int(time.time() * 1000)
        })
        print(f"📤 Envoyé au serveur: {qr_data}")

        last_scan = {
            'data': qr_data,
            'time': current_time
        }
        return True
    except Exception as e:
        print(f"❌ Erreur d'envoi: {e}")
        return False


def main(camera_id=0, show_processing=False):
    """
    Fonction principale du scanner
    """
    print("🚀 Démarrage du scanner Python QR Code...")
    print(f"📹 Ouverture de la caméra {camera_id}...")

    # Connexion au serveur Socket.IO
    try:
        sio.connect(SERVER_URL)
        print(f"✅ Connecté au serveur {SERVER_URL}")
    except Exception as e:
        print(f"⚠️  Serveur non disponible: {e}")
        print("   Le scanner fonctionnera en mode local uniquement")

    # Ouvrir la caméra avec résolution maximale
    cap = cv2.VideoCapture(camera_id)

    # Configurer la résolution (essayer le maximum)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)

    # Vérifier la résolution obtenue
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"📐 Résolution: {width}x{height}")

    if not cap.isOpened():
        print("❌ Impossible d'ouvrir la caméra")
        return

    print("✅ Caméra ouverte avec succès")
    print("ℹ️  Appuyez sur 'q' pour quitter, 'p' pour voir les traitements")

    show_processed = show_processing

    while True:
        ret, frame = cap.read()

        if not ret:
            print("❌ Erreur de lecture de la caméra")
            break

        # Détecter les QR codes
        decoded_objects, processed_frame = detect_qr_codes(frame)

        # Traiter les QR codes détectés
        for obj in decoded_objects:
            qr_data = draw_qr_code(frame, obj)
            send_to_server(qr_data)

        # Afficher le nombre de QR codes détectés
        status_text = f"QR detectes: {len(decoded_objects)}"
        cv2.putText(frame, status_text, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Afficher le frame
        cv2.imshow('Scanner QR Code Python - OpenCV + pyzbar', frame)

        # Afficher le traitement si activé
        if show_processed:
            cv2.imshow('Image traitee', processed_frame)

        # Gestion des touches
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('p'):
            show_processed = not show_processed
            if not show_processed:
                cv2.destroyWindow('Image traitee')

    # Nettoyage
    cap.release()
    cv2.destroyAllWindows()

    if sio.connected:
        sio.disconnect()

    print("👋 Scanner arrêté")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scanner QR Code Python avancé')
    parser.add_argument('--camera', type=int, default=0,
                        help='ID de la caméra (défaut: 0)')
    parser.add_argument('--show-processing', action='store_true',
                        help='Afficher les étapes de traitement d\'image')

    args = parser.parse_args()

    try:
        main(camera_id=args.camera, show_processing=args.show_processing)
    except KeyboardInterrupt:
        print("\n⚠️  Arrêt par l'utilisateur")
