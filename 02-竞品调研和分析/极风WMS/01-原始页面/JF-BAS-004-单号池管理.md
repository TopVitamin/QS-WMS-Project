---
sourceId: "JF-BAS-004"
title: "单号池管理"
url: "https://help.jfwms.com/zh_CN/doc-article/7114760820-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 单号池管理"
category: "基础设置"
categoryId: 159
docId: 7114760820
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-20T20:29:12.557Z"
---

# 单号池管理

## 一、定义
使用仓库的线下物流下单时，一般是物流商返回单号和面单，在WMS系统进行面单打印。但是部分物流商是先给用户一批可用的运单号，在WMS上建立单号池（例如韩进物流）——海外仓WMS在物流下单调接口传参时，从单号池取一个单号，传配送类型S+运单号+订单信息——物流商返回面单在WMS系统进行面单打印。

## 二、操作流程

### 1、授权线下物流。（以韩进物流举例）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820201814/514f2d525c90378b9627b5eefa9dccfd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820202055/7518c1e687bebcaa5acababc360e79a7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820202009/e6cf64239ff40aaf8d9d078fa9416fa3.png)

### 2、添加物流渠道。设置配送类型【S自打单】，则需维护单号池——物流下单调接口传参时，从韩进单号池取一个单号，传S类型+运单号+订单信息——物流商返回成功——流转至待打单状态进行打印面单即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820202425/daa827103116009408c00933a8baf4de.png)

### 3、维护单号池。设置——基础设置——单号池

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820202554/9718e05c30775db765e831e8c55ad6cd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260820202704/6e8cbb6f14e9235a8886565b5a9a5329.png)
