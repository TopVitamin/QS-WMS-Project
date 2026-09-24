---
sourceId: "JF-OMS-ERP-013"
title: "易仓ERP授权极风WMS、配对商品、处理订单、备货海外仓"
url: "https://help.jfwms.com/zh_CN/doc-article/7108550602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 易仓ERP授权极风WMS、配对商品、处理订单、备货海外仓"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108550602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T02:38:14.472Z"
---

# 易仓ERP授权极风WMS、配对商品、处理订单、备货海外仓

**一、定义**

如果卖家客户使用易仓ERP对接极风wms，批量管理多平台多店铺，首先需要联系海外仓确认，海外仓在易仓ERP的名字。

** 二、操作路径**

**第一步：获取极风OMS授权信息**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605023730/45a6bb25c09e510cf0d60889430f8507.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605023759/bf46b5900854dee7c712c6ab650d1b9d.png)

**第二步：在易仓ERP创建三方海外仓**

**易仓ERP仓储—仓库管理（NEW）—查询服务商仓库列**

**获取服务商仓库列表，选择对应合作的服务商、填写三方海外仓的授权信息并选择具体的海外仓即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065756/e84ecc53ea21bc874ec1cd8216dee41f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065748/c213223b29e8f12a46324be64d148006.jpg)

**勾选具体的海外仓，若该海外仓有多个仓库，则需要勾选具体合作的海外仓名称，勾选后，点击「确定」即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065741/abe589f9eeaacd30d5cabbe4e81ee65c.jpg)

**更多的海外仓基本信息，您可点击「编辑」进行完善，避免影响到销售订单预报到海外仓的流程处理**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065729/c51348ccf134b2a8411e72283fe87a81.jpg)

#### 
**第三步：设置运输方式**

**设置运输方式，将用于后续的订单推送预报获取跟踪号和头程发货**

**在易仓ERP—物流—物流管理—运输方式管理**

**Step1：筛选合作的服务商，点击启用**

**Step2：启用该服务商下的渠道**

**Step3：完善渠道信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065711/358c9f34249feb69f9c749177723e4dd.jpg)

**然后在易仓设置物流平台映射关系，维护发货渠道与平台的映射，便于后续订单标发。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065656/35ef08f8a8d456ad384c41272c62b2af.jpg)

#### 
**第四步：海外仓的商品与易仓ERP配对**

**海外仓发货，需要ERP告诉海外仓，订单配对ERP的这个商品是仓库的哪个商品，需要把ERP的SKU与海外仓SKU配对，以保证后续的头程/库存同步/订单推送数据不会出错。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065644/a4935115962d3991716210ae98a471c9.jpg)

**具体操作：在易仓ERP—产品—三方仓编码绑定**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065636/62e7f12cb0c81ba1e9fbeba76ccb6c68.jpg)

#### 
**第五步：易仓ERP库存初始化**

**系统切换时，通过导入库存，实现库存数据的初始化，直接增加库存**

**Step1：可在海外仓后台导出库存数据**

**Step2：在系统中导出模板**

**然后在易仓ERP—仓储—库存初始化—下载易仓ERP库存模版—填写好数据后到入文件**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065618/6f493a501aa3b0b546c4095a009b7ba7.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065612/e3c3e8c3fc725cdc2f559e7a187bc55f.jpg)

#### 
**第六步：海外仓库存同步易仓ERP**

**在易仓ERP—仓储—库存快照配置—库存同步配置—处理差异数据**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065602/df1b8bbd69ccf5053754147930257593.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065555/50cd077d710ef8c62cc2a9c79dd51f9c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065546/1a037cd3b0fd2129612700f8eaf03e5a.jpg)

#### 
**第七步：易仓ERP处理订单，选物流和仓库，申请运单号**

**ERP将销售订单推送到海外仓进行发货，待海外仓发货后，可实现获取物流跟踪号和发货状态，实现自动标发的动作**

**1、先开启标发服务**

**在易仓ERP—订单—订单管理，开启标发服务，后面处理订单，会将订单物流追踪号同步平台**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065514/a6bf1eb5928ef1657984bf6f6acc9b23.jpg)

**2、ERP处理订单**

**在易仓ERP—订单—订单管理**

**Step1：订单审核**

**Step2：系统自动推送订单到三方海外仓**

**Step3：系统自动获取三方仓发货状态和跟踪号，并自动标发**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065500/c6000a3b6fce424a3870057685e43a2c.jpg)

#### 
**第八步：易仓ERP备货到海外仓**

**针对有对接三方海外仓，系统支持创建海外仓头程发货单，推送到海外仓，建立海外仓的入库单，从而实现的备货的动作 针对没有对接的三方海外仓，需在系统走完发货流程后，再到三方仓后台创建入库单**

**在易仓ERP—头程—海外仓发货管理—创建头程发货，选择海外仓服务商，（若是没有对接海外仓，请选择其他），选择发货产品，填写数量**

**在操作建立入库单时需要选择海外仓的对应入库信息（每个海外仓需要维护的内容不一样，具体内容以界面上显示的为准），建立入库单后 ，订单推送到三方仓，在三方仓后台创建一张入库单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251204065449/cf5076bdd6fbbbde35a47a1c2e43695e.jpg)
