import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Empty } from '@/components/biz/display'
import { Button } from '@/components/ui/button'

/**
 * Mock 照片上传（新品维护、无主货登记共用）：一期不接附件服务，
 * 只保留文件名并做本地预览，不校大小与张数。
 */
export function MockPhotoField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  // 预览用 object URL 必须手动释放，否则反复选图会一直占内存
  const previewUrls = useRef<Record<string, string>>({})

  useEffect(
    () => () => {
      Object.values(previewUrls.current).forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const add = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const names: string[] = []
    Array.from(files).forEach((file) => {
      names.push(file.name)
      const previous = previewUrls.current[file.name]
      if (previous) URL.revokeObjectURL(previous)
      previewUrls.current[file.name] = URL.createObjectURL(file)
    })
    setPreviews({ ...previewUrls.current })
    onChange([...value, ...names])
  }

  const remove = (name: string) => {
    const url = previewUrls.current[name]
    if (url) URL.revokeObjectURL(url)
    delete previewUrls.current[name]
    setPreviews({ ...previewUrls.current })
    onChange(value.filter((v) => v !== name))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          add(e.target.files)
          e.target.value = ''
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <ImagePlus data-icon="inline-start" />
        {t('common.upload')}
      </Button>
      {value.map((name) => (
        <span key={name} className="flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground">
          {previews[name] ? <img src={previews[name]} alt={name} className="size-6 rounded object-cover" /> : null}
          <span className="max-w-40 truncate">{name}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => remove(name)}
            aria-label={t('common.remove')}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  )
}

/** 只读的照片留底：一期只存文件名，详情里逐个列出；没有照片显示占位符 */
export function MockPhotoList({ value }: { value: string[] }) {
  if (value.length === 0) return <Empty />
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((name) => (
        <span key={name} className="rounded border px-2 py-1 text-xs text-muted-foreground">
          {name}
        </span>
      ))}
    </div>
  )
}
