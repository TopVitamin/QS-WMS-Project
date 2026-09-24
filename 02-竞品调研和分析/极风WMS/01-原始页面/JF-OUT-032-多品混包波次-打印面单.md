---
sourceId: "JF-OUT-032"
title: "多品混包波次-打印面单"
url: "https://help.jfwms.com/zh_CN/doc-article/7107530601-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 多品混包波次-打印面单"
category: "出库"
categoryId: 170
docId: 7107530601
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-13T12:47:27.104Z"
---

# 多品混包波次-打印面单

**一、定义**

波次完成分拣作业之后，在进入包装作业打印面单，可以使用扫描商品标签逐个打印面单，也可以扫描分拣框号逐个打印面单，或者批量打印面单。

注意事项：扫描包装环节需要安装打印插件

      打印插件下载地址：[https://download.jfwms.com/print/plugin/java/jf_printer.exe](https://download.jfwms.com/print/plugin/java/jf_printer.exe)

      可下载打印回车码用于逐个扫描确定打印面单

      回车码下载地址：[https://download.jfwms.com/product/temp/setting/file/1/20240305052832/b713a3f0d1e571c23ef74485a6b3288f.pdf](https://download.jfwms.com/product/temp/setting/file/1/20240305052832/b713a3f0d1e571c23ef74485a6b3288f.pdf)

### 
** 二、操作步骤：**

**方法一：扫描商品标签逐个打印面**

**Step1：安装打印插件之后双击打开打印插件**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091032/e2908f9012432fd9a3c9cdf56461e8cc.jpg)

**Step2：前往波次设置进行设置打印方式**

**功能入口：设置-业务设置-波次设置-面单打印方式**

**将多品混包面单打印方式设置为“扫描商品标签逐个打印”**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094806/a2bc25ea8589fa76269f78358d91f757.png)

**Step3：扫描拣货单上的条形码或者是输入波次号进入波次包装作业页面**

**功能入口：出库-扫描包装（只有当波次的状态是待包装时，才能进行扫描包装作业打印面单）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094843/6dcc9d14475ce5acc6ba3d237eeb6d05.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091034/5c7e8e0f229c9f7d20548c902e2e4cdb.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091034/4bf1ccc9aa6d03870420b25c5d40cce4.jpg)

**Step4：扫描商品标签或输入商品SKU后点击回车**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091035/82b5d97b279a887d9a290ca99d9eebe6.jpg)

**Step5：选择包材**

**若出库设置-包材出库中选择了“开启包材出库计费”，则需要在扫描包装环节选择包材（若没有开启包材出库计费则不需要选择包材）可在出库设置中设置**[**出库设置**](https://jifengwms.feishu.cn/docx/C1CxdjBs0o6r6Qx8uWecaUsanPe?from=from_copylink)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091036/4b62a64d56ea25179259ba0884b62fe2.jpg)

**Step6：将分拣框里的商品都扫描结束以及选择包材之后，点击确定/回车/扫描回车码，确认包裹信息打印面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091036/ce7738fcd82941f2cffbdf0357f4d306.jpg)

**Step7：包裹信息无误，系统会打印一张该包裹的面单，并生成一条面单打印记录，面单打印状态为“已打印”**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091037/f58af5b7ae4e0c2f39250f503b35213d.jpg)

**Step8：可以继续扫描下一个分拣框里的商品打印下一张面单**

**Step9：当波次中所有的包裹都打印面单之后会自动弹出提示弹窗，可直接点击“结束作业”，则波次状态变为“已结束”，包裹进入“待发货”状态，可前往“扫描包装”进行发货操作，或者进入包裹管理-待发货列表进行手动点击发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091038/7c0fa6d91ffd376037cb47c9f48db721.jpg)

** **

#### 
**方法二：扫描分拣框号逐个打印面单**

**Step1：安装打印插件之后双击打开打印插件**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090941/ce071020da520a0572079d88fe1db210.jpg)

**Step2：前往波次设置进行设置打印方式**

**功能入口：设置-业务设置-波次设置-面单打印方式**

