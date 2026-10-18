import type { UnitSystem } from '@/types/wms'

/**
 * 新品维护单位换算（新品维护主PRD 第三节）：inch×2.54 得 cm、lb×0.45359237 得 kg；
 * cm 保留 2 位小数、kg 保留 3 位小数，四舍五入。展示按查看仓库单位反向换算，保留同样位数。
 */
const CM_PER_INCH = 2.54
const KG_PER_LB = 0.45359237

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** 长度录入值 → cm（存储值） */
export function lengthToCm(value: number, unit: UnitSystem): number {
  return roundTo(unit === 'imperial' ? value * CM_PER_INCH : value, 2)
}

/** cm（存储值）→ 展示用长度 */
export function cmToLength(cm: number, unit: UnitSystem): number {
  return roundTo(unit === 'imperial' ? cm / CM_PER_INCH : cm, 2)
}

/** 重量录入值 → kg（存储值） */
export function weightToKg(value: number, unit: UnitSystem): number {
  return roundTo(unit === 'imperial' ? value * KG_PER_LB : value, 3)
}

/** kg（存储值）→ 展示用重量 */
export function kgToWeight(kg: number, unit: UnitSystem): number {
  return roundTo(unit === 'imperial' ? kg / KG_PER_LB : kg, 3)
}

/** 去掉小数尾零，便于按位数展示（11.81 / 2.756 这类示例值） */
export function trimDecimals(value: number, digits: number): string {
  return roundTo(value, digits)
    .toFixed(digits)
    .replace(/\.?0+$/, '')
}

export function lengthUnitLabel(unit: UnitSystem): string {
  return unit === 'imperial' ? 'inch' : 'cm'
}

export function weightUnitLabel(unit: UnitSystem): string {
  return unit === 'imperial' ? 'lb' : 'kg'
}

/** 长×宽×高 展示文案（含单位），如 `11.81×7.87×3.94 inch` */
export function formatDimensions(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  unit: UnitSystem,
): string {
  const parts = [lengthCm, widthCm, heightCm].map((v) => trimDecimals(cmToLength(v, unit), 2))
  return `${parts.join('×')} ${lengthUnitLabel(unit)}`
}

/** 单个长度值（不含单位），按查看仓库单位换算 */
export function formatLength(cm: number, unit: UnitSystem): string {
  return trimDecimals(cmToLength(cm, unit), 2)
}

/** 单个重量值（不含单位），按查看仓库单位换算 */
export function formatWeightValue(kg: number, unit: UnitSystem): string {
  return trimDecimals(kgToWeight(kg, unit), 3)
}

/** 毛重展示文案（含单位） */
export function formatGrossWeight(kg: number, unit: UnitSystem): string {
  return `${trimDecimals(kgToWeight(kg, unit), 3)} ${weightUnitLabel(unit)}`
}
