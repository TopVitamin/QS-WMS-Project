---
sourceId: "JF-FEE-002"
title: "多币种结算"
url: "https://help.jfwms.com/zh_CN/doc-article/7114190729-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 费用 > 多币种结算"
category: "费用"
categoryId: 176
docId: 7114190729
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-06T13:22:48.844Z"
---

# 多币种结算

## **一、定义**
当服务商有多个仓库，同一个卖家多个仓库备货发货时，每个仓库的成本结构、报价币种、合同币种都可能不同，需要有多种结算货币分开结算。或者货主全球分销，不同国家的分销商结算币种不一致，需要汇率换算结算。

## **二、操作流程**

### **1、设置仓库可选结算货币以及合计展示单位**
可选货币：创建计费模板以及开户支持的币种；

合计展示单位选择：利润计算时，当有多条费用数据时，选择用哪种货币按前一天银联汇率换算并展示合计数据。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729071057/3b2a4f7083051083541586e959e83769.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260730053912/e0160394e8e9b06e11783f086090ad4b.png)

### **2、选择仓库的计费模板**
选择计费模板的时候，自动带出对应计费模板的结算币种，仓库端只需要设置该仓库计费模板的时候，使用对应的结算币种即可。下方账户信息会在客户编辑保存的时候自动创建不同币种的充值账户，不同账户之间的结算独立分开。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729073053/ad60151b9971f04eb1f88e5d184494fb.png)

### **3、客户充值。**

#### **①OMS充值申请**
可选择仓库配置的计费模板对应的币种进行充值，这里用的时不同币种单独生成的充值账户，生成不同货币的余额，不支持做汇率换算转换。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729073819/6bdbe74a00a46094a7c6f0216b15b077.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729073947/f663d622cc5030c1cbef6b82147407cd.png)

账户资产总可用余额是各个币种账户的总余额，按美金进行换算，如需要查看不同货币账户下的余额，点击账户资产下的详情进入查看。

余额不足提醒：任何一币种余额不足都会进行提醒。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729074444/1d0b0eaa53cdacf82a02228127b24cb4.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729074603/12e63e06681ac81f180b34884eb818f9.png)

#### **②WMS仓库端代充值。**
哪个仓库需要充值余额，选择对应仓库的结算币种进行充值。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729075435/e544f47bea8941fa7f83efb8def0e009.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729075332/dc5458ee6fd8a55e8b118edc75a7716b.png)

### **4、代金券发放**
哪个仓库需要发放代金券使用，选择对应仓库的结算币种进行充值。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729075737/1f73ecd898c6a7fa0ffe19c79d976586.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729075853/58a8d0abc605f98e5d36057928dfd521.png)

### **5、信用额度调整**
根据客户使用的仓库的结算币种进行信用额度的调整。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729080216/323f1a5ad79f4476a32477a885ce9a7d.png)

### 6、多仓发货，多币种物流比价
卖家有不同的仓库，各个仓库的结算币种不同的情况下，支持统一使用美金进行汇率换算比价，汇率使用的当日银联汇率。这里第一显示是当前仓库的货币费用展示，第二显示是美金的统一显示。智能分仓以及选择最低价物流，统一按照美金汇率换算比价。

![企业微信截图_1785315982864.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729090642/087444143d57ee37cc372c638cdcab77.png)

![企业微信截图_17853159936264.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729090655/82ac970d17fc413872911e8d9b004d19.png)

### **7、手动扣费**
手动扣费分币种单独计费。关联单据的情况下，自动带出对应账户的货币类型，不关联单据的情况下，选择客户和仓库的时候，会自动带处该客户所用仓库的货币类型，默认使用该货币类型进行扣费，不可更换币种。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729091110/89fc79e137e5ab661508b71a2cc30135.png)

![企业微信截图_17853167562729.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729092113/c9d9c882a776372960ed7b32943ad243.png)

### **8、资金流水和业务费用查看**
资金流水支持按币种查看；业务费用同一个客户，不同的结算币种支持独立统计核算。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729105736/0abbf1db9f8de024bd39fcc813586189.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729105816/9d4f903abd317899125d3c408360bb77.png)

### **9、预警金额调整**
批量调整预警金额，可选多货币统一调整数值，但是不支持选单一货币调整再按汇率换算。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729111220/a93b730c279c379330ceb13cd20cf3b8.png)

预警消息通知会在消息中心具体显示哪种货币余额不足。

![企业微信截图_17853236359353.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729111709/c409dc6fa2c23fcb19d87919b49ea6aa.png)

![企业微信截图_17853236847500.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729111723/f3372f81ed2818f8797861d60733bf8a.png)

### **10、OMS端员工子账号解决查看以及充值权限。**
OMS设置员工子账号的时候，支持开启或者关闭不同币种结算账户的查看。

![企业微信截图_1785323825795.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729112303/7069bb6a8003058c33de3b474001bdd5.png)

### 11、分销商品不同结算货币下单
功能按钮开启后，分销商品币种与客户仓库币种不一致时，OMS仍可下单，计费时按最新汇率换算为客户仓库币种。关闭后，币种不一致将无法下单。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260729112634/4b7951a42f3568667c2752f831d96134.png)

若设置了退货返回分销价格费用，那么发生退货，按照分销商当时拿货扣取的费用返回。
