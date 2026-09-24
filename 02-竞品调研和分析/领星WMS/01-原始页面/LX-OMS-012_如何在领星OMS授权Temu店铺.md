# 如何在领星OMS授权Temu店铺

- 来源编号: LX-OMS-012
- 原始URL: https://help.xlwms.com/d458/aabc/4a1f/b5d4
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS平台相关 > OMS主流平台授权相关问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-05-11

---

# 如何在领星OMS授权Temu店铺


              
## 1. 
    操作场景

定义：通过OMS系统的平台授权将Temu店铺与订单管理系统（OMS）进行连接绑定，使 OMS 能够获取Temu店铺相关数据和权限，从而实现对店铺订单等业务的统一管理。作用：OMS系统可自动同步拉取Temu店铺订单，商家能在 OMS 中对订单进行审核、发货等操作。同时，还可通过设置平台订单规则实现自动发货，这有助于提高订单处理效率，优化库存管理，提升整体运营效能。
## 2. 
    操作指引


### 2.1 补充商品SKU货号

进入temu店铺后台：领星OMS获取的平台SKU对应的是Temu店铺的SKU货号，为保证领星OMS同步到的订单可顺利生成一件代发出库单，建议授权前在店铺后台 - 商品管理中补充商品SKU货号。路径：商品管理-商品列表-操作-编辑-维护货号注意：系统会优先抓取SKU货号，如果SKU货号没有填写则抓取SKU ID
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542068/MTMxMDI3MDM1NDAzNzMyNDA_702094_aSIYcussfKPycoGo_1756378211)

### 2.2 获取授权access_token


#### 2.21跨境店铺

第一步：Temu后台＞点击右上角Seller Central切换到订单管理＞同意政策＞点击确认授权并前往
                ● 请确认您登录的是【半托管】店铺，且登录的是【主账号】（Temu仅区分主子账号，不区分主子店铺）
                ● 或直接进入链接https：//agentseller.temu.com/main/system-manage/client-manage
                ● 这一步非必需，若您登录界面左上角已显示为Seller Central，请直接操作第二步
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225541858/MTMxMDI3MDM1NDAzNzMyNDA_740270_YG81ffOcH1F_TdBp_1756378211)
第二步：确认右侧的店铺站点选项请注意：
                ● 不同店铺站点的Access token不互通，请确认站点后再操作下一步获取授权码
                ● 【领星OMS选择的站点】、【Temu当前页面选择的站点】与【店铺订单的实际站点】需要与保持一致
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768980591093/image.png)
第三步：授权管理（订单） ＞ 点击获取授权 ＞ 选择领星WMS ＞ 确认请注意：
                ● 请确认当前界面左上角为英文的Seller Central才是获取订单Token授权。如果左上角为“卖家中心”，无法找到领星WMS应用；
                ● 请确认该授权界面选择领星WMS时，并勾选全部权限（包含特殊授权），否则系统无法同步平台订单；
                ● 领星ERP与领星WMS不是同个应用，若要在领星OMS完成店铺授权，请确认应用信息为领星WMS。
                ● Y2预售模式目前主要是支持美区，请确保选择的是【Temu-Seller Central-美国】，在领星OMS上选择的也是美国站点
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542059/MTY4ODg1NjAyMzU3Mzc4OQ_378801_A-DfkZ4FJeXTwxi0_1756711031)
第四步：点击确认后，将access_token复制粘贴到领星OMS页面access_token位置
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542305/MTMxMDI3MDM1NDAzNzMyNDA_743397_zHL42x6RxaZRp7WD_1756378211)

#### 2.22本土店铺

第一步：如果您店铺后台的登录地址为[Temu Seller Central](https://seller.temu.com/)即为本土店铺进入Temu店铺后台【Manage Your Apps】页面，点击【Authorize a new app】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225544188/MTMxMDI3MDM1NDAzNzMyNDA_961464_QTOZ0SMo9z380iMN_1756378211)
第二步：选择“Lingxing WMS”生成获取店铺access_token并复制到领星WMS中进行授权。勾选全部的接口权限
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542515/MTMxMDI3MDM1NDAzNzMyNDA_826573_R_XGkCrEE8jX7AmM_1756378211)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542610/MTMxMDI3MDM1NDAzNzMyNDA_729155_aboLfAnC6e_XUPVt_1756378211)

### 2.3 登录领星OMS，填写店铺授权信息

