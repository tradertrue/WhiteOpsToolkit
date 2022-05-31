/** Generarate a random hex string */
export const genRanHex = (size: number): string => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

export function randomInteger(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
