---
sourceId: "JF-LOG-001"
title: "备货中转出库单支持子母件发货（仅线下物流）"
url: "https://help.jfwms.com/zh_CN/doc-article/7114810825-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 备货中转出库单支持子母件发货（仅线下物流）"
category: "物流渠道管理"
categoryId: 163
docId: 7114810825
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-25T11:06:45.243Z"
---

# 备货中转出库单支持子母件发货（仅线下物流）

**需求背景； 为了满足卖家备货中转出库时，同一个出库单可以分不同的包裹运出的需求，系统现在支持物流渠道可以选择预报方式是一票多件了，即子母件。（特殊说明下，当前支持子母件的物流商是Fedex，其他的物流渠道还在陆续更新中）详细操作步骤如下：**

## **第一，正常授权Fedex的物流账号，并且在物流商渠道管理里面设置好预报方式，最后，正常给客户开好物流产品即可。这样卖家就可以在自己的OMS系统里面 正常使用了**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825080541_91754c2339cd480b81139aa21cb0be24.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825080631_4262f45eed21487ab426411ec82f0744.png)

**授权完毕Fedex后，再去设置物流商渠道管理，有些物流商的物流渠道是在授权物流商的时候系统会自动同步过来的，但是有的物流渠道是需要手动添加的。根据情况灵活操作即可**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825081208_0f993d91bda940a3a077a698636800aa.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825081343_fbbf01a38a644161af3c70e71995ab50.png)

**备注：1.一票一件模式适用于一件代发小包裹，一个订单一个包裹；一票多件模式适用于备货转运，一个订单内多个包裹。**

**           2.一票多件模式下物流计费默认按照包裹维度计费，一个订单有多个包裹则有多个物流费，业务费用内运费合并展示**

**物流商渠道设置好后，就可以设置物流产品给对应的客户使用了**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825082715_198c132e0b3645ad8e1ffd3203d75cf5.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825083008_797c4f71f1a5461fbbf9d72a985cff10.png)

## **第二，仓库在WMS按照上述步骤设置好后，现在卖家在OMS创建备货中转出库时就可以使用预报方式是：一票多件的物流产品了**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825083523_e7b10dc685ed4571ae580d5d67a20831.png)

### **1.出库类型是 按箱出库的情况下，(按箱出库的话，最小单位就是箱)操作如下:**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825085522_05c9aecc06ac41758b8a02f291263d84.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825103628_138510ae96ef43ea9155155506906c4c.png)

**仓库WMS收到卖家按箱出库出库单后，在出库-备货中转出库环节-待拣货（有时也会在获取运单号环节，要看下获取运单号的状态，是待获取还是获取中，还是获取失败），接下来按照备货中转出库的流程正常操作出库即可。（关于备货中转出库的流程之前有详细的文档，在此不再赘述）**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825092224_227cd52d226c4fed93c7edd6f0a68792.png)

### **2.出库类型是 按产品出库的情况下，操作如下:**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825105014_95e863f5885b465584d0c61031e3f131.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825105830_cb797d8c3f10424ba197c6a2dc417cd1.png)

**仓库WMS收到卖家按产品出库的出库单后，在出库-备货中转出库环节-待拣货（有时也会在获取运单号环节，要看下获取运单号的状态，是待获取还是获取中，还是获取失败），接下来按照备货中转出库的流程正常操作出库即可。（关于备货中转出库的流程之前有详细的文档，在此不再赘述）**

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825092224_227cd52d226c4fed93c7edd6f0a68792.png)
