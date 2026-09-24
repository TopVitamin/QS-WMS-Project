# 如何在领星OMS授权NOON店铺

- 来源编号: LX-OMS-014
- 原始URL: https://help.xlwms.com/d458/aabc/4a1f/ffea
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS平台相关 > OMS主流平台授权相关问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-09-09

---

# 如何在领星OMS授权NOON店铺


              
## 1 操作场景

定义：通过OMS系统的平台授权将NOON店铺与OMS进行连接绑定，使OMS能够获取NOON店铺相关数据和权限，从而实现对店铺订单等业务的统一管理。作用：将NOON店铺后台订单同步至OMS进行管理，可以直接对订单进行审核、提交仓库处理等操作；同时可通过设置平台订单规则实现自动发货，提高订单处理效率，提升整体运营效能。本章将指导您如何在领星OMS授权NOON店铺。
## 2 操作指引


### 2.1 获取授权信息

※请注意：领星OMS当前仅支持FBPI（跨境直供NGS）模式仓库中的订单，FBN/FBP模式暂不支持，授权前请确认您的店铺属于FBPI类型
#### 2.1.1 Warehouse Code

登录NOON后台：noon.com依次点击 Fulfilled by Partner Integration → Warehouse，复制本次需要授权的店铺仓库编号
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936634018/c875d136)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633968/c7f167b1)

#### 2.1.2 下载授权json

依次点击 User & Access → User Access，进入 API Users 界面
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633928/a6f626cf)
点击Add Service Account，创建新的授权账号
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936634091/b1567475)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936634119/d6a04912)
Role选择【Project Owner】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936634173/2d6c1533)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633901/6b0813f0)
下载的JSON文件，使用记事本打开
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633720/e0ba9711)

### 2.2 登录领星OMS添加平台授权

路径：领星OMS - 系统设置 - 平台授权 - NOON - 添加授权
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633628/672cf865)

### 2.3 设置产品映射配对（必需）

操作步骤：OMS系统设置 ＞ 产品配对 ＞ 新建/导入
- 产品配对前请确保OMS已创建对应的产品SKU；
- 平台订单模块内的平台 SKU 依据店铺后台的 partner_sku 自动赋值，新建产品配对时手动填写的平台 SKU 需与其保持一致；
- 数量为平台SKU与系统SKU的换算系数（不是库存量），即买家下单购买1个平台SKU，卖家对应要发出的商品数量。如果是多种SKU的组合，可以点击加号继续添加；
- 产品映射关系是与平台店铺进行绑定，若授权了多个平台店铺，都需要重新进行产品映射。

  点击链接获取创建产品映射的详细教程：[使用OMS实现产品配对](https://help.xlwms.com/d458/fcbb/ceb5/5a2e)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1788936633889/0c34d537)

### 2.4 领星OMS平台订单操作


- 首次授权后，系统会自动拉取店铺的创建时间3-5天内的订单，但平台订单不是实时自动同步的，后续会每间隔15分钟拉取2天内的订单。如果需要立刻看到最新的所有订单，需要点击【手动同步】按钮进行数据同步。

点击链接，查看详细操作步骤：[使用OMS平台订单实现发货](https://help.xlwms.com/d458/fcbb/aed1/0c14)
# 3.补充说明


### 3.1名词解释

    OMS授权界面●店铺名称：支持自定义店铺名称，代表平台店铺在系统的名称，可以和平台店铺名称填写一致。●店铺代码：自定义店铺代码，店铺代码具有唯一性，方便管理用户授权的平台店铺。
# 4.常见问题

Q1：支持拉取哪些状态下的订单？答案：支持拉取MP_ITEM_STATUS_CONFIRMED（订单商品已确认）状态的订单。Q2：拉取订单后采用何种履约方式？答案：仅支持使用仓库面单。
              
                
                  
                
                2026-09-09
