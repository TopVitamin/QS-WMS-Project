export type QtyInputResult = { kind: 'unchanged' } | { kind: 'number'; value: number } | { kind: 'scan'; code: string }

/** 人工录入的数量上限位数；超过视为扫码内容 */
const MAX_QTY_DIGITS = 6

/**
 * 数量框内容解析（《PDA作业端设计规范》§4.2）：键盘模拟扫描头会把条码追加进获得焦点的输入框。
 * 内容含非数字字符或超过 6 位数字时视为扫码，数量保持原值，追加的部分作为扫到的码返回。
 */
export function interpretQtyInput(raw: string, current: number): QtyInputResult {
  const text = raw.trim()
  const currentText = String(current)
  if (text === '' || text === currentText) return { kind: 'unchanged' }
  if (new RegExp(`^\\d{1,${MAX_QTY_DIGITS}}$`).test(text)) return { kind: 'number', value: Number(text) }
  const appended = text.startsWith(currentText) && text.length > currentText.length
  return { kind: 'scan', code: (appended ? text.slice(currentText.length) : text).trim() }
}
