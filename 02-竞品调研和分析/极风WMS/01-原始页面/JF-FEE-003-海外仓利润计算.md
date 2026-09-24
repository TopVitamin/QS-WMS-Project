---
sourceId: "JF-FEE-003"
title: "海外仓利润计算"
url: "https://help.jfwms.com/zh_CN/doc-article/7107760602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 费用 > 海外仓利润计算"
category: "费用"
categoryId: 176
docId: 7107760602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T06:14:37.367Z"
---

# 海外仓利润计算

**一、定义**

展示海外仓业务的总费用、总成本和总利润，并细分到仓租费、操作费、包材费、分销商品成本、物流费、工单、手工计费，如果涉及重新计费会自动计算利润。

极风WMS利润=海外仓应收费用—海外仓应付成本费。

即极风WMS利润=收入（海外仓仓租费+操作费+包材费+分销商品成本+物流费+工单+手工计费）—成本（海外仓仓租费+操作费+包材费+分销商品成本+物流费+工单+手工计费）。

适合：

1.代理仓推送主仓，代理仓设置成本，知晓自己仓库的利润和成本。

2.货盘分销商。分销商品设置成本，知晓货盘分销商给货主对账。

3.海外仓毛利计算。海外仓设置成本，可以查看仓库的毛利和成本。

** 二、操作路径**

**第一步：查看海外仓总利润、一件代发业务利润**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602060029/fa252827c4b4d677533b91576abd683c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602060317/39b48f1d7d8a00a3adcc504ae5c6c004.png)

**注意：利润计算列表页与业务费用数据一一对应，但要展示每个业务单据对应的成本和利润信息,物流费和包材费涉及到货币单位转换的费用，按计费前一天的汇率转换为客户结算货币展示（重新计费和重算成本也是按计费日前一天汇率）**

**利润=费用-成本**

**利润率=利润/费用*100%，保留两位小数,如果费用为0利润率展示“--”**

#### 
**第二步：海外仓收入、成本维护**

**1.仓租费、操作费利润维护**

**（1）仓租费、操作费收入维护（创建客户计费模版，给你的客户计费）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602060444/d52167ee43e9b8ae108d8189d405a87e.png)

**（2）仓租费、操作费成本维护（海外仓仓租费、操作费成本）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602060555/04f47880b610bb0c821d510f7b7b1da6.png)

**2.物流费利润维护**

**（1）物流收入维护（创建客户物流计费模版，给你的客户计费）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602060848/eb242c25b963d782f65e4b08d5420ef9.png)

**（2）物流成本维护（可以直接引用物流分区规则）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602061018/67646611010c055a0806a7faec5cc699.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251028064244/204ce6e100739e39fab3f576ef4299ff.jpg)

##### 
**3.包材费利润维护（收入、成本维护）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602061116/56fd77effe527ccfe933d266d5b29f17.png)

**4.分销商品利润维护**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602061234/841a505f5f0b69dec4bef4370ac397ff.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602061329/aa65bea429f92ed71847f75d3146c857.png)

**5.指定子账号可以编辑和查看仓库利润、成本**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602061432/1e65364c53a646ff7aea5e23261e8919.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251028064359/a839cfd0ae72597404511f03a87a614f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251028064406/8a283e41a9a94b4192f43bb4c7bff55d.jpg)
