---
sourceId: "JF-IN-008"
title: "海外仓退货处理&海外仓创建退货入库单"
url: "https://help.jfwms.com/zh_CN/doc-article/7106580525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 入库 > 海外仓退货处理&海外仓创建退货入库单"
category: "入库"
categoryId: 162
docId: 7106580525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-05-25T07:14:33.469Z"
---

# 海外仓退货处理&海外仓创建退货入库单

**一、定义**

当仓库收到退货入库包裹，不同类型的退货包裹处理逻辑和操作完全不一样。

1、如果是买家拒绝签收，原包裹返回仓库，仓库扫描退货直接入库上架；

2、如果是买家已经签收，使用线下物流退货仓库，需要卖家在极风OMS创建退货入库单，告诉仓库退货包裹商品和数量，海外仓进行退货质检、入库、上架，等有新订单，再打包发货。

3、如果仓库扫描退货，显示退货入库单不存在，即卖家没有创建退货入库单，仓库可以直接在极风WMS端帮助卖家创建退货入库单，卖家需要根据实际情况分析是否可继续上架做二次销售，或者需要维修或者销毁，OMS/WMS都需要看到照片，方便沟通

注意：仓库退货如果没有入库单，仓库无法质检入库，会造成仓库退货包裹堆放混乱，无法上架，否则会出错。这个帮助就讲解极风WMS退货入库上架流程。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251225070428/b8f1b1e4fc34025c86637270ff2cd78e.jpg)

### 
** 二、操作路径**

**方法1：扫描收货直接创建退货入库单（适合电脑扫描枪签收入库，高效便捷）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525070434/6eb10bdca0d2cdde320390df627f9bf9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525070604/6ab86caca031614958a5bd0d443a9c14.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525071148/97c15354dd41a03182a6aacfca1bfe54.png)

**方法2：批量创建退货入库单（适合卖家大量退货包裹集中处理）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525071336/e9a26d4b4bf5983dff755c24c7fe7081.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525071148/97c15354dd41a03182a6aacfca1bfe54.png)

**方法3：PDA扫描退货入库直接创建退货入库单（适合仓库内使用PDA移动作业，灵活高效）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251225070731/921ddfb39bea12be8c41950424cb4feb.jpg)
