/**
 * 管理端排版约定（与 docs/02-设计规范.md 一致）：
 * - 正文/中文/列表编码：font-sans + text-sm
 * - 数字对齐：tabular-nums（不整列 font-mono，避免与中文混排时「两套字」）
 * - font-mono：仅 PDA、条码打印、kbd 等场景
 */
export const textSm = 'text-sm'

/** 表格内可点击文字链（编辑、启用等） */
export const textLink = `${textSm} text-primary hover:underline`

/** 业务编码、单号展示（含 DocNo 静态态） */
export const textCode = `${textSm} tabular-nums tracking-tight`

/** 业务编码链接 = 编码样式 + 链颜色 */
export const textCodeLink = `${textCode} text-primary hover:underline`

/** 全站唯一的空值占位符（ASCII `-`，不用中文破折号 `—`）；组件用 <Empty />，只能放字符串的地方（如 Input value）用它 */
export const EMPTY_TEXT = '-'

/** 下拉选项、只读框等纯文本场景的「编码 · 名称」；表格和详情里用 <CodeName /> */
export function codeNameText(code: string, name?: string): string {
  return name && name !== code ? `${code} · ${name}` : code
}
