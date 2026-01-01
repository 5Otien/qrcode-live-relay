/**
 * Module de traitement d'image professionnel
 * Techniques de vision par ordinateur pour QR codes difficiles
 */

class ImageProcessor {
  /**
   * Pipeline de traitement complet pour améliorer la détection
   */
  static processImage(imageData) {
    const variations = [];

    // Version 1: Image originale
    variations.push({
      name: 'original',
      data: imageData
    });

    // Version 2: Contraste amélioré
    variations.push({
      name: 'enhanced_contrast',
      data: this.enhanceContrast(this.cloneImageData(imageData), 2.0)
    });

    // Version 3: Binarisation Otsu (méthode automatique)
    variations.push({
      name: 'otsu_binary',
      data: this.otsuBinarization(this.cloneImageData(imageData))
    });

    // Version 4: Filtre gaussien + netteté
    variations.push({
      name: 'gaussian_sharp',
      data: this.gaussianSharpen(this.cloneImageData(imageData))
    });

    // Version 5: Égalisation CLAHE (Contrast Limited Adaptive Histogram Equalization)
    variations.push({
      name: 'clahe',
      data: this.applyCLAHE(this.cloneImageData(imageData))
    });

    // Version 6: Morphologie (fermeture pour combler les trous)
    variations.push({
      name: 'morphology',
      data: this.morphologicalClosing(this.cloneImageData(imageData))
    });

    // Version 7: Super contraste + binarisation
    variations.push({
      name: 'extreme',
      data: this.extremeProcessing(this.cloneImageData(imageData))
    });

    return variations;
  }

  /**
   * Clone ImageData
   */
  static cloneImageData(imageData) {
    const cloned = new ImageData(imageData.width, imageData.height);
    cloned.data.set(imageData.data);
    return cloned;
  }

  /**
   * Amélioration du contraste
   */
  static enhanceContrast(imageData, factor) {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Conversion en niveaux de gris
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

      // Augmentation du contraste
      let enhanced = ((gray - 128) * factor) + 128;
      enhanced = Math.max(0, Math.min(255, enhanced));

      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }

    return imageData;
  }

  /**
   * Binarisation par méthode d'Otsu (seuil automatique optimal)
   */
  static otsuBinarization(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Conversion en niveaux de gris et création de l'histogramme
    const grayData = new Uint8Array(width * height);
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      grayData[i / 4] = gray;
      histogram[gray]++;
    }

    // Calcul du seuil d'Otsu
    const total = width * height;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    // Application du seuil
    for (let i = 0; i < data.length; i += 4) {
      const value = grayData[i / 4] > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    return imageData;
  }

  /**
   * Filtre gaussien suivi de netteté
   */
  static gaussianSharpen(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Conversion en niveaux de gris
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayData[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    // Filtre gaussien 3x3
    const gaussian = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const gaussianSum = 16;

    const blurred = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += grayData[(y + ky) * width + (x + kx)] * gaussian[ky + 1][kx + 1];
          }
        }
        blurred[y * width + x] = sum / gaussianSum;
      }
    }

    // Netteté (unsharp masking)
    const sharpness = 1.5;
    for (let i = 0; i < grayData.length; i++) {
      const sharp = grayData[i] + sharpness * (grayData[i] - blurred[i]);
      const value = Math.max(0, Math.min(255, sharp));

      const pixelIdx = i * 4;
      data[pixelIdx] = data[pixelIdx + 1] = data[pixelIdx + 2] = value;
    }

    return imageData;
  }

  /**
   * CLAHE - Contrast Limited Adaptive Histogram Equalization
   */
  static applyCLAHE(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Conversion en niveaux de gris
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayData[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    // CLAHE simplifié avec grilles 8x8
    const gridSize = 8;
    const clipLimit = 4.0;

    const gridWidth = Math.ceil(width / gridSize);
    const gridHeight = Math.ceil(height / gridSize);

    // Pour chaque grille, calculer l'histogramme et l'égaliser
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const histogram = new Array(256).fill(0);

        // Calculer l'histogramme de la grille
        const startX = gx * gridSize;
        const startY = gy * gridSize;
        const endX = Math.min(startX + gridSize, width);
        const endY = Math.min(startY + gridSize, height);

        let count = 0;
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            histogram[grayData[y * width + x]]++;
            count++;
          }
        }

        // Clipping de l'histogramme
        const clipValue = Math.floor(clipLimit * count / 256);
        let excess = 0;
        for (let i = 0; i < 256; i++) {
          if (histogram[i] > clipValue) {
            excess += histogram[i] - clipValue;
            histogram[i] = clipValue;
          }
        }

        // Redistribution de l'excès
        const increment = excess / 256;
        for (let i = 0; i < 256; i++) {
          histogram[i] += increment;
        }

        // CDF pour égalisation
        const cdf = new Array(256);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + histogram[i];
        }

        // Normalisation
        const cdfMin = cdf.find(v => v > 0) || 0;
        const mapping = new Array(256);
        for (let i = 0; i < 256; i++) {
          mapping[i] = Math.round(((cdf[i] - cdfMin) / (count - cdfMin)) * 255);
        }

        // Application du mapping
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = y * width + x;
            grayData[idx] = mapping[grayData[idx]];
          }
        }
      }
    }

    // Copier dans imageData
    for (let i = 0; i < grayData.length; i++) {
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = grayData[i];
    }

    return imageData;
  }

  /**
   * Fermeture morphologique
   */
  static morphologicalClosing(imageData) {
    // Dilatation suivie d'érosion
    const dilated = this.dilate(this.cloneImageData(imageData));
    return this.erode(dilated);
  }

  static dilate(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const result = this.cloneImageData(imageData);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let max = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            max = Math.max(max, data[idx]);
          }
        }
        const idx = (y * width + x) * 4;
        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = max;
      }
    }

    return result;
  }

  static erode(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const result = this.cloneImageData(imageData);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let min = 255;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            min = Math.min(min, data[idx]);
          }
        }
        const idx = (y * width + x) * 4;
        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = min;
      }
    }

    return result;
  }

  /**
   * Traitement extrême pour QR codes très difficiles
   */
  static extremeProcessing(imageData) {
    // 1. CLAHE
    let processed = this.applyCLAHE(this.cloneImageData(imageData));

    // 2. Super contraste
    processed = this.enhanceContrast(processed, 3.0);

    // 3. Binarisation Otsu
    processed = this.otsuBinarization(processed);

    return processed;
  }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageProcessor;
}
