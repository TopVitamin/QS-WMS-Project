# 使用领星OMP授权Yamato（日本黑猫物流）

- 来源编号: LX-OMP-089
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/7a50
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-07-20

---

# 使用领星OMP授权Yamato（日本黑猫物流）


              
## 1.操作场景

定义：使用领星OMP授权yamato是指通过领星OMP与yamato黑猫物流的官方接口对接，实现将yamato黑猫物流的物流渠道集成在领星OMP中。作用：完成yamato黑猫物流的授权后，您可以激活您需要的物流渠道，实现从系统向物流商自动下单并获取面单的功能。
## 2.操作指引


### （1）登录yamato账号

登录链接：https://bmypage.kuronekoyamato.co.jp/
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516559428/image.png)

### （2）进入B2打单系统


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516526108/image.png)

### （3）点击“外部システムとの連携”模块


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516660141/image.png)

### （4）复制API授权信息（accessToken）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516734152/image.png)

### （5）领星OMP授权

（1 ）物流商授权步骤：物流管理＞物流商账号＞添加授权＞官方接口＞yamato＞下一步＞填写授权信息customerCode：黑猫登录账号。clscd：登录账号的“任意”部分，没有可留空。apiUserId：留空。accessToken：第（4）步获取的API授权信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516856197/image.png)
（2）激活物流渠道服务
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784516977837/image.png)
（3 ）绑定物流渠道可使用的仓库步骤：物流管理＞物流渠道列表＞选择上一步激活的物流渠道>编辑>绑定仓库
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/015ed032-04f8-4f04-83de-84b7b024fc57/1784517111652/image.png)

              
                
                  
                
                2026-07-20
