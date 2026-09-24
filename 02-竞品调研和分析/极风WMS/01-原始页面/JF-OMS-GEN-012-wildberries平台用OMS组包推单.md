---
sourceId: "JF-OMS-GEN-012"
title: "wildberries平台用OMS组包推单"
url: "https://help.jfwms.com/zh_CN/doc-article/7115060907-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > wildberries平台用OMS组包推单"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7115060907
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-08T11:23:10.171Z"
---

# wildberries平台用OMS组包推单

## **一、定义**
**Wildberries（下文简称WB）平台FBS出库存在****供货单（Supply）****组包逻辑。OMS平台订单需要先在OMS、ERP待处理中完成WB组包，再推送至WMS仓库作业。仓库发货后，系统需要将当前****组包单在WB平台标发至配送中****，并在****标发成功后****获取****供货订单二维码****，供WMS查看和打印。**

## **二、操作流程**

### **1、如果有多个仓库，需要在设置-店铺授权-仓库映射，进行仓库配对**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907082234_336e9cc9316240979fcd61c690636e1f.png)

### **2、筛选WB平台的订单，创建供货单，并添加订单至供货单**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907065820_7dc89d5caa3c409a8d041e5ec01aba9c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907070122_4414c2ff7e28429bbe6350a579500ec1.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907070056_b9712bd7ed3446d4b68290ea27d7190e.png)

**注：此处添加订单只能添加未推送仓库的订单，若选择已组包待推仓订单，则该订单会从原有供货单中移除，并加入到新组包**

### **3、平台订单-待处理板块，正常走推单流程（分配仓库-选择物流-获取运单号），将订单流转到发货中即可**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907075926_1f5a688423bf4403872735fb17e9da1f.png)

**注：这里只有已经加入组包的订单才可以正常推送**

**订单未全部推送仓库则会红色提示，全部推送后黑色字体。未推完需要重复上步操作，未推仓的订单继续获取运单推仓**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907081418_5e01e93c8f8f452eb8ae2f6ab70fc945.png)
