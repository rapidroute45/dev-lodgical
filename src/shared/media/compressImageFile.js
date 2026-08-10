const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_QUALITY = 0.72;

function isImageFile(file) {
  if (!file) return false;
  if (file.type && /^image\//i.test(file.type)) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name ?? "");
}

/**
 * Client-side resize/JPEG compress for chat / payroll image uploads.
 * Non-images are returned unchanged.
 */
export async function compressImageFile(file, options = {}) {
  if (!isImageFile(file) || typeof createImageBitmap !== "function") {
    return file;
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options.quality ?? DEFAULT_QUALITY;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
    });

    if (!blob) return file;

    const base = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
