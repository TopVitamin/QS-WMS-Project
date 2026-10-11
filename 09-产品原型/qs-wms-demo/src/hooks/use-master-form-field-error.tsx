import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { MasterDataI18nScope } from '@/lib/master-data'

/** 表单校验错误行：`master*.error.*` */
export function useMasterFormFieldError(scope: MasterDataI18nScope) {
  const { t } = useTranslation()

  return useCallback(
    (errors: object, key: string) => {
      const code = (errors as Record<string, string | undefined>)[key]
      return code ? <p className="text-xs text-destructive">{t(`${scope}.error.${code}`)}</p> : null
    },
    [scope, t],
  )
}
