import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from '@/hooks/use-confirm'

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const resolveRef = useRef<((value: boolean) => void) | null>(null)
  const [state, setState] = useState<ConfirmState>({ open: false, title: '' })

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({ open: true, ...options })
    })
  }, [])

  const close = (result: boolean) => {
    setState((s) => ({ ...s, open: false }))
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => !open && close(false)}>
        <DialogContent
          className="sm:max-w-md"
          data-size={state.size ?? (state.hideCancel ? 'pda' : 'default')}
          showCloseButton={false}
          // 阻断提示多由扫码触发：不自动聚焦按钮，避免扫描头紧跟的回车把弹窗直接关掉（PDA 规范 §5）
          onOpenAutoFocus={state.hideCancel ? (e) => e.preventDefault() : undefined}
        >
          <DialogHeader>
            <DialogTitle className={(state.size ?? (state.hideCancel ? 'pda' : 'default')) === 'pda' ? 'text-lg' : undefined}>
              {state.title}
            </DialogTitle>
            {state.description && (
              <DialogDescription
                className={(state.size ?? (state.hideCancel ? 'pda' : 'default')) === 'pda' ? 'text-base' : undefined}
              >
                {state.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            {!state.hideCancel && (
              <Button variant="outline" onClick={() => close(false)}>
                {state.cancelText ?? t('common.cancel')}
              </Button>
            )}
            <Button
              variant={state.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => close(true)}
            >
              {state.confirmText ?? t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
