# 如何在领星OMS授权领星ERP

- 来源编号: LX-OMS-019
- 原始URL: https://help.xlwms.com/d458/aabc/b26d/9125
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS平台相关 > OMS主流ERP授权相关问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2025-09-30

---

# 如何在领星OMS授权领星ERP


              
## 1.操作场景

定义：领星ERP系统通过接口对接OMS系统，实现领星 ERP（侧重店铺运营、订单初步管理）与领星 OMS（侧重订单全流程精细化管理、库存协同）之间的订单、库存等数据同步，无需人工重复录入，形成 “前端运营 - 后端订单管理” 的无缝协作链路。作用：实现订单、库存等核心数据自动同步，无需人工重复录入，既减少错漏、节省时间，又能让订单状态实时互通、商品库存数据联动（降低超卖风险），还能简化“前端运营-后端订单管理”流程，让您不用频繁切换系统，更专注于核心业务。
## 2.操作指引


### 2.1登录领星OMS获取授权信息

（1）登陆您的OMS账号，领星OMS网址：[oms](https://oms.xlwms.com/)（2）路径：领星OMS - 点击右上角头像 - API信息请注意：如果您的API信息界面无App Key，需要您先点击“新建”进行创建
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523013/MTY4ODg1NjY1ODQ5NjQzNA_378554_zuI7Z2QjNj7ztkOI_1755065945)

### 2.2登录领星ERP添加仓库

（1）登陆您的ERP账号，领星ERP网址：[领星ERP - 跨境电商管理系统](https://erp.lingxing.com/)  （2）路径：领星ERP - 设置 - 仓库设置 - 添加仓库请注意：①仓库属性选择“海外仓库”，仓库类型选择“第三方”；②第三方服务商名称列表中，领星WMS海外仓品牌名称均有特殊标识。未带特殊标识的均不是领星WMS海外仓，领星OMS的授权码无法进行授权。如果您的海外仓名称未显示在列表中，可以选择通用的“领星WMS”完成授权，不影响后续使用；③clientID对应领星OMS的App Key，secret对应领星OMS的App Secret，请留意顺序。领星OMP的API信息无法授权，请确认api信息来源。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523108/MTY4ODg1NjY1ODQ5NjQzNA_607942_v_l05BGSGm3-fkXJ_1755066416)

### 2.3已添加仓库的初始化流程


#### 2.3.1同步并启用第三方仓仓库

首次授权后需等待15-30分钟同步信息，可稍后进行确认。仓库设置界面会同步本次授权的OMS账号 - 个人中心里已绑定的仓库。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523104/MTY4ODg1NjY1ODQ5NjQzNA_127628_BwiR6zCPbIncdtsT_1755068153)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523119/MTY4ODg1NjY1ODQ5NjQzNA_658774_zosSf7YT9ojHQVkr_1755068056)

#### 2.3.2SKU配对

将领星ERP创建的系统SKU与领星OMS创建并已审核的三方仓SKU进行关联。命名完全一致的SKU可通过【系统自动配对】功能自动完成匹配。如果命名/大小写不一致，可选择手动配对或导入配对。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523188/MTY4ODg1NjY1ODQ5NjQzNA_762535_StsVGO6svETEFJpQ_1755068728)
导入表格可参考填写：
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523214/MTY4ODg1NjY1ODQ5NjQzNA_212689_PwhoBp3wOTBcf4Le_1756892729)

#### 2.3.3同步并启用第三方仓物流渠道

