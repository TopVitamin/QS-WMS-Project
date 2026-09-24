---
sourceId: "JF-OMS-SKU-006"
title: "获取分销商品"
url: "https://help.jfwms.com/zh_CN/doc-article/7108020602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 商品 > 获取分销商品"
module: "OMS帮助文档(新)"
category: "商品"
categoryId: 181
docId: 7108020602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T08:28:07.574Z"
---

# 获取分销商品

### **一、**分销模式介绍
      分销模式与一件代发模式最大的区别在于：一件代发模式是每个卖家出售自己存放在三方仓仓库的货盘，拥有自己独立的库存清单；而分销是多个卖家共享一个货盘。

      因此需要海外仓在WMS先设置：①哪些商品SKU是支持分销的，②哪些客户（分销商）是允许获得分销商品信息和库存的

      设置完成后，被授权的客户可以在ERP中获得分销商品的商品信息及库存数据，并将它们与店铺中的产品链接进行匹配，匹配后，当收到订单时，WMS将会为它锁定库存并安排发货，同时为分销商结算分销价格

### **二、获取分销商品**
**（一）定义：**当海外仓有分销货盘时，仓库会对货盘商品设置分销，仓库设置产品分销权限后，卖家就可以在erp或者卖家端oms看到支持分销的商品、价格。​

**（二）操作路径：**分销商在ERP中获取分销商品并关联到店铺的商品链接，

这里以店小秘ERP、BigSeller、4SellerERP为例获取分销商品

**店小秘ERP分销别人海外仓商品**

**海外仓SKU与店小秘仓库中商品SKU配对，分2种情况**

第一种：若之前在【仓库—商品管理】中，有添加商品SKU，则直接将海外仓分销SKU与对应店小秘商品SKU配对即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428075648/e49bd6678d319912d6271c04f986bb4a.jpg)

第二种：若之前未在【仓库—商品管理】中添加商品，则需一键生成海外仓分销商品完成配对

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428075648/9644bee86af7ac480d095582ef39848f.jpg)

东南亚分销：通过BigSeller来实现**

1、让客户在ERP中获取分销商品

注意：分销商品需要在wms的库存清单中有库存，BigSellerERP才能获取到

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130432/8cb309a32c532ceb64074cc213746162.jpg)

2、客户获取分销商品后，将分销商品加入分销

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130433/8cc1a4ccb3cabf6fd7360b382381ad25.jpg)

3、客户在ERP中，将分销商品与店铺商品建立匹配关系，之后店铺收到订单号将会锁定分销商品的库存，安排订单后将会推送给WMS进行处理

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130433/a4f4989ade46df8d4a4523bf52a7fdc9.jpg)

 

4、完成分销订单后，将会按照商品的分销价格，扣除分销商一笔分销费用

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130434/dfcca6f3637e1df59987e43285bc5504.jpg)

** 欧美分销：通过4Seller实现**

1、前往：库存-三方仓-找到已经完成授权的三方从仓库，进入到仓库清单后点击“3PF管理”

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130434/250a25d1995b0113c3d3cd690c84b656.jpg)

2、点击“分销商品”获取仓库允许他分销的商品清单

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130435/856b7b6f872555b26240d7849bea8f81.jpg)

**注意：分销商品需要在wms的库存清单中有库存，ERP才能获取到**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130435/26cf02afcc8fbd8ce24b43e3a701dcc4.jpg)

3、将需要分销的商品加入到“我的商品”

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130436/e6967597b50f99bd10999a5beeada959.jpg)

4、将分销的商品刊登或关联到店铺进行销售，销售的订单会直接推送到WMS系统由仓库进行处理

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427130436/9f2762c9d7b0d0253cf843f0361fd380.jpg)

5、完成分销订单后，将会按照商品的分销价格，扣除分销商一笔分销费用