**将多品混包面单打印方式设置为“扫描分拣框号逐个打印”**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094929/3f7c0ce31be5a24052b21b59bb511778.png)

**Step3：进入波次包装作业页面**

**功能入口：出库-扫描包装（只有当波次的状态是待包装时，才能进行扫描包装作业打印面单）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094843/6dcc9d14475ce5acc6ba3d237eeb6d05.png)

**扫描拣货单上的条形码或者是输入波次号后点击回车即可进入扫描包装作业页面**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090943/900c72bfe5851ab680f741ce14ed1627.jpg)

**Step4：进入包装作业页面后，扫描分拣框号，或者输入分拣框号后点击确定/回车**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090944/3240fa501855547ec4d60379a15a02e3.jpg)

**Step5：选择包材**

**若出库设置-包材出库中选择了“开启包材出库计费”，则需要选择包材（若没有开启包材出库计费则不需要选择）**

**可在出库设置中设置**[**出库设置**](https://jifengwms.feishu.cn/docx/C1CxdjBs0o6r6Qx8uWecaUsanPe?from=from_copylink)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090944/57bcbf2fc1e7a55ad4ac7222bb0b5a98.jpg)

**Step6：选择包材之后，人工核对分拣框内的商品信息以及数量是否正确，不需要扫描商品标签，如果正确就点击确定/回车，或者扫描回车码，确认打印面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090945/d2a96ca42c6c49b17f1ce99a1d88f5a9.jpg)

**Step7：面单打印成功后，会生成一条打印记录**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090946/a9e7afae4432d8a45d5c82b36e01eef4.jpg)

**Step8：继续扫描下一个分拣框号，继续打印下一个包裹面单**

**Step9：当波次中所有的包裹都打印面单之后会自动弹出提示弹窗，可直接点击“结束作业”，则波次状态变为“已结束”，包裹进入“待发货”状态，可前往“扫描发货”进行发货操作，或者进入包裹管理-待发货列表进行手动点击发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090947/ec87b5a2525315c97a34ba7044df31ac.jpg)

#### 
**方法三：批量打印面单**

**Step1：安装打印插件之后双击打开打印插件**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090913/0bb2a2dcc07b33e8f80cef8776acade9.jpg)

**Step2：前往波次设置进行设置打印方式**

**功能入口：设置-业务设置-波次设置-面单打印方式**

**将多品混包面单打印方式设置为“扫描拣货单批量打印”**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601095106/76955c835f7cdaca41bf0edf30068846.png)

**Step3：进入波次包装作业页面**

**功能入口：出库-扫描包装（只有当波次的状态是待包装时，才能进行扫描包装作业打印面单）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094843/6dcc9d14475ce5acc6ba3d237eeb6d05.png)

**扫描拣货单上的条形码或者是输入波次号后点击回车即可进入扫描包装作业页面**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090915/081d4088e210a39cbea57b3ec8b32b37.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090916/303d41d90f2a8bb963fda940d43e5cc9.jpg)

**Step4：进入扫描包装作业页面，选择包材**

**若出库设置-包材出库中选择了“开启包材出库计费”，则需要选择包材（若没有开启包材出库计费则不需要选择）**

**可在出库设置中设置**[**出库设置**](https://jifengwms.feishu.cn/docx/C1CxdjBs0o6r6Qx8uWecaUsanPe?from=from_copylink)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090916/0441fbbbfc14b5be126ba466484a8fa7.jpg)

**Step5：选择包材之后，可勾选包裹进行面单打印**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090917/eec9edc000e358fab7a58b580302e2a3.jpg)

**点击打印之后后又打印进度显示**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090918/f44f3ee4ed0220da16b7e9555670742a.jpg)

**Step6：点击关闭弹窗后，若波次中所有的包裹都打印面单之后会自动弹出提示弹窗，可直接点击“结束作业”，则波次状态变为“已结束”，包裹进入“待发货”状态，可前往“扫描发货”进行发货操作，或者进入包裹管理-待发货列表进行手动点击发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090918/4aa7a5da9f419fe896e06da1b57ebfd9.jpg)
