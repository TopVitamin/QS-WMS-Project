---
sourceId: "JF-OMS-ERP-002"
title: "领星ERP授权到极风WMS操作流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108450602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 领星ERP授权到极风WMS操作流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108450602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T02:30:53.583Z"
---

# 领星ERP授权到极风WMS操作流程

**一、定义**

如果卖家客户使用领星ERP推单到免费的极风海外仓管理系统，海外仓帮卖家库存管理和发货。

** 二、操作路径**

**第一步：极风海外仓系统创建开发者信息**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602071336/4475df089f2752cb7337fe27773a81e7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604121129/970a41a228d086d6f3b49ae6dd752c3a.png)

**开发者名称填写领星ERP，webhook地址默认不需要填写，确认后会自动生成一条新的开发者数据**

#### 
**第二步：提供极风海外仓授权信息给领星ERP**

**提供以下信息给领星ERP进行配置**

**（可以海外仓提交，海外仓也可以把信息给领星ERP卖家提交，领星ERP配置完成后，其他领星ERP卖家都可以看到和使用您的海外仓）：**

**1.领星ERP展示给卖家的海外仓名称：**

**2.接口请求域名：**

**3.授权domain参数：**

**4.开发者ID：**

**5.密钥：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604121232/21b989ddb9e3f563525661b50fd3ef23.png)

#### 
**第三步：卖家客户OMS授权绑定领星ERP**

**1.卖家在极风OMS获取授权口令**

**通过极风WMS给客户开户，然后卖家客户通过卖家端OMS获取授权口令。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602071933/aeab05d14d5d00b194a9727fc8f2e065.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604121258/a6d9e5ddac8d42c2a0190d4388be84a4.png)

**2.卖家在领星ERP授权海外仓**

**卖家需要复制上面的信息：**

**（1）OMS的Email：**

**（2）OMS的Token：**

**（3）您的海外仓的接口请求域名（看第二步）：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250819050737/f5690615f93087b0874efd37d755e010.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250819050746/49e3f37e60781593c4e6391599a65858.jpg)

** **

**完成授权后，卖家就可以通过领星ERP推送商品（海外仓商品和卖家店铺商品配对）、推送备货入库单、处理订单到极风WMS，极风海外仓处理订单即可。**
