---
sourceId: "JF-BAS-009"
title: "自定义系统登录域名教程"
url: "https://help.jfwms.com/zh_CN/doc-article/7101220201-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 自定义系统登录域名教程"
category: "基础设置"
categoryId: 159
docId: 7101220201
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-22T14:56:44.138Z"
---

# 自定义系统登录域名教程

## 一、系统支持设置自定义域名+公司品牌名称+logo，提升仓库的品牌影响力

### 1、设置——账号信息——品牌管理

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260618200054/2261d62003f39f99f8ea29aa4e2208f1.png)

** **

### 2、填写品牌名称、上传Logo
1、Logo图片格式必须为PNG格式，建议使用透明背景以适应不同底色（深蓝、浅蓝、白色），避免因颜色相近导致显示不清2、Logo可单独设置，若设置品牌名则必须同时上传Logo；

### 3、选择域名类型
子域名配置​：允许用户修改域名中间部分，后缀仍保留极风标识（如 .[jfwms.com](http://wms.com) 或 .[jfwms.net](http://oms.net)），域名格式：[自定义名称].jfwms.com，例如：mumule.jfwms.com，设置后立即生效。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260618201545/b3d60f842d0d54a191f5237a0d0dff07.png)

​

独立域名配置​：需用户自行购买不含极风信息的独立域名，购买后必须联系工作人员进行技术配置与校验，无法由客户自行完成

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260618201733/e291d0168e2cadf4b12177443f1df690.png)

## 二、购买独立域名操作

### 1、购买域名

### 2、注册cloudflare账号（注册地址：[http://www.cloudflare-cn.com](http://www.cloudflare-cn.com)）

### 3、将域名站点添加到cloudflare，并选择免费套餐

### 注：以下案例均以wmstest,top域名为例

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014115/db40c1eae82a8e575c1ec03bbe8e9e6c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014126/0c4aae70806dd214eb12684448608735.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014141/08788ccfbfd27eae590bde32aa6afd00.jpg)

#### 
**4、完成域名DNS服务修改**

在cloudflare的DNS>Records下查看Cloudflare NameServers并拷贝

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014159/6674ddb13bd1e78320a8a675fa4dea1d.jpg)

去到域名服务商DNS管理，修改域名的DNS服务，以阿里云为例

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014215/5e61b26c458bd41233f654698acde6c6.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014223/487c3b2027f06b100a75d88a2aa6c910.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014235/f53f36fc5b1474776389ac3b00269ada.jpg)

### 5、域名DNS服务修改成功后，cloudflare上站点状态更新为Active,然后添加DNS record记录

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014253/6710210ca0460b044f867d72833d9e70.jpg)

Type选择CNAME类型，Name一般设置为www或 @，Target设置为： [custom.jfwms.com](http://custom.jfwms.com)

### 6、创建缓存规则

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014419/bbb93999aafdacf9ecce73b2cecdbaeb.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014427/0d53a33cb3816f4872489fa1836f3d0a.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014436/792fbdb0f4156525f96c7e5d6ebf70b6.jpg)

#### 

### 7、设置SSL/TLS

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014452/d826735b82f7eedf6a828d41ddf6b633.jpg)

#### 
**8、设置HTTPS和TLS版本**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014506/91fc57fe7611c78ab4d97d548c3f9865.jpg)

#### 

### 9、验证是否成功
一般配置10分钟内会生效，直接访问您自己购买的域名，能正常跳转至极风登录页面即成功

#### 

### 10、配置成功之后请联系极风工作人员进行系统配置
因为系统做了域名校验，非极风系统域名默认是无法通过登录校验的，需要联系工作人员进行配置处理，截图以下页面提供给极风工作人员即可

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260201014708/deb7f33b624a4742d9597f02fc6971ff.jpg)
