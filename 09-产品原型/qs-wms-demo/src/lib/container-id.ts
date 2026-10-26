/** 容器档案自然键：同仓容器号唯一且不可变，因此可稳定用作明细外键。 */
export function containerIdOf(warehouseCode: string, containerNo?: string): string | undefined {
  const no = containerNo?.trim().toUpperCase()
  return no ? `${warehouseCode}::${no}` : undefined
}
