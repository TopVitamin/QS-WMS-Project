---
sourceId: "JF-LOG-035"
title: "按自定义规则设置物流费"
url: "https://help.jfwms.com/zh_CN/doc-article/7106920526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 按自定义规则设置物流费"
category: "物流渠道管理"
categoryId: 163
docId: 7106920526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-28T16:47:43.242Z"
---

# 按自定义规则设置物流费

## **一、定义**
当不按照物流费率计费时，可以按照自定义规则，或者不同州、省、地区，或者偏远地区设置物流规则，按照规则计算物流费。需要先建分区规则，再设置物流计费策略。

当订单在仓库wms状态是发货成功后才会扣除

## ** 二、操作路径**

### 1、新建分区规则
计费>分区规则>新建>填写基本信息>填写规则详情>保存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526081609/9a10e253e1f37ea4a7eb60b581a21dd4.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604061323/ec083e1feea59272bcb3b6efc63d6afe.png)

基本信息：

**（**1）规则名称：输入方便记忆和辨识的名称即可

（2）匹配方式：下拉选择匹配方式，

如果是通过邮编进行匹配分区的，选择邮编全匹配

如果是通过国家进行匹配分区的，选择国家/地区匹配

如果是通过国家+城市进行匹配分区的，选择国家+城市匹配

规则详情

可以添加行设置规则详情，也可以通过复制粘贴快速编辑

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604061350/104cd3486d8a4bcfd1f005c6168f4ee3.png)

第一步，先点击复制，将系统里的分区代码、国家地区、城市、开始邮编、结束邮编这些信息复制并粘贴到excel表

第二步：再excel表整理好分区信息之后，再将整理好的信息粘贴到系统里

### **2、偏远地区规则设置**
操作路径：物流>偏远地区规则>新建>填写基本信息>填写规则详情>保存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526082736/fda28ac26572e46292f9395881f4c44a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604061421/92e82561b936bae88c1fd60c568402cb.png)

### 3、新建物流成本
如果不需要核算成本利润，这一步可跳过。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526083346/d255ba054cafb541a04310d88b9df166.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526083451/3e381dba1b01d938bc2d74e28a1c5502.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604061449/cdfebaf55582c1854830763905c88169.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/59/20260331120056/c1772d05894e913455daed3d76a4338c.jpg)

若需要按照包裹尺寸三边和进行运费配置，可添加尺寸变量，添加后，按三边和以及重量端价格取最大值。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628163555/b4bd6fbc39d45cad4b8e8f6973511596.png)

若有附加费，则添加附加费

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628164547/3f7c0ce31be5a24052b21b59bb511778.png)

### 4、新建按规则计费策略
仓库端WMS>计费>物流计费>选择按规则计费>填写规则详情>选择分区规则，设置收费计费标准>附加费>保存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526083622/63e2f61041a527645ae933033f4bcbc3.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604061523/69cc5839b8a0911a304f930f8918c0fc.png)

在选择分区规则时，可设置收费标准

![图片](https://download.jfwms.com/prod/static/back_help/img/59/20260331120442/bfdda20a84907dbd518374b4d0147e1e.jpg)

若需要按照包裹尺寸三边和进行运费配置，可添加尺寸变量，添加后，按三边和以及重量端价格取最大值。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628163555/b4bd6fbc39d45cad4b8e8f6973511596.png)

# 5、新建物流附加费

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260514024935/7256088590fa791ed9d1072dce6a029d.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260514025621/274bd774289b6a20128dfca16a113cc1.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260514030252/56fd77effe527ccfe933d266d5b29f17.png)

**注意事项：**

物流计费策略：一个【计费策略】只能绑定一个物流产品，一个【物流产品】支持被多个计费策略引用，保存后不可以修改物流产品。

物流旺季附加费：按附加费计费，支持同一个费用项多条价格设置规则，同一个附加费类型生效不能重复。

超长/超重附加费：指定费用项若同时命中，则比较取大值费用项（若金额相等，则按照以下顺序优先选择计费项：超体积附加费、超限制附加费、超大附加费、超重附加费、超长附加费），若单选费用项，则该费用项条件命中直接计费。
