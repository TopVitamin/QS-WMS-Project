import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/**
 * 右侧详情抽屉：宽 880px（窄屏不超过 92vw），头部标题 + 可滚动内容区。
 * 用于「边看列表边查看」的子记录（收货记录、上架单等），主单据详情用独立路由页。
 */
export function DetailSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        className="gap-0 data-[side=right]:w-[880px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[92vw]"
        // 没有描述时显式声明，避免 Radix 的无障碍告警
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-8">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