海外仓完成授权后，进入物流-物流管理-三方仓物流中，找到授权的海外仓。在 物流渠道 数据列中，选择需要使用的物流渠道并启用，启用后才能在订单管理中选择。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523271/MTY4ODg1NzQ5NjY5ODMzNw_70180_GG7Eu9S9hE9vhWYg_1752215007)
如需将领星ERP获取到的平台面单，推送到领星OMS。可参考：[【自发货】通过领星ERP向海外仓提供物流面单（仓配分离）-领星ERP-专业亚马逊ERP系统](https://www.lingxing.com/help/article/OrderManagement3PLWarehouseSelfLable)
#### 2.3.4物流渠道的标发设置

当订单在领星ERP使用指定的物流方式审核发货后，领星将获取到对应物流的追踪单号用于上传给电商平台后台，但是因各个平台要求上传的承运商名称类型和单号类型不同，需要您对使用的物流方式做数据映射。点击物流渠道进入详情页，点击[编辑] 按钮，为不同平台设置该物流方式的传值方式。以下图为例：按页面显示设置，当订单使用了物流渠道XM-UPS发货时，该订单如果是亚马逊订单，在上传物流单号给平台时，将按 承运商=UPS，取 订单获取到的跟踪号 上传给平台。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226524245/MTMxMDI3MDM4MDAxNDE3NTE_342046_XYeaPCFAzeJVHilF_1756894569)

#### 2.3.5导入库存初始值

※在完成三方仓启用及SKU配对的情况下，领星ERP即可自动同步海外仓库存量。导入库存初始值是为了维护库存成本，可以按需操作。第一步：在领星ERP导出已配对的商品信息，操作路径：领星ERP - 仓库设置 - SKU配对。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523316/MTY4ODg1NjY1ODQ5NjQzNA_659910_6HU2q0uh-HhBdggt_1756972130)
第二步：在领星OMS - 库存 - 产品库存界面，导出库存数据用于填写表格。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523356/MTY4ODg1NjY1ODQ5NjQzNA_369050_2uMMxZslVeuD23N1_1756895720)
第三步：在领星ERP库存明细 - 导入库存初始值页面中下载库存导入模板，填入已配对的商品信息、库存数量（填写在可用库存中）和单位采购成本。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523417/MTMxMDI3MDM4MDAxNDE3NTE_301367_5t2S751uc-rWXASR_1756895546)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523556/MTMxMDI3MDM4MDAxNDE3NTE_344237_KpYxFMEU_lvgLOw1_1756895546)
下载导入模板后，将初始库存和相应SKU填写好导入维护初始库存。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523441/MTMxMDI3MDM4MDAxNDE3NTE_358448_nkOglviXNVFs7kJQ_1756895546)
注：这一过程中导入库存初始值可能有功能权限控制；初始化成本可能需要管理员配合授权。
### 2.4自动处理功能配置

路径：领星ERP - 设置 - 业务设置 - 仓库 - 基础 - 海外仓 - 自动处理
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523476/MTY4ODg1NjY1ODQ5NjQzNA_444169_oAgilASfqVtWYvNI_1756972590)

#### 2.4.1自动收货

开启后，推送至领星OMS的海外仓备货单将自动同步海外仓的收货上架状态。可参考：[领星ERP如何推送入库单至领星OMS](https://doc.weixin.qq.com/doc/w3_AbIAywY0AJUCNprIDtJHCRqSIudhW?scode=AEQAvAeyABAQh0hDTIAbIAywY0AJU)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226524313/MTY4ODg1NjY1ODQ5NjQzNA_858153_65gAOJ61ySSqQ2XL_1756972805)

#### 2.4.2自动调整库存差异

开启后，当海外仓库存对比界面的【系统可用量+锁定量】与【三方仓的可用量+锁定量】有差异时，【系统可用量】将按【三方仓的可用量+锁定量】自动同步调整。例如：系统可用量是20；三方仓可用量是10，锁定量是20，ERP通过（自动）库存调整将系统可用量调整为30。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523608/MTY4ODg1NjY1ODQ5NjQzNA_498076_6hFracjFDEX0nPUm_1756976603)

### 2.5领星ERP同步并查看海外仓库存

