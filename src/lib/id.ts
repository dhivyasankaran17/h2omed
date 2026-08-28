/** Small dependency-free unique id generator (good enough for local-only records). */
export function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
