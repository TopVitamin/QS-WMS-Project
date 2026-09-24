---
sourceId: "JF-OMS-FBA-003"
title: "FBA退货出库单（按换标装箱出库）"
url: "https://help.jfwms.com/zh_CN/doc-article/7108130602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > FBA退货 > FBA退货出库单（按换标装箱出库）"
module: "OMS帮助文档(新)"
category: "FBA退货"
categoryId: 186
docId: 7108130602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T03:16:23.108Z"
---

# FBA退货出库单（按换标装箱出库）

**一、定义**

FBA退货入库的商品发往FBA仓或者其他仓，需要卖家在卖家端OMS端发起出库单，可以选择换标或者不换标发往FBA仓或者其他仓。

FBA退货出库方式的区别

（1）按换标装箱出库：使用这种方式出库的话，FBA退货入库完成之后，是要先在OMS客户端发起退货换标单，仓库处理换标并且装箱之后，才可以使用换标装箱出库

（2）按条码（FNSKU）出库：使用此方式出库，则是需要在OMS客户端直接发起FBA退货出库单，选择已经入库的条码进行出库，在出库单中填写装箱要求，仓库在处理出库单时，会按照装箱要求装箱出库

** 二、操作路径:****按换标装箱出库操作步骤**

**功能入口：OMS-退货-FBA退货-出库单管理-新建**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602090341/32e457002c4b255082306edaed31d878.png)

**第一步：点击新建，进入退货出库单新建页面，填写基本信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206063132/be0eb21f1e03cc780280ce89b08063d1.jpg)

#### 
**第二步：填写收件人信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206063310/4ca22fddb5171e0fcc2e3e86fe3679ec.jpg)

#### 
**第三步：选择箱子**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206064954/d1ee2fc565363ca283ec2d603fcd7dd8.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206065017/c4d202ae03a1518912fd047eee0d3c75.jpg)

#### 
**第四步：上传附件**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206065234/d1dab2cadb590e7ea77fea12bc2d8006.jpg)

#### 
**第五步：保存/保存并提交**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206065416/7a4d0e527a8793e559f935a46b234fd6.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605031602/6ed34eed866a1da76b42b0e5b6adbf76.png)

**提交成功之后，状态为“待出库”，WMS端可接收到出库单，进行出库处理操作，仓库处理出库完成之后，单据会进入“已出库”列表，相应的已装箱库存则会扣减**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605031617/5fbe8f7bd5525c3bc86fdc92d1293798.png)
