export const fontSizeOptions = [
  { value: 'small', label: '小号', pixels: 12 },
  { value: 'standard', label: '标准', pixels: 14 },
  { value: 'large', label: '舒适大字', pixels: 16 },
  { value: 'extra-large', label: '大号', pixels: 18 },
  { value: 'largest', label: '特大号', pixels: 20 },
] as const;
export const fontSizeRange = { min: 12, max: 24 } as const;
export type FontSize = typeof fontSizeOptions[number]['value'] | number;

export function isFontSize(value: unknown): value is FontSize {
  return typeof value === 'number'
    ? Number.isInteger(value) && value >= fontSizeRange.min && value <= fontSizeRange.max
    : fontSizeOptions.some(option => option.value === value);
}

export function fontSizePixels(value: FontSize): number {
  return typeof value === 'number' ? value : fontSizeOptions.find(option => option.value === value)!.pixels;
}
