export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;

  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error(`Failed to load image: ${src}`));
    });
  }

  return img;
}

export function cropImageToAspect(file: File, aspectRatio: number) {
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.onload = () => {

      const originalWidth = img.width;
      const originalHeight = img.height;
      const originalRatio = originalWidth / originalHeight;

      let cropWidth: number;
      let cropHeight: number;
      let offsetX = 0;
      let offsetY = 0;

      if (originalRatio > aspectRatio) {
        // Image too wide -> crop width
        cropHeight = originalHeight;
        cropWidth = cropHeight * aspectRatio;
        offsetX = (originalWidth - cropWidth) / 2;
      } else {
        // Image too tall -> crop height
        cropWidth = originalWidth;
        cropHeight = cropWidth / aspectRatio;
        offsetY = (originalHeight - cropHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        img,
        offsetX, offsetY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
    };

    img.src = reader.result as string;
  };

  reader.readAsDataURL(file);
}