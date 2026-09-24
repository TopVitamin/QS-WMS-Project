---
sourceId: "JF-INV-007"
title: "商品有效期管理"
url: "https://help.jfwms.com/zh_CN/doc-article/7109310608-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 库存管理 > 商品有效期管理"
category: "库存管理"
categoryId: 161
docId: 7109310608
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-22T08:53:34.217Z"
---

# 商品有效期管理

## 一、定义
效期管理主要用于管理有保质期要求的商品，例如食品、保健品、美妆、药品、耗材等。此类商品在WMS的出入库、库存管理中，不可只按SKU管库存，还需要按生产日期、过期日期、保质期、批次号等维度去管理。

**解决场景：**

**1、避免临期、过期商品误入库、误销售、误发货；**

**2、实现效期库存的先进先出；**

**3、库存流转追溯。**

## 二、操作流程

### 1、设置客户效期管理权限WMS端针对需要有效期管理的客户，开户或者编辑客户的时候，对客户OMS账号开启效期管理功能。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610081804/49bc4994a843df975b4bd3a60da5c722.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610081926/f304faa772d232dbbbe0dbdba2b151f0.png)

### 2、卖家设置效期商品

##### OMS卖家创建/编辑商品的时候，对需要效期管理的商品开启效期管理功能，并且设置效期信息：临期天数、临期规则、过期规则。
临期天数：维护临期天数，可以在库存页面查看以及搜索临期商品的具体效期。

临期规则：达到临期值的效期商品可以选择继续售卖或者禁止售卖；选择禁止售卖则仓库会在商品临期后自动下架。

过期规则：已过期的效期商品可以选择继续售卖或者禁止售卖；选择禁止售卖则仓库会在商品临期后自动下架。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610082159/514f2d525c90378b9627b5eefa9dccfd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610082244/a404dd49901478a44ad2f1adba934b60.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610082937/cd78768f80d2ff0d65345b4feaa8b60b.png)

### 3、仓库收货管理商品效期
卖家创建入库单后，仓库收货，填写收货数量、生产日期、保质期、到期时间，根据外箱信息的商品有效期进行填写，填写后注意观测商品效期状态，系统会提示商品是属于：正常/临期/过期。过期商品仓库一般和卖家沟通后不做收货上架处理。支持按SKU收货/按箱收货/打托收货。

#### ①按SKU收货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610090056/d987e60055c09e17dce0d135301aef00.png)

#### ②按箱收货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610090356/189ddff7828e16f04578c7b135f149fe.png)

#### ③打托收货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610090428/1c5fd766d4d9c9009a117161b7f0f96f.png)

#### ④PDA端操作

![企业微信截图_17810850982740.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610095325/8aad489041a8f1bdeff676d7b0e5c3de.png)

### 4、仓库效期商品上架
收货完成后，进行上架处理，操作流程和普通一件代发上架流程一致，支持按商品上架/按箱上架。若一箱内有多个效期商品，建议使用按商品上架，上架时不同效期的同一种SKU，分开不同库位上架。

#### ①按SKU上架

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610090902/d255ba054cafb541a04310d88b9df166.png)

#### ②按箱上架

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610090932/12e63e06681ac81f180b34884eb818f9.png)

#### ③PDA操作

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610095920/d25db78c7ad08f8b6338501c9f495e2b.png)

### 5、效期商品出库
效期商品出库不做二次扫描核验有效期，系统默认认靠近临期/到期时间的商品优先出库，系统会指向对应效期的商品库位拣货。（不同效期的同一种SKU，建议上架时放不同的库位）

### 6、效期商品退货处理流程
其他流程与常规扫描退货流程一致，增加填写商品生产日期、保质期、到期时间。填写时留意系统提示：正常/临期/过期。和卖家沟通决定是否上架。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610093204/d9c0bc3170736e7a04b7517ab5aa2c9f.png)

**PDA操作**

![企业微信截图_1781085706587.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610100157/ebb90762dff72351d012c1b7d3427fc3.png)

### 7、库存调整操作
库存调整增加时，需要添加新库存效期信息：数量、生产日期、有效期、过期时间；库存调整减少时，不需要填写效期信息，统按照效期先进先出自动调整。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610101138/943359f44dc87f6a1679c987280e8dc7.png)

**PDA操作：商品查询**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610101432/eb0a43fcc1177c0e5cedb709d7a46044.png)

### 8、效期商品库存转换
目前只有一件代发库存有效期管理，B2B库存、FBA库存没有做效期管理。所以当B2B库存和SKU库存转换成一件代发库存时，需要填写效期信息。

#### ①B2B库存库存转一件代发库存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610145711/0c58cdd5ab2dab6fb3f2a1d9709aec6b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610102153/db141600b3407442ea25b77ddfeadc9b.png)

#### ②FBA库存转一件代发库存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610150032/0e6d964993dbdcdc2063ea1821005286.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610103333/20a79239a276b46e228e7172591cae55.png)

#### ③B2B出库单按产品出库，本质上用的是一件代发库存，不需要做转换，出库时遵循按照效期先进先出。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610103541/7ffc74c3e1236d6c9835bf7fd3c3834e.png)

### 9、库存盘点操作
其效库存盘点和原库存盘点逻辑相似，盘盈时需要填写所增加库存的效期信息；盘亏时不需要填写效期信息，统按照效期先进先出自动调整。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610103957/868b2e87e087e2b771e433f5bcb506bf.png)

**PDA操作**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610104036/94331a4986349f956b0c1a628c87b6b8.png)

### 10、临期到期禁止售卖商品库存处理方式——自动生成移货建议
临期到期商品仓库禁止售卖后，无法作为可用库存出库，系统会自动生成移货建议，可一键创建移货单，从良品区移到不良品区货架位。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610104656/a1668c97fc1e66620f7ed051f1f5b578.png)

### 11、效期商品批次库存查看及调整

#### ①WMS查看

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610105559/c9a586710025d42901b34941630886fb.png)

#### ②OMS端查看

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610105912/6b8df7c76c2017e29c043f75bb765a50.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610105939/8cf1ce846cc75f8bf5f71216130152f9.png)

③WMS端调整商品库存效期。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610110222/ad84dcbce15c932dd23b735eca31c40c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610110257/ff853ea56f6c91dbb45a5abb2632165f.png)

#### 12、导入初始库存

##### 仓库已有一批货存在，SKU刚录入系统，需要管理效期的时候，可以用初始化库存导入的方式。表格增加了商品库存效期信息。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610110823/95bdfb5b6166bf36f24fdcd068fbc2cd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260610110534/8d5b47e0e61db7132ebb15f1912c0ce7.png)
