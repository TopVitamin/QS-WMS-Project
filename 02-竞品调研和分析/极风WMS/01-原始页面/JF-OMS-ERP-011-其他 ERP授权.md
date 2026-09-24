---
sourceId: "JF-OMS-ERP-011"
title: "其他 ERP授权"
url: "https://help.jfwms.com/zh_CN/doc-article/7108520602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 其他 ERP授权"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108520602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T02:56:53.745Z"
---

# 其他 ERP授权

**一、定义**

如果仓库端需要对接其他ERP，批量管理多平台多店铺，需要看这个操作。

** 二、操作路径**

**第一步：创建开发者信息**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602122546/be52cd188a20c69c5f324293de08d409.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605025648/f192d9561787a6fff15678f79c6b3246.png)

**开发者名称填写ERP系统名称，webhook地址默认不需要填写，确认后会自动生成一条新的开发者数据**

#### 
**第二步：提供开发者信息给ERP**

**开发者信息：**

**接口请求域名：WMS系统域名，例如https://abc.jfwms.com （abc即您注册极风账号时填写的二级域名）**

**授权domain参数 : abc (注册极风账号时填写的二级域名) **

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428085116/63612ad2f4b46bb81d69f6be194d9802.jpg)

**ClientId : 开发者信息ID **

**ClientSecret : 开发者信息密钥**

**提供以上信息给ERP进行配置**

#### 
**第三步卖家客户授权绑定ERP**

通过极风WMS给客户开户，然后卖家客户通过卖家端OMS账号授权给ERP，完成海外仓系统授权ERP授权邮箱：OMS账号邮箱

授权token：登录OMS系统，右上角获取

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602122638/28356ee95e86d201bc04dde0191d6678.png)
