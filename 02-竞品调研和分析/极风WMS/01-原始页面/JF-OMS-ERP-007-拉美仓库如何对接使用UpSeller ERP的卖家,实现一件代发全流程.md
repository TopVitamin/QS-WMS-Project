---
sourceId: "JF-OMS-ERP-007"
title: "拉美仓库如何对接使用UpSeller ERP的卖家,实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108490602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 拉美仓库如何对接使用UpSeller ERP的卖家,实现一件代发全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108490602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-05T17:29:02.544Z"
---

# 拉美仓库如何对接使用UpSeller ERP的卖家,实现一件代发全流程

**一、定义**

拉美本土卖家使用UpSeller授权店铺、处理订单、推送商品的全流程。

** 二、操作流程**

**第一步：授权店铺**

**step1：登录UpSeller （建议使用Chrome/Firefox/Edge最新版浏览器打开 **[**UpSeller**](https://www.upseller.com/zh-CN/)**）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090515/8ae958733855ae82c795d7193e12fe2f.jpg)

** **

**step2： 选择授权店铺平台**

**（Shopee/ Mercado/ B2W/ Shein/ Falabella/ Magalu/ AliExpress）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090516/e15f2162bb3c90471f18dd01da5dd1f0.jpg)

**step3： 填写店铺昵称**

**注意：店铺名称仅在UpSeller中使用，可与您店铺实际名称不一致，便于区分和管理**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090516/02b2c0ce06ab3dd7fa366182d5554117.jpg)

**step4：点击>授权 ，您将进入到平台授权页面进行登入和授权**

**详见：**[**Upseller帮助中心-授权店铺**](https://help.upseller.com/zh-CN/doc-article/246-%E7%AC%AC1%E6%AD%A5-%E5%A6%82%E4%BD%95%E5%9C%A8UpSeller%E6%8E%88%E6%9D%83%E5%BA%97%E9%93%BA)

#### 
**第二步：创建商品SKU**

**注意事项：SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） _ . - * + #**

**第一种创建方式：在线产品生成商品**

**定义**

**UpSeller支持从平台在线产品生成商品，并自动配对，方便快速建立商品列表，使用库存**

**操作步骤**

**第一步：前往【产品】模块>>Mercado在线产品（以下操作为Mercado在线产品为例)>>生成库存商品>>选择按勾选生成/按所有生成**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090517/110c66e12a085395af874fcda3507032.jpg)

** **

**第二步：完善或修改商品相关信息，完善后，点击“生成”即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090518/90cdadaa68f7e0f5150e0d56474a0464.jpg)

** **

**第三步：生成商品成功后，可点击“前往商品列表”查看该商品**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090518/7b926a1c4f0ad0fa21f91d24f8ffb75d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090519/02728c1ef7f8cb67227661b2a75f9d9b.jpg)

** **

**第二种创建方式：导入表格创建商品SKU**

**如果店铺卖家中心没有填写SKU，或填写的SKU与仓库中的不一致，可采用该方式创建**

**操作步骤**

**第一步：前往【产品】模块>>商品列表>>导入&导出**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090520/841ff8ada5f5efb1be290a2c829317fb.jpg)

**第二步：选择导入单品，下载导入模板，填写完模板之后，上传文件，点击导入即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090521/1ef2256b9ef9fb2e8aa103e973ef7663.jpg)

**注意：**

**1、导入商品一次只能导入5000条数据（如果表中数据超过5000条，超出部分不会被导入，在页面中会出现报错提示并生成导入失败文件，支持下载后再进行导入）**

**2、SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） _ . - * + #**

#### 
**第三步：开启upseller库存功能**

**需要开启库存功能之后才能授权三方仓，开启库存功能的入口如下：**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805165533/f84efc6cd2a5181d92aed09f5b269126.png)

**第四步：授权三方仓**

**step1：点击 “设置”>> 点击“服务授权”>> 选择 服务商>> 点击“授权”**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090522/95d68221a440a1c12126ac71b9f35b07.jpg)

** **

**step2：完善授权信息>> 点击“授权”即可完成三方仓授权**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090523/8faa9a6e99606010f8b4e5231c461329.jpg)

**注意：**

- **昵称：仅在UpSeller中使用，可与三方仓实际名称不一致，便于区分和管理**

- **邮箱：三方仓的注册邮箱，并不是UpSeller的注册邮箱**

- **Token：需要前往三方仓获取Token。如下图所示，如何在PACIFIC中获得Token**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030121/bf46b5900854dee7c712c6ab650d1b9d.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030145/cc4aa8114405b3b77383e42efdf144ad.png)

**step3：创建三方仓仓库**

**入口一：点击“设置”>>服务授权>>选择对应服务商 >>点击“添加仓库”**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090524/6a190062d4233fb9fbb676ed5de14f2b.jpg)

** **

** **

**入口二：点击“库存”模块>>仓库管理>>仓库列表，点击“添加仓库”**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090525/61d6e3fe4be054c0f31ac003f1cadf5f.jpg)

** **

**完善相关信息并保存：**

- **服务商：仅展示已授权的服务商列表**

