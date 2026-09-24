---
sourceId: "JF-OMS-ERP-006"
title: "赛狐ERP店铺授权、推送商品、处理订单全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108480602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 赛狐ERP店铺授权、推送商品、处理订单全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108480602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T03:07:51.526Z"
---

# 赛狐ERP店铺授权、推送商品、处理订单全流程

**一、定义**

卖家通过赛狐ERP授权店铺、推送商品、处理订单全流程

** 二、操作流程**

**第一步：授权仓库**

**授权前准备工作：**

**1.给操作角色打开三方仓库存权限**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124452/3bd4654e3c4d44fa5d8d2d3abcce1044.jpg)

**2.请在授权前与服务商确认，是否已将仓库服务商加入到赛狐三方仓服务商列表！否则无法在授权资料中选择海外仓服务商**

**Step1:前往赛狐授权页、点击“授权”**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124456/446d943b4603cbaaec48c91dca003d65.jpg)

**Step2:在极风OMS中获取授权资料**

**获取方式一：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602120835/ae38ed60e5cda23497d9eff5f8a79505.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602120932/2d743ca26c5ae63d2811e278cb5d9164.png)

**获取方式二：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030731/9220654a6e8df267b824adfe08b1dcc2.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030701/4d14e39225a05a350c8f241b3824ed24.png)

**Step3:进入授权页面填写授权资料**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124459/0091badc8e35ae4500377d1debd12409.jpg)

**注意事项：**

**●授权信息根据不同的服务商会有差异，可以联系服务商获取相关信息**

#### 
**第二步：三方仓库存设置**

**2.1同步库存状态**

**授权完成后，在三方仓库存页面可看到授权的海外仓库存数据**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124459/560876c8d2316c0e701227759b35ca21.jpg)

**注意事项：**

**●点击“同步库存”后更新同步授权仓库的所有数据**

**●4PX仓库接口只返回在途数、待出库和库存总数三个数据信息**

**三方仓库存其他设置：**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124500/9e1359c03e2dde07c1f2f86ec517500a.jpg)

**名词释义：**

**设置差异化自动调整：设置后，三方仓与系统库存会自动调整一致**

**生成调整单：可手动将三方仓与系统库存调整一致**

#### 
**第三步：三方仓商品配对**

**●赛狐ERP推送商品至OMS，自动完成配对**（适合未在海外仓创建商品的卖家）**

**●赛狐ERP商品配对极风OMS商品（适合已经在海外仓创建商品的卖家）**

**方法一：赛狐ERP推送sku到三方仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250623083507/f68bbc155f554913e4d89f79c5a93a3c.jpg)

**方法二：商品配对（适合已经在海外仓创建商品的卖家）**

**单个配对**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124501/c0ec348ee485cd13f2a990670cde5818.jpg)

**注意事项：**

**解除配对直接点击操作列表里的【解除配对】即可，解除配对需配对的SKU+FNSKU+三方仓SKU不存在未完成单据**

**3.2批量导入配对**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124502/04a70d00a165f6011c2877aec389f633.jpg)

#### 
**第四步：海外仓备货单**

**要把商品运送到海外仓入库，可先创建海外仓备货单，海外仓即可根据备货单收货，海外仓备货单支持单个创建或是批量导入两种方式**

**4.1开启海外仓备货单权限**

**1.角色管理设置**

## 

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124502/c06fac24fe75df30210b76c26bcdc9cc.jpg)

**2.业务设置**

## 

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124503/285a3340edaa6a153480c6ac1eb5a61b.jpg)

**4.2创建海外仓备货单**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124503/8f2e867eed0d11c482d00086158212ca.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124504/e95137b4d892c67f9d6c1a844bdc448c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124505/7f7ecc3583b39081121d9c534fdc9f00.jpg)

**4.3导入生成备货单**