（1）操作步骤：登录领星OMS ＞系统设置 ＞ 平台授权 ＞ Temu ＞ 添加授权 
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542705/MTMxMDI3MDM1NDAzNzMyNDA_630870_ni6z-ReYqtdylwL5_1756378211)
（2）授权信息填写：第一步：平台授权模块点击Temu平台添加授权后，会跳转出店铺授权-Temu的添加授权界面，填写自定义店铺信息及access_token与站点信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542809/MTMxMDI3MDM1NDAzNzMyNDA_714593_6SYXCtVup5dRhLec_1756378211)
第二步：选择 “所有订单” 或 “店铺仓库” 。
                ● 所有订单：若授权时不需要绑定店铺仓库，直接选择“所有订单”，再点击“前往授权”完成店铺授权即可。授权成功后，该Temu店铺内的全部待发货订单都会同步至OMS系统
                ● 店铺仓库：若授权时需绑定店铺仓库，先选择“店铺仓库”，再到“输入仓库代码”栏填写Temu店铺内的仓库ID。系统支持绑定多个仓库，可点击下方“添加仓库”继续录入其他仓库ID，所有仓库ID填写完成后，点击“前往授权”完成店铺授权即可。授权成功后，仅同步已绑定仓库的待发货订单至OMS系统获取仓库代码方式**（仅支持半托管店铺，本土店不支持）**方式一：Temu卖家后台-商品管理-库存维护中找到SKU的库存扣减仓库的ID方式二：订单管理里中找到订单的库存扣减仓库的名称，再前往配送管理-仓库地址管理中找到仓库名称对应的仓库ID，并填写到系统中
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225542976/MTMxMDI3MDM1NDAzNzMyNDA_590674_WRRxXspzqsItYiiK_1756378211)

### 2.4 领星OMS物流商配对（必需）

操作步骤：OMS系统设置 ＞平台授权> 操作 ＞ 物流商配对
                ● 授权成功后，返回OMS-平台授权界面，选择已授权成功的店铺，点击【操作】 - 【编辑物流商配对】，系统会自动获取已授权店铺平台物流商，若订单使用仓库物流，且承运商不在配对关系中可能导致系统无法自动回传物流跟踪号。
- 如果当前店铺全部都是使用平台物流的，那只需要在【物流商配对】模块任意有一个配对规则即可，例如可以选择设置为：联邦快递 - FedEx
- 如果当前店铺是使用平台物流+仓库物流，那需要把平台物流商跟要使用的仓库物流对应的系统物流商（承运商）进行配对，可以点击添加授权设置多种物流商配对关系


                ● 常见的配对方式：联邦快递 - FedEx，優比速 - UPS，美国邮政 - USPS，UPS-MI - UPS-MI，YWE-YANWEN，GOFO EXPRESS-GOFO
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543125/MTMxMDI3MDM1NDAzNzMyNDA_660405_B3C1Zvp2Ba9v6rG7_1756378211)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543222/MTY4ODg1NjAyMzU3Mzc4OQ_785386_VyCJuY5CFmAonbXI_1756715982)

### 2.5 设置产品映射配对（必需）

