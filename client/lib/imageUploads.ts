// `image/*` alone hides .heic/.heif in some desktop file pickers, so the phone
// formats are listed explicitly alongside it.
export const IMAGE_UPLOAD_ACCEPT = 'image/*,.heic,.heif';

export const COVER_IMAGE_OPTIONS = {
  maxDimension: 1920,
  maxLength: 1_000_000,
};

export const PROFILE_IMAGE_OPTIONS = {
  maxDimension: 1200,
  maxLength: 850_000,
};

// The pipeline downscales and re-encodes every photo, so this only needs to be
// high enough to reject non-photo junk. 5 MB rejected ordinary 48 MP iPhone and
// DSLR shots that would have compressed down fine.
const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const QUALITY_STEPS = [0.86, 0.76, 0.66, 0.56];
const SCALE_STEPS = [1, 0.84, 0.7, 0.56];

// iPhones shoot HEIC, which no browser can decode into a canvas, and which some
// browsers hand over with an empty `File.type`. Both are sniffed from the ISO
// base-media `ftyp` box so the picker never silently rejects a phone photo.
const HEIC_SNIFF_BYTES = 12;
const HEIC_BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'];
const HEIC_CONVERSION_QUALITY = 0.92;

type PersistedImageOptions = {
  maxDimension: number;
  maxLength: number;
};

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export type PreparedImages = {
  refs: string[];
  /** One sentence per file that could not be used; empty when every file worked. */
  failures: string[];
};

export type PrepareImagesProgress = { completed: number; total: number };

// Files are processed one at a time on purpose. Decoding a phone camera roll in
// parallel exhausts the total-canvas budget iOS Safari enforces per tab (and runs
// several 1.5 MB libheif decodes at once), which is why picking a single photo
// worked while picking several silently produced blank or failed images.
//
// Each file is also isolated: one oversized or unreadable photo reports itself
// and the rest of the batch still lands, instead of the whole selection being
// thrown away.
export async function filesToPersistedImageRefs(
  files: FileList | File[],
  options: PersistedImageOptions,
  onProgress?: (progress: PrepareImagesProgress) => void
): Promise<PreparedImages> {
  const imageFiles = Array.from(files);
  const refs: string[] = [];
  const failures: string[] = [];

  onProgress?.({ completed: 0, total: imageFiles.length });
  for (const [index, file] of imageFiles.entries()) {
    try {
      refs.push(await fileToPersistedImageRef(file, options));
    } catch (error) {
      failures.push(`${file.name || 'That photo'}: ${toImageUploadErrorMessage(error)}`);
    }
    onProgress?.({ completed: index + 1, total: imageFiles.length });
  }

  return { refs, failures };
}

async function fileToPersistedImageRef(
  file: File,
  options: PersistedImageOptions
): Promise<string> {
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new ImageUploadError('That file is too large — choose an image under 25 MB.');
  }

  const isHeic = await isHeicFile(file);
  if (!isHeic && !file.type.startsWith('image/')) {
    throw new ImageUploadError('Choose an image file.');
  }

  const source = isHeic ? await heicToJpeg(file) : file;
  const image = await loadImage(source);
  try {
    for (const scale of SCALE_STEPS) {
      const canvas = drawScaledImage(image, options.maxDimension * scale);
      try {
        for (const quality of QUALITY_STEPS) {
          const ref = canvasToImageRef(canvas, quality);
          if (ref.length <= options.maxLength) {
            return ref;
          }
        }
      } finally {
        releaseCanvas(canvas);
      }
    }
  } finally {
    // Drops the decoded bitmap so the next file in the batch starts from a clean
    // memory budget instead of waiting on GC.
    image.src = '';
  }

  throw new ImageUploadError('Choose a smaller image.');
}

// Zeroing the dimensions is what actually frees a canvas backing store on WebKit;
// dropping the reference alone leaves it pinned until the next GC.
function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

async function isHeicFile(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, HEIC_SNIFF_BYTES).arrayBuffer());
  if (header.length < HEIC_SNIFF_BYTES) return false;
  const box = String.fromCharCode(...header.subarray(4, 8));
  if (box !== 'ftyp') return false;
  return HEIC_BRANDS.includes(String.fromCharCode(...header.subarray(8, 12)));
}

// The libheif decoder is ~1.5 MB of wasm, so it is only pulled in once a photo
// actually turns out to be HEIC — never on the ordinary JPEG/PNG path.
async function heicToJpeg(file: File): Promise<Blob> {
  try {
    const { heicTo } = await import('heic-to');
    return await heicTo({ blob: file, type: 'image/jpeg', quality: HEIC_CONVERSION_QUALITY });
  } catch {
    throw new ImageUploadError(
      'We could not read that iPhone photo. Try saving it as JPEG and uploading again.'
    );
  }
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageUploadError('We could not read that image.'));
    };
    image.src = objectUrl;
  });
}

function drawScaledImage(image: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageUploadError('We could not process that image.');
  }
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToImageRef(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}

export function toImageUploadErrorMessage(error: unknown): string {
  return error instanceof ImageUploadError
    ? error.message
    : "We couldn't prepare that image. Try another file.";
}
