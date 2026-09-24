# 领星ERP如何同步系统SKU至领星OMS

- 来源编号: LX-OMS-032
- 原始URL: https://help.xlwms.com/d458/dc94/fe0f/9654
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS常见问题 > 领星ERP相关问题处理
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-20

---

# 领星ERP如何同步系统SKU至领星OMS


              
## 1. 
    操作场景

定义：领星ERP支持将已创建的系统SKU，同步至领星OMS创建。并将领星OMS已审核状态的三方仓SKU同步至领星ERP，操作SKU配对，最终实现领星ERP单据下单至三方仓。作用：该功能无需在领星 ERP 与 OMS 分别创建 SKU，减少人工重复操作、提升管理效率，通过系统间 SKU 同步及配对保障信息一致、避免错漏，同时打通 “SKU 同步 - 配对 - 下单” 业务链路，保障订单高效流转。
## 2. 
    操作指引


### 2.1. 
    领星ERP创建系统SKU

路径：领星ERP - 产品 - 产品管理 - 添加产品/导入产品
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146612/MTMxMDI3MDM4MDAxNDE3NTE_627582_3V0m5qwcDFuHMTLm_1763349300)
※请注意：为确保您的系统SKU成功推送领星OMS创建，请参考以下截图填写对应字段信息，均为必填项。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146623/MTMxMDI3MDM4MDAxNDE3NTE_713454_15KPd8Focb9xIUU8_1763349300)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146695/MTMxMDI3MDM4MDAxNDE3NTE_616979_X6azX1wH6XcTknv6_1763349300)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146645/MTMxMDI3MDM4MDAxNDE3NTE_581736_ET0C5S56GwK2veTn_1763349300)

### 2.2. 
    授权领星WMS海外仓

路径：设置 - 仓库设置 - 添加仓库（详细操作可参考：[如何在领星OMS授权领星ERP | 领星WMS帮助中心-卖家版](https://help-oms.xlwms.com/aad8/f400/4940/87e3)）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146741/MTMxMDI3MDM4MDAxNDE3NTE_519692_xgV88plGenIHcUSv_1763349300)

### 2.3. 
    导入需同步至领星OMS的系统SKU

路径：设置 - 仓库设置 - 已授权的领星WMS海外仓 - SKU同步 - 导入产品 - 下载模板 - 导入系统SKU※请注意：①为确保系统SKU是正确的，请从产品管理导出SKU；②表格里只需要填写要同步至当前已授权的领星OMS账号创建的系统SKU，如果该产品不需要在当前领星OMS账号使用，请不要填写在表格里。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146754/MTMxMDI3MDM4MDAxNDE3NTE_636044_oA4mh2UB2FPPbJR3_1763349300)

### 2.4. 
    推送已导入的系统SKU至领星OMS创建产品

路径：设置 - 仓库设置 - 已授权的领星WMS海外仓 - SKU同步 - 勾选并点击批量同步可以在当前界面查看同步创建的状态。【同步成功】的系统SKU已推送领星OMS产品管理 - 产品界面同步创建。【同步失败】的系统SKU请根据下方提示的失败原因，在领星ERP产品管理界面补充对应字段的信息（可参考[2.1领星ERP创建系统SKU](https://lingxing.feishu.cn/wiki/MUk7wtuo5iCR9bkXzmRcqMilnTd#share-V3pkdFY8WoJULjx82CDcPij7nne)），补充后再操作“重新同步”。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895147521/MTMxMDI3MDM4MDAxNDE3NTE_722415_b4X-kBVKmTJuB7G2_1763349300)

### 2.5. 
    同步并配对领星OMS已审核状态的三方仓SKU

路径：设置 - 仓库设置 - 已授权的领星WMS海外仓 - SKU配对 - 全量拉取刷新 - 增量同步 - 系统自动配对如果当前界面没有产品信息，请确认【仓库设置】界面已启用第三方仓库，且领星OMS的产品为已审核状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895146946/MTMxMDI3MDM4MDAxNDE3NTE_579297_49ExfSL2HA1G5Xmx_1763349300)

## 3. 
    补充说明


### 3.1. 
    名词解释

系统SKU：领星ERP创建的本地产品信息，是供应链库存流转的基础（采购、仓库、发货）；三方仓SKU：海外仓系统的产品信息，用于海外仓仓库实际作业识别。通过将系统SKU与三方仓SKU的配对，将ERP订单转换为仓库作业指令。
## 4. 
    常见问题


#### Q1：领星ERP更新的产品规格信息，能否同步至领星OMS调整？

**答案**：当前仅支持同步创建，暂不支持同步调整。尺寸信息仍需独立维护，如果您在领星ERP更新了产品规格信息，请同步您的领星WMS海外仓在管理后台协助您调整三方仓SKU的WMS尺寸重量信息，避免尺寸差异影响计费。
#### Q2：领星ERP操作SKU同步，同步失败报错“海外仓[领星wms],返回失败“

**答案**：根据“返回失败”后面提示的信息，确认客户ERP创建的产品是否有填写对应的内容。可参考下图进行对比，如示例中报错“国家二字码不能为空”，对应ERP产品信息里的原产地为空，需补充填写二字码。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895148151/MTMxMDI3MDM4MDAxNDE3NTE_683572_3_8gLWjvCNl9uGAy_1763349300)

#### Q3：领星ERP已操作SKU同步，且同步状态为”同步成功“，但是在领星OMS没有查看到产品信息


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895148774/MTMxMDI3MDM4MDAxNDE3NTE_731996_RY4HnOk_fCG_wRf1_1763349300)
**答案**：①请在领星OMS - 产品管理 - 产品 - 全部界面，确认是否有相同的SKU信息；如果海外仓开启了”产品审核“功能，领星ERP推送创建的产品，会先进入审核中状态，请联系您的领星WMS海外仓确认后续审核进度；②如果在全部状态下仍没有相同的SKU信息，请确认当前界面的OMS账号的API信息，与您领星ERP操作SKU同步的海外仓授权信息是否相同。如果不一致，领星ERP推送的不是当前界面的OMS账号，请切换其他领星OMS账号确认同步创建情况。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895147557/MTMxMDI3MDM4MDAxNDE3NTE_596991_XZ0SdyTLbmn-w_Wn_1763349300)

              
                
                  
                
                2026-01-20
