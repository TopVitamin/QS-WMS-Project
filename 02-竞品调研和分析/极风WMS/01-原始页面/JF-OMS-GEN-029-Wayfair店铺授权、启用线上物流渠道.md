---
sourceId: "JF-OMS-GEN-029"
title: "Wayfair店铺授权、启用线上物流渠道"
url: "https://help.jfwms.com/zh_CN/doc-article/7108570602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > Wayfair店铺授权、启用线上物流渠道"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7108570602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-14T02:55:55.105Z"
---

# Wayfair店铺授权、启用线上物流渠道

## **一、定义**
Wayfair是美国知名家居类跨境电商平台，卖家可以使用极风OMS管理多个Wayfair店铺订单，完全免费，不限店铺数量，不限单量。

授权时需要注意：

1、Wayfair店铺存在新的待确认订单（后台状态为：New、Processing）才允许授权2、授权完成后，只能同步获取到生产权限的日期之后新销售的订单，平台政策要求只能同步未确认的订单，已确认的订单无法同步。

3、支持查看和处理Wayfair店铺自发货订单，官方仓订单不需要处理和查看。

## ** 二、操作路径**

### **1、前往Wayfair后台获取授权信息**
**① 店铺的：Supplier ID**

**② Sandbox沙盒环境的：Sandbox Client ID、Sandbox Client Secret**

**③ Production生产环境的：Client ID、Client Secret**

### **2、进入Wayfair后台：**
**https://partners.wayfair.com/developer/applications  **

**【打开Account Management—My Account ，显示如下图页面，找到Supplier ID】**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223075926/06f4f4e66db5d00ab12fc3f08c748ade.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223075930/2b5c744a5561e1efc333bcfc8f69f275.jpg)

#### **①打开Developer—Applications**
**新版后台：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080000/c0447b1e02f0cbb52ccd83f3c6b52fc1.jpg)

**旧版后台：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080023/c7cac6475e5d0de06968ef1c0b56bfef.jpg)

**显示如下图页面，点击按钮New Application：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080051/9d506cdd664e9594ee35a47d0a84fadf.jpg)

**输入Name、Description（输入内容不限，比如Name写【极风OMS】，Description写处理订单）**

**默认选择Sandbox类型，点击save按钮创建应用**

**注意：此处是创建Sandbox类型的应用，建议Sandbox类型的应用只创建一个，避免测试认证中多沙盒环境混乱**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080134/72d534d3b79d853fc437154beb679e28.jpg)

#### **②保存后，复制sandbox环境的clientId和clientSecret到极风WMS页面输入**
**注意：记住此处是sandbox的【后面授权需要】**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080201/1a98aef94591d12e04851c996f7f0bd0.jpg)

#### **③再次点击按钮New Application**
**输入Name、Description及勾选开关Production（生产环境），点击save按钮创建应用**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080226/fa2e815fe0f786c0085d63b69c400b0b.jpg)

#### **④保存后，复制production环境的clientId和clientSecret到极风页面输入**
**注意：此处是production正式的【后面授权需要】**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080257/1a2caa80078c41e8ba3bfdf666604e9b.jpg)

#### **⑤将刚刚保存下来的Supplier ID、Sandbox沙盒环境的Sandbox Client ID、Sandbox Client Secret和Production正式环境的Client ID、Client Secret填写到极风OMS店铺的授权页面**

### **3、wayfair店铺免费授权极风OMS**

![26dbf213c7afd2846de9ad35e756befc.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603071215/284450e46f08a48c4aec8e555ad97bd7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605091412/f663d622cc5030c1cbef6b82147407cd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605091551/edaba62ff4a19bc4346fd2ce4dad373b.png)

### **4、wayfair后台开启Purchase Order、Ship Notice、Shipping**

#### **①在极风授权成功后，需要回到wayfair平台**
**打开Developer—Supplier Integration Status，选择当前操作店铺账号的supplier id**

**这时页面中Purchase Order\Ship Notice\Shipping API Status已变更为Ready for Production，如下图示**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080513/4eed395e189961ac800243ca88693a2c.jpg)

#### **②分别依次点击Purchase Order\Ship Notice\Shipping右侧的View/Update**
**选择在极风OMS添加店铺账号授权时填写的Application（即Production的应用）**

**将Line in Production状态变更为YES，如下图示**

**注意：Purchase Order、Ship Notice、Shipping三个都需要开启**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080547/37c26ce5c1132075d36a0540c6aa656d.jpg)

**如果点击开关按钮弹出这个提示“Falled to update application scopes”**

**可以关掉页面稍等几分钟刷新一下，如下图所示**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080613/4737e9f08b8e371131c6f1ef461594a3.jpg)

#### **③最终当如下图所示，Purchase Order\Ship Notice\Shipping API Status都变更为Live时，店铺账号的授权正式完成****在Wayfair Developer Portal里当前application开通READ-PRODUCT-CATALOG / read:catalog_products权限，然后重新签发token**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223080636/4e9f60ab2c347e04ed6c3c5c4600353f.jpg)

#### 

### **5、联系海外仓启用Wayfair线上物流渠道，卖家配对海外仓商品后在平台订单正常处理订单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602123624/d0e5ebadb034266c58f163d2815960ea.png)
