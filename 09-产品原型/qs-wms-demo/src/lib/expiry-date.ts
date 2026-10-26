/** 按 YYYY-MM-DD 日期做日历天加减，不受浏览器当前时区影响。 */
export function shiftDate(date: string | undefined, days: number): string | undefined {
  if (!date || !Number.isInteger(days)) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const value = new Date(Date.UTC(year, month - 1, day))
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return undefined
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function updateExpiryDatePair(
  dates: { productionDate?: string; expiryDate?: string },
  changed: 'productionDate' | 'expiryDate',
  value: string,
  shelfLifeDays?: number,
): { productionDate?: string; expiryDate?: string } {
  const next = { ...dates, [changed]: value || undefined }
  if (!value || shelfLifeDays === undefined || shelfLifeDays < 0 || !Number.isInteger(shelfLifeDays)) return next
  const other = changed === 'productionDate' ? 'expiryDate' : 'productionDate'
  const computed = shiftDate(value, changed === 'productionDate' ? shelfLifeDays : -shelfLifeDays)
  return computed ? { ...next, [other]: computed } : next
}

/** 保存时兜底计算未录入的一端；两端都已录入时保留人工值。 */
export function completeExpiryDatePair(
  dates: { productionDate?: string; expiryDate?: string },
  shelfLifeDays?: number,
): { productionDate?: string; expiryDate?: string } | undefined {
  const productionDate = dates.productionDate?.trim() || undefined
  const expiryDate = dates.expiryDate?.trim() || undefined
  if (productionDate && expiryDate) return { productionDate, expiryDate }
  if (!Number.isInteger(shelfLifeDays) || shelfLifeDays === undefined || shelfLifeDays < 0) return undefined
  if (productionDate) {
    const computed = shiftDate(productionDate, shelfLifeDays)
    return computed ? { productionDate, expiryDate: computed } : undefined
  }
  if (expiryDate) {
    const computed = shiftDate(expiryDate, -shelfLifeDays)
    return computed ? { productionDate: computed, expiryDate } : undefined
  }
  return undefined
}
