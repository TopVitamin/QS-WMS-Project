# 使用领星OMP授权DHL eCommcerce

- 来源编号: LX-OMP-091
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/89b6
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-19

---

# 使用领星OMP授权DHL eCommcerce


              
## 1.操作场景

定义：WMS系统授权物流商 DHL eCommerce，指的是WMS通过 API 接口对接等方式，使得客户可以直接在领星WMS里下单购买并获取DHL生成的面单。作用：WMS系统授权DHL eCommerce，可实现加快订单处理、简化客户操作等。
## 2.操作指引

（1）获取API授权信息：访问DHL官网或联系DHL商务人员创建账号并开通DHL eCommerce API权限，开通成功后，DHL会通过邮件给您发送API授权信息。如果您还没有API授权信息，请联系DHL获取
- 授权信息包括：Client ID、Client Secret、Pickup Number、Distribution Center


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423636/3964f669)
（2）进入OMP管理后台系统进行物流商授权：OMP管理后台-物流管理-物流商账号，点击添加授权，搜索DHL eCommerce，点击下一步，填写上一步从DHL获得的授权信息，账户名称是自定义内容，只是用于多账号的时候做区分
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423440/ece7c9f6)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423551/3da94d3b)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423510/3fbf1234)
（3）激活物流渠道服务：完成授权后，点击账户名称旁的展开键，在列表中激活需要使用的渠道
- 物流渠道代码和物流渠道名称是自定义的，OMS渠道列表中对应显示，物流渠道代码创建后不可修改


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423353/008a5746)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423686/b8693458)
（4）绑定物流渠道可使用的仓库：激活渠道后绑定可用仓库的两种方式
- 物流商账号 - 点击已创建的物流渠道名称 - 右上角编辑 - 添加仓库
- 物流渠道列表 - 编辑 - 添加仓库


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423493/ec58905a)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423271/ecd47be2)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423682/e930d165)

## 3.补充说明


### （1）注意事项


- 渠道绑定之后，可以选择设置发货地址，如果您没有设置，那么会直接使用仓库地址作为您的打单发件地址


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423366/39e654a6)

## 4.常见问题

Q1：激活渠道之后，OMS里选择不到对应的渠道是为什么？答案：渠道没有绑定仓库或者是没有设置可用名单。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423301/0f054200)
Q2：物流商的授权状态显示未知是什么意思？
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759033423053/828e6cd1)
答案：说明这个物流商的渠道都还没有顺利的获取到面单过，可以使用该服务商下的渠道，在OMS里创建测试出库单获取面单，成功获取后，服务商的授权状态就会转为授权成功了。


              
                
                  
                
                2026-01-19
