export function nanoid(size: number = 12): string {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
  let id = "";
  const cryptoObj = globalThis.crypto || (globalThis as any).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(size);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
    return id;
  }
  for (let i = 0; i < size; i++)
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
}



