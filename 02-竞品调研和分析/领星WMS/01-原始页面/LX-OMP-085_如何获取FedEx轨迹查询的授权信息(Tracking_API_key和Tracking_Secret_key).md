# 如何获取FedEx轨迹查询的授权信息(Tracking API key和Tracking Secret key)

- 来源编号: LX-OMP-085
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/19fe
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-05-15

---

# 如何获取FedEx轨迹查询的授权信息(Tracking API key和Tracking Secret key)


               为保证OMP中FedEx轨迹查询持续稳定，强烈建议按照此帮助文档的流程来创建自己的物流轨迹查询API key 和 Secret key，并填写到OMP的FedEx-Domestic授权信息中，系统会使用您的API key和API Secret来查询此租户下发货的FedEx包裹轨迹。 
### 1. 使用FEDEX账号登录FedEx Developer Portal

网址：[https://developer.fedex.com/api/en-us/home.html](https://developer.fedex.com/api/en-us/home.html)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879249332/20899301)

### 2. 创建tracking Project

步骤：My projects - Create API projecta.选择API需求类型,选择【Ships with FedEx and needs to integrate FedEx APIs into their system】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879247445/ca3b267e)
b.选择希望使用的物流轨迹查询API【Basic Integrated Visibility】，然后选择Next下一步
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1776824189131/image.png)
c. 填写项目名称，选择国家（选实际发件地或收件地国家均可）后点击Next下一步，来生成测试账号
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1776824296546/image.png)
d.勾选同意协议，并进行创建项目
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1776824817210/image.png)

### 3. 获取生产环境下的API key 和 Secret key

a. 创建好项目后，默认会生成测试环境可用的API key 和 Secret key，需要继续生成Product key
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1776825055028/image.png)
b. 切换到Production Key的标签，选择项目对应的fedex发货账号，点击下一步，然后复制保存下来自己生产环境的**API key** 和 **Secret key**注意：Secret key生成后仅会出现一次，请妥善保存，如果未保存，可以点击Regenerate重新生成。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1776825175137/image.png)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1778310919529/image.png)
c. 将刚刚保存下来的API key 和 Secret key填写到OMP的FedEx-Demestic授权信息中
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/29a37bf2-159d-4752-862f-f2b12a46d3b8/1778808795018/image.png)

              
                
                  
                
                2026-05-15
