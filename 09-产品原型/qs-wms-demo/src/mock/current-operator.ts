import { useSettings } from '@/stores/settings'

/** 当前演示操作人（与顶栏用户菜单、各单据的操作人保持一致） */
export const currentOperator = () => useSettings.getState().operator
