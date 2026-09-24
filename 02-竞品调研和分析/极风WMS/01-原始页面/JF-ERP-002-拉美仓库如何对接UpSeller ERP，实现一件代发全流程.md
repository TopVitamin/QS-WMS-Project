---
sourceId: "JF-ERP-002"
title: "拉美仓库如何对接UpSeller ERP，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108860603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 拉美仓库如何对接UpSeller ERP，实现一件代发全流程"
category: "ERP授权"
categoryId: 178
docId: 7108860603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-05T17:30:41.806Z"
---

# 拉美仓库如何对接UpSeller ERP，实现一件代发全流程

**一、授权店铺**

**第一步： 登录UpSeller （建议使用Chrome/Firefox/Edge最新版浏览器打开 **[**UpSeller**](https://www.upseller.com/zh-CN/)**）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092608/20b79dc29746288b113c89404b226fe6.jpg)

** **

#### 
**第二步： 选择授权店铺平台**

**（Shopee/ Mercado/ B2W/ Shein/ Falabella/ Magalu/ AliExpress）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092609/60b4a67c04fcac192dc2ef3c7e2747a2.jpg)

#### 
**第三步： 填写店铺昵称**

**注意：店铺名称仅在UpSeller中使用，可与您店铺实际名称不一致，便于区分和管理**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092610/48a741a2c4d8c01b65fe32c133aa5f1c.jpg)

#### 
**第四步：点击>授权 ，您将进入到平台授权页面进行登入和授权**

**详见：**[**Upseller帮助中心-授权店铺**](https://help.upseller.com/zh-CN/doc-article/246-%E7%AC%AC1%E6%AD%A5-%E5%A6%82%E4%BD%95%E5%9C%A8UpSeller%E6%8E%88%E6%9D%83%E5%BA%97%E9%93%BA)

### 
** 二、创建商品SKU**

**注意事项：SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） _ . - * + #**

#### 
**第一种创建方式：在线产品生成商品**

**定义**

**UpSeller支持从平台在线产品生成商品，并自动配对，方便快速建立商品列表，使用库存**

**操作步骤**

**第一步：前往【产品】模块>>Mercado在线产品（以下操作为Mercado在线产品为例)>>生成库存商品>>选择按勾选生成/按所有生成**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092610/4bda50848aa7bb62a098207e201baf60.jpg)

** **

**第二步：完善或修改商品相关信息，完善后，点击“生成”即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092611/ca88859ce60e42f622301b0661c3db8e.jpg)

** **

**第三步：生成商品成功后，可点击“前往商品列表”查看该商品**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092612/71d034637a63a436b75dce8e31f0e23d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092613/c1c24060b32b19e4b961c3d3db81ec31.jpg)

** **

#### 
**第二种创建方式：导入表格创建商品SKU**

**如果店铺卖家中心没有填写SKU，或填写的SKU与仓库中的不一致，可采用该方式创建**

[**（帮助视频）**](https://www.youtube.com/watch?v=f47pRdMJJrU&list=PLnNOir7AljPFpnJLFSZa-SVy9b-fGnUri&index=2)

**操作步骤**

**第一步：前往【产品】模块>>商品列表>>导入&导出**

**不要点创建组合SKU，三方仓不支持组合SKU**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092613/23c96080b3b8f45899a26af06db95584.jpg)

**第二步：选择导入单品，下载导入模板，填写完模板之后，上传文件，点击导入即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092614/98f04b9dc040823a41b6f74ea9dcadc5.jpg)

**注意：**

**1、导入商品一次只能导入5000条数据（如果表中数据超过5000条，超出部分不会被导入，在页面中会出现报错提示并生成导入失败文件，支持下载后再进行导入）**

**2、SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） _ . - * + #**

### 
** 三、开启库存功能**

**需要开启库存功能之后才能授权三方仓，开启库存功能的入口如下：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805165533/f84efc6cd2a5181d92aed09f5b269126.png)

** 四、授权三方仓**

**第一步：点击 “设置”>> 点击“服务授权”>> 选择 服务商>> 点击“授权”**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092616/61731791ac69195bdfa66155570b22ba.jpg)

** **

#### 
**第二步：完善授权信息>> 点击“授权”即可完成三方仓授权**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092616/4f4da29ffcec0d6e78b98579b657d451.jpg)

**注意：**

- **昵称：仅在UpSeller中使用，可与三方仓实际名称不一致，便于区分和管理**

- **邮箱：三方仓的注册邮箱，并不是UpSeller的注册邮箱**

- **Token：需要前往三方仓获取Token。如下图所示，如何在PACIFIC中获得Token**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603061328/e8635d9464a8c2b1ac682c6f75ef8b80.png)

** **

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603061419/f0a4266e37653e960eff3a1df2bad20a.png)

** 第三步：创建三方仓仓库**

