---
sourceId: "JF-ERP-007"
title: "商家的ERP系统如何与极风系统对接"
url: "https://help.jfwms.com/zh_CN/doc-article/7108840603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 商家的ERP系统如何与极风系统对接"
category: "ERP授权"
categoryId: 178
docId: 7108840603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-20T08:17:19.821Z"
---

# 商家的ERP系统如何与极风系统对接

### 一、ERP系统开发
对接文档：[API文档](https://s.apifox.cn/25bf1c44-f535-4c37-9bf4-7244130a67ce)

ERP如果需要使用测试账号进行开发调试，请联系极风工作人员

### 二、创建开发者ERP开发完成后，仓库方需要在极风WMS创建开发者，将开发者信息提供给ERP开发进行配置

一个开发者信息只能给一个对接方使用，多个对接方使用同一个开发者信息会导致授权数据失效

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603052739/cf726ba7c337289a68cb6e91acb5714a.png)

开发者名称填写ERP系统名称，webhook地址默认不需要填写，确认后会自动生成一条新的开发者数据

### 三、提供开发者信息给ERP
**开发者信息：**

**接口请求域名**：WMS系统域名，例如https://abc.jfwms.com （abc即您注册极风账号时填写的二级域名）

**授权domain参数** : abc (注册极风账号时填写的二级域名) 

![图片](https://download.jfwms.com/prod/static/back_help/img/1/20241128084711/35bfcd33b02ed9561cc8e4f4a6ebd9e7.jpg)

**ClientId **: 开发者信息ID 

**ClientSecret **: 开发者信息密钥

提供以上信息给ERP进行配置

 

### 四、商家授权绑定
**授权邮箱**：OMS账号邮箱

**授权token**：登录OMS系统，右上角获取

 

商家登录OMS系统，在系统的右上角获取授权token，在ERP上选择好对应的仓库服务商填写OMS注册邮箱和授权token即可进行授权绑定

![图片](https://download.jfwms.com/prod/static/back_help/img/1/20250117090217/d5c2846df8a171644e694f4829a338c5.jpg)
