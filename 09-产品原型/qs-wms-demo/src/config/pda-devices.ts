/**
 * PDA 模拟机型（《PDA作业端设计规范》§2）。一期全屏运行（装成应用或用企业浏览器，没有地址栏），
 * 机框按整块屏幕画：状态栏 + 可用区，屏幕比例与真机一致；可用区就是规范里的三档（宽松档 / 验收基线 / 兼容档）。
 */
export const PDA_STATUS_BAR_HEIGHT = 24

export interface PdaDevice {
  key: 'hd-plus' | 'hd' | 'keypad'
  /** 切换条上的名称：屏幕尺寸 · 物理分辨率（宽×高），不翻译 */
  label: string
  /** CSS 视口宽（物理宽 ÷ 像素密度） */
  width: number
  /** CSS 视口高；可用区高 = 它减状态栏 */
  height: number
}

export const pdaDevices: PdaDevice[] = [
  { key: 'hd-plus', label: '5.7″ · 720×1440', width: 360, height: 720 },
  { key: 'hd', label: '5″ · 720×1280', width: 360, height: 640 },
  { key: 'keypad', label: '4″ · 480×800', width: 320, height: 533 },
]

export type PdaDeviceKey = PdaDevice['key']

/** 默认 18:9 主流机 */
export const DEFAULT_PDA_DEVICE: PdaDeviceKey = 'hd-plus'
