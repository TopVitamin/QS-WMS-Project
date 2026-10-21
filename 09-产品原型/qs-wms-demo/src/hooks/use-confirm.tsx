import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  /** 只保留确认按钮，用作业务阻断提示（PDA 规范 §5） */
  hideCancel?: boolean
  /** PDA/作业台阻断用大字号；默认管理端尺寸 */
  size?: 'default' | 'pda'
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return { confirm }
}

export { ConfirmContext }
