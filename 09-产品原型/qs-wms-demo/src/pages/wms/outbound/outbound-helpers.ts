import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundCommand } from '@/types/outbound'

export function useOutboundAction() {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const operator = useSettings((s) => s.operator)
  const run = (c: OutboundCommand) => {
    const result = useDb.getState().outboundAction(c, operator)
    if (!result.ok) {
      setError(t(result.errorKey, result.params))
      return undefined
    }
    setError('')
    toast.success(t('outbound.success'))
    return result
  }
  return { run, error, setError }
}
export function useOutboundNavigation() {
  const navigate = useNavigate()
  return useCallback(
    (kind: string, no: string) => navigate(`/wms/outbound/${kind}/${encodeURIComponent(no)}`),
    [navigate],
  )
}
export const outboundTypes = ['B2C', 'FBA', 'WHOLESALE', 'TRANSFER', 'PURCHASE_RETURN', 'OTHER'] as const
export const sum = <T,>(rows: T[], value: (row: T) => number) => rows.reduce((n, r) => n + value(r), 0)
export const parseSerials = (text: string) => text.split(/[\s,，]+/).filter(Boolean)
