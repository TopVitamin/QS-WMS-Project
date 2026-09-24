---
sourceId: "JF-OMS-ERP-003"
title: "如何对接Hiseller ERP，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7115360915-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 如何对接Hiseller ERP，实现一件代发全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7115360915
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-15T05:53:35.308Z"
---

# 如何对接Hiseller ERP，实现一件代发全流程

## **一、授权规则**

### 1、一个海外仓的OMS账号，只能授权给一个HiSeller账号；

### 2、一个HiSeller账号可以同时绑定不同的海外仓，每个海外仓只能绑定一个OMS账号。

## **二、授权流程**

### 1、点击 “设置”—>> 点击“服务授权”—>> 选择 服务商—>> 点击“授权”

![图片1.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915032435_7407c8a4f32c48bc8f74a946854942d6.png)

### 2、完善授权信息—>> 输入服务商授权Token信息后，点击“授权”即可完成三方仓授权。

![图片2.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915053534_f1792fa7b52a4f9cb40a2c3b7debed08.png)

### 3、获取极风服务商Token—>> 点击右上角账号信息—>> 点击获取Token并复制Token及Email。

![图片3.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915033512_15b5e35cea6f4aaa800aff3c2888ddaa.png)

![图片4.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915053610_bd25dd6a5de243e6b7e78de9bc78b78d.png)

## **三、添加三方仓仓库**

### **1、点击 “设置”—>> 点击“服务授权”—>> 选择服务商—>> 点击“授权”（方法一）**

![图片5.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915053918_bc8d798c9cdc4213aa6e073e3b0323d3.png)

### **点击“库存”—>> 仓库管理—>> 仓库列表—>> 点击“添加仓库”（方法二）**

![图片6.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915053953_9e32aae658a04d70b1bbe0f5d48cbe10.png)

### **2、选择仓库类型****—>> 在「仓库类型」中选择「三方仓」。**

![图片7.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054033_db2916dbde984bb391551e304afaa589.png)

### **3、选择服务商****—>> 在「服务商」下拉框中选择三方仓服务商。**

![图片8.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054107_d4e248e87dd14d779ced77575a692e6d.png)

### **4、选择服务商仓库****—>> 选择服务商后，在「服务商仓库」下拉框中选择该服务商下的可用仓库并保存仓库。**

![图片9.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054148_a57e9cb1988a4f7b82078867e9a32d11.png)

![图片10.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054224_dcfe5957cddd495db841a25dcd76b695.png)

## **四、推送商品至极风三方仓**

### **1、点击「未推送」，查看已经在HiSeller创建、但尚未推送至所选三方仓的货品。**

![图片11.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054355_2a4390a1ea1948518b29b2adb350ee75.png)

### **2、****选择目标三方仓服务商—>> 使用SKU、标题或条码搜索目标货品**

![图片12.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054438_3c004e8ea70b4e258958807991c1a378.png)

### **3、选择货品并发起推送****—>> 勾选需要推送的货品—>> 点击「推送货品到三方仓」**

![图片13.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054518_47d2e813d0274a89919dd73aa9b28579.png)

### **4、查看推送结果****：推送成功：货品进入「已推送」、推送失败：货品进入「推送失败」**

![图片14.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054551_ac7f333d4c774a4fbfcfccfeb6ea455e.png)

## **五、推送订单至极风三方仓**

### **1、****如订单中的商品未配对，将先****进入待审核处理未配对的商品**

![图片15.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054805_c7f1655f7c304a41bdd13db605265f89.png)

### **2、勾选订单，点击安排发货。(****WB将自动按店铺组包并获取面单，Ozon、Yandex Market也将自动获取面单，系统获取面单后会自动推送至三方仓。****)**

![图片16.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915054834_8ac81b22cc8941f9ad18215790fe1226.png)

### **3、订单在「待打单」等待三方仓处理，WB自动推送组包码**

![图片17.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915055004_713f88cbaf9e4992b86663ee1861a3ba.png)

### **4、在WMS待打单板块处理订单**

![图片18.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915055041_295b1b30f1d34c65817d321d7faa1ffa.png)
