import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export const alt = 'Marathon runner competing on a city street';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const renderedPhotoHeight = 1795;

export default async function OpenGraphImage() {
  const sharePhoto = await readFile(join(process.cwd(), 'assets/images/share-thumbnail.jpg'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          alt={alt}
          src={`data:image/jpeg;base64,${sharePhoto.toString('base64')}`}
          width={size.width}
          height={renderedPhotoHeight}
          style={{
            position: 'absolute',
            left: 0,
            top: -150,
            width: size.width,
            height: renderedPhotoHeight,
          }}
        />
      </div>
    ),
    size,
  );
}
