// Single builder for Unsplash photo URLs used across mock data and pages.
// Accepts either a bare Unsplash photo id or an already-complete URL.
export function unsplashPhoto(photoId: string, width = 800): string {
  return photoId.startsWith('http') || photoId.startsWith('data:image/')
    ? photoId
    : `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=70`;
}
