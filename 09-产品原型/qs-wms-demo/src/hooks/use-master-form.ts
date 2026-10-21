import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard'
import type { MasterDataI18nScope } from '@/lib/master-data'

type SaveResult = { ok: true } | { ok: false; errorKey: string }

interface UseMasterFormOptions<T extends object, E extends object> {
  scope: MasterDataI18nScope
  /** 编辑页传当前实体；新增页传 createEmpty*Form() */
  initial: T
  validate: (form: T) => E
  save: (form: T) => SaveResult
  /** 保存成功后跳转的详情/列表路径 */
  backTo: (form: T) => string
}

/**
 * 主数据新增/编辑页的表单生命周期：表单状态、校验错误、脏检查、保存、取消、离开拦截。
 * 页面只保留字段映射与保存 payload，不再每个模块重复 useEffect + useState + toast。
 */
export function useMasterForm<T extends object, E extends object>({
  scope,
  initial,
  validate,
  save,
  backTo,
}: UseMasterFormOptions<T, E>) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const leave = useMasterDiscardNavigate(scope)
  const rawFieldError = useMasterFormFieldError(scope)
  const [form, setForm] = useState<T>(initial)
  const [errors, setErrors] = useState<E>({} as E)
  const fieldError = useCallback((key: string) => rawFieldError(errors, key), [errors, rawFieldError])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  const { markSaved } = useUnsavedChangesGuard(dirty, scope)

  const onSave = useCallback(() => {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t(`${scope}.saveValidationFailed`))
      return
    }
    const result = save(form)
    if (!result.ok) {
      toast.error(t(result.errorKey))
      return
    }
    markSaved()
    toast.success(t(`${scope}.saveSuccess`))
    navigate(backTo(form))
  }, [backTo, form, markSaved, navigate, save, scope, t, validate])

  const onCancel = useCallback(() => {
    void leave(backTo(form), dirty)
  }, [backTo, dirty, form, leave])

  return { form, setForm, errors, dirty, fieldError, onSave, onCancel }
}