操作步骤：OMS系统设置 ＞ 产品配对 ＞ 新建/导入
                ● 产品映射前请确保OMS已创建对应的产品SKU，且Temu平台的商品信息都已填写SKU货号；
                ● 数量为平台SKU与系统SKU的换算系数（不是库存量），即买家下单购买1个平台SKU，卖家对应要发出的商品数量。如果是多种SKU的组合，可以点击加号继续添加；
                ● 产品映射关系是与平台店铺进行绑定，若授权了多个平台店铺，都需要重新进行产品映射。  点击链接获取创建产品映射的详细教程：[使用OMS实现产品配对 | 领星WMS帮助中心-卖家版](https://help-oms.xlwms.com/aad8/bf28/ed20/e976)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543361/MTMxMDI3MDM1NDAzNzMyNDA_621459_Xpf0nSYcSUIWxnit_1756378211)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543519/MTMxMDI3MDM1NDAzNzMyNDA_611769_IgwAuqC9OLohi7J7_1756378211)

### 2.6 领星OMS平台订单操作


                ● 首次授权后，系统会自动拉取店铺的创建时间3-5天内的订单，但平台订单不是实时自动同步的，后续会每间隔15分钟拉取2天内的订单。如果需要立刻看到最新的所有订单，需要点击【手动同步】按钮进行数据同步。
                ● 仅卖家履约订单可以同步到OMS-平台订单处，合作仓履约订单是直接推送到OMS-仓储服务-一件代发出库单位置
                ● 点击链接，查看详细操作步骤：[使用OMS平台订单实现发货 | 领星WMS帮助中心-卖家版](https://help-oms.xlwms.com/aad8/bf28/7080/de0f)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543659/MTMxMDI3MDM1NDAzNzMyNDA_716258_ST8dEMNNM6gi2Gi4_1756378211)

### 2.7使用平台面单发货


                ● 若订单需要使用平台面单发货，请在订单同步到OMS后，再返回Temu平台操作“在线下单发货”，生成跟踪号及面单后，再到OMS系统-平台订单-待处理状态下对订单进行分配“上传物流面单（Upload_Shipping_Label）”渠道自动获取平台面单。
                ● 请注意：如需获取待发货状态的平台面单，请确认第三步授权应用已勾选【下call成功待发货包裹列表查询接口】，若无该权限，请操作重新授权，将新的授权码复制到领星OMS更新授权。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225543714/MTMxMDI3MDM1NDAzNzMyNDA_565473_RaAfnvqWejAIKiLn_1756378211)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225544418/MTMxMDI3MDM1NDAzNzMyNDA_646037_CSoB721l58Cv14I1_1756378211)

## 3. 
    补充说明


### （1）名词解释

物流商配对：将平台物流商与系统物流商进行配对，平台物流商为temu向客户开放的物流商，系统物流商为系统自带的物流商，例如：平台物流商【美国邮政】配对系统物流商【USPS】产品配对：将平台上的产品SKU与系统产品SKU绑定，消费者在平台下单时选择的平台SKU，系统根据产品配对关系，会自动匹配对应的系统SKU和数量实现出库发货
## 4. 
    常见问题

Q1：授权时提示”access_token错误“。答案：请确认获取授权的界面左上角为英文的Seller Central。在“卖家中心”获取授权生成的access_token无法在领星OMS使用。并且确认【订单的站点】要和【Temu后台授权的站点】以及【OMS更新授权选择的站点】要一致Q2：提示授权成功，但无法同步平台订单。答案：①请确认Temu平台已授权的领星WMS应用已勾选全部的权限（包含特殊授权）；②平台重新授权了领星WMS，要将新的授权码复制到OMS进行更新，若OMS的授权码与店铺后台最新的不一致，可能导致同步异常； ③领星OMS仅同步待发货状态的订单，请确认平台订单状态；Q3：已同步的平台订单，显示平台SKU为空。答案：请在店铺后台补充店铺商品的SKU货号，并在领星OMS完成产品映射，异常状态取消后，从已取消状态转待处理，稍等15分钟左右同步已补充的平台SKU。Q4：同步到领星OMS的平台订单更新为已发货状态时，TEMU后台未同步更新跟踪号及出库状态。答案：请在领星OMS - 平台订单模块，确认平台订单的状态为“已发货”，且订单内的承运商与物流商配对一致。Q5：获取[Temu]平台面单失败，请稍后再试。答案：请确认订单已在TEMU后台已操作“在线物流下单”，再到OMS分配上传物流面单渠道审核获取。如需获取待发货状态的平台面单，请确认第三步授权应用已勾选【下call成功待发货包裹列表查询接口】，若无该权限，请操作重新授权，将新的授权码复制到领星OMS更新授权。Q6：Temu的订单，为什么没有收件人信息，要如何标记发货？答案：Temu 更新了收件人信息接口权限，却未给卖家推送资源，导致未获取到收件人信息。temu 会重新推送该接口权限，着急推送单据的客户需到 temu 平台重新获取权限，勾选常规权限和特殊权限，再到系统重新审核单据。Q7：已同步的平台订单，显示Temu店铺未与平台物流商做映射答案：这种情况是未进行2.4领星OMS物流商配对，完成物流商配对进行审核即可Q8：为什么TEMU左上角已经切换为Seller center还是找不到领星WMS？答案：注意看下界面是不是在授权管理（商品）位置，需要点击到授权管理（订单）这个子页面里才能找到领星WMS
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759225544314/MTY4ODg1NjAyMzU3Mzc4OQ_625251_b94qvajzzoewRUsj_1757315915)

              
                
                  
                
                2026-05-11
