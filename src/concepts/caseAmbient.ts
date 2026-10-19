export type AmbientColor = readonly [number, number, number];

/** Sample a loaded cover once. Cross-origin covers without CORS keep the curated fallback. */
export function sampleCaseAmbient(image: HTMLImageElement): AmbientColor | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 24;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, 24, 24);
    const { data } = context.getImageData(0, 0, 24, 24);
    const buckets = new Map<string, { weight: number; rgb: number[] }>();
    for (let i = 0; i < data.length; i += 4) {
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const high = Math.max(...rgb), low = Math.min(...rgb);
      if (data[i + 3] < 128 || high < 30 || low > 230) continue;
      const weight = .25 + (high - low) / 255;
      const key = rgb.map(channel => Math.floor(channel / 48)).join(',');
      const bucket = buckets.get(key) ?? { weight: 0, rgb: [0, 0, 0] };
      bucket.weight += weight;
      rgb.forEach((channel, index) => { bucket.rgb[index] += channel * weight; });
      buckets.set(key, bucket);
    }
    const dominant = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
    if (!dominant) return null;
    const rgb = dominant.rgb.map(channel => channel / dominant.weight);
    const lift = Math.max(1, 150 / Math.max(...rgb));
    return rgb.map(channel => Math.round(Math.min(215, channel * lift) * .8 + 35)) as [number, number, number];
  } catch {
    return null;
  }
}
