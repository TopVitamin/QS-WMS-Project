---
sourceId: "JF-OUT-010"
title: "极风WMS退货视频录制功能"
url: "https://help.jfwms.com/zh_CN/doc-article/7114480812-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 极风WMS退货视频录制功能"
category: "出库"
categoryId: 170
docId: 7114480812
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-14T03:44:28.941Z"
---

# 极风WMS退货视频录制功能

## **一、定义**
**退货入库签收时录制视频，向商家举证提供证据，减少售后纠纷的时长，保证视频录制的唯一性，也可追溯人员操作中发现问题定位。**

## **二、前期准备**

### **1、下载客户端**

### 注意：如果之前有安装过此客户端，需要重新下载安装新的客户端，安装的时候换一个新目录，不要和之前的安装在同一个目录下，需要把之前安装目录下的License.lic授权文件复制到新的目录下，替换之后需要把之前安装的客户端进行删除

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

## **四、操作说明**

### **1、进入退货入库签收界面，可以直接启用视频长录制功能。如下图所示**

#### **（1）扫描退货视频录制页面展示，打开视频录制按钮就会开始录制功能了。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260812061747/811cfc4c706b8bef125e74bf1d5ad92d.png)

#### **（2）退货包裹录制，视频会上传在已完成，可以自行查看退货视频录制效果**。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260812061935/5127c31314947d98fad07c13ca636b5a.png)

### **2、退货包裹视频同步给oms端查看，在退货入库订单查看。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260812064112/382c87c8424692e9ed7239084af4a17f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260812064228/e8635d9464a8c2b1ac682c6f75ef8b80.png)

**特别注意：每笔退货包裹以单号视频录制裁剪节点，按照扫描下一个单号做节点，点击【确认入库】，视频按照最终结果保存，上传云端。**
