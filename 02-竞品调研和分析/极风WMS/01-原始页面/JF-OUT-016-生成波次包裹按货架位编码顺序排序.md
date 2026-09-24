---
sourceId: "JF-OUT-016"
title: "生成波次包裹按货架位编码顺序排序"
url: "https://help.jfwms.com/zh_CN/doc-article/7114240731-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 生成波次包裹按货架位编码顺序排序"
category: "出库"
categoryId: 170
docId: 7114240731
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-31T09:27:51.721Z"
---

# 生成波次包裹按货架位编码顺序排序

## **一、定义：针对需要使用波次打单仓库，包裹排序需要通过按货架位编号排序，不走拣货优先级逻辑，直接按照货架位编码生成拣货路径。**

## **二、操作流程：**

### 1、维护货架位编号
创建货架位的时候，可按编号顺序进行创建或者导入

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260731091107/50a3fb7a4c97be63ae0493c509839d8f.png)

### **2、生成波次的时候，包裹排序选择【按货架位编码顺序排序】生成。**
生成后波次订单排序以及面单打印排序按货架位排序

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260731091730/4437485f0a172d8067fe0f196e8de59e.png)

### **3、波次策略生成波次，包裹排序【按货架位编码顺序排序】生成。**
如果需要使用波次策略自动生成波次，可在波次策略内设置。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260731092623/f7bd0be57252e3fd51802f216e4715a9.png)
