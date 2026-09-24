---
sourceId: "JF-OUT-023"
title: "订单处理流程（简易一件代发出库流程）"
url: "https://help.jfwms.com/zh_CN/doc-article/7107440601-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 订单处理流程（简易一件代发出库流程）"
category: "出库"
categoryId: 170
docId: 7107440601
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-28T17:07:22.905Z"
---

# 订单处理流程（简易一件代发出库流程）

## **一、定义**
仓库端订单处理流程，即当卖家客户使用ERP或者卖家端（OMS账号）处理订单或者创建手工订单、或者通过平台直接授权卖家端（OMS账号），自动把订单推送仓库WMS后，仓库收到指令，拣货打包，每个海外仓可根据仓库的使用场景来选择适合自己的拣货、打包方式，提高仓库效率。

**下面讲到三种简易订单处理流程：**

第一种：打印配货单+面单

第二种：面单加打sku第三种：打印拣货单

**简易拣货、打单、发货，相比波次拣货的优势：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250611132342/442393697bfd21ba8a9b8393fa40f175.jpg)

注意：这个帮助是介绍简易打单流程，适合日单量3000单内的卖家操作，**如果想将****将不同类型包裹**：单品/多品混包/同类包裹等分成不同的拣货任务，不同拣货任务**分配给不同拣货员**处理，需要用到波次拣货。

##  **二、操作教程：**

## 第一种：打印配货单+面单
设置好订单配货模版，订单打印配货单+面单，仓库工作人员根据配货单拣货，打包人员根据配货单拣货的商品直接包装，贴上面单。

此方式适合：sku比较复杂（如定制产品、手机壳、服装等，或者一个包装sku数量比较多、sku名字比较长等）。

### **1、设置配货单类型**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601074651/17e88fc629a52e1ed8883aa8fc302586.png)

### **2、打印面单+配货单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075112/5ee0133b7f77ba1abacc6c474c7961d4.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604123321/ca59be50e98301e117678efee574d617.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604123634/af402ddee09a89a564fc2eb743c0de72.png)

打印完成之后，面单打印状态会标记已打印。

### **3、扫描验货（如果怕拣货人员拣错货，可以扫描验货）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075154/007a18e4d0da316bffc95bf72bf58966.png)

扫描面单（运单号），验货。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250616022346/8ceb69b327ddd807474cbc326fda00ef.jpg)

【扫描设置】

①验货模式：常规验货

②扫描包材：不扫描包材

③打印面单：不打印面单

注意：进入扫描验货页面，需要打开极风打印插件，没有安装或者打开会弹层提示安装打印插件。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628170528/5d85896953bcc0d383571ec574342198.png)

### **5、发货或者扫描发货（可以在上一步扫描验货就发货，也可以手动点发货，也可以称重扫描发货）**
①.扫描验货就发货需要设置：

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075317/e9c5449da69796b208908b2cd0688cef.png)

②需要称重扫描发货的海外仓需要设置

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075431/0e83556956295bb5d1094f1d55ce2535.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080807/edaba62ff4a19bc4346fd2ce4dad373b.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610015041/eaf41ac37ce8d157c4d63f79aafe8e05.jpg)

 

## 第二种方式：直接面单加打SKU水印
在物流-面单水印设置好模版，根据物流渠道打印面单，面单自带sku和货架位，根据sku和货架位拣货，打包。

此方式适合：想节省纸张的海外仓，不想打印拣货单或者配货单。但是存在的问题是面单上有sku或者货架位水印，可能会让派送人员知道包裹里的商品，容易造成卖家商品被物流派送人员丢失。

