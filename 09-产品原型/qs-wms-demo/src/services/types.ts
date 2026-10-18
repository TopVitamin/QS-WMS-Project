export type ActionResult =
  | { ok: true }
  | { ok: false; errorKey: string; params?: Record<string, string | number> }
