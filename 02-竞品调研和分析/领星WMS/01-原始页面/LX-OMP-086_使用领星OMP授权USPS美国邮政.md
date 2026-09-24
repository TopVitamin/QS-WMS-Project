# 使用领星OMP授权USPS美国邮政

- 来源编号: LX-OMP-086
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/5eef
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-19

---

# 使用领星OMP授权USPS美国邮政


              
## 1.操作场景

定义：使用领星OMP授权USPS美国邮政是指通过领星OMP与USPS美国邮政的官方接口对接，实现将USPS美国邮政的物流渠道集成在领星OMP中。作用：完成USPS美国邮政的授权后，您可以激活您需要的物流渠道，实现从系统向物流商自动下单并获取面单的功能。
## 2.操作指引

官方指引：https://developer.usps.com/getting-started
### 2.1获取USPS账号信息（CRID,Master MID,MID,EPA）

（1）注册账号：如果没有账号需要先注册账号。注册链接：https://reg.usps.com/entreg/RegistrationBusinessAction_input
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326403/d8d1d74f)
（2）登录账号：登录您的USPS账号。登录链接：https://gateway.usps.com/eAdmin/view/signin
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327295/b629b64a)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327115/3d58052f)

### 2.2申请授权信息

（1）登录开发者中心：使用第一步注册的USPS账号登录开发者中心。登录链接：https://developers.usps.com/
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326125/d753edd8)
（2）创建APP：进入APP管理页面创建APP。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327436/9375bcd9)
（3）添加APP：添加APP,填写App名称和描述App用途。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879325970/f69d75f1)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327175/98c7ed46)
（4）查看开发者Key和Secret：查看并复制开发者Key和Secret，请求接口时需要用到这些信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327634/b50252ab)
（5)进入客户中心：授权您在USPS开发者门户上注册的APP。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326633/27644cab)

### 2.3 申请API访问权限

注意：创建APP时APIs只能选择公共接口（Public Access I）权限，如果要使用发货标签或退货标签接口，还需要申请Shipping API接口权限。在邮件内写明您的申请原因和帐号信息，发送给APISupport@usps.gov进行审核。邮件内容中需要中包括以下信息：Using the Label API ReasonYour NameContact Phone NumberDeveloper Portal UsernameURL being called (api.usps.com)Customer Registration Id (CRID)Mailer Id (MID)Developer Portal App Name
### 2.4 领星OMP授权

（1）登录领星：登录领星OMP，导航至【OMP-物流管理-物流商账号】，点击添加授权。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327694/c38140a7)
（2）填写授权信息：填写上述获取到的信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327551/f3df8311)
（3）激活物流渠道服务：选择需要的渠道激活，填写物流渠道信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326700/093eece5)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326934/596e70dc)
（4）绑定仓库：导航至【OMP-物流管理-物流渠道列表】，点击编辑，绑定可使用该物流渠道的仓库和客户。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326791/6b019743)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327060/d8691da4)

## 3.补充说明


### （1）名词解释


- 官方物流商 ：实际提供物流服务的物流商，如USPS、FedEx、UPS 等。官方物流商在完成授权后，系统会根据系统支持的官方渠道自动为每个物流商添加渠道。


### （2）注意事项


- 激活渠道后必须绑定仓库，客户OMS才可选择该渠道进行下单，绑定客户的不可用名单为空代表仓库的所有客户都可以使用该物流渠道。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326558/c1ecb35b)

## 4.常见问题

Q1:刚授权完成的物流商授权状态显示未知，是授权失败了吗？答案：需要使用OMS账号创建单据测试打单系统授权信息的正确性，面单和跟踪号获取成功，授权状态会同步更新。Q2：OMS使用美国邮政物流渠道打单报错：物流系统返回异常：CRID isn't enrolled in USPS Return or USPS Ship Outbound 是什么原因呢？
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879327350/7b08ec6e)
答案：报错提示“客户注册 ID（CRID）未注册美国邮政（USPS）的退货或出站发货服务”，需要联系USPS官方确认CRID信息的是否有效。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879326077/b6e93fc5)

              
                
                  
                
                2026-01-19