### **1、设置面单加打SKU快速打单发货**
[https://help.jfwms.com/zh_CN/doc-article/1002120425-](https://help.jfwms.com/zh_CN/doc-article/1002120425-)

同时此方式不适合包裹sku比较多、sku名称比较长的订单，容易超出面单水印。（解决方式：打印面单时面单水印超出范围加打配货单

[https://help.jfwms.com/zh_CN/doc-article/1002910526-）](https://help.jfwms.com/zh_CN/doc-article/1002910526-）)

### **2、打印面单（带水印的面单），打印面单建议使用浏览器打印，插件打印容易受网络和设备影响效率。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080850/9dd93ff028ab158930aa90bf30068546.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604123749/4e2c0b6a599694f4a364ac1056e3ce15.png)

#### 如果需要更高效率，面单打印前可以先筛选包裹类型，再按SKU排序，打印面单会按照筛选以及排序打印。
①、筛选包裹类型，仓库先筛选处理单品单数，再处理单品多数和多品混包，从简单包裹优先处理，增加效率。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260612045305/81cf8dc06e1909aa99d4e00140fb06ae.png)

②、按SKU排序/SKU*数量排序/货架位排序/货架位*SKU排序，面单打印会以订单排序为准，以单品为例，按SKU排序可以实现，拿面单拣货的时候，先拣完一种SKU，再拣下一种SKU。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260612045605/49705af7eab8d9fee97c3b1f32937a74.png)

### **③、扫描验货（如果怕拣货人员拣错货，可以扫描验货）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080924/6ac9fff0d3efb2ab8096ca43dd91eb0d.png)

扫描面单（运单号），验货。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250616022346/8ceb69b327ddd807474cbc326fda00ef.jpg)

【扫描设置】

①验货模式：常规验货

②扫描包材：不扫描包材

③打印面单：不打印面单

注意：进入扫描验货页面，需要打开极风打印插件，没有安装或者打开会弹层提示安装打印插件。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628170528/5d85896953bcc0d383571ec574342198.png)

### **④发货或者扫描发货（可以在上一步扫描验货就发货，也可以手动点发货，也可以称重扫描发货）**
**扫描验货就发货需要设置：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601081040/bbb2ab6586c1b3053b072506ec328875.png)

**需要称重扫描发货的海外仓需要设置**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075431/0e83556956295bb5d1094f1d55ce2535.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080807/edaba62ff4a19bc4346fd2ce4dad373b.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610015041/eaf41ac37ce8d157c4d63f79aafe8e05.jpg)

## 第三种方式：打印拣货单+打印面单（拣货单默认A4纸）
设置好拣货单模版，然后仓库根据平台、下单时间、SKU、物流商等维度筛选订单，选中订单，打印拣货单，然后根据拣货单进行拣货，然后扫描验货进行验货或者扫描商品直接出面单。

### **1、设置拣货单模版**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601082453/1c5fd766d4d9c9009a117161b7f0f96f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604123843/5fbe8f7bd5525c3bc86fdc92d1293798.png)

### **2、打印拣货单（按照包裹进行拣货）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080850/9dd93ff028ab158930aa90bf30068546.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601082811/75125c426557c9099277a30a5fac37bc.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610015054/e47de8bf308b40415e5bd689160528b3.jpg)

### **3、扫描验货（如果怕拣货人员拣错货，可以扫描验货）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075154/007a18e4d0da316bffc95bf72bf58966.png)

扫描面单（运单号），验货。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250616022346/8ceb69b327ddd807474cbc326fda00ef.jpg)

【扫描设置】

①验货模式：常规验货

②扫描包材：不扫描包材

③打印面单：不打印面单

注意：进入扫描验货页面，需要打开极风打印插件，没有安装或者打开会弹层提示安装打印插件。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628170528/5d85896953bcc0d383571ec574342198.png)

### **4、发货或者扫描发货（可以在上一步扫描验货就发货，也可以手动点发货，也可以称重扫描发货）**
**扫描验货就发货需要设置：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075317/e9c5449da69796b208908b2cd0688cef.png)

**需要称重扫描发货的海外仓需要设置**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075431/0e83556956295bb5d1094f1d55ce2535.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080807/edaba62ff4a19bc4346fd2ce4dad373b.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250610015041/eaf41ac37ce8d157c4d63f79aafe8e05.jpg)
