---
sourceId: "JF-OMS-OUT-013"
title: "店小秘ERP处理订单自动推送订单"
url: "https://help.jfwms.com/zh_CN/doc-article/7108330602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > 店小秘ERP处理订单自动推送订单"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108330602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T11:24:37.185Z"
---

# 店小秘ERP处理订单自动推送订单

**一、定义**

海外仓物流授权店小秘ERP后，就可以直接快速在店小秘ERP一键处理多平台多店铺订单，直接获取物流商单号，并把物流商单号同步给海外仓和跨境电商平台，无需制单，减少人工，避免人工制单错误。

** 二、操作路径**

**第一步：海外仓物流授权店小秘**

登录店小秘ERP系统>物流>海外仓物流>选择海外仓>启用物流渠道>设置平台映射关系>确认

注意：不是所有海外仓和渠道都支持推送线上面单，需要和海外仓确认清楚后，再启用。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428055842/ef755fb10083292844bd8fe5810d25ff.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428055842/3ca360d571712bbcee98166e7fa73b3c.jpg)

**案例：****如果是temu线上面单，海外仓映射关系和仓配关系设置

**

![图片](https://wxalbum-10001658.picsh.myqcloud.com/wxalbum/0/20250428114648/e1add657a97a50ade1412fb2befc747d.png)

#### 
**第二步：****海外仓SKU与店小秘仓库中商品SKU配对，分2种情况**

**第一种：若之前在【仓库—商品管理】中，有添加商品SKU，则直接将海外仓SKU与对应商品SKU配对即可
**

![图片](https://wxalbum-10001658.picsh.myqcloud.com/wxalbum/0/20230309161233/842acbc11016af44079bb54a72535883.png)

**
第二种：若之前未在【仓库—商品管理】中添加商品，则需一键生成商品完成配对
**

![图片](https://wxalbum-10001658.picsh.myqcloud.com/wxalbum/0/20230309162106/17048182adc8f0ad99fd567db8947be5.png)

#### 
**第三步：处理订单推送海外仓**

**【订单—待审核/待处理—选择菜鸟海外仓渠道—点击配对，选择商品SKU—申请单号即可】

**

![图片](https://wxalbum-10001658.picsh.myqcloud.com/wxalbum/0/20230309201614/0df95635533dc4f377f39b2a0b037ffd.png)

**

****【由于海外仓系统不是实时返回单号的，订单会先进入运单号申请—海外仓库—申请失败状态， 可以等海外仓生成单号后，再勾选订单—点击重新获取运单号】**** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428055845/ca0abd8e14fd3aa610a155eb74a5f017.jpg)

**
**

#### 
**第四步：批量发货**

**【订单获取到单号，勾选订单—批量操作—批量发货，将运单号提交给平台，完成发货状态】**** **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428055845/912e5778669d592df1eace8305b9aa1f.jpg)
