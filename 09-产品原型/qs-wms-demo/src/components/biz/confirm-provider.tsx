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
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            {state.description && <DialogDescription>{state.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => close(false)}>
              {state.cancelText ?? t('common.cancel')}
            </Button>
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
