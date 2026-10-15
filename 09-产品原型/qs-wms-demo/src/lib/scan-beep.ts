let audioCtx: AudioContext | undefined

/** 扫码反馈音（PDA 与管理端作业台共用）：成功短高音，失败长低音 + 震动 */
export function beep(ok: boolean) {
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = ok ? 1320 : 220
    osc.type = ok ? 'sine' : 'square'
    gain.gain.value = 0.08
    osc.connect(gain).connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + (ok ? 0.08 : 0.3))
  } catch {
    // 浏览器不支持音频时静默
  }
  if (!ok) navigator.vibrate?.(200)
}
