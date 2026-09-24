---
sourceId: "JF-OUT-009"
title: "极风WMS出库打包、验货视频录制功能"
url: "https://help.jfwms.com/zh_CN/doc-article/7107180526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 极风WMS出库打包、验货视频录制功能"
category: "出库"
categoryId: 170
docId: 7107180526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-14T03:52:29.418Z"
---

# 极风WMS出库打包、验货视频录制功能

## **一、定义**
**扫描包装环节增加录制视频功能方便后续仓库排查包裹是否漏发等现象**

## **二、前期准备**

### **1、下载客户端**

### 注意：如果之前有安装过此客户端，需要重新下载安装新的客户端，安装的时候换一个新目录，不要和之前的安装在同一个目录下，需要把之前安装目录下的License.lic授权文件复制到新的目录下，替换之后之前安装的客户端需要删除

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260807104459/287d78173c0b16a90203b1d12df6da66.png)

![企业微信截图_17860943725288.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260807104523/ea8b143683c3911078b7998414f75455.png)

### **2、安装完成后，任务栏右下角会显示中间件图标。**
**灰色-相机处于离线状态**

![图片](https://download.jfwms.com/prod/static/back_help/img/84/20260425090643/01b268287df545a21122df4f8f79879d.jpg)

**蓝色-相机处于在线状态**

![图片](https://download.jfwms.com/prod/static/back_help/img/84/20260425090614/ee6a6306c0d10b7a40f4f4ac39b76f0d.jpg)

### ** ****3、进入WMS设置-服务授权，新建设备授权，选择设备类型：视频录制，保存成功**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526115825/9824eebfaaf1e831c077795fedffc0c7.png)

### **4、复制创建好的token，替换HSJVideos设置中token；**
**注意事项： 设备号就是上图中的设备编号，Token就是上图中的Token，与当前账号token绑定后，只能使用当前账号开启视频录制；其它账号无效****监控相机IP：可自定义
上传域名：自定义， 测试环境默认test15,生产环境需要替换成客户自己的WMS域名；****最大录制时间：默认10分钟，可自定义HTTP服务端口： 默认8283端口，前端对接接口地址，不允许更换

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526115904/be52cd188a20c69c5f324293de08d409.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/84/20260425081726/f4d071b2fe4865fddee06b1180659418.jpg)

### 5、设备连接检测**
浏览器输入监控设备IP地址**账号：admin密码：123456

## 三、请求接口说明**
**由鸿顺捷提供API接口请求/响应格式及协议，客户根据该API请求/响应格式及数据传输协议，自主实现符合客户物流系统逻辑的接口内部业务功能，并提供API接口地址请求鸿顺捷服务端软件，具体参数定义参考下面文档 。**

**注：目前仅支持对接鸿顺捷，****需要设备对接，请联系极风实施沟通，需要鸿顺捷技术远程配置**

## **四、操作说明（特别说明，扫描包装功能是属于波次类型的出库方式）**
**目前支持扫描包装功能中按照 扫描商品标签出面单、扫描分拣框打印面单这两种方式录制视频。也支持扫描验货环节录制视频**

### 1、进入扫描包装页面，如果波次设置里面的面单打印方式是扫描商品标签出面单、扫描分拣框打印面单的话，可以直接启用视频长录制功能。如下图所示

#### **（1）扫描商品标签打印面单的视频录制页面展示，打开视频录制按钮就会开始录制功能了。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260701094202/8c3eb8815190bafd6cf38131eccf841c.png)

#### **（2）扫描分拣框号打印面单的视频录制页面展示，打开视频录制按钮就会开始录制功能了。**

![企业微信截图_17828985239870.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260701093553/69af9511db4ded04e0f8cd40cc92eea4.png)

**特别注意：挂起/结束波次 终止当前长视频录制功能并异步处理每个包裹分片视频上传。当打出第一单的面单后会记录面单生成节点，这时视频还在录制，当扫第二单的sku/分拣框号时开始录制第二单，依次进行处理**

#### **（3）波次结束后，视频会上传在出库列表待发货/已发货，可以自行查看包装视频录制效果**。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526120010/8263fa817bd84a3f89e57050dba00eed.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/84/20260425082514/3ed8792829f9c888a4fd3474ff2369dd.jpg)

#### 2.扫描验货功能也支持开启视频录制功能，进入扫描验货页面-打开视频录制功能即可开始录制功能，完成验货后，这个验货的视频可以在待发货或者已发货页面找到（这个是针对单个订单进行验货的过程）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260701102830/37589c5c89fb6e8f3877f2649ebf93c0.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260701103858/e2994cee6eaf9737a6d8abb2ea65f1d5.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/84/20260425082514/3ed8792829f9c888a4fd3474ff2369dd.jpg)

**特别注意一下： 如果想要整个波次进行验货并且录制视频的话，目前仅支持单品单数的波次跟爆款的波次，在扫描验货环节输入对应的波次号-打开视频录制按钮即可开始录制。完成录制后，在待发货或者已发货页面找到视频（也归类在包装视频里面）即可。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260701104518/afd2e08811370e9d0d4b2b547c7174cf.png)

**注意：扫描验货录制视频是以开启视频录制后开始录制，判断当扫描第二个订单的包裹号/运单号的时候记录第一个包裹录制结束节点，依次进行处理**

**3、WMS录制的打包视频可同步到客户oms端查看，可在一件代发出库-已发货页面查看**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260814035122/3bbbb426445ece46af1a561247b890cd.png)
