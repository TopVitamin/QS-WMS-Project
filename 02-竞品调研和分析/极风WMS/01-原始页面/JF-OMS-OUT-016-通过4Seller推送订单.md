---
sourceId: "JF-OMS-OUT-016"
title: "通过4Seller推送订单"
url: "https://help.jfwms.com/zh_CN/doc-article/7108340602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > 通过4Seller推送订单"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108340602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T11:26:51.227Z"
---

# 通过4Seller推送订单

**一、定义**

卖家通过4Seller推送订单到WMS海外仓系统。

 **二、操作流程**

**第一步：订单处理-待审核**

点击订单模块，进入待审核页面，可勾选订单后点击批量修改下方的仓库可批量修改发货仓库

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061348/7b90508294396ef24988193138f35e11.jpg)

**选择相应的极风WMS仓库然后点击保存即可将订单的发货仓库批量修改为极风WMS的仓库**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061349/095b1dcfa5c6e7c4f6428e1286a4391f.jpg)

**第二步：订单处理-待处理**

**当订单的SKU已匹配且可用库存不缺货时，订单即会自动流转到待处理流程中**

**1）单个操作**

**单个点击TikTok Shipping订单的购买订单即可进入购买面单的页面**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061350/b8c7a5e7928d7c0fa5459333da5c1b48.jpg)

**在订单的购买面单页面，可进行以下操作：**

**1.可更改发货仓库**

**注意：“平台发货”的订单，此处的仓库仅用于库存扣除，标签地址基于创建产品时选择的仓库地址**

**2.可填写包裹信息，包括包裹重量和尺寸**

**3.确认物流商为TIKTOK**

**4.可选择TIKTOK提供的物流计费服务**

**最后点击购买面单即可将订单推送至已选的极风WMS仓库并购买面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061351/9c3ffd95a2445a62b63c52f7591e8c77.jpg)

** 注意：在批量处理TikTok Shipping的订单时，需先在买家指定筛选栏中筛选出TikTok Shipping的订单**

**筛选订单**

**2)批量操作**

**更新包裹信息**

**可批量勾选订单，点击批量修改下的包裹，即可批量编辑包裹信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061351/feeab5cafaf8760cdb63cc7a95650fa5.jpg)

**  在编辑包裹信息页面，可填写包裹重量，选择相应的尺寸模板或手动输入尺寸，最后点击保存即可为已选订单批量修改包裹信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061351/714d6c23368721c22f79361a4a2ad431.jpg)

**更新物流信息**

**勾选订单后，点击批量修改下方的物流信息即可批量修改物流信息**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061352/7086bcdf9fad94b9d3842bf16a692575.jpg)

**在修改物流信息页面，确认物流商为TIKTOK，然后选择一个物流服务，最后点击保存即可为已选订单批量修改物流信息**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061353/d659403ee3a7510f0dc01876d3380ad4.jpg)

**更新完包裹和物流信息后可点击上方的购买面单，即可将已选订单推送至极风WMS并为其批量购买面单**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061353/efbaa26d71aae59eef5b5d59d2f8629f.jpg)

**3）快捷操作**

**点击包裹和物流栏下方的方框可以快捷输入包裹的重量和尺寸以及选择物流服务**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061354/f51ff65d2b97cd3cd95d7d001fe09ca1.jpg)

**第三步：订单处理-处理中-3PF仓库**

**已购买面单的订单即会流转到3PF仓库的处理中的流程中，订单会有三种状态：**

**①.失败：**

**买面单失败：即订单购买面单失败**

**推送3PF失败：即订单推送至极风WMS失败 发货失败：即将运单号推给订单所在平台发货时失败**

**注意：在失败流程中的订单可申请再次操作**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061354/c8bf4a4b1c4332cb370e47a1506a21e6.jpg)

**②处理中：**

**购买面单中：即正在为订单购买面单中**

**推单中：即正在推送订单到极风WMS**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061354/1d7a856763b18a69c19a892805c0e433.jpg)

** ****③三方仓处理中：面单购买成功但未返回运单号**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061356/fa10380ecd330d1bf12c956ed1fa25e4.jpg)

**当订单申请到运单号并且成功提交到订单所在平台后，订单会自动进入到Shipped状态，即发货成功。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428061358/28a8b6c864cef4229989e9317f091ca6.jpg)
