import { Value } from "../ChipEditorApp/model/netlist/Value";

export const COLORS = {
  on: '#7ed957',
  off: '#ff3131',
  unknown: '#b5b5b5',
  outline: '#000000',
  background: '#ffffff',
  gridLine: '#dcdcdc',
  stdElementBackground: '#606060'
} as const;

export type ColorKey = keyof typeof COLORS;

export function valToColor(val: Value): ColorKey {
  switch (val) {
    case Value.ONE: return 'on';
    case Value.ZERO: return 'off';
    case Value.X: return 'unknown';
  }
}