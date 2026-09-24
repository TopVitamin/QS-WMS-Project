---
sourceId: "JF-LOG-032"
title: "如何注册、授权、使用USPS美国邮政"
url: "https://help.jfwms.com/zh_CN/doc-article/7106890526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 如何注册、授权、使用USPS美国邮政"
category: "物流渠道管理"
categoryId: 163
docId: 7106890526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-05-26T08:07:02.292Z"
---

# 如何注册、授权、使用USPS美国邮政

**一、定义**

海外仓如果没有USPS官方物流账号（Cird、Mid、Account Number、 Client ID、Client secret），可以按照本流程设置物流授权。

** 二、操作路径**

**USPS注册官方指引：**[**https://developers.usps.com/getting-started**](https://developers.usps.com/getting-started)** （如果有账号无需注册，直接授权）**

如果无法自行注册，可给USPS官方发送邮件（邮箱：[APISUPPORT@usps.gov](mailto:APISUPPORT@usps.gov)），他们会有人协助注册账号

#### 
**第一步：登录/创建USPS商业帐户**

如果没有账号，可以注册账号[https://developers.usps.com/](https://developers.usps.com/)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102534/cf39828ed665d75a8d5e62211db23a88.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102535/c04e91f7050816c7f41192eda203625e.jpg)

 

 

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102535/3f59413c599eb39d36fb9480b58567be.jpg)

**第二步：使用步骤1中的USPS业务帐户凭据登录USPS开发人员门户**[**https://developers.usps.com/**](https://developers.usps.com/)

**第三步：创建APP**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102536/6514e4fb0c33060b93cc3a39af46a56f.jpg)

 

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102536/c770e66fafd592dde9c35b4845a7ef56.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102536/ca949d9fbe129d79ed2a4d4ed5c7f122.jpg)

#### 
**第四步：查看开发者Key、Secret**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102537/1817a44bc13cfc3446548ed0793d5bd6.jpg)

#### 
第五步：输入APP Key授权，此时授权的只是USPS的公共API（Public Access I），不包含发货标签API输入这个网址[USPS客户中心](https://verified.usps.com/am/XUI/?realm=/alpha&goto=https%3A%2F%2Fverified.usps.com%3A443%2Fam%2Foauth2%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3DCOP-PROD%26scope%3Dopenid%2520profile%2520email%2520address%2520phone%2520user_services%26state%3DaHR0cHM6Ly9jb3AudXNwcy5jb20vbmF2aWdhdG9yP3dmPWFwaXNvbmJvYXJkaW5nJmNhbGxiYWNrPWh0dHBzOiUyRiUyRmRldmVsb3BlcnMudXNwcy5jb20%253D%26redirect_uri%3Dhttps%3A%2F%2Fcop.usps.com%2Flogin%2Foauth2%2Fcode%2Fverified%26nonce%3DvVzOOtUhQDK9IjnR9KXMGz79cyu8dsqVN7AxaLl11nA%26regApp%3DCOP#/) 输入您在USPS开发者门户上注册的APP

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250918033015/c3b5b4e26b35fa7c1a76c3adf820178d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250918033105/56a2e602efe6ef845405a79953784c17.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250918033305/4067c6f8d7a308bb17de3626844167e5.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250918033448/c11738a450462f5e2ad1849266de7f18.jpg)

 

#### 
**第六步：向USPS官方发送邮件，申请使用发货标签API**

**在邮件内写明您的申请原因和帐号信息，发送给APISupport@usps.gov进行审核。邮件内容中需要中包括以下信息：**

Using the Label API Reason：

Your Name：

Contact Phone Number：

Developer Portal Username：

URL being called (api.usps.com)

Customer Registration Id (CRID)

Mailer Id (MID)

Developer Portal App Name：

 USPS官方会回复邮件，按照邮件中说明的去操作即可！

**USPS授权之后，最后会在您的USPS账号的APP页面看到一个发货标签的key和secret**

**有了这个授权之后，用shipping suite Ⅱ这个的Consume key再进行一次第五步的授权即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102537/1816f544403749755baaac2681861244.jpg)

#### 
**第七步：在极风WMS授权使用USPS官方物流**

![cd17890b7347edefa74cab4bb7871bfa.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526080455/3b2ac5d9bae72d5f631a29028fd451af.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526080611/3559b736a91b0f9270c7e9fc14030328.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526080650/792849a318f8acc798a539243f753ec4.png)

Account Number是EPS Account，如下图圈起来的数字部分，

如果找不到，就可以复制打开这个访问网址:[获取USPS Account Number](https://epay.usps.com/paymod)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425102538/0d4d39aaecdf2f220545a3735829f4e9.jpg)
