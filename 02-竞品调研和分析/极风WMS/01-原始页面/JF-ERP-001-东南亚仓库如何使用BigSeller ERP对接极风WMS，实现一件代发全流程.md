---
sourceId: "JF-ERP-001"
title: "东南亚仓库如何使用BigSeller ERP对接极风WMS，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108880603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 东南亚仓库如何使用BigSeller ERP对接极风WMS，实现一件代发全流程"
category: "ERP授权"
categoryId: 178
docId: 7108880603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-02T10:14:47.846Z"
---

# 东南亚仓库如何使用BigSeller ERP对接极风WMS，实现一件代发全流程

## **一、授权店铺**
**第一步： 登录BigSeller > 进入首页，鼠标放到右上角的设置按钮的位置，点击店铺授权功能**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629012522/049e7bbd9d13472acf8bf24578586d27.png)

#### 

### **第二步： 选择平台（下面用Shopee举例） > 点击立即授权，您将进入到平台授权页面**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629013021/7f41a6519c63d45fb212afb6ce889f71.png)

**第三步： 选择站点 > 输入Shopee账号和密码 > 点击Login**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092956/b899203f56e4df689582cfe1de59bb4a.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092957/87d6f1f0886dbea9ba6748fc63c734da.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092958/5e05517ed56dd41850329f9726c7b2b8.jpg)

#### 

### **第四步：编辑并确认BS店铺昵称**
**为了保证BS店铺昵称的唯一性，无法使用与您当前BigSeller账号下已存在的BS店铺昵称相同的昵称进行填写；如果您不确定昵称是否被使用，可以到设置>授权中心>店铺授权页面进行搜索。**

** **

### 

## ** 二、创建商品SKU**

#### 

### **第一种创建方式：单个新增商品SKU**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629014344/79dd4fb055e6be82c13b82e15eff4feb.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629014541/f0a4266e37653e960eff3a1df2bad20a.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251020110248/dbfbd2158085cd401bd8a3e030947800.jpg)

#### 
**第二种创建方式：导入表格创建商品SKU**

**如果店铺卖家中心没有填写SKU，或填写的SKU与仓库中的不一致，可采用该方式创建**

**第一步：点击库存 点击导入＆导出 点击导入商品SKU点击创建商品SKU**

**不要点创建组合SKU，三方仓不支持组合SKU**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629014802/de775916861c31f606b9608e096abfa6.png)

### **第二步：下载表格模板 > 按要求编辑表格 > 返回BigSeller商品SKU页面 > 上传文件 点击确定，完成创建**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093004/69011c7ababf27abc9fa45269ddc791f.jpg)

**注意：**

**1、表格里不要填写仓库**

**2、SKU字符数量需在2~50范围内，仅支持数字、字母、及特殊符号 空格 （ ） _ . - * + #**

** **

### **第三步：匹配店铺SKU**
**【单个设置】 您可以在商品SKU编辑页或者操作栏单个设置商品SKU的匹配关系 在商品SKU操作栏操作如下图所示**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093005/93e37569b58cd23d9f26fa9c1892182b.jpg)

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093005/187a2014e30df40432473c04b1f0d3c7.jpg)

**在商品SKU编辑页操作如下图所示**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093006/aac4d0fe1d93441369a2f9dc0ff0d942.jpg)

** **

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093007/a12bad64e4b7f711f2ddf51b6de8fea3.jpg)

**【导入表格批量设置】**

**第一步：下载表格模板 点击商品SKU导入&导出 导入匹配店铺SKU点击下载模板，系统会弹出下载提示框**

**注意：一定要用BigSeller提供的模板导入匹配**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093008/87f61dbb36dad1c80a551b5d6b4bc3e5.jpg)

**第二步：模板下载完成后，打开表格进行编辑。在表格里填写想要匹配的商品SKU和店铺SKU，填写示例如下：**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093008/6985dbfa42b77f0c9ee15ad8cf303c9a.jpg)

**第三步：表格填写好之后，导入表格完成匹配 点击导入&导出 导入匹配店铺SKU点击上传文件**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093009/d68d77879447e6ab58e7ff05d26a4b06.jpg)

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093010/060af43ed02e74b82e10ecc3fb3d0dfa.jpg)

** **

### 

## ** 三、开启库存功能**
**需要开启库存功能之后才能授权三方仓，开启库存功能的入口如下：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629015704/04f47880b610bb0c821d510f7b7b1da6.png)

** **

### 

## ** 四、授权三方仓**

### **第一步：点击授权中心 点击第三方仓库授权 点击+授权 输入授权信息 > 点击授权完成三方仓授权**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629020118/cdb40f92e09580c276c86a961721f5cb.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629020334/51de5d1af7bf7c245699313cc4a68b4e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629020515/55897da2c3b31e391fef2e4dc84b4f5c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629020622/a81629c6d0765f4ae832a7c038f57b5e.png)

### **第二步：创建三方仓仓库**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093014/36bd0ad19d4c06c836098711bf775493.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093014/511620b2e7d53cc112df2550533f3157.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093015/0f95bf0b30825e77d87957ef5cfacafb.jpg)

** **

### 

## ** 五、推送商品SKU**

### **第一步：进入商品SKU页面（库存>商品SKU） > 点击推送三方仓 > 选择需要推送的商品SKU > 点击推送三方仓**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629020921/4dd3717f2e037727a0e48a0b58627acf.png)

** **

### **第二步：选择商品或将全部商品推送到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093016/6e5aef5a4aa3a7a7e1abe8a559672016.jpg)

** **

### 

## ** 六、推送采购单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093017/f402ef816fbdb2ab097f4698d344126c.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629021143/fbf59a81e94d29896cf1794dabccaa4b.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093019/7077b387b42dd3b3aaf4d43c699de256.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093020/98e7020c6467030782a12611521685b2.jpg)

** **

** **

### 

## ** 七、同步三方仓库存**
**注意：这一步要在仓库初始化库存，或完成您的采购单之后才能执行**

** **

**进入库存清单（库存>仓库管理库存清单） > 选择三方仓 > 勾选想要同步的商品SKU > 点击同步三方仓库存 点击同步所选商品库存 检查库存数据 > 确定更新**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093020/24ef107f69f97752386d3b9af1401237.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093021/da7f7bd381608839610a0c8cabad4a83.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093022/0068af2851005e2b3b707af50a439b41.jpg)

### 

## ** 八、设置自定义面单**

### **第一步：前往：设置>打印设置>面单打印>添加模板**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629021517/331705059c7c9b589e92d733678c36f0.png)

** **

### **第二步：按照下图所示设置自定义面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093023/9369eac99af82dd183c19ecf74356b7f.jpg)

** **

** **

** **

** **

### 

## ** 九、推送订单到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093024/f9a746f343725bd1bc5463c220c2aad3.jpg)

**1、进入订单 > 【待处理】列表，点击安排订单。或者也可以批量勾选订单，点击批量操作，选择三方仓库，选好后确认推送订单即可。**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905093025/b08c6da76fbf9e463a696e24690d0d46.jpg)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629022125/482c84726ddb23cbf73124d7cd0159c2.png)

**2、在BigSeller安排订单后，订单将会自动推送三方仓。等待三方仓处理订单后，BigSeller自动同步订单最新状态。**

** **

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260629022328/2e791aca2b7962295090d37213d8154d.png)
