// localStorage throws an error when the browser blocks it (e.g. user turned off site data). We ignore that

export function getItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
