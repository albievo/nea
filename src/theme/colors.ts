import { Value } from "../editor/model/netlist/Value";

export const COLORS = {
  on: '#7ed957',
  onOverlay: '#7ed957',
  off: '#ff3131',
  unknown: '#b5b5b5',
  outline: '#000000',
  background: '#ffffff',
  gridLine: '#dcdcdc',
  stdElementBackground: '#606060',
  black: '#000000',
  white: '#ffffff'
} as const;

export type ColorKey = keyof typeof COLORS;
export type Color = typeof COLORS[ColorKey];

export function valToColor(val: Value): ColorKey {
  switch (val) {
    case Value.ONE: return 'on';
    case Value.ZERO: return 'off';
    case Value.X: return 'unknown';
  }
}

export function hexWithTransparency(
  color: ColorKey, transparency: number
): string {
  const alpha = Math.round(
    Math.min(1, Math.max(0, transparency)) * 255
  )
    .toString(16)
    .padStart(2, '0');

  return `${COLORS[color]}${alpha}`;
}