在完成三方仓启用及SKU配对的情况下，领星ERP即可自动同步海外仓库存量。可以在海外仓库存对比界面查看系统与三方的库存量差异情况。首次完成领星ERP授权后，可以点击领星ERP - 仓库设置 - 全量拉取刷新 - 全量同步，同步已授权OMS账号的库存量。（如果您已完成2.3.5导入库存初始值的操作，可忽略这一步）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523642/MTY4ODg1NjY1ODQ5NjQzNA_676276_l4VczRLQPc4b3Jae_1756977866)
领星ERP每30分钟自动同步一次海外仓的库存量。如果您需要立即同步最新的库存量，可以在领星ERP - 海外仓库存对比界面，点击立即更新。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523665/MTY4ODg1NjY1ODQ5NjQzNA_356767_OFMjF4HyEawJHkD0_1756976494)

## 3.补充说明


### 3.1名词解释

SKU配对：指的是将领星 ERP 系统中使用的商品 SKU与 OMS 系统中的对应商品 SKU 建立关联配对关系，确保两个系统对同一商品的标识、信息保持一致。当 ERP 向 OMS 推送订单、或 OMS 向 ERP 反馈库存时，双方能准确匹配到同一商品，避免因编码差异导致的数据混乱（如订单商品信息错配、库存数据不同步等），保障跨系统数据流转的准确性。
## 4.常见问题

Q1：授权领星WMS海外仓时，第三方服务商列表中查询不到对应的海外仓名称答案：第三方服务商列表需要海外仓提供品牌名称给到领星WMS客服进行配置，配置未上线前，您可以使用通用的”领星WMS“完成授权，不影响后续的操作。※需要特别注意：带有领星WMS标识的第三方服务商才能授权领星OMS。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523675/MTY4ODg1NjY1ODQ5NjQzNA_218326_3Xh55VyKlIgdyxMD_1756978323)
Q2：报错“授权信息不正确”答案：请确认①第三方服务商选择的是领星WMS海外仓；②您填写的ClientID与secret来自于领星OMS账号的API信息，领星WMS管理后台的API信息仅用于智能设备对接，无法完成ERP授权。Q3：授权后，仓库设置界面未显示三方仓仓库答案：首次授权后需要同步的数据量较大，预计30分钟左右完成。如果领星ERP在业务配置中开启了仓库权限，需到【用户管理】页面给对应的员工账号分配指定仓库的权限，否则无法查看已同步到的仓库信息。Q4：授权后，SKU配对界面为空答案：请确认①领星ERP已启用第三方仓仓库；②领星OMS已创建SKU且为已审核状态。如果您在领星ERP完成授权后，再创建/审核的三方仓SKU，可以点击全量拉取刷新 - 增量同步，手动更新。领星ERP的自动更新时间为每日00:00Q5：三方仓物流渠道未同步答案：领星ERP按领星OMS可使用的物流渠道列表进行同步，可以先确认领星OMS在创建一件代发出库单选择相同仓库时，能否使用到当前渠道。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523695/MTY4ODg1NjY1ODQ5NjQzNA_297466_9ToiKfbkrt2DWKWl_1756981684)
如果是仓库新配置的渠道，可以在领星ERP - 物流设置 - 第三方仓物流 - 海外仓配套物流 ，先点击同步，再从下方的已关闭列表中，操作“启用”。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523743/MTY4ODg1NjY1ODQ5NjQzNA_674576_bHkXL76oSf3CU4jS_1756981787)
Q6：领星ERP已完成SKU配对，但海外仓库存对比界面为空答案：海外仓库存对比界面仅展示领星OMS有过库存流水记录的三方仓SKU。如果三方仓SKU仅审核，还未在仓库有过库存记录（可以通过领星OMS - 库存 - 产品库存 - 库存流水，搜索对应的三方仓SKU进行确认），无法同步显示在领星ERP的海外仓库存对比界面。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226523721/MTY4ODg1NjY1ODQ5NjQzNA_857813_MPCXBrwTLxUgnx0N_1757494642)

              
                
                  
                
                2025-09-30
