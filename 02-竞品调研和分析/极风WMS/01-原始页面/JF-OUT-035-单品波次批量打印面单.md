---
sourceId: "JF-OUT-035"
title: "单品波次批量打印面单"
url: "https://help.jfwms.com/zh_CN/doc-article/7107560602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 单品波次批量打印面单"
category: "出库"
categoryId: 170
docId: 7107560602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-13T12:48:10.597Z"
---

# 单品波次批量打印面单

**一、定义**

当仓库订单比较多，且单品出单比较多，可以生成单品波次，打印拣货单后，直接扫描拣货单，批量打印面单。

### 
** 二、操作路径**

**注意事项：扫描包装环节需要安装打印插件**

**打印插件下载地址：**[**https://download.jfwms.com/print/plugin/java/jf_printer.exe**](https://download.jfwms.com/print/plugin/java/jf_printer.exe)

**可下载打印回车码用于逐个扫描确定打印面单**

**回车码下载地址：**[**https://download.jfwms.com/product/temp/setting/file/1/20240305052832/b713a3f0d1e571c23ef74485a6b3288f.pdf**](https://download.jfwms.com/product/temp/setting/file/1/20240305052832/b713a3f0d1e571c23ef74485a6b3288f.pdf)

#### 
**第一步：安装打印插件之后双击打开打印插件**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425133528/bcf333b5815e50571331ea8980b82e1c.jpg)

#### 
第二步：前往波次设置进行设置打印方式

功能入口：设置-业务设置-波次设置-面单打印方式—设置为“扫描拣货单批量打印”

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602021629/58e4bbf6ac7761ff71c49cb302ac6ffd.png)

第三步：生成波次，拣货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604125137/9426121e3bfe07f290306ea7f169cf4b.png)

生成波次后，在波次管理页面可以打印拣货单

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604125213/73af0d5f9316da2a9ee7efa1546bb34e.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425133855/f066f607fc346aac68a7b152aac3c1f6.jpg)

打印完成后标记已打印

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425133856/b183df7301c2bc56326ee35802f2d075.jpg)

#### 
第四步：扫描拣货单上的条形码或者是输入波次号进入波次包装作业页面

功能入口：出库-扫描包装（只有当波次的状态是待包装时，才能进行扫描包装作业打印面单）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602022214/4025cefebe55d5ef0d7c5eaff71b4bd4.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425134250/cac25608b6e881a2e0d635ef1cbf686d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425134344/b6e3bc38d40a3fe098ae2e3b1b392f95.jpg)

#### 
第五步：进入包装作业页面后，选择包材

若出库设置-包材出库中选择了“开启包材出库计费”，则需要在扫描包装环节选择包材（若没有开启包材出库计费则不需要选择包材）可在出库设置中设置[出库设置](https://jifengwms.feishu.cn/docx/C1CxdjBs0o6r6Qx8uWecaUsanPe?from=from_copylink)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091127/060af43ed02e74b82e10ecc3fb3d0dfa.jpg)

#### 
第六步：包材选择之后会自动打印面单，勾选打印面单

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091128/0f95bf0b30825e77d87957ef5cfacafb.jpg)

#### 
第七步：开始打印面单会有进度弹窗显示

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091129/76f12182ca2c64d5957086eb0e8b3d4e.jpg)

#### 
第八步：打印完成后，关闭进度弹窗

若波次中所有的包裹都打印面单之后会自动弹出提示弹窗，**可直接点击“结束作业”，则波次状态变为“已结束”，包裹进入“待发货”状态，可前往“扫描包装”进行发货操作，或者进入包裹管理-待发货列表进行手动点击发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091129/6b07957eb417322b39b64c4a397a43fa.jpg)
