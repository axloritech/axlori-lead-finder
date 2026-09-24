import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic 32-bit string hash — used to keep demo data stable per query. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small, fast, seedable PRNG (mulberry32) so demo results never shuffle on reload. */
export function createRng(seed: number | string) {
  let a = (typeof seed === "string" ? hashString(seed) : seed) >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function round(value: number, decimals = 1) {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/(\s|-|\/)/)
    .map((part) => (part.length > 2 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

