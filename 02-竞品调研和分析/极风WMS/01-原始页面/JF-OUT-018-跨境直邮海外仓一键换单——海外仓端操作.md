---
sourceId: "JF-OUT-018"
title: "跨境直邮海外仓一键换单——海外仓端操作"
url: "https://help.jfwms.com/zh_CN/doc-article/7107200526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 跨境直邮海外仓一键换单——海外仓端操作"
category: "出库"
categoryId: 170
docId: 7107200526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T12:27:05.817Z"
---

# 跨境直邮海外仓一键换单——海外仓端操作

**一、定义**

跨境电商卖家tiktok、shopify、temu、shein等店铺出单后，卖家从国内供应商采购，在国内进行打包，粘贴中性面单，国内物流商收货发到海外仓，由海外仓更换尾程面单进行交运。

或者店铺出单后，由卖家在国外供应商采购，发货到海外仓，由海外仓进行换单。

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310025658/757102c87fc24001483a73ae6beb4af7.jpg)

** 二、操作步骤（仓库端）**

**第一步：设置直邮单计费模板**

**①设置计费项，选择单据类型为跨境直邮单。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121055/619f0c56fdf95f13a06546d03c7e0355.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121202/bbb2ab6586c1b3053b072506ec328875.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604122608/a935abf34bf4c693d4fce972b5c18cd2.png)

**②若需称重，则计费方式选择单据维度阶梯计费，并且计费方式选择包裹重量（若选其他，则按照卖家申报规格计费）。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604122628/9426121e3bfe07f290306ea7f169cf4b.png)

**（若需要设备测量商品体积按体积计费，则设置体积计费，或者设置体积重计费，数据采用逻辑为：通过设备测量优先试用测量体积，无测量体积选用商品实际规格，无实际规格选择申报规格。包裹重量的体积重计费方案也遵循这个逻辑）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604122649/451a09b1971651cc891d0b39ae795ffe.png)

**③创建计费模板并且分配模板给卖家。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121253/04ab00845dbfc86fa70e14cf9f7c793f.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310093422/b10179a4fec599616830bd49c214528f.jpg)

**第二步：扫描签收设置开启直邮单称重，可进行称重计费（若不需要使用称重可跳过这一步）**

**①开启直邮单签收入库流程**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121341/50d6fd1a8dfb8c5c6817c04519ba5bec.png)

**②设置直邮单称重，并且操作扫描签收。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121450/56ae4059db06887a15137f8aebfdb292.png)

**第三步：设置验货完成自动流转已发货（用于节省仓库端二次操作手动点击发货的时间）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121615/31e8124e73d3062a9e3274ee9741ed8a.png)

**第四步：设置扫描验货的模式，切换为直邮单换单的模式**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121652/e6b77401f84a2d3e3d2d5ad8aa1c9b38.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310112346/aa7a1c642702b54877a25674dad53268.jpg)

**第五步：扫描直邮标签打印面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310113009/f363a6ba646d3c9b2c574c23c34433c0.jpg)

**如果遇到面单打印卡纸情况，可以手动操作二次打印。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310113151/b0566351f6b4327e4c67f7c00a0d6564.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260310113246/731e8070f5c9711c47eb8db74e04113f.jpg)

**第六步：手动点击发货（若前面已设置验货成功自动发货，则这一步可省略）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526121754/bcf1abb3e296c7d486aa267fac349c9e.png)
