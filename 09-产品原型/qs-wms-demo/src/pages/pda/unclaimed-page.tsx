import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar } from '@/components/pda/pda-context-bar'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { beep } from '@/lib/scan-beep'
import { parseCodeLines } from '@/lib/unclaimed'
import { useDb } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

type ClueField = 'tracking' | 'mark' | 'container' | 'qty'

/**
 * PDA 无主货登记（《PDA无主货登记前端Demo版PRD》）：单屏录入线索、箱数、暂存库位并提交；
 * 与管理端登记弹窗共用 `registerUnclaimed`；只登记，不认领、不指定货主。
 */
export function PdaUnclaimedPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const registerUnclaimed = useDb((s) => s.registerUnclaimed)

  const [trackingNos, setTrackingNos] = useState('')
  const [cartonMarks, setCartonMarks] = useState('')
  const [containerNo, setContainerNo] = useState('')
  const [cartonQty, setCartonQty] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [requestId, setRequestId] = useState(() => newRequestId())
  const [focusField, setFocusField] = useState<ClueField | undefined>('tracking')
  const [submitting, setSubmitting] = useState(false)

  /** 扫码只作为线索框与库位的快捷输入（PDA 无主货登记 PRD §3），返回是否命中 */
  const onScan = (code: string): boolean => {
    const existing = [...parseCodeLines(trackingNos), ...parseCodeLines(cartonMarks)]
    if (focusField === 'tracking' || focusField === undefined) {
      if (existing.includes(code)) {
        toast.error(t('pdaUnclaimed.duplicate', { code }))
        return false
      }
      setTrackingNos((prev) => `${prev}${prev ? '\n' : ''}${code}`)
      return true
    }
    if (focusField === 'mark') {
      if (existing.includes(code)) {
        toast.error(t('pdaUnclaimed.duplicate', { code }))
        return false
      }
      setCartonMarks((prev) => `${prev}${prev ? '\n' : ''}${code}`)
      return true
    }
    if (focusField === 'container') {
      setContainerNo(code)
      return true
    }
    /** 箱数框收到扫码内容不写入数值（PDA 规范 §4.2） */
    return true
  }
  usePdaScanListener(onScan)

  useEffect(() => {
    setRequestId(newRequestId())
  }, [warehouse.code])

  const missing = (() => {
    const hasClue =
      parseCodeLines(trackingNos).length > 0 || parseCodeLines(cartonMarks).length > 0 || containerNo.trim() !== ''
    if (!hasClue) return 'unclaimed.error.clueRequired'
    if (!Number.isInteger(Number(cartonQty)) || Number(cartonQty) <= 0) return 'pdaUnclaimed.fillCartonQty'
    return undefined
  })()

  const submit = async () => {
    if (missing || submitting) return
    const ok = await confirm({
      title: t('pdaUnclaimed.submitTitle'),
      description: `${t('pdaUnclaimed.submitBody')} · ${cartonQty} ${t('pdaUnclaimed.cartonQty')}`,
      confirmText: t('pdaUnclaimed.submit'),
    })
    if (!ok) return
    setSubmitting(true)
    const res = registerUnclaimed({
      warehouseCode: warehouse.code,
      trackingNos: parseCodeLines(trackingNos),
      cartonMarks: parseCodeLines(cartonMarks),
      containerNo: containerNo.trim() || undefined,
      cartonQty: Number(cartonQty),
      description: description.trim() || undefined,
      photos,
      requestId,
      operator,
    })
    setSubmitting(false)
    if (!res.ok) {
      beep(false)
      toast.error(t(res.errorKey))
      return
    }
    beep(true)
    toast.success(t('unclaimed.submitSuccess', { registerNo: res.record?.registerNo }))
    setTrackingNos('')
    setCartonMarks('')
    setContainerNo('')
    setCartonQty('')
    setDescription('')
    setPhotos([])
    setRequestId(newRequestId())
    setFocusField('tracking')
  }

  return (
    <>
      <PdaHeader title={t('pdaUnclaimed.title')} />
      <PdaContextBar>
        <span className="font-medium">
          {warehouse.code} {t(warehouse.nameKey)}
        </span>
      </PdaContextBar>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="py-2 text-sm text-muted-foreground">{t('pdaUnclaimed.scopeHint')}</PdaCard>

        <ScanInput
          label={t('pdaUnclaimed.scanHint')}
          onScan={onScan}
          candidates={[
            { value: '1Z999AA10000009999', label: t('pdaUnclaimed.trackingNos') },
            { value: 'FBA15XYZ9999', label: t('pdaUnclaimed.cartonMarks') },
          ]}
        />

        <PdaSection title={t('pdaUnclaimed.clueSection')}>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('pdaUnclaimed.trackingNos')}</span>
            <Textarea
              rows={2}
              value={trackingNos}
              placeholder={t('pdaUnclaimed.onePerLine')}
              onFocus={() => setFocusField('tracking')}
              onChange={(e) => {
                setFocusField('tracking')
                setTrackingNos(e.target.value)
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('pdaUnclaimed.cartonMarks')}</span>
            <Textarea
              rows={2}
              value={cartonMarks}
              placeholder={t('pdaUnclaimed.onePerLine')}
              onFocus={() => setFocusField('mark')}
              onChange={(e) => {
                setFocusField('mark')
                setCartonMarks(e.target.value)
              }}
            />
          </label>
          <div className="flex items-start gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('pdaUnclaimed.containerNo')}</span>
              <Textarea
                rows={1}
                value={containerNo}
                onFocus={() => setFocusField('container')}
                onChange={(e) => {
                  setFocusField('container')
                  setContainerNo(e.target.value)
                }}
              />
            </label>
            <label className="flex w-28 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t('pdaUnclaimed.cartonQty')}</span>
              <Textarea
                rows={1}
                value={cartonQty}
                onFocus={() => setFocusField('qty')}
                onChange={(e) => {
                  setFocusField('qty')
                  setCartonQty(e.target.value)
                }}
              />
            </label>
          </div>
        </PdaSection>

        <PdaSection title={t('pdaUnclaimed.description')}>
          <Textarea
            rows={2}
            value={description}
            placeholder={t('pdaUnclaimed.description')}
            onFocus={() => setFocusField(undefined)}
            onChange={(e) => setDescription(e.target.value)}
          />
        </PdaSection>

        <PdaSection title={t('pdaUnclaimed.photo')}>
          <div className="flex items-center gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center rounded border px-3 text-sm">
              {t('pdaUnclaimed.takePhoto')}
              <input
                type="file"
                accept="image/*"
                capture
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) setPhotos((prev) => [...prev, ...Array.from(files).map((f) => f.name)])
                  e.target.value = ''
                }}
              />
            </label>
            <span className="text-sm text-muted-foreground">{photos.length > 0 ? photos.join('、') : '—'}</span>
          </div>
        </PdaSection>
      </div>
      <PdaFooter hint={missing ? t(missing) : undefined}>
        <PdaButton className="flex-1" disabled={!!missing || submitting} onClick={submit}>
          {t('pdaUnclaimed.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}

function newRequestId() {
  return `ug-pda-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
