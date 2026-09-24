# 使用领星OMP授权FedEx

- 来源编号: LX-OMP-094
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/ed4a
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-05-15

---

# 使用领星OMP授权FedEx


              
## 1.操作场景

定义：授权FedEx就是在系统内添加FedEx物流商的授权信息，实现直接从领星内下单，通过API接口向FedEx发起获取面单作用：本篇将指引您在OMP管理后台添加FedEx物流商信息，保证可以成功的获取到面单，简化操作步骤，提高仓库作业效率。
## 2.操作指引


### （1）使用FEDEX账号登录FedEx Developer Portal

网址：[https://developer.fedex.com/api/en-us/home.html](https://developer.fedex.com/api/en-us/home.html)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249332/20899301)

### （2）创建组织

步骤：Manage Organization ＞ Create Organization ＞ Add shipping account ＞ Add users（1） 创建组织Create Organization      a.【Company website】可填写领星官网www.xlwms.com.      b.【Organization name】可填写Lingxing.      c.以上信息不用作校验，均可自定义
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249319/e7103358)
（2）创建货运账户Add shipping account  a.填写您9位数的FedEx账户及相关信息. b.点击【NEXT】，接受End User License Agreement (EULA)条款
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879246945/c0881b1f)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249335/b0465f93)

### （3）创建Project

步骤：My projects - Create API project（1 ）选择API需求类型 a.选择【Ships with FedEx and needs to integrate FedEx APIs into their system】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879247445/ca3b267e)
b.选择API类型为【Ship,Rate&other APIs】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879248109/40f0b445)
 c.划到下方将APIs类型全部勾选。务必留意【Ship API】必选
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879248209/a1895ca1)
（2） 接受条款Configure project      a. Project name支持自定义.      b.下方两个“Do you plan……”选项，保持默认即可（根据实际需求勾选）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879246900/ede76abd)
（3 ）确认project信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879247326/37587a99)

### （4）创建API

（1） 创建API获取TEST KEY点击上一步已创建的project，保存Test key界面的三个值API KEY、SECRET KEY及ACCOUNT，将以上信息发送给领星WMS客服，帮助您在测试环境完成测试。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879247037/c819702c)
如需认证Ground Economy渠道，请将该界面下方的HUB ID一并提供
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1761114277231/image.png)
（2 ）获取Production key
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249380/e70ecd2e)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249681/94891dc2)

### （5）API认证

（1） API认证生成测试标签并填写托运api认证表单      a.保存上一步领星WMS客服返回的测试标签pdf.      b.点击下方网址，获取托运api认证表单，填写并保存为pdf[https://developer.fedex.com/api/content/dam/fedex-com/irc/common/Label-Cover-Sheet-form.pdf](https://developer.fedex.com/api/content/dam/fedex-com/irc/common/Label-Cover-Sheet-form.pdf)      c.亦可联系领星WMS客服获取
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249822/68841ffa)
（2） 发送邮件，等待认证      a.将上一步保存的【测试标签】与【托运api认证表单】的pdf文件，一并发送至FedEx邮箱.      b.标签评估预计需要3个工作日，标签分析组将联系您说明所提交的标签是批准了还是被拒绝了。如果测试标签已批准，请继续下一步。如果测试被拒绝，请按照指示更正标签，然后重新提交以供批准。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249456/b2b3c486)
（3） 认证通过后会有邮件通知，请注意查收
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249384/9664f656)

### （6）领星OMP授权

（1 ）物流商授权步骤：物流管理＞物流商账号＞添加授权＞官方接口＞Fedex-Domestic＞下一步＞填写授权信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249349/a33b75e7)
如果还需要在OMP中获取FedEx的轨迹查询能力，强烈建议参考[如何获取Tracking API key和Tracking Secret key](https://help.xlwms.com/2f8e/a8f8/96cd/07ce/19fe)，进行FedEx Tracking API的对接，需要填写Tracking API key 和 Tracking API Secret。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1778809355300/image.png)
（2）激活物流渠道服务
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249407/ac41e208)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879247989/d2180eca)
（3 ）绑定物流渠道可使用的仓库步骤：物流管理＞物流渠道列表＞选择上一步激活的物流渠道>编辑>绑定仓库
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249368/c8a1063f)

## 3.补充说明


### （1）注意事项：


- 领星只能获取到PDF格式的测试面单
- 如果您需要测试的渠道是economy渠道，在测试时需要另外提供hub ID信息


## 4.常见问题

Q1:为什么OMP填入appkey和appsecret后，仍授权失败？答案：a.请确认您填入的api信息为已通过FedEx认证的Production Key；        b.未通过邮件认证的Production Key亦无法使用，请返回上文参考5【API认证】；        c.Test Key无法在OMP使用，请确认是否已生成Production Key，请返回上文参考4.2【获取Production Key】。
              
                
                  
                
                2026-05-15
