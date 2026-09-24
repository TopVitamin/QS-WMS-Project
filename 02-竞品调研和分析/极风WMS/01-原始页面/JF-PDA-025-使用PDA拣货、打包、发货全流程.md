---
sourceId: "JF-PDA-025"
title: "使用PDA拣货、打包、发货全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108690603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > PDA > 使用PDA拣货、打包、发货全流程"
category: "PDA"
categoryId: 165
docId: 7108690603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-03T02:00:07.386Z"
---

# 使用PDA拣货、打包、发货全流程

**一、定义**

**海外仓使用PDA绑定拣货车拣货，无需打印拣货单。**

** 二、操作流程**

**第一步：拣货车管理**

**设置-拣货车管理-创建，创建之后可以将拣货车的标签打印出来，贴在拣货车上，方便扫描**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015957/a520540e316162bd427edb42c4710045.png)

#### 
**第二步：下载PDA**

**下载地址：**[**https://download.jfwms.com//pda/app-release.apk**](https://download.jfwms.com//pda/app-release.apk)

**PDA下载或者手机下载都可以使用**

#### 
**第三步：波次设置使用拣货车作业**

**在设置-业务设置-波次设置中开启对应波次类型的PDA拣货车配置**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015858/9229932450071e9284f7059dc435895b.png)

**第四步：生成波次**

**出库-生成波次-筛选波次生成条件-生成波次**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015808/bd4ff175f8e76d3ade63b215bb801577.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085349/d7622e58e31657fc2646015dfec69310.jpg)

**如果需要给波次分配给不同的拣货员，可以在波次管理进行分配拣货员操作**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085350/98d1fff43dfe225b7a51830e981ed6a3.jpg)

**（分配拣货员之后，拣货员在PDA上只能看到拣货员是自己的波次以及还未分配拣货员的波次）**

**如果不需要分配拣货员，则生成波次之后不需要进行其他操作，直接登录PDA进行拣货即可**

 

**第五步：打开PDA仓库拣货**

**PDA拣货无需打印拣货单，网页端生成波次后，登录PDA可看到待拣货的波次，选择波次进行拣货即可**

**注意事项：PDA拣货不需要打印拣货单，如果一定要打印，则打印之后不要标记为“已打印”**

##### **1.打开PDA**
**（1）登录PDA的账号密码与登录网页端的一样**

**（2）点击个人中心，可进行仓库、语言等设置**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085351/39865b416d034d2389d8e2bbce6bca10.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085351/011ef590b2f6129c89935684b5bce4e1.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085352/7077b387b42dd3b3aaf4d43c699de256.jpg)

 

 

 

**2.点击“仓库拣货**

**进入待拣货波次列表页面选择波次**

**可以按波次号搜索，或者按照波次类型筛选（可多选）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085353/2739b27ee42fa8c5adcadf286332a9ed.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085353/2950fef8f5d5eecb3cdc77fad48b6266.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085354/f3f7f52ff3fae49ba44fbd05f4fa80a7.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085355/59c9fae2f45ad290be08dc9934c31e96.jpg)

 

##### **3.选择波次，绑定拣货车**
**PDA直接扫描**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085355/f79c7805980dc23de6b26ada1fcf2ef2.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085356/c2ae4e401c79032e28e0986bf7638008.jpg)

 

**如果是手机，可以调用摄像头拍摄**

 

##### **4.绑定拣货车成功后进入拣货页面**
**先拣后分模式拣货**

**单品波次/爆品包裹/多品混包“先拣后分”模式拣货页面如下**

**（1）按照页面显示，找到对应的货架位，扫描拣货对应的商品**

**已拣数量=应拣数量时，自动进行下一个商品拣货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085356/8837641c81d7fc8861b9547f76130d54.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085357/1c32e520f10922f8f55f346418f20a63.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085358/8faa9a6e99606010f8b4e5231c461329.jpg)

 

**（2）如果是使用的手机可以点击调用摄像头拍摄**

**（3）如果数量过多也可以直接点击输入框进行数量填入**

**（4）当所有商品拣货完成时，会自动显示结束作业提示，点击“结束作业”即可完成PDA拣货**

**（5）如果在拣货过程中，遇到实际货架位上的商品缺货时，可以操作“标记缺货”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085358/ee2a1dc5e1c3b5b2e2b7b6ad89ed0f0a.jpg)

**（6）标记当前商品缺货之后，会按照拣货顺序继续下一商品拣货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085359/46f6838f7830f33b816df96b0c4973c6.jpg)

**（7）当完成所有商品拣货时，存在被标记缺货的商品，会自动跳转到波次详情页**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085400/d3c0e92ef4d467de1ea7915140eaf085.jpg)

**（8）可点击缺货页签查看缺货包裹的商品**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085401/bf5d4e51d3b719de056acb4392467d53.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085401/fc773249e5017dce0aa366be7ef1252d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085402/73bf81ea84a93a9b039be896a0fa1c85.jpg)

**（9）点击结束拣货，会有缺货提示，点击“确定”则该包裹会进入异常包裹列表，可在网页端查看**

**（10）可以点击缺货的商品进行继续拣货**

**边拣边分”模式拣货**

**单品波次/爆品包裹/多品混包“边拣边分”模式拣货页面如下**

**（1）按照页面显示，找到对应的货架位，扫描拣货对应的商品**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085403/9fdfb6e0afdcc194b9aab4e2504969df.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085404/a6854d27e069f6bbf51fb3fa2cf72e7f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085405/818f4a7b85b514935a63139baf268ae2.jpg)

**（2）边拣边分模式显示分拣框号，即当前商品应拣多少个放在几号框**

**（3）完成该分拣框的拣货会自动下一个分拣框的拣货**

**（4）也可以快速完成该商品的所有分拣框的拣货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085405/85be753d35ddc4f3700e940415f067b1.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085406/f543e6155fc26769c4faf79ad4b9e2f0.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085406/5ed7ee60846c8c1ea70ccb7fcb6233ad.jpg)

**（5）打开页面，依次点击“完成”即可**

**（6）都完成之后，继续下一商品拣货**

**剩下其他的操作跟单品的一样**

#### 
**第六步：拣货完成打包**

**拣货完成到待包装，打开极风WMS-出库-扫描包装（下方图片教程）**

**（海外仓也可以根据自己的需求，在波次页面直接打印面单）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015702/64f05ae157b7a4042ef46f5105742c6d.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822022614/5f12133b358f8342397dd9c467014573.jpg)

**依次扫描订单SKU，打包结束后点击结束作业**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822022821/0436beb2f49eddbb1f72219906124f11.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822022831/984bc4bc114285ec376650c770f31a67.jpg)

#### 
**第七步：发货**

**仓库打印完面单，包装好包裹，可以点击发货，也可以扫描（称重扫描）发货，也可以设置打印面单自动发货。**

##### **方法一：手动点发货**
**出库-出库包裹-待发货-选择订单-点击发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822023120/6e62bb324581c7bd7cfd178cdb341b9a.jpg)

##### **方案2：扫描发货或称重扫描发货**
**先设置扫描发货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015542/e60a0de21618c7b8090d30031a7bcb74.png)

**然后扫描发货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603015610/6588a5b222c8cb3a8ba0ac40f1e3ff9f.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822023054/675cfc2275cb9508a1169f73c3934fa2.jpg)

**在这个界面扫描包裹运单号标记发货。**

##### **方法三：设置打印面单自动发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250822023029/b71f18bb308e9489c9803249b09138f1.jpg)
