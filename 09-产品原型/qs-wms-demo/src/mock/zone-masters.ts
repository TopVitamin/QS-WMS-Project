import type { ZoneMaster } from '@/types/wms'

const ts = '2026-10-05T09:00:00.000Z'

/** 演示库区：与库区/货位 PRD Mock 对齐 */
export function createZoneMasters(): ZoneMaster[] {
  const base = {
    createdAt: ts,
    createdBy: 'system',
    updatedAt: ts,
    updatedBy: 'system',
  }
  return [
    {
      warehouseCode: 'US-LA-01',
      code: 'Z-STORE',
      name: '存储区 A',
      zoneType: 'STORAGE',
      status: 'ENABLED',
      ...base,
    },
    {
      warehouseCode: 'US-LA-01',
      code: 'Z-PICK',
      name: '拣货区 B',
      zoneType: 'PICK',
      status: 'ENABLED',
      remark: '下属 P-B-01 有占用，测 R07',
      ...base,
    },
    {
      warehouseCode: 'US-LA-01',
      code: 'Z-STAGE',
      name: '收货暂存',
      zoneType: 'STAGING',
      status: 'ENABLED',
      ...base,
    },
    {
      warehouseCode: 'US-LA-01',
      code: 'Z-OFF',
      name: '已停用样例',
      zoneType: 'STORAGE',
      status: 'DISABLED',
      remark: 'R08 资格演示',
      ...base,
    },
    {
      warehouseCode: 'HK-WH-01',
      code: 'Z-HK-PICK',
      name: '香港拣货区',
      zoneType: 'PICK',
      status: 'ENABLED',
      ...base,
    },
    {
      warehouseCode: 'HK-WH-01',
      code: 'Z-HK-STAGE',
      name: '香港暂存区',
      zoneType: 'STAGING',
      status: 'DISABLED',
      ...base,
    },
  ]
}
