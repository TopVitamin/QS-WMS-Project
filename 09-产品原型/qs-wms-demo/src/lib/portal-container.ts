let container: HTMLElement | null = null

/** PDA 模拟机框的 Portal 容器；为空时 Radix/Sonner 使用默认 body */
export function setPortalContainer(next: HTMLElement | null) {
  container = next
}

export function getPortalContainer(): HTMLElement | undefined {
  return container ?? undefined
}
