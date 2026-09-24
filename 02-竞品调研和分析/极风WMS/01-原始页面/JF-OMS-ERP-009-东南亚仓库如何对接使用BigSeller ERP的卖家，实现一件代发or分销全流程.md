---
sourceId: "JF-OMS-ERP-009"
title: "东南亚仓库如何对接使用BigSeller ERP的卖家，实现一件代发or分销全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108510602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 东南亚仓库如何对接使用BigSeller ERP的卖家，实现一件代发or分销全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108510602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T02:59:41.102Z"
---

# 东南亚仓库如何对接使用BigSeller ERP的卖家，实现一件代发or分销全流程

**一、定义**

卖家使用BigSellerERP授权店铺，推送产品，处理订单全流程

** 二、操作流程**

**第一步：授权店铺**

**step1：登录BigSeller > 进入首页**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090553/6c442d5f7a52edaec1c4aa6b7995fdbb.jpg)

**step2：点击授权引导选择平台（下面用Shopee举例） 填写店铺昵称 > 点击授权店铺，您将进入到平台授权页面**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090554/0bc23fd1e015d1dc6540c84a8f1210dd.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090554/bbc18f4c1d19eaa3289ebaf9ca449123.jpg)

**step3：选择站点 > 输入Shopee账号和密码 > 点击Login**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090555/14d12e3b62c66d7d7c5b643b280b7386.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090556/52166c189f53335882edc7aaec91c5b6.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090557/c651b672e8b5154caa91ef021b8817f7.jpg)

**step4：编辑并确认BS店铺昵称**

**为了保证BS店铺昵称的唯一性，无法使用与您当前BigSeller账号下已存在的BS店铺昵称相同的昵称进行填写；如果您不确定昵称是否被使用，可以到设置>授权中心>店铺授权页面进行搜索。**

#### 
**第二步：BigSeller创建商品SKU**

**第一种创建方式：SKU匹配关系页面，根据店铺SKU一键生成**

**注意事项：**

**1、如店铺SKU与已存在的商品SKU一致时，将创建匹配关系；如不一致时，将创建新的商品SKU并匹配**

**2、SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） \_ . - \* + #**

**操作步骤：【匹配商品SKU > 生成商品SKU】**

**进入SKU匹配关系 > 点击未匹配 > 点击匹配商品SKU \> 点生成商品SKU**

**如店铺SKU与已存在的商品SKU一致时，将创建匹配关系；如不一致时，将创建新的商品SKU并匹配**

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2023/1699091894379700.png)

## 

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2023/1699091906275138.png)

**第二种创建方式：商品SKU列表，手动创建**

**第一步：点击新增商品SKU**

**点击库存 > 商品SKU > 点+新增商品SKU \> 选择添加单个SKU**

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2024/1720598080995223.png)

**第二步：填写商品SKU信息**

**添加基本信息 >  设置店铺SKU匹配关系 > 填写重量信息 > 选择仓库，输入库存初始值**

**注意：同一个商品SKU下，SKU编号和GITN可以相同**

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2023/1699068855953561.png)

## 

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2023/1699068877175118.png)

**第三种创建方式：导入表格批量创建**

**如果您在使用BigSeller之前是用表格管理库存的，推荐您使用这种方法。**

**第一步：点击库存> 点击导入＆导* \> 点击导入商品SKU \> 点击创建商品SKU**

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2024/1724152993486147.png)

**第二步：下载表格模板 > 按要求编辑表格 > 返回BigSeller商品SKU页面 > 上传文件 \> 点击确定，完成创建  **

![图片](https://bigseller-1251220924.cos.accelerate.myqcloud.com/static/faq/2023/1699077961153856.png)

**注意！如在表格内填写了仓库；导入创建商品SKU时，会自动将该商品SKU添加到所填仓库的库存清单**

#### 
**第三步：开启库存功能**

**需要开启库存功能之后才能授权三方仓，开启库存功能的入口如下：**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090608/5cc5dce93d47709618b9cebc4274308a.jpg)

#### 
**第四步：授权三方仓**

**step1：点击*授权中心点击第三方仓库授权点*+授权 输入授权信息 > 点击授权完成三方仓授权**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090609/69011c7ababf27abc9fa45269ddc791f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090609/9a858f9be7df3fc4f241da33f908a7af.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090610/3dccc015f289f18f26387d1fde0b86dc.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605025932/6c4e4795605d9fbf3741662e2c51158b.png)

**step2：创建三方仓仓库**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090611/31394390dd32dca080901822651292d6.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090612/08c0a4392c37c932d26035088f7be593.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090612/60ffeb77852aa3a5bd19553e5e3ef060.jpg)

#### 
**第五步：bigseller推送商品SKU到极风海外仓**

**step1：进入商品SKU页面（库存>商品SKU） > 点击**推送三方仓** > 选择需要推送的商品SKU > 点击**推送三方仓****

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090613/e932ecf1bce4ac4d4f06c6bbcb1e960c.jpg)

**step2:选择商品或将全部商品推送到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090614/5ed7ee60846c8c1ea70ccb7fcb6233ad.jpg)

#### 
**第六步：推送采购单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090614/dcfd144f698571cc5d673d2640be7be0.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090615/2cbcd77d8243b255f0071bc6f47a1a88.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090616/f9a746f343725bd1bc5463c220c2aad3.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090616/51c6baab07444a6e280cc7f5cb673009.jpg)

#### 
**第七步：同步三方仓库存**

**注意：这一步要在仓库初始化库存，或完成您的采购单之后才能执行**

**进入库存清单（库存>仓库管理库存清单） > 选择三方仓 > 勾选想要同步的商品SKU > 点击**同步三方仓库存** 点击**同步所选商品库存** 检查库存数据 > 确定更新**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090617/9280385c3f407def8e1468d04336edb8.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090618/bc053e66e73d6b5ed888e3c1bb13510a.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090618/80f7fb8aa1bb18f7d5db3a00cb216b2b.jpg)

#### 
**第八步：设置自定义面单**

**step1：前往：设置>打印设置>面单打印>添加模板**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090619/7e8a8df88b9a6bf72a74ea753bbde357.jpg)

**step2： 按照下图所示设置自定义面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090620/7a8028fd9e4a403753130642d652c653.jpg)

#### 
**第九步：推送订单到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090621/6f7dcb30a809556db8e5b82b948c8247.jpg)

**step1：进入订单 > 【待处理】列表，点击安排订单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090622/1b887bcbfd2893ecd4a7f3e528c8c56f.jpg)

**step2：在BigSeller安排订单后，订单将会自动推送三方仓。等待三方仓处理订单后，BigSeller自动同步订单最新状态。**
