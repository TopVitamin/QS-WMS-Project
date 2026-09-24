import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { exchangeRatesToCny } from '@/mock/seed'
import type { CurrencyCode, Money, UnitSystem } from '@/types/wms'

dayjs.extend(utc)
dayjs.extend(timezone)

export function convertMoney(money: Money, to: CurrencyCode): Money {
  if (money.currency === to) return money
  const cny = money.amount * exchangeRatesToCny[money.currency]
  return { amount: cny / exchangeRatesToCny[to], currency: to }
}

export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    currencyDisplay: 'narrowSymbol',
  }).format(money.amount)
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDateTime(iso: string, tz: string, pattern = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(iso).tz(tz).format(pattern)
}

/** 时区缩写偏移，如 UTC-07:00 */
export function formatTzOffset(tz: string): string {
  return `UTC${dayjs().tz(tz).format('Z')}`
}

export function formatWeight(grams: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const lb = grams / 453.592
    return lb < 1 ? `${(grams / 28.3495).toFixed(1)} oz` : `${lb.toFixed(2)} lb`
  }
  return grams < 1000 ? `${grams} g` : `${(grams / 1000).toFixed(2)} kg`
}

export function formatDimension(l: number, w: number, h: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const f = (cm: number) => (cm / 2.54).toFixed(1)
    return `${f(l)}×${f(w)}×${f(h)} in`
  }
  return `${l}×${w}×${h} cm`
}
