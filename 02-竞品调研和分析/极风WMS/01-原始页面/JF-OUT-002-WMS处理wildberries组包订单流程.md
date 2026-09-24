---
sourceId: "JF-OUT-002"
title: "WMS处理wildberries组包订单流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7115070907-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > WMS处理wildberries组包订单流程"
category: "出库"
categoryId: 170
docId: 7115070907
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-08T03:13:44.401Z"
---

# WMS处理wildberries组包订单流程

## **一、定义**
Wildberries（下文简称WB）平台FBS出库存在**供货单（Supply）**组包逻辑。OMS平台订单需要先在OMS、ERP待处理中完成WB组包，再推送至WMS仓库作业。仓库发货后，系统需要将当前**组包单在WB平台标发至配送中**，并在**标发成功后**获取**供货订单二维码**，供WMS查看和打印。

## **二、操作流程**
**1、****正常操作打单，将订单流转到已发货。（订单到了已发货之后，系统会将运单号和发货状态回传给OMS和平台，平台那边收到后会进行标发，并将组包码回传给极风WMS）**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907100500_e68c6b8deaa44afe82a739ce380a2286.png)

**2、仓库端在全部和已发货状态中，只要有组包就会展示【供货单】，仓库选择任意一个订单打印组包码**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907100652_a8614b904db845d3aed4320dc0ceb337.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907100741_2b57d7e29218468b834bd7a8f2210776.png)

**注：子账号需要配置【供货单】权限，可通过主账号开启。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907100943_36cc62d518504e4b9162e0f7b9144491.png)
