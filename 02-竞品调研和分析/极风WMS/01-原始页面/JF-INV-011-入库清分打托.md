---
sourceId: "JF-INV-011"
title: "入库清分打托"
url: "https://help.jfwms.com/zh_CN/doc-article/7106570525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 库存管理 > 入库清分打托"
category: "库存管理"
categoryId: 161
docId: 7106570525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T09:26:17.193Z"
---

# 入库清分打托

**一、定义**

客户预报一整柜货物送至海外仓，里面有多种SKU，卸货工人需要对SKU进行清分放到单独的托盘上。以往只能肉眼识别，导致效率低下。极风清分打托功能可以借用系统组托区智能清分方案，扫描后自动语音播报进行清分，提高准确度和效率，帮助仓库节省大量人工成本。

** 二、支持场景**

1、SKU种类均为单箱包装，且一SKU一托，不混托；

2、SKU种类均为单箱包装，一SKU一托，尾货支持混托；

3、SKU装箱明细均一致，相同装箱明细的箱唛放置到一托，不混托；

4、SKU装箱明细不一致，不同装箱明细的箱唛支持混托。

** 三、操作路径**

**第一步：仓库收到货后，待入库入库单进行预估打托，系统自动根据货物体积以及托盘规格预估所需托盘数量。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525065816/b4bd6fbc39d45cad4b8e8f6973511596.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604092427/75125c426557c9099277a30a5fac37bc.png)

**第二步，进行清分打托**

**1、入库单在待入库状态选择清分打托进入**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525065917/863cd0cefe0ef8367340619df4fb226c.png)

#### 
**2、可设置组托完成打印托盘唛，根据实际需要设置，若无需要，可设置不打印。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306092724/1cfe25f5694459b06b3fa05b27dd6b34.jpg)

#### 
**3、根据根据仓库组托区面积以及可放托盘数量，设置区域分布，以一共2行4列，一次可放8个托盘为例，则设置2行*4列，并将托盘按照托盘区域进行摆放。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306092819/018f8a684bd3cb55c9fd29e8df99f0a4.jpg)

#### 
**4、操作扫描清分（可按SKU清分以及箱唛清分，若入库单是按快递包裹到仓方式创建的，则是SKU清分，若入库单是按其他到仓方式创建的，则箱唛清分）。**

#### 
**第一种：SKU清分**

**扫描SKU条码，扫描后根据语音播报提示，把扫描商品放到对应的托盘上（可多个SKU，多个托盘一起清分）。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306093234/6756eb1b6eaa7aa2b49847bf4063d562.jpg)

**目前默认是一种SKU放一个托盘上，若一个托盘需要放多种SKU，可手动投放组托区。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306094542/0b56554bf4f93a2e6064c61c360cd448.jpg)

#### 
**第二种：箱唛清分**

**扫描箱唛号，根据语音提示将箱子放到对应的托盘上。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306094730/168fd124135cda1b7632ae7c843dbd49.jpg)

#### 
**5、实际判断托盘是否装满，装满后点击完成当前托盘组托，并且移出托盘，移入至待上架暂存区域。（这里的完成托盘组托实际是完成收货动作）**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306094831/8fd01fe1837a9d83ac6a504a688f3963.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306094841/c704eeffc11267f48c2b0d05b094ece9.jpg)

#### 
**6、打印托盘唛（如果前面设置了组托完成打印托盘唛，则完成组托后托盘唛会自动打印）。**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260306094951/364013ea5ce4288dd21ae4dd38ab9af7.jpg)

#### 
**7、若涉及多次收货，可在入库中继续清分打托。最终入库单收货数量已实际收到为准。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604092613/bfa150cd5aef7f08ba64f76d4d9995fd.png)
