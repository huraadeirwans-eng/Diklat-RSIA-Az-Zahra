/**
 * Utility untuk kompresi gambar otomatis di sisi browser (client-side)
 * Mengubah foto resolusi tinggi (misal 5-10MB dari kamera HP) menjadi file ringan (~80KB - 150KB)
 * Tanpa mengurangi keterbacaan teks sertifikat atau poster.
 * Mencegah kuota storage cepat penuh secara 100% gratis.
 */

export function compressImageFile(
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.78
): Promise<{ dataUrl: string; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    // Jika file berupa SVG atau PDF, tidak perlu kompresi canvas
    if (file.type === 'image/svg+xml' || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUrl: result,
          originalSize: file.size,
          compressedSize: file.size
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skala proporsional jika melebihi batas maksimum
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback ke data URL asli jika canvas gagal
          resolve({
            dataUrl: event.target?.result as string,
            originalSize,
            compressedSize: originalSize
          });
          return;
        }

        // Gambar ke canvas dengan smoothing berkualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP jika didukung atau JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const approxCompressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize,
          compressedSize: approxCompressedSize
        });
      };

      img.onerror = () => {
        resolve({
          dataUrl: event.target?.result as string,
          originalSize,
          compressedSize: originalSize
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

