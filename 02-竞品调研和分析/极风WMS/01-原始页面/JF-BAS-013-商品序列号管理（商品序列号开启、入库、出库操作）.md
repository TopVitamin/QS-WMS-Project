---
sourceId: "JF-BAS-013"
title: "商品序列号管理（商品序列号开启、入库、出库操作）"
url: "https://help.jfwms.com/zh_CN/doc-article/7106180521-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 商品序列号管理（商品序列号开启、入库、出库操作）"
category: "基础设置"
categoryId: 159
docId: 7106180521
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T09:11:11.174Z"
---

# 商品序列号管理（商品序列号开启、入库、出库操作）

**一、定义**

**SN码是Serial Number的缩写，也被称为商品序列号或机器码，是某个商品的唯一编号，**商品管理以唯一的商品序列码作为关键标识，管理商品的库存、入库、出库。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702132722/28b75bbd4cca931318645bffa9125ffe.jpg)

**商品序列码的意义：**

1.确保商品的真伪

一方面消费者可以收到商品通过品牌官方网站输入序列码查询产品是否为正品；另一方面海外仓和卖家，也可以通过序列码直接查询商品是否是自己的商品，避免其他卖家的商品和自己商品混淆。

2.记录商品的批次和时间（生产信息追溯）

产品如果按时间和批次划分，序列码是提供产品保质、保修和服务的重要依据。产品的序列码即可查询日期、批次等。

3.供应链库存管理：

实现商品以单个产品为单位的库存控制，减少损耗4.保修服务依据

通过序列号快速查询是否在保修期，提升售后服务效率5.数据分析决策

通过商品序列号的销售和出库，分析单品流通路径，识别滞销区域；统计返修率高的批次，改进生产工艺

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702132750/b5b0f8e1ea8dd60695041e24400d5676.jpg)

### 
 **二、操作路径**

#### 
首先商品序列号使用流程1.开启商品序列号管理2.商品序列号管理3.商品序列号入库4.商品序列号出库5.商品序列号退货

#### 
其次，具体操作

##### 
**1.海外仓指定卖家使用商品序列号管理**

**仓库开户时，可以针对客户选择要不要【卖家】使用【商品序列号管理】，选择给卖家使用的方式：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604090514/d38ee74ba98e143270109286c9d5f978.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604090754/d32078b8267cedd2b08cf5c528a1c150.png)

**出库采集序列号：仅仅出库管控，序列号在出库的时候扫描发货，在出库的层面记录序列号出库。但是不记录序列号与货架位的绑定关系。**

**                            这个适合食品和普通货值的产品卖家，操作流程简单一些。**

**出入库采集序列号：入库、出库管控，商品序列号不仅在入库的时候扫描采集，出库的时候也扫描采集。**

##### 
**2.卖家选择合适的商品使用序列号管理**

**海外仓给卖家客户开启商品序列号管理后，卖家在卖家端（OMS）商品管理可以创建商品或者编辑商品，选择这个商品是否要使用商品序列号管理**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521085521/b2ec537f54a55eaf413b59957ed2d9bf.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702064132/1abe7f9f59af754e757b3fae3184fb31.jpg)

##### 
**3.卖家创建商品序列号入库单**

**卖家在卖家端（OMS）创建入库单，商品列表这里选择序列号商品，也支持按箱创建序列号商品，也支持导入创建**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604091042/2261d62003f39f99f8ea29aa4e2208f1.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702070446/afa730c29358a09b5d8c2452c2b32bfb.jpg)

**温馨提示：已经创建的入库单，可以在入库单详情这里，看到序列号商品**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521085736/526741e42081090d7adcc1523c046088.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702072538/d83d5b30851288264c5581aa75a66f93.jpg)

##### 
**4.海外仓扫描签收、扫描收货、****扫描商品序列号上架入库**

**（1）扫描签收（签收完成进入待入库）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521085846/e0c94b1a431637224b35a672980b8c10.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702070837/b5e6d12dd5223ad4aaf482fe9353aca8.jpg)

**（2）海外仓扫码收货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521085954/4db3015b367fef3f49726e70516d5747.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702071544/0f9076bad126a7262e8f5de51b4311e4.jpg)

**（3）扫描上架或者点击上架（收货完成进入入库中）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521090110/dc213099444981c0ad21261ae7f52f67.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702071908/23bd8eb7d55c9bb16b7c92b245d10a94.jpg)

##### 
**4.海外仓扫码商品序列号出库**

**（1）商品序列号的订单生成拣货波次**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521090252/a86bdc588018994652e05643a542cd0e.png)

**简易打单的老板可以在待打单生成波次，**

**（2）打印拣货单拣货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521090500/5992283df6d24df77747931e45efc6fe.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521090657/20b272433f090ea248d45e8a60a127d2.png)

**（3）扫描包装，**

** **

**在包装时，扫描商品标签或者扫描序列号直接自动打印面单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521090834/680fb4f0203cbb8e75ea73b945ecb758.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702073647/8f4bd1d9100cc9b64257c0ad1a49db67.jpg)

**打包后完成交运后，商品序列号库存会自动扣减。**

##### 
**5.商品序列号退货**

**当有开启商品序列号的产品退货时，海外仓可以扫描退货入库单**

**扫描退货入库，就可以完成商品序列号重新上架入库**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521091010/db7e091c7f01010d9b5a6c348a0bdac5.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521091050/f51a19e6300131e3567a5a8ac760eee3.png)

**6、卖家查看商品序列号的状态**

**卖家在卖家端（OMS）商品——序列号管理这里，可以展示所有商品图片、sku、商品名称、商品序列号、所在仓库，**

**也展示了商品序列号的入库、出库、退货等状态和对应的单号及时间。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260521091149/a733473e4b6d70648e6d13a72e9e4b03.png)

**这里也可以添加商品序列号关联对应的入库单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250702075107/eb841911fd5b0918ac1d31e1b48d4352.jpg)

** **
