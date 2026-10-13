#!/usr/bin/env node
/**
 * 设计规范检查（docs/02-设计规范.md 第 9 节）。零依赖，按行用正则扫 src 下的 .tsx。
 * 用法：npm run lint:design
 * 个别行确属例外时，在该行加注释 `design-lint-ignore 原因`。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')

/** shadcn 源码、语言包、Mock 数据不检查 */
const SKIP_DIRS = [join(SRC, 'components', 'ui'), join(SRC, 'i18n'), join(SRC, 'mock')]

/** 打印标签：固定黑白、编码用等宽字，是规范允许的例外 */
const PRINT_FILES = ['src/pages/wms/inbound/print-label-dialog.tsx']

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

const rules = [
  {
    id: 'raw-color',
    message: '用语义色 token（primary / success / warning-text / tone-cyan …），不要写 Tailwind 原始色',
    test: (code) =>
      new RegExp(`\\b(bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration)-(${PALETTE})-\\d{2,3}\\b`).test(code) ||
      /\b(bg|text|border)-(white|black)\b/.test(code),
    skip: (file) => PRINT_FILES.includes(file),
  },
  {
    id: 'arbitrary-font-size',
    message: '字号只用刻度（text-xs / sm / base / lg / xl / 2xl），不要写 text-[13px]',
    test: (code) => /\btext-\[\d/.test(code),
  },
  {
    id: 'admin-font-mono',
    message: '管理端编码用 <BizCode> / <DocNo>（sans + tabular-nums），font-mono 只给 PDA、条码打印、kbd',
    test: (code) => /\bfont-mono\b/.test(code) && !/<kbd\b/.test(code),
    skip: (file) => file.startsWith('src/pages/pda/') || file.startsWith('src/components/pda/') || PRINT_FILES.includes(file),
  },
  {
    id: 'cjk-literal',
    message: '界面文字走 t(\'key\')，不要在代码里写死中文',
    test: (code) => /[一-鿿]/.test(code),
  },
  {
    id: 'dialog-width',
    message: 'DialogContent 宽度要写 sm:max-w-*（组件自带 sm:max-w-sm，不带 sm: 的 max-w-* 在桌面端不生效）',
    test: (code) => /<DialogContent\b[^>]*className="[^"]*(?<![:\w-])max-w-(sm|md|lg|xl|2xl|3xl|4xl)\b/.test(code),
  },
  {
    id: 'empty-placeholder',
    message: '空值用 <Empty />（字符串场景用 EMPTY_TEXT），不要手写 \'-\' / \'—\'',
    test: (code) => /(\|\||\?\?|\?|:)\s*['"](-|—)['"]/.test(code) || />\s*(-|—)\s*</.test(code),
  },
  {
    id: 'link-button',
    message: '表格/行内操作用 <ActionLink> 或 <RowActions>，不要用 Button variant="link"',
    test: (code) => /variant="link"/.test(code),
    skip: (file) => !file.startsWith('src/pages/'),
  },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (SKIP_DIRS.some((d) => full === d || full.startsWith(d + sep))) continue
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.tsx') && !name.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

/** 去掉注释，避免中文注释、示例代码误报（按行近似处理） */
function stripComments(line, state) {
  let code = line
  if (state.inBlock) {
    const end = code.indexOf('*/')
    if (end < 0) return ''
    code = code.slice(end + 2)
    state.inBlock = false
  }
  code = code.replace(/\{?\/\*.*?\*\/\}?/g, '')
  const open = code.indexOf('/*')
  if (open >= 0) {
    state.inBlock = true
    code = code.slice(0, open)
  }
  // 行尾注释：// 前面是行首或空白，且不是 URL 里的 ://
  code = code.replace(/(^|\s)\/\/.*$/, '$1')
  return code
}

const problems = []
for (const full of walk(SRC)) {
  const file = relative(ROOT, full).split(sep).join('/')
  const state = { inBlock: false }
  readFileSync(full, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (line.includes('design-lint-ignore')) return
      const code = stripComments(line, state)
      if (!code.trim()) return
      for (const rule of rules) {
        if (rule.skip?.(file)) continue
        if (rule.test(code)) problems.push(`${file}:${index + 1}  [${rule.id}] ${rule.message}`)
      }
    })
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n设计规范检查：${problems.length} 处不符合（规则说明见 docs/02-设计规范.md 第 9 节）`)
  process.exit(1)
}
console.log('设计规范检查通过')
