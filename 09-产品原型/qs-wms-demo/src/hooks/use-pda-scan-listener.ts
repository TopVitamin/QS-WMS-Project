import { useEffect, useRef } from 'react'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

/**
 * 页面级扫码监听（《PDA作业端设计规范》§4.2）：焦点不在任何输入框时，接收键盘模拟扫描头输出的整串字符，
 * 回车时交给 `onScan`。回车会被拦下，避免同时「点击」当前获得焦点的按钮。输入框自己处理扫码；有弹窗时不接收。
 */
export function usePdaScanListener(onScan: (code: string) => void, enabled = true) {
  const onScanRef = useRef(onScan)
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return
    let buffer = ''
    const onKeyDown = (e: KeyboardEvent) => {
      // 输入框自己处理扫码；弹窗打开时必须先处理弹窗（阻断提示须点「知道了」）
      if (isEditable(e.target) || document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        buffer = ''
        return
      }
      if (e.key === 'Enter') {
        const code = buffer.trim()
        buffer = ''
        if (code) {
          e.preventDefault()
          onScanRef.current(code)
        }
        return
      }
      if (e.key === 'Escape') buffer = ''
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) buffer += e.key
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
