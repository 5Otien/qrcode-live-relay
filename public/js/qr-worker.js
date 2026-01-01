/**
 * Web Worker pour détection QR en parallèle
 * Traite les images sans bloquer l'UI
 */

importScripts('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');

// Traitement d'image basique et efficace
function enhanceImage(imageData, width, height) {
  const data = imageData.data;
  const enhanced = new Uint8ClampedArray(data.length);

  // Augmentation du contraste simple mais efficace
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    // Contraste fort
    let value = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40);

    enhanced[i] = enhanced[i + 1] = enhanced[i + 2] = value;
    enhanced[i + 3] = 255;
  }

  return { data: enhanced, width, height };
}

// Redimensionnement pour tester plusieurs résolutions
function resizeImageData(imageData, scale) {
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const dstWidth = Math.floor(srcWidth * scale);
  const dstHeight = Math.floor(srcHeight * scale);

  const srcData = imageData.data;
  const dstData = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      const srcIdx = (srcY * srcWidth + srcX) * 4;
      const dstIdx = (y * dstWidth + x) * 4;

      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return { data: dstData, width: dstWidth, height: dstHeight };
}

// Message handler
self.onmessage = function(e) {
  const { imageData, width, height, jobId } = e.data;

  try {
    const variations = [
      // 1. Image originale
      { name: 'original', data: imageData, width, height },

      // 2. Contraste amélioré
      { name: 'enhanced', ...enhanceImage({ data: imageData, width, height }, width, height) },

      // 3. Résolution réduite (pour QR éloignés)
      { name: 'scaled_0.7', ...resizeImageData({ data: imageData, width, height }, 0.7) },

      // 4. Résolution augmentée (pour QR petits)
      { name: 'scaled_1.3', ...resizeImageData({ data: imageData, width, height }, 1.3) },

      // 5. Contraste + résolution réduite
      { name: 'enhanced_scaled', ...resizeImageData(enhanceImage({ data: imageData, width, height }, width, height), 0.8) }
    ];

    // Essayer chaque variation
    for (const variation of variations) {
      // Essai normal
      let code = jsQR(variation.data, variation.width, variation.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        self.postMessage({
          success: true,
          data: code.data,
          method: variation.name,
          jobId
        });
        return;
      }

      // Essai avec inversion
      code = jsQR(variation.data, variation.width, variation.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code) {
        self.postMessage({
          success: true,
          data: code.data,
          method: variation.name + '_inverted',
          jobId
        });
        return;
      }
    }

    // Aucun QR trouvé
    self.postMessage({
      success: false,
      jobId
    });

  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
      jobId
    });
  }
};
