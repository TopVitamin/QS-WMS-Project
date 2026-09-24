---
sourceId: "JF-LOG-003"
title: "如何对接佐川物流下单并上传单号和面单？"
url: "https://help.jfwms.com/zh_CN/doc-article/7113680710-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 如何对接佐川物流下单并上传单号和面单？"
category: "物流渠道管理"
categoryId: 163
docId: 7113680710
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-10T11:14:25.028Z"
---

# 如何对接佐川物流下单并上传单号和面单？

## **一、功能场景**
佐川物流因种种原因无法对接API获取面单，但海外仓想要通过极风导出订单信息，下载这些信息从佐川系统下单，再将佐川的面单和运单号上传到极风并回传给卖家，若您有这种需求，可学习本文档。

## **二、操作步骤**

### **1.创建自定义物流商，添加物流渠道，并创建物流产品**

![1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710105941/45f31d16b1058d586fc3be7207b58053.png)

![2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710105956/f2e43fa3400d826df4195a9ac70dca62.png)

![3.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110005/31ca0ca71184bbdb3de7b20a51e88e90.png)

![4.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110012/82ba9d6eee3f026be339bb287651c3d8.png)

![5.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110034/fd45c64e026040dbcb83395829d2aea5.png)

![6 .png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110044/f13d9f31d409f872a266a6100602c35e.png)

![7.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110055/040d45ccc13c070fcec9d46ccd0cc543.png)

![新建物流产品最后一张图.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710111005/eb01fa96b398136fe1f3497eb8a2a0a3.png)

### **2.卖家在OMS/ERP下单的时候选择仓库设置好的佐川物流进行推单，下单后该订单会出现在WMS待打单页面**

![步骤二.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110211/b9d961180a5de836a3d9f2f8d4158085.png)

### **3.WMS一件代发出库列表导出佐川模板，模板中会自动下载对应的地址信息**

![步骤三1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110201/73e59f8e98f1ee734daf5bda457d138b.png)

![步骤三2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110227/1c2886438cb3da5518990939b6a71d71.png)

![步骤三3.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110235/9a1bccc053af0a15aea110cdb031c96c.png)

### **4.将极风下载出来的信息表格导入佐川系统，生成对应的运单号、面单等数据并从佐川系统导出**

### **5.极风上面下载导入运单号的表格，将导出的运单号和面单导入极风，系统就会将这些信息回传给OMS/ERP**

![步骤五1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110255/5114d2d9ffc6ea63c84b642095959770.png)

![步骤五2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260710110305/efc446e3bb7dcefbb3ce1ef4c9c0d2c0.png)
