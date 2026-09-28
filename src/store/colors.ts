// Okabe-Ito colorblind-safe palette, one color per word (up to 5 words)
export const WORD_COLORS = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00"] as const;

const WORD_FILL_ALPHA = "20%"; // word tint mixed into the opaque card color

export function wordBackground(wordIdx: number): string | undefined {
  if (wordIdx < 0) return undefined;
  const base = WORD_COLORS[wordIdx % WORD_COLORS.length];
  return `color-mix(in srgb, ${base} ${WORD_FILL_ALPHA}, var(--card))`;
}

export function wordBorder(wordIdx: number): string | undefined {
  if (wordIdx < 0) return undefined;
  return WORD_COLORS[wordIdx % WORD_COLORS.length];
}
