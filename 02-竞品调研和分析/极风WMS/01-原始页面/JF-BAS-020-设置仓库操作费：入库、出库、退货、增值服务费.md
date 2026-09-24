---
sourceId: "JF-BAS-020"
title: "设置仓库操作费：入库、出库、退货、增值服务费"
url: "https://help.jfwms.com/zh_CN/doc-article/7106260521-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 设置仓库操作费：入库、出库、退货、增值服务费"
category: "基础设置"
categoryId: 159
docId: 7106260521
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-05-21T11:26:55.370Z"
---

# 设置仓库操作费：入库、出库、退货、增值服务费

**一、定义**

**卖家将商品寄给仓库后，仓库进行收货、验货、上架、打单、包装、发货、退货、换标、特殊增值服务等费用**。

可根据商品数量、商品重量、商品体积、订单单据等计费。

如果是自己仓库发货，也可以设置费用为0。

### 
 **二、操作路径**

#### 
第一步：**创建费用**

费用>计费项>操作费>入库、出库、退货、增值服务>创建费用

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521112504/ec9979f57a47594a1ae2a145bbda5d69.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521112629/252909de7cf75782de11089fb65b4c27.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425072903/f94ebfd729f0bdc1c4a525e836459205.jpg)

**注意：**

**按单收费**

按单计费只需要简单的为所选的单据类型设置单价，如果客户应用了该策略，当该类型的单据完成时，按照设置的单价收费

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425072903/aeace1199bad0bace501e1e186d37d13.jpg)

**阶梯计费**

1、阶梯计费需要先选择阶梯单位，以单据内的SKU种类数、商品数量、商品体积或商品重量为单位分阶梯计费；

如果选择了等多个阶梯，还需要设置，当一个单据命中了两个阶梯范围时，最终如何取值

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425072903/b120febca959fcd39de4809046db635b.jpg)

2、填写阶梯范围，以及在阶梯范围内，是按什么维度收费的（可选：SKU种类数、商品数量、整单收费、商品体积或商品重量）

如果计费维度选择了“SKU种类数”、“商品数量”、“商品体积”或“商品重量”时，可以设置单位的数量及单价，即每多少种类/数量/体积/种类收费多少元

可另外设置基础费用、减免费用、最低收费和最高收费

基础费用：每个单据按单价*单位数量算出费用后，需要额外再加一个固定费用

减免费用：每个单据按单价*单位数量算出费用后，需要减去一个固定费用

最低收费：每个单据按单价*单位数量算出费用后与最低收费做对比，若低于最低收费，则应该按最低收费计费

最高收费：每个单据按单价*单位数量算出费用后与最高收费做对比，若高于最低收费，则应该按最高收费计费

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425072903/c9d0c04481eac77f12a5a63fa369a872.jpg)

#### 
第二步:费用试算

     设置策略后，可直接在页面模拟单据信息进行费用试算

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827103228/bc79f496a33d75f2e72fbd774ef31253.jpg)

填写模拟数据后点击“试算”即可回显试算结果

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827103229/1c29df6254ed17231510c005dcace7e1.jpg)
