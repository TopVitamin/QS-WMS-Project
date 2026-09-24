---
sourceId: "JF-OUT-033"
title: "波次发货>多品混包打印面单（先拣后分）"
url: "https://help.jfwms.com/zh_CN/doc-article/7107540601-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 波次发货>多品混包打印面单（先拣后分）"
category: "出库"
categoryId: 170
docId: 7107540601
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-01T09:57:32.450Z"
---

# 波次发货>多品混包打印面单（先拣后分）

**一、适用场景**

将订单按某个条件进行分组，比如按同一个SKU/按数量/按同一个物流服务商等等，同一组的订单称为一个波次，将波次内的订单一起拣货，提高拣货的效率**。**

** 波次先拣货后分，需要二次分拣，****即先把多品混包波次里的包裹商品先进行拣货，然后再针对这个波次的商品进行分拣完成为一个个包裹对应有的商品；分拣结束之后再进行包装作业打印面单**

 **二、操作流程**

第一步设置多品混包拣货模式-先拣后分

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095339/a5d68ca29bc8d13f296fcfeb7e550e44.png)

#### 
第二步：波次设置、生成波次

[**https://help.jfwms.com/zh_CN/doc-article/1003000610-**](https://help.jfwms.com/zh_CN/doc-article/1003000610-)

#### 
第三步：二次分拣

当拣货人员根据波次完成分拣作业之后，按包裹（订单维度）进行二次分拣。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095426/7c779b9b5ce0488702ba4b3d5bb2ce7c.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610165124/0375d7d834aa58cf5aa22952164fde0e.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427081251/cf2625ebf2d6275e5ceb15b50a9204c7.jpg)

**进入分拣页面后，开始扫描商品标签进行分拣,**

**商品校验成功后显示该商品要投放的分拣框号，以及分拣框号中对应的包裹号**

#### 
第四步：扫描包装

在进入包装作业打印面单，可以使用扫描商品标签逐个打印面单，也可以扫描分拣框号逐个打印面单，或者批量打印面单。

**1.是否确认拣货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095537/34881c08a5d5961af56ab3177f099c2a.png)

 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095654/9660ff9d6d662947d7e7fece6cffecba.png)

**2.扫描包装**

待包装的波次拣货单，扫描包装

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095728/0bcd0a18b1f66f2410bb0c04a8a48679.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610164151/50f8fa20bccd68bd490cabd9148d0e1d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610164413/3906dbbb17f8831fc5cb2628e1273bb4.jpg)

###
