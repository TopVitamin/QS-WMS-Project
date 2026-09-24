---
sourceId: "JF-OUT-037"
title: "设置爆款波次校验SKU"
url: "https://help.jfwms.com/zh_CN/doc-article/7107580602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 设置爆款波次校验SKU"
category: "出库"
categoryId: 170
docId: 7107580602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T12:57:20.528Z"
---

# 设置爆款波次校验SKU

**一、定义**

爆款波次需要校验SKU正确之后才可以打印面单，避免拣货和包装错误

** 二、操作流程：**

**第一步：开启爆款波次校验SKU**

**功能入口：设置-业务设置-波次设置**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604125716/be286e6c0f11cbfa69fa00849ffa22c4.png)

**第二步：正常处理爆款波次**

操作步骤参考[**爆款包裹波次批量打印面单**](https://jifengwms.feishu.cn/docx/X9tvd2fjfojaNjxiDc8cpvM2nie?from=from_copylink)

开启校验SKU后，是在进入扫描包装后出现校验SKU弹窗，需要校验单个包裹里的商品SKU，校验通过后才可以打印面单（需要先拣货再进行扫描包装打印面单）

特别提示：一个爆款波次不管有几个包裹，都只需要检验一个包裹的商品SKU即可，只要校验通过了就能打印波次内所有包裹的面单

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090751/060fc624707aa47029d5768fd3c16307.jpg)

**扫描商品标签进行校验，校验通过即可批量打印面单**
