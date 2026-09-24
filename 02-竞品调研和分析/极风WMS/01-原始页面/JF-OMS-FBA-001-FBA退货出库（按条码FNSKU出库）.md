---
sourceId: "JF-OMS-FBA-001"
title: "FBA退货出库（按条码FNSKU出库）"
url: "https://help.jfwms.com/zh_CN/doc-article/7108120602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > FBA退货 > FBA退货出库（按条码FNSKU出库）"
module: "OMS帮助文档(新)"
category: "FBA退货"
categoryId: 186
docId: 7108120602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T09:02:02.784Z"
---

# FBA退货出库（按条码FNSKU出库）

**一、定义**

FBA退货入库的商品发往FBA仓或者其他仓，需要卖家在卖家端OMS端发起出库单，可以选择换标或者不换标发往FBA仓或者其他仓。

FBA退货出库方式的区别

（1）按换标装箱出库：使用这种方式出库的话，FBA退货入库完成之后，是要先在OMS客户端发起退货换标单，仓库处理换标并且装箱之后，才可以使用换标装箱出库

（2）按条码（FNSKU）出库：使用此方式出库，则是需要在OMS客户端直接发起FBA退货出库单，选择已经入库的条码进行出库，在出库单中填写装箱要求，仓库在处理出库单时，会按照装箱要求装箱出库

### 
** 二、操作路径：****按条码（FNSKU）出库操作步骤**

**功能入口：OMS-退货-FBA退货-出库单管理-新建**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602090014/6ed08a51b32b7dd725ecda376bfc62e1.png)

### **Step1：点击新建，进入退货出库单新建页面，填写基本信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206074048/4e149c3a0e952b4cdd5c4090b500a4f2.jpg)

### **Step2：填写收件人信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206063310/4ca22fddb5171e0fcc2e3e86fe3679ec.jpg)

### **Step3：选择商品，填写出库数量以及选择是否要换标**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206074313/76b3f6842986b85e43404fefba71639d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206074336/97cb3525ab755a29b819789177a87406.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206074541/9e39a0249a472eefb998d1b36a6ad6b9.jpg)

### **Step4：填写装箱要求**
**商品信息填写完成之后，需要填写装箱要求，即要出库的商品需要怎么装箱**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206075527/6ff3e6df89cf66d357301000d1495b2d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206075628/306ef11849d118afccca5c4184e1bf0b.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206075101/5d0271de327b892ae38b5eed2650acbc.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206074914/35236403a74687668aa243d25bfa113b.jpg)

### **Step5：保存/保存并提交**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206075916/2fac2bc2cdc2ba7d9d87692765173abd.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602090159/e6cf64239ff40aaf8d9d078fa9416fa3.png)

**提交成功之后，状态为“待出库”，WMS端可接收到出库单，进行出库处理操作，仓库处理出库完成之后，单据会进入“已出库”列表，相应的未装箱库存则会扣减**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602090051/6687ab834740c7c4a85c1c333a8b91a3.png)
