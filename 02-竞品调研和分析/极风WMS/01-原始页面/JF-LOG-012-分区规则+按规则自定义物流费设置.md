---
sourceId: "JF-LOG-012"
title: "分区规则+按规则自定义物流费设置"
url: "https://help.jfwms.com/zh_CN/doc-article/7106710525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 分区规则+按规则自定义物流费设置"
category: "物流渠道管理"
categoryId: 163
docId: 7106710525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T08:06:24.817Z"
---

# 分区规则+按规则自定义物流费设置

###  **一、定义**
海外仓拿到物流账号，根据国家、城市、邮编设置分区规则，根据分区规则+重量段设置物流计费，实现物流费精准计算物流费。

** 二、操作流程**

**第一步：轻松搞定 “邮编分区”**

**物流分区的核心是 “邮编范围”**

##### 
**方法一：物流商提供邮编范围**

**大多数物流商（有商务服务人员的物流商）会提供报价表，里面附了详细的分区规则（哪个邮编属于哪个区），直接拿来用；**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825061713/b154ebaab911e083240e67e3a4841223.jpg)

##### 
**方法二：官方物流商获取邮编**

**像USPS这类官方物流，直接去官网https://postcalc.usps.com/DomesticZoneChart ，输入发件人3位邮编，就能获取对应地区的分区和邮编范围 —— 精准又权威**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825061741/9c0da639f2352f41c073f4d16eb0aab1.jpg)

#### 
**第二步：整理分区规则表，“无缝对接” 系统**

**拿到分区数据后，不用手动一条条输，可以使用系统“批量导入”分区规则，省去手动输入的麻烦，还能避免填错邮编范围。**

**打开极风海外仓管理系统，进入 “物流 - 分区规则”，点 “新建”；**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525092605/d9c0bc3170736e7a04b7517ab5aa2c9f.png)

**自定义分区规则，匹配方式，系统会显示需要填写的字段（分区代码、国家 / 地区、城市、开始邮编、结束邮编），按这个格式整理你的分区表格（比如 “Zone1美国 洛杉矶90001 90099”）；**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604080327/73d0103279a9e91551b8cedfea838c65.png)

**打开物流商的可达分区邮编表，按照系统分区规则的格式，整理成系统分区规则表，整理好后直接复制粘贴到系统！省去手动输入的麻烦，还能避免填错邮编范围！**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825061812/ca48fcc009120d1da59cb4ba5f00afcd.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604080403/6bdbe74a00a46094a7c6f0216b15b077.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604080442/729f00b9848eec5be23945fb9b27ec70.png)

**第三步：自定义计费方案，按 “分区 + 重量” 精准收费**

**分区规则建好后，就能根据业务需求设置计费策略，想怎么收就怎么收： 进 “物流 - 物流计费策略”，点 “新建”：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525092517/f7c295181031222dee564c6253a4f6b9.png)

**自定义策略名（比如 “USPS美国专线计费”），选仓库、物流渠道、收费币种（美元 / 欧元等）；计费方式选 “按规则计费”，选择USPS物流渠道，选择货币单位，选择体积重计算方式；**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525092439/c2d77b3e5d5d62efa8c7e269c62884df.png)

**先找到自己的分区价格表，然后选择分区规则，按 “分区 + 重量段” 填价格：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825062705/2c0cf5581e816532b149f51a7018ede0.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825061907/e0750cb1d53104f91258d144731cf937.jpg)

**部分渠道需要按照包裹尺寸三边和进行运费配置，配置后的尺寸区间和重量区间变量关系为【或】，优先选择最大的命中区间来计算基础运费**

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20260502171953/064d18e8923569abb3678573f272c4e5.jpg)

**超长超重或者偏远地区附加费也能加，面单取消费也可以设置，系统会自动叠加计算。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825061920/2b2a815f72fdb9e7751c0bfa504df73c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250825062004/3ef20515f8c9e9f45c4723e597ae9fb5.jpg)