- **三方仓：展示服务商下的所有三方仓列表（若某三方仓已创建过仓库，则不显示在该列表）**

- **仓库名称：自定义名称。建议根据实际仓库名称命名，便于后期管理**

- **地址信息：非必填项。建议根据仓库实际情况进行填写，便于后期管理**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090526/a2107376e4045db3a89781500e432197.jpg)

** **

#### 
**第五步：推送商品SKU**

**step1：点击“产品”模块>> 选择“商品管理-商品列表”>>三方仓商品，点击“推送商品到三方仓”**

** **

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805172615/ff174c5a6c384c4c176d1de1924fe07f.png)

**step2：选择需要推送的商品SKU > 点击“推送”即可**

**注意：商品推送清单展示的商品为UpSeller商品列表里面的所有商品SKU，已过滤之前已经推送成功/推送失败的商品SKU**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090527/3c12cc15ac30c91f3a8b873202d75886.jpg)

** **

**step3：查阅推送状态**

- **推送成功会进入“已推送”列表**

- **推送失败会进入“推送失败”列表，支持重新将商品推送到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090528/5d9282a26d0d2ba36613e87a5cecbc24.jpg)

** **

**step4：商品SKU推送状态介绍**

**表格 还在加载中，请等待加载完成后再尝试复制**

** **

#### 
**第六步：推送采购单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090529/03a16d75a9910783a6b1bcbc64fe1add.jpg)

**step1：点击“采购”模块>>采购管理-采购单，选择三方仓，点击“创建采购单”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090529/c0618f1619b26f0f3810181b292598dc.jpg)

**step2：仓库选择三方仓仓库，完善其他采购信息，并点击【保存】/【保存&采购】**

** **

**【保存】指采购单进入“待采购”状态 【保存&采购】指采购单进入“在途中”状态 注意：如果希望了解采购单信息字段介绍，具体可查看以下文档>> **[**https://help.upseller.com/zh-CN/doc-article/1101**](https://help.upseller.com/zh-CN/doc-article/1101)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090530/c1ab0cf1de71be87045e777312256703.jpg)

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090530/09f6677d779b1290a0fb194576077ec1.jpg)

** **

**step3：查阅推送状态**

- **推送中：正在将采购单推送给三方仓**

- **推送失败：已经操作将采购单推送三方仓但是推送失败（可以查看具体的失败原因）**

- **推送成功：已经成功将采购单推送给三方仓。采购单进入“在途中”状态，该状态不支持取消采购单！**

** **

**step4：系统自动同步三方仓收货结果**

- **若三方仓按采购单上的商品数量，全部收货后，采购单会进入到“已完成”列表**

- **若三方仓按采购单上的商品数量，部分收货后，采购单会进入到“部分收货”列表**

** **

**系统对于三方仓采购支持以下操作：**

- **打印商品SKU标签，具体操作可查看>> **[**https://help.upseller.com/zh-CN/doc-article/677**](https://help.upseller.com/zh-CN/doc-article/677)

- **打印采购清单，具体操作如下图所示：**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090531/927b2c13fe6dd02e01885cb7304b0454.jpg)

** **

** **

#### 
**第七步：同步三方仓库存**

**注意：这一步要在仓库初始化库存，或完成您的采购单之后才能执行**

** **

**step1：点击“库存”模块>>库存管理-库存清单>> 选择三方仓 >> 点击“同步三方仓库存”**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805170037/8c4f4a39853923ad0967a633715a4bac.png)

**step2：检查库存数据（UpSeller现有库存、三方仓现有库存、库存差值）>> 点击“更新”**

**注意：三方仓现有库存已剔除不良品库存**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090532/1f353cf924d0a1767da5cf3fb172c653.jpg)

** **

** **

**系统对于三方仓商品支持以下操作：**

- **打印商品SKU标签，具体操作可查看>> **[**https://help.upseller.com/zh-CN/doc-article/677**](https://help.upseller.com/zh-CN/doc-article/677)

- **设置商品低库存预警，具体操作可查看>> **[**https://help.upseller.com/zh-CN/doc-article/1032**](https://help.upseller.com/zh-CN/doc-article/1032)

- **商品导出，具体操作如下图所示：**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090533/f9d6d05841b9cece36a10bf100ee2a97.jpg)

** **

** **

** **

** **

** **

#### 
**第八步：推送订单到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090534/df24bdd74e23ad369603632f08c47e63.jpg)

**step1：在【待发货】列表，点击“安排发货”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090534/e8f074782cdf1337cb88ee0214003a79.jpg)

**step2：在UpSeller安排订单后，订单将会自动推送三方仓。等待三方仓处理订单后，UpSeller自动同步订单最新状态**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260805171336/282efe43235be68a0c4d32d10df3fcd6.png)

**注意：已经推送给三方仓的订单，支持手动撤回。但需注意，三方仓已发货的订单不支持撤回**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090535/650c26fdd23213bde3c99d3f01df918b.jpg)

** **

**PS:如果仓库需要在面单上展示商品信息，请在UpSeller配置自定义面单，配置方法：**[**如何设置自定义面单？**](https://help.upseller.com/zh-CN/doc-article/1242)