**支持导入生成海外备货单、导入更新备货单、导入物流费用、导入关联辅料。**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124505/62997fce9df7f8467f04b705925de464.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124506/379243843b2b7a1026e7ab6fe82721c2.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124507/914a9ffa38262488207c9b7272a6430f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124508/c81659371266147bdeedf1b0f63f83cf.jpg)

**各状态说明：**

**●待配货**

**添加好的备货单会进入待配货状态，可以勾选备货单进行分配库存、作废、打印、标记付款、导出报关资料等操作，配货后库存会处于占用状态。打印单据模板支持添加导出组合商品、加工商品的子商品数据；**

**加急：对于比较紧急或者关注的海外仓备货单，可以勾选加急，后续可以快速筛选处理这些单据。**

**●待发货**

**配货后的备货单会进入待发货页面，待发货-自建仓可以勾选备货单进行发货、作废、重新分配、打印、标记付款、导出报关资料等操作，发货后库存会自动扣减。支持给海外仓备货单进行装箱操作，可以扫描装箱/手动装箱，记录装箱信息。**

**●待收货**

**备货单发货后，进入待收货页面，点击配货单的详情，可进行编辑、收货的操作。**

**点击【收货】货可编辑实际的收数量，支持多次到货。点击【结束剩余到货】后进入【已完成】状态，剩余未到货的商品不再到货。**

**●已完成**

**收货后，备货单进入已完成状态，这时如要编辑备货单，无法更改发货仓库与收货仓库。可查看部分到货和已经全部到货的采购单，已完成的备货单不能进行作废。**

**●已作废**

**进行作废操作的备货单，会进入已作废页面，可供查看，不支持编辑。**

#### 
**第五步：海外仓物流开启**

**开启物流渠道，物流渠道1小时更新一次**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124508/448c3ced9b0daa002b52cb241ffbecb0.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124509/7aad9b428510dd7fbac9f7f6a6ececaa.jpg)

#### 
**第六步：下单至海外仓**

**6.1三方海外仓设置**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124510/6d0104edfdb6fc5475741b9eee0bd942.jpg)

**6.2三方海外仓订单同步**

**①待处理状态**

**授权完成后三方海外仓的订单会同步至FBM订单发货“待处理”状态**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124511/95b738f1d43faffddc45c910e03540aa.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124511/c955c77789f72ee92487187e71101938.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124511/4d663409091e1411c3f84cffe8932403.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124512/c31a046c16fcc1b666bff62f92e6991e.jpg)

**注意事项：**

**1. 参考上述配对流程，去完成配对，再处理订单**

**2. 已完成配对商品，直接点击物流下单，订单流转到三方仓里**

**②三方仓状态**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124513/32ccf819d51962c732ea5fd3d33c32fb.jpg)

**注意事项：**

**待更新：若订单处理环节中，订单信息信息无误，即会流转到待更新状态里**

**失败：若订单处理环节中，订单信息有误，比如授权过期，商品物流等信息有问题，即会流转到失败状态里**

**成功：待更新状态里的订单添加运单号成功后，即会流转到成功状态**

**获取中：若包裹请求过多，需要耐心等待系统请求返回结果；**

**●待更新**

**订单处理完成后，状态流转到【待更新】，此时极风WMS可接收到此订单信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124513/6fed59a4727eeea47ef535452ce3ffe2.jpg)

**在极风WMS里，获取订单号，并对订单进行出库操作**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124514/26d8d34602304d47be0c19db9c211611.jpg)

**完成发货后，点击“手动更新”同步订单信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124514/d1f57f9e3247c9b3dbef8a16119430f5.jpg)

**●成功**

**更新成功后，订单流转到成功**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124514/cd813efc3ce7b4f27a18cc9ded3438c0.jpg)

**点击发货后，订单状态流转到已发货**

![图片](https://download.jfwms.com/prod/static/back_help/img/34/20250217124515/b6b8236f7a005f8d410d7e1062af17de.jpg)

**注意事项：**

**订单操作发货后，需要扣减三方仓本地库存**
