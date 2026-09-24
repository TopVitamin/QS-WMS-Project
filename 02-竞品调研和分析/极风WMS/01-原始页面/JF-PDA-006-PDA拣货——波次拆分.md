---
sourceId: "JF-PDA-006"
title: "PDA拣货——波次拆分"
url: "https://help.jfwms.com/zh_CN/doc-article/7108670603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > PDA > PDA拣货——波次拆分"
category: "PDA"
categoryId: 165
docId: 7108670603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-03T01:45:14.187Z"
---

# PDA拣货——波次拆分

### **一、定义**
拣货员PDA拣货时，由于一些特定条件限制，无法完整一个波次拣货回来，当前拣货员不需要整个波次完成拣货，只需要完成当前可拣货商品的包裹任务。剩余当前无法拣货商品可拆分到下一个波次任务，灵活处理。例如某些库位商品体积过大，或者库位位置特殊，当前拣货车无法拣货，可把波次任务进行拆分。

### **二、操作步骤**

#### **步骤1：在设置——出库设置——波次设置——通用设置里面打开波次拆分按钮。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603014258/098441039cf8e94c58080d8488d52b82.png)

#### **步骤2：PDA进入拣货任务。可拣货商品完成拣货后，进入拣货波次详情，拆分波次。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260527084247/4a91b986a09bd8cf5f80e82f2c0ecb89.png)

#### **注意：拆分波次前查看有没有包裹是部分拣货，如果是部分拣货，则需要当前已部分拣货包裹完成拣货，才可拆分。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260527085057/8524482425cf1c99a76b6d33793703cc.png)

#### **步骤3：到包装台进行扫描拣货单/拣货车，进行包装作业。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260527085736/e0a5afb4889a5219cdef6b2c5eb5fd24.png)

#### **步骤4：PDA继续拣货任务。不用等包装作业完成，可直接开启当前波次的剩余拣货任务。
若开启了绑定拣货车，则扫描拣货车进入拣货任务；若没有绑定拣货车，则进入拣货任务会有弹窗提示继续拣货。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260527090454/7955a173ab54e85d97e82b8502df6fa3.png)

#### **步骤5：剩余子波次拣货完成继续包装，支持不同的包装员账号对子波次进行包装。****说明：子波次由波次拆分得来，A波次拆分后，拆分后的波次自动带有尾缀，如A-1、A-2。**
