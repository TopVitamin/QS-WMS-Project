---
sourceId: "JF-OMS-IN-008"
title: "通过店小秘ERP推送入库单"
url: "https://help.jfwms.com/zh_CN/doc-article/7108070602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 入库 > 通过店小秘ERP推送入库单"
module: "OMS帮助文档(新)"
category: "入库"
categoryId: 182
docId: 7108070602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-11T03:18:25.168Z"
---

# 通过店小秘ERP推送入库单

## 一、定义
如果需要在店小秘ERP管理进销存，需要根据平台动态单量，海外仓动态发货数量，来预测库存时间，对需要补货的商品进行预警。并快速创建入库单，推送海外仓。

##  二、操作路径

### 第一步：开启备货建议
登录店小秘ERP系统>仓库>海外仓>仓库设置>开启备货建议

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811031332/0fd23452cf85a74420327c147ef1b7a8.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811031545/e1e6665df8f087aed3756727241621c1.png)

### 第二步：创建备货单
登录店小秘ERP系统，找到仓库>海外仓库>海外仓备货建议>创建备货单

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073259/db141600b3407442ea25b77ddfeadc9b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073512/3b2a4f7083051083541586e959e83769.png)

审核通过后，备货单会进入待发货，点击发货即可推送至海外仓

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073935/c164f27e34f05e296bdd2637c481df1a.png)

若备货单进入缺货列表的话，需要先手动补足海外仓库存，备货单才会进入“待发货”列表，手动点击发货后才能推送至海外仓

#### **补库存方式：创建一个手动入库单（仓库>入库管理>手动入库）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810074519/dd9e645d19fda07be1831bfb3d27e2bd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810075020/39b48f1d7d8a00a3adcc504ae5c6c004.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080210/d7f595e042d45bc369600074438987d9.png)

 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080342/93e29e842cbedd4af7a4d3ae9f1f0b6f.png)

最后点击创建入库单，入库单价不需要管

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080442/151af0d4a47957ea0786481c47aad27a.png)

然后可以回到备货单的位置-缺货-- 移入发货---最后发货就好了（一定要写运单号哦）
