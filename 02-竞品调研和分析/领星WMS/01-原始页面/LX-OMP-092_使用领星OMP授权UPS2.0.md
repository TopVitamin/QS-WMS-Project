# 使用领星OMP授权UPS2.0

- 来源编号: LX-OMP-092
- 原始URL: https://help.xlwms.com/2f8e/a8f8/96cd/07ce/9f78
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2025-09-28

---

# 使用领星OMP授权UPS2.0


              
# 1.操作场景

定义：在OMP管理后台授权UPS官方物流商账号并激活需要使用的渠道。作用：在OMS端的直接选择已经授权创建的物流渠道下单就可以获取到UPS的面单了。
# 2.操作指引


## 2.1注册UPS账号（如有账号请跳至下一步）

注册网址：[https://www.ups.com/doapp/signup](https://www.ups.com/doapp/signup)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779594/MTY4ODg1NTM4MTcyNTc3MQ_567214_jiebyS3Z1RvCR6UY_1758081106)

## 2.2获取Client ID 和 Client Secret


#### （1）使用UPS账号登录UPS开发者中心

      网址：[https://developer.ups.com/](https://developer.ups.com/)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779596/MTMxMDI3MDEyNTY5NzQxMTY_692873_bwsJRanobHnzF-B4_1758079902)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779611/MTMxMDI3MDEyNTY5NzQxMTY_638666_wnS8ge2dVoD9pfYx_1758079902)

#### （2）创建APP

 ① 登陆后点击【My Apps】 - 【Add Apps】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779700/MTMxMDI3MDEyNTY5NzQxMTY_891702_b1wbZ1HECa5segXg_1758079902)
② API类型选择【I want to integrate UPS shipping capabilities to my business】，辅助认证选择UserID已绑定的账户，点击NEXT
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779692/MTMxMDI3MDEyNTY5NzQxMTY_518912_5Wi8WZZlxXl7bzc1_1758079902)
    ③ 添加联系人信息，填写必填字段（带*的框），点击NEXT
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779750/MTMxMDI3MDEyNTY5NzQxMTY_955171_tTMdwOqCutkfaFu7_1758079902)
④ App name填写Lingxing，单击+号将右侧全部的API产品添加到您的应用程序中，点击Save
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801780300/MTMxMDI3MDEyNTY5NzQxMTY_938575__KBGhvpnkogRj9vJ_1758079902)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779785/MTMxMDI3MDEyNTY5NzQxMTY_832251_TORRxg8s5YCHzkWW_1758079902)

## 2.3复制授权所需信息


#### （1）User ID （路径：My information - User ID）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801781354/MTMxMDI3MDEyNTY5NzQxMTY_315674_smMbFvea4KMlGRLu_1758079905)

#### （2）Account number（路径：Accounts and Payment - NUMBER）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779808/MTMxMDI3MDEyNTY5NzQxMTY_786056_H_qrXVDHyFxsdnft_1758079902)

#### （3）Client ID 和 Client Secret（路径：My Apps - AppName）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779858/MTMxMDI3MDEyNTY5NzQxMTY_194012_75FaUkynpgrxNflE_1758079903)

## 2.4领星OMP授权


#### （1）填写上一步获取到的授权信息


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801779948/MTY4ODg1NTM4MTcyNTc3MQ_384686_tTbrcyx4wXmjfRel_1758157438)

#### （2）激活需要的物流渠道

 ① 找到已授权的UPS物流商账号，点击左侧展开按钮，激活所需物流渠道。 ②【物流渠道代码】及【物流渠道名称】均为自定义，仅在领星系统显示。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801780042/MTY4ODg1NTM4MTcyNTc3MQ_156740_G3NZf5UVFC7vBwro_1758157576)

#### （3）编辑渠道配置

① 物流渠道列表 - 找到新激活的UPS物流渠道 - 编辑 - 绑定仓库。② 若备货中转出库，同一单需要按箱生成多个面单，【预报方式】可选择【按箱预报】。③ 发货地址默认为仓库地址，如需特别设置，可在绑定仓库后，点击物流渠道代码进入详情页设置。④绑定客户可选择是绑定可用名单还是不可用名单，绑定可用名单表示只有被勾选的客户可使用这个渠道，绑定不可用名单表示未被勾选的客户才能使用这个渠道。⑤下单规则是针对这个物流渠道做出的限制，可按需添加规则，该规则只对一件代发出库、备货中转出库生效；满足配置规则即可下单成功。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801780120/MTY4ODg1NTM4MTcyNTc3MQ_408437_ojuSWyIGVudNxdR0_1758157707)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801780205/MTY4ODg1NTM4MTcyNTc3MQ_834489_1kaGxn5-tWJTD9_8_1758172081)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758801780416/MTY4ODg1NTM4MTcyNTc3MQ_291160_4epOlkE-Zl-5W32g_1758172489)

# 3. 
    常见问题

Q1：【按箱预报】 和 【整单预报】 的区别是什么呢？答案：【按箱预报】类似于子母单，按SKU数量分别获取面单，【按单预报】即按出库单预报面单，同个出库单仅获取一个面单。Q2：物流渠道选择的UPS，为什么出库单填了门牌号，但面单却不显示？答案：【UPS官方】接口不支持传门牌号。
              
                
                  
                
                2025-09-28
