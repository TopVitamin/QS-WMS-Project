---
sourceId: "JF-ERP-006"
title: "如何用WMS+ERP实现分销业务"
url: "https://help.jfwms.com/zh_CN/doc-article/7108900603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 如何用WMS+ERP实现分销业务"
category: "ERP授权"
categoryId: 178
docId: 7108900603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T12:05:34.237Z"
---

# 如何用WMS+ERP实现分销业务

### 一、分销模式介绍
分销模式与一件代发模式最大的区别在于：一件代发模式是每个卖家出售自己存放在三方仓仓库的货盘，拥有自己独立的库存清单；而分销是多个卖家共享一个货盘。

因此需要仓库在WMS先设置：①哪些商品SKU是支持分销的，②哪些客户（分销商）是允许获得分销商品信息和库存的

设置完成后，被授权的客户可以在ERP中获得分销商品的商品信息及库存数据，并将它们与店铺中的产品链接进行匹配，匹配后，当收到订单时，WMS将会为它锁定库存并安排发货，同时为分销商结算分销价格

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084922/ba6cf55117d026520f97195cac28bf82.jpg)

### 二、操作说明

## 第1步：将商品设置为支持分销

### 方式一：单个编辑
在编辑商品页面将商品设置为“支持分销”并完善分销价格和商品链接

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084923/43b726acce8df61f35ac1b835aff57fa.jpg)

### 方式二：通过导入表格进行批量编辑1、勾选您要设置的分销商品然后点击"导入设置分销商品"（如果当前筛选条件下的所有商品都需要被设置成分销，则不需要勾选商品）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604120432/9ecb5383e30041cdf3811867daf10a5a.png)

2、将要设置为分销商品的商品信息导出EXCEL表格

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604120450/682468d60f0316522a7da1890f97bd69.png)

 

3、编辑导出的商品，补充分销相关的信息

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084925/d6d69414efb1e45c1fb050471b077655.jpg)

4、导入修改后的文件，完成设置

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084926/6e19aebcb39f0289ea59530de7db6c54.jpg)

 

## 第2步：给客户授权分销1、前往“客户>已开户”选择要授权的客户，点击编辑

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604120521/6a9abe99c448f6d45b1960fc0e92e0d2.png)

2、选择“支持分销”

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084928/fcf5748ff5304e50aa55dcd851cbf119.jpg)

 

## 第3步：分销商在ERP中获取分销商品并关联到店铺的商品链接

### 东南亚分销：通过BigSeller来实现1、让客户在ERP中获取分销商品

**注意：分销商品需要在wms的库存清单中有库存，BigsellerERP才能获取到**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084928/dc04f6b4c2c3feeacdc940878a50b9ec.jpg)

2、客户获取分销商品后，将分销商品加入分销

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084929/f2a7a9b600c0877761b9a6f984135cc4.jpg)

3、客户在ERP中，将分销商品与店铺商品建立匹配关系，之后店铺收到订单号将会锁定分销商品的库存，安排订单后将会推送给WMS进行处理

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084930/93d59f0750c187e08663eb967d5b518b.jpg)

 

4、完成分销订单后，将会按照商品的分销价格，扣除分销商一笔分销费用

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084931/a5f9a4e5666fa55c3c831604bb2dc5bc.jpg)

 

### 欧美分销：通过4seller实现1、前往：库存-三方仓-找到已经完成授权的三方从仓库，进入到仓库清单后点击“3PF管理”

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084932/18e7fd3d2dadfa02e26b90a81e338746.jpg)

2、点击“分销商品”获取仓库允许他分销的商品清单

**注意：分销商品需要在wms的库存清单中有库存，BigsellerERP才能获取到**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084932/f599f781ed0dfe197562dadd68aecb56.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084933/9e5dcb87b22aea203861b3d8f0dc1383.jpg)

3、将需要分销的商品加入到“我的商品”

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084934/906eeff893c11023f47976fdcb7ed70e.jpg)

4、将分销的商品刊登或关联到店铺进行销售，销售的订单会直接推送到WMS系统由仓库进行处理

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084934/542aae026d5c6754f7be2ad90b7d39c4.jpg)

5、完成分销订单后，将会按照商品的分销价格，扣除分销商一笔分销费用

 

# 注意事项
*分销模式下，需要客户的结算货币与商品分销价格的货币一致

*分销模式目前在内测阶段，如需开通请联系客服

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827084935/ffaf7222b6fe0386405c52d0040fdf3a.jpg)