**入口一：点击“设置”>>服务授权>>选择对应服务商 >>点击“添加仓库”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092618/bbc18f4c1d19eaa3289ebaf9ca449123.jpg)

** **

** **

**入口二：点击“库存”模块>>仓库管理>>仓库列表，点击“添加仓库”**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092619/631ee4425897fcd253c3253d935fc9c6.jpg)

** **

**完善相关信息并保存：**

- **服务商：仅展示已授权的服务商列表**

- **三方仓：展示服务商下的所有三方仓列表（若某三方仓已创建过仓库，则不显示在该列表）**

- **仓库名称：自定义名称。建议根据实际仓库名称命名，便于后期管理**

- **地址信息：非必填项。建议根据仓库实际情况进行填写，便于后期管理**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092620/a193f207f8051c7c3b63702d9b4e78e5.jpg)

** **

### 
** 五、推送商品SKU**

#### 
**第一步：点击“产品”模块>> 选择“商品管理-商品列表”>>三方仓商品，点击“推送商品到三方仓”**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805172615/ff174c5a6c384c4c176d1de1924fe07f.png)

** **

**第二步：选择需要推送的商品SKU > 点击“推送”即可**

**注意：商品推送清单展示的商品为UpSeller商品列表里面的所有商品SKU，已过滤之前已经推送成功/推送失败的商品SKU**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092621/d9d55596a743577b6f651c8170a99681.jpg)

** **

### 
** 第三步：查阅推送状态**

- **推送成功会进入“已推送”列表**

- **推送失败会进入“推送失败”列表，支持重新将商品推送到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092622/c0618f1619b26f0f3810181b292598dc.jpg)

** **

### 
** 四、商品SKU推送状态介绍**

**暂时无法在飞书文档外展示此内容**

** **

### 
** 六、推送采购单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092622/a0db4dc076753cf5a3e7a1a6bb0b78c8.jpg)

**第一步：点击“采购”模块>>采购管理-采购单，选择三方仓，点击“创建采购单”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092623/ecdbff84f5125769bda9af06ea3e2b3a.jpg)

**第二步：仓库选择三方仓仓库，完善其他采购信息，并点击【保存】/【保存&采购】**

** **

**【保存】指采购单进入“待采购”状态 【保存&采购】指采购单进入“在途中”状态 注意：如果希望了解采购单信息字段介绍，具体可查看以下文档>> **[**https://help.upseller.com/zh-CN/doc-article/1101**](https://help.upseller.com/zh-CN/doc-article/1101)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092624/26d54971dcd647b8220e55210bd69340.jpg)

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092624/50ba5614b31ca02e170b9f3da241f35a.jpg)

** **

**第三步：查阅推送状态**

- **推送中：正在将采购单推送给三方仓**

- **推送失败：已经操作将采购单推送三方仓但是推送失败（可以查看具体的失败原因）**

- **推送成功：已经成功将采购单推送给三方仓。采购单进入“在途中”状态，该状态不支持取消采购单！**

** **

**第四步：系统自动同步三方仓收货结果**

- **若三方仓按采购单上的商品数量，全部收货后，采购单会进入到“已完成”列表**

- **若三方仓按采购单上的商品数量，部分收货后，采购单会进入到“部分收货”列表**

** **

**系统对于三方仓采购支持以下操作：**

- **打印商品SKU标签，具体操作可查看>> **[**https://help.upseller.com/zh-CN/doc-article/677**](https://help.upseller.com/zh-CN/doc-article/677)

- **打印采购清单，具体操作如下图所示：**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092625/05a3fb3b7a95ef9a93f68be7e6275b63.jpg)

** **

** 七、同步三方仓库存**

**注意：这一步要在仓库初始化库存，或完成您的采购单之后才能执行**

**第一步：点击“库存”模块>>库存管理-库存清单>> 选择三方仓 >> 点击“同步三方仓库存”**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805170037/8c4f4a39853923ad0967a633715a4bac.png)

** **

** **

** **

### 
** 八、推送订单到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092629/b8aa876732e70042390d4e60ade51ec8.jpg)

**第一步：在【待发货】列表，点击“安排发货”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092630/98128c7348d3ce01472260b18e5e6f8d.jpg)

**第二步：在UpSeller安排订单后，订单将会自动推送三方仓。等待三方仓处理订单后，UpSeller自动同步订单最新状态**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805171336/282efe43235be68a0c4d32d10df3fcd6.png)

**注意：已经推送给三方仓的订单，支持手动撤回。但需注意，三方仓已发货的订单不支持撤回**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092630/b146bb59a2d99e718ff2615b504a51b3.jpg)

** **

**PS:如果仓库需要在面单上展示商品信息，请在Upseller配置自定义面单，配置方法：**[**如何设置自定义面单？**](https://help.upseller.com/zh-CN/doc-article/1242)
