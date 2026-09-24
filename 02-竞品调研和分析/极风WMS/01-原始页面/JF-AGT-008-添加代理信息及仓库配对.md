---
sourceId: "JF-AGT-008"
title: "添加代理信息及仓库配对"
url: "https://help.jfwms.com/zh_CN/doc-article/7107640602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 代理仓 > 添加代理信息及仓库配对"
category: "代理仓"
categoryId: 171
docId: 7107640602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-07T08:58:40.107Z"
---

# 添加代理信息及仓库配对

**一、定义**

如果海外仓管理和发货是第三方海外仓，您是海外仓的代理拓客运营人员，需要添加代理信息及仓库配对，获得代理仓库、物流渠道信息，后续仓库打包发货等均有第三方仓库负责。​

** 二、操作路径**

**第一步：仓库主给代理仓服务商开通一个****OMS账号****（类似你给客户开账号）**

**用于链接代理仓主仓和自己仓库**

#### 
**第二步添加代理信息**

仓库端WMS>设置>代理设置>【代理授权】>添加授权>各个海外仓的授权密钥需要去各自系统的OMS内找到授权信息然后填写至此完成授权；列表增加授权信息，同步代理系统的仓库以及物流渠道

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032714/aaec6b5c1dc496938e8d60ee3a22c8c3.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907085526_0014929410f144ad98e3d16d396d8106.png)

授权完成后，代理仓的仓库和物流渠道都会推送过来

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032633/d75f5039454d4a94a3162150e4a6dec9.png)

代理商：你代理的仓库

自定义代理商：你方便管理你的代理仓名字

授权token：主仓给你的OMS授权账号

#### 
第三步：新建代理仓库

 在WMS设置的仓库设置内新建一个类型为【代理仓】的待发仓库，仓库配对成功之后，需要在客户列表对客户开启代理仓库

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032802/23e8bf9a432b8bb553cd3c2dd0d2b2a2.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112555/334fc259d35f2f52e3cdb378cf425957.png)

**第四步代理仓和主仓仓库配对**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032903/8028028c24731310514d50d36374e9af.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112739/b886e7a270fca1c24a9f7afc3ec44c70.png)

这样仓库就配对完成。

注意：

1.如果卖家创建入库单到你自己设置的自定义代理仓，但实际上真正给他操作入库是代理别人的主仓库。

2.如果需要配对的代理仓数量多，也可以批量导入配对3.代理仓配对完成，给客户开户，创建计费模版参照极风WMS的基础操作。
