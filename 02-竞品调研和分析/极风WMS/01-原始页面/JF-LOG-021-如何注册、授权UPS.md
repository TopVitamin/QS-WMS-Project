---
sourceId: "JF-LOG-021"
title: "如何注册、授权UPS"
url: "https://help.jfwms.com/zh_CN/doc-article/7106820525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 如何注册、授权UPS"
category: "物流渠道管理"
categoryId: 163
docId: 7106820525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-05-25T12:09:47.533Z"
---

# 如何注册、授权UPS

**一、定义**

**使用UPS物流授权极风海外仓系统，为客户开启物流渠道流程。**

** 二、操作流程**

**第一步：注册UPS账号（如有账号请跳至下一步）**

** 注册网址：**[**https://www.ups.com/doapp/signup**](https://www.ups.com/doapp/signup)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054313/9552fdafd649d0ff9eed8c1ed900a801.jpg)

#### 
**第二步：获取Client ID和Client Secret**

**步骤一：使用UPS账号登录UPS开发者中心**

为了获取您的Client ID和Client Secret，您需要创建一个应用程序。此应用程序将与您的托运人帐户和与您的UPS.com ID相关联的电子邮件地址相关联。

点击链接 [https://developer.ups.com/get-started?loc=en_US](https://developer.ups.com/get-started?loc=en_US)  申请UPS开发者账号

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054313/1c9949a483b8617bb42288b69187c702.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054313/00a193338c23ad9fc5d83f181343c1d8.jpg)

**步骤2：选择您的使用案例、发货人账户并接受协议。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054314/db0e3e2552dabbd648bf30bccd8aeb0b.jpg)

**步骤3：输入您的联系信息。**考虑使用其他人可以访问的群组收件箱。一旦创建凭据或更改电子邮件，您将无法更改此电子邮件，否则您将失去对应用程序的访问权限。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054314/de446b093e3b7766c4323f6b856cf3e9.jpg)

**步骤4：定义您的申请详细信息，包括名称、关联的计费帐户号码和自定义产品。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054315/e51093eb91f69a05f0149753881828b7.jpg)

**步骤5:复制授权所需信息**

保存后，您的Client ID和Client Secret会被生成。这些将用于获取访问令牌以授权您的API请求。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250619054315/fb13a008bca4b97def88134ad99b574d.jpg)

#### 
**第三步：极风海外仓系统添加物流商**

![cd17890b7347edefa74cab4bb7871bfa.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120742/bfbc3630ca8e0401c5240d6a85968e69.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120816/7ffc74c3e1236d6c9835bf7fd3c3834e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120900/33acea49a5b60aa9a64614cbba2d9250.png)

**第四步：开启物流渠道**

![b70ac8ae41b9fdb8a488eea01a91c9f7.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120921/0cbbdde0b6f8a54d0f41b753c143be4c.png)

![863578e17253fd5d2b4d8ea8f3fb51ea.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120934/8a90d316ecbb96647b87fd2100258b91.png)

**第五步：海外仓为客户开启物流渠道（开启后卖家可在OMS卖家端、ERP端看到这个渠道）**

![431c7c9fb1ac03188da7246838f30bf8.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525120635/fcc5835f4315ac2a2177ecc7eb00af07.png)
