import { useEffect, useState } from 'react'

/** 当前时间，按间隔刷新（顶栏时钟、PDA 模拟状态栏） */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
