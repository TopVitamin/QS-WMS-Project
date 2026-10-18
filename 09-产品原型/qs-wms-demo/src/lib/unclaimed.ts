/**
 * 无主货登记共用的文本处理：运单号、箱唛号每行一个，去首尾空格、去空行、去重。
 * 实物统一放本仓无主货暂存区域（异常处理库区），登记不选库位（无主货登记主PRD 第二节）。
 */
export function parseCodeLines(text: string): string[] {
  const seen = new Set<string>()
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || seen.has(line)) return false
      seen.add(line)
      return true
    })
}
