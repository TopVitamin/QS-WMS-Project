---
sourceId: "JF-OMS-OUT-022"
title: "卖家端（OMS/店小秘ERP/赛狐ERP）线下物流渠道自动比价"
url: "https://help.jfwms.com/zh_CN/doc-article/7108410602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > 卖家端（OMS/店小秘ERP/赛狐ERP）线下物流渠道自动比价"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108410602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T11:49:38.572Z"
---

# 卖家端（OMS/店小秘ERP/赛狐ERP）线下物流渠道自动比价

**一、定义**

卖家使用极风海外仓系统发货，会根据系统的物流价格，结合商品的尺寸和重量，显示系统对接的物流价格，可以手动选择价格更低的物流下单，也可以自动选择最低的物流渠道。

卖家使用物流比价有三个方式1.店铺直接通过极风OMS处理订单，物流比价2.卖家使用店小秘ERP发货到极风海外仓，物流自动比价3.卖家使用赛狐ERP发货极风海外仓，物流自动比价

温馨提示：物流比价依据是根据极风WMS物流计费策略（按物流分区规则计费、按费率计费<物流对接有比价接口方可>）进行运费试算。

** 二、解决问题**

（1）海外仓WMS端设置物流价格，卖家无法看到物流价格，不能选择低价物流下单

（2）对于海外仓仓库端来说，如果卖家选择物流后发现价格贵，取消重新选择其他物流渠道的话，对仓库端来说取消物流面单是一个损失，这样可以减少卖家更换测试物流价格的行为。

** 三、操作路径**

**使用前提：使用线下物流比价，您使用的海外仓需设置物流计费策略，可以择按规则计费，也可以选择按费率计费（前提是物流对接时有比价接口）**

**第一种：卖家使用极风OMS处理订单，物流比价**

**方法一：手工订单线下比价（单个创建或者导入）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602114932/f39483d076ae69b9c68fa1999f3e394b.png)

**    **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250527022318/26ae11f7e7be08d991e7b35c864fe428.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250527052858/55545eed1552afc30e47dfb425e9cab5.jpg)

**特殊说明：**

**1.自动选择最低价物流时，订单成功提交到WMS时，会确认一个具体的物流，此时，在订单列表以及详情页，显示物流方式的位置，显示具体的物流名称，以及显示时自动选择，展示格式：物流名称（自动选择）**

**2.如果用操作了运费试算，且选择了一个物流渠道，则基本信息中的物流选择以用户手动选择的为准，即优先级为手动选择>自动选择**

**方法二：平台订单使用线下物流渠道发货，自动选择价格最低的物流渠道**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602114840/9ef321c644238fe6f95f200881b91ab4.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250527023233/54ed59cb8dfcfd0facb5357d2e27d532.jpg)

**注意：当平台订单按自动获取价格最低物流策略执行时，需要比较所有物流渠道，计算出价格最低的物流**

**          如果物流渠道费用为空，无法比价，需要在待处理订单展示报错信息“无法计算价格最低物流，请手动选择一个物流”，需要用户在待处理列表分配物流，**

#### 
**第二种：卖家使用店小秘ERP发货到极风海外仓，自动比价**

**在店小秘物流海外仓物流，开启自动选择最低价格渠道，卖家在处理订单时可以从极风WMS的API接口获取比价信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113022709/5704e296668c1f0d7cc655739ad8c975.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113022719/2c5fb9c2538b6b3d4bc4f7710ea2cc77.jpg)

**在店小秘处理订单时选择海外仓自动选择最低价格物流渠道（店小秘ERP具体使用，可以参照店小秘ERP处理订单流程，也可以直接联系店小秘ERP实施或者客服培训）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113062018/6338bc0a68786d822c4f26a53d1e6aeb.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113062123/1eb2f0c2e9b9e92466bca229bfcb1117.jpg)

#### 
**第三种：卖家使用赛狐ERP发货极风海外仓，物流自动比价**

**在极风海外仓授权赛狐ERP时，开启服务商API比价功能**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113060831/e4a3a492b90cd412fb67622b90287792.jpg)

**卖家在赛狐ERP处理订单时可以从极风WMS的API接口获取比价信息，选择最低价格物流渠道（赛狐ERP具体使用，可以参照赛狐ERP处理订单流程，也可以直接联系赛狐ERP实施或者客服培训）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113061102/8f6a5cecc41e133b432b430b80846495.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251113061320/0a7e322735116abebffd9797ce1aa81c.jpg)

#### 
**第四种 代理仓物流策略计算费用**

**如果在代理仓库设置了物流费用，则按代理仓库的物流策略计算费用**
