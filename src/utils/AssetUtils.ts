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