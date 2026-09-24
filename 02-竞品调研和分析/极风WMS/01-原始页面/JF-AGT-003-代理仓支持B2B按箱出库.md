---
sourceId: "JF-AGT-003"
title: "代理仓支持B2B按箱出库"
url: "https://help.jfwms.com/zh_CN/doc-article/7108040602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 代理仓 > 代理仓支持B2B按箱出库"
category: "代理仓"
categoryId: 171
docId: 7108040602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-18T03:45:34.638Z"
---

# 代理仓支持B2B按箱出库

** ****一、定义**

**代理仓将客户的货备到主仓时，会有从主仓补货至平台仓的需求，可以通过代理仓创建B2B出库单推送到主仓，****后续仓库打包发货等均由主仓负责。​**

### **二、操作路径**

**第一步：仓库主给代理仓服务商开通一个****OMS账号****（类似你给客户开账号）**

**用于链接代理仓主仓和自己仓库**

**第二步：添加代理信息**

**仓库端WMS>设置>代理设置>【代理授权】>添加授权>各个海外仓的授权密钥需要去各自系统的OMS内找到授权信息然后填写至此完成授权；列表增加授权信息，同步代理系统的仓库以及物流渠道**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032714/aaec6b5c1dc496938e8d60ee3a22c8c3.png)

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260907085526_0014929410f144ad98e3d16d396d8106.png)

授权完成后，代理仓的仓库和物流渠道都会推送过来

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032633/d75f5039454d4a94a3162150e4a6dec9.png)

**第三步：新建代理仓库**

** 在WMS设置的仓库设置内新建一个类型为【代理仓】的待发仓库，仓库配对成功之后，需要在客户列表对客户开启代理仓库**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032802/23e8bf9a432b8bb553cd3c2dd0d2b2a2.png)

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112555/334fc259d35f2f52e3cdb378cf425957.png)

**第四步：代理仓和主仓仓库配对**

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602032903/8028028c24731310514d50d36374e9af.png)

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112739/b886e7a270fca1c24a9f7afc3ec44c70.png)

**注意：**

**1.如果卖家创建入库单到你自己设置的自定义代理仓，但实际上真正给他操作入库是代理的主仓库。**

**2.如果需要配对的代理仓数量多，也可以批量导入配对**

**第五步代理仓和主仓的物流渠道配对**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260918033459_95c3eea3143c4bcea5376bbed4059de1.png)

**可以参考：代理仓物流渠道配对**[https://help.jfwms.com/zh_CN/doc-article/7107630602-](https://help.jfwms.com/zh_CN/doc-article/7107630602-)

**第六步：代理仓和主仓的箱库存配对**

**将主仓库的箱唛和极风代理仓系统内的箱唛进行配对。​目前只支持代理仓和主仓都是用极风的。**

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908034854_92134f6f60d64fa398df506b795031d7.png)

**注：授权好主仓后，会自动同步主仓的箱子（仅支持极风），需注意只有总库存大于0的箱子才拉取，等于0的不拉取**

### **如果要配对的箱子很多，也可以通过导入的方式批量配对。**

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908041021_2cc5b941c4f94cb1a8756570bcca91b3.png)

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908041200_d17499c1f52f4380970eadfdff88f1e7.png)

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908041333_cf646addb8314c48b2695bc4ee82cf80.png)

### 同步主仓的箱子后也可以使用自动配对功能，如果点击自动配对，会检查主仓箱唛号和代理仓箱唛号是否一致，如果是一样的会自动配对成功。

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908041802_87eb7917bce2439fb891c16b604e5efe.png)

**如果主仓有新增的箱子需要配对，可以点击同步主仓，同步主仓的箱子然后进行配对。**

![图片](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908042756_8c82dceb0dfa42c6a4869a6ae5e4e36a.png)

** ****三、创建备货中转出库单**

**卖家端OMS登录>出库>备货中转出库>出库单管理>新建>填写发货仓库为代理仓、出库类型为按箱出库、及其他信息>保存并提交**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260602083319/8248578d617e5a2c1fb1e90bebbd8e7c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605020800/2a0226a36a71fa7e4a6a06e7bfcc707e.png)

**1.点击新建，填写信息**

**1.1基本信息**

**（1）发货仓库：必填**

**（2）目的地：必填，选择需要发往的目的地**

**（3）物流服务：必填，可以选择亚马逊物流或自有物流/发货仓库物流**

**（4）运单号：选择亚马逊物流/自有物流时必填**

**1.2收件信息**

**（1）选择亚马逊物流/自有物流时，只需要填写收件人和国家/地区**

**（2）选择发货仓库物流时，所有收件人信息必填**

**1.3箱信息&商品信息**

**（1）选择箱子：选择要发货的箱子**

**（2）出库箱数：必填，填写要出库的箱数**

**（3）是否换标：如果需要仓库帮忙换标，可以开启要换标，然后输入新条码，以及上传新条码标签文件**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904031547/60ad51aac515de603f1bc73e0ce323f9.jpg)

**1.4附件上传**

**（1）物流面单：当物流服务选择亚马逊物流/自有物流时，必须上传物流面大**

**（2）BOL、箱唛、其他文件可以选择上传**

**（3）每个类型的附件个数不能超过5个**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904031709/70cca2bb57187bf4213be1104df2e3cf.jpg)

#### 
**2.点击保存或保存并提交**

**（1）点击保存，则返回草稿箱列表，可以在草稿箱列表提交**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904032150/4717dfcd5dd642bf314b04d35e330944.jpg)

**（2）如果是点击“保存并提交”，则返回待出库列表，可查询查看**

## 

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904032248/a7080030028ccb2ed261de72a05b053e.jpg)

#### 
**3.出库单在仓库出库之前都可以上传附件或者取消**

**（1）可在待出库列表操作上传附件或者取消出库单**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904032411/5d6e7ac6c819b6d063372da4ce1444d8.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20240904032447/0e5d833c2919166eb05a23cc630128cb.jpg)
