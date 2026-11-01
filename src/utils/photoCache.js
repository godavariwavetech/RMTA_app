// In-memory store for row photos (base64 blobs). They are kept out of React
// state and navigation params because very large strings there get logged,
// copied and re-rendered, which freezes the app.
const store = new Map();

export function setPhotos(key, photos) {
  store.set(key, photos);
}

export function getPhotos(key) {
  return store.get(key) || [];
}
