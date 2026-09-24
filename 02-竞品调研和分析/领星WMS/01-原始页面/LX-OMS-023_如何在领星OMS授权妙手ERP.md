# 如何在领星OMS授权妙手ERP

- 来源编号: LX-OMS-023
- 原始URL: https://help.xlwms.com/d458/aabc/b26d/f2d3
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS平台相关 > OMS主流ERP授权相关问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2025-09-30

---

# 如何在领星OMS授权妙手ERP


              
## 1.操作场景

定义：妙手ERP系统通过接口对接OMS系统，实现妙手 ERP（侧重店铺运营、订单初步管理）与领星 OMS（侧重订单全流程精细化管理、库存协同）之间的订单、库存等数据同步，无需人工重复录入，形成 “前端运营 - 后端订单管理” 的无缝协作链路。作用：实现订单、库存等核心数据自动同步，无需人工重复录入，既减少错漏、节省时间，又能让订单状态实时互通、商品库存数据联动（降低超卖风险），还能简化“前端运营-后端订单管理”流程，让您不用频繁切换系统，更专注于核心业务。
## 2.操作指引


### 2.1领星OMS端获取授权信息

（1）登录OMS账号，网址：[oms](https://oms.xlwms.com/)（2）点击右上角头像“API信息”，获取App Key和App Secret信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481145/MTY4ODg1NzYyMTU2ODYyMg_558205_0_y553iR9TlqdwDy_1744288109)

### 2.2在妙手ERP授权领星海外仓

（1）打开妙手ERP-点击仓库-第三方仓库-仓库列表
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226484101/MTY4ODg1NzYyMTU2ODYyMg_356218_idesOF9lpk1IJKv__1743404381)
（2）仓库列表中搜索【贝瑞海外仓】，点击【使用此服务商】，输入从领星OMS复制的App Key和App Secret，分别填入输入框中，点击【下一步】，即可开始授权
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481203/MTY4ODg1NzYyMTU2ODYyMg_239197_GgNUTETotde4-Jdx_1743404476)
（3）授权成功后，在已授权仓库页面点击【编辑仓库】可自定义仓库名称以及修改需要开启的仓库
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481265/MTY4ODg1NzYyMTU2ODYyMg_59656_uurmiNDzTaUc4_Zb_1743404496)

### 2.3妙手ERP与领星WMS进行SKU配对


#### 2.31生成商品

适用场景：刚授权海外仓，在妙手ERP的商品管理中，没有和海外仓SKU相映射的商品（1）进入妙手ERP，点击仓库-第三方仓库-仓库清单
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481297/MTY4ODg1NzYyMTU2ODYyMg_747522_ucMVZ6uVZI9cYQ8a_1744291210)
（2）仓库清单中会同步已授权的海外仓的sku和库存，可筛选仓库，首次授权可点击界面右侧的【同步库存】，再点击商品右侧的生成商品
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481346/MTY4ODg1NzYyMTU2ODYyMg_62258_x_sNXuLsn-Mxq4Sr_1744291236)
（3）点击生成商品，会跳转到商品管理的新增单品界面，在界面中，系统会根据海外仓SKU，自动生成商品SKU（默认与第三方SKU一致）；完善其他的商品信息，比如商品名称、单价等，标*的为必填项。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481405/MTY4ODg1NzYyMTU2ODYyMg_223546_f_d7YgFhu8xCzqek_1744291350)
生成仓库商品必须入仓，可直接选择前面授权添加的“领星海外仓”，最后点击【保存】，即可生成商品
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481478/MTY4ODg1NzYyMTU2ODYyMg_579973_CeJnLWcEfR-NqSCB_1744291631)
（4）生成商品后，可在商品管理中，查看到商品SKU
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481522/MTMxMDI3MDAzNTMxNjI5NjY_497794_nScg9j_LgB9fEJaF_1744291669)
回到仓库清单，商品SKU与三方仓SKU会自动映射
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481591/MTY4ODg1NzYyMTU2ODYyMg_153463_VGf1QY4DFD8SO6m0_1744291693)

#### 2.32手动映射

适用场景：商品管理中，已创建商品，可直接与三方仓SKU映射（1）在第三方仓库清单页面点击【去映射】，在弹窗中，会显示商品管理已有的商品，找到需要关联的仓库商品后点击【选中】即可。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481660/MTY4ODg1NzYyMTU2ODYyMg_156804_DFtRCruVZkWKSFFF_1744291828)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481788/MTY4ODg1NzYyMTU2ODYyMg_392252_QFiRFKrwu1j_vZ8m_1744291845)
①在第三方仓库清单页面勾选需要映射的商品点击【手动映射】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481710/MTY4ODg1NzYyMTU2ODYyMg_64054_FXwsxlOkEyOmnujH_1744291866)
②在弹窗中输入要映射的商品SKU和第三方SKU，输入完成后点击【确定】即可 （注：商品SKU只能输入一个，第三方SKU支持多个）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226482157/MTY4ODg1NzYyMTU2ODYyMg_821821_Gx6fZXJc9ZGlx9n5_1744291881)

#### 2.33自动映射

适用场景：商品管理中，已有第三方SKU相对应的商品，且商品SKU与第三方SKU一致勾选需要映射的商品，点击【自动关联】后，直接点击确定即可，系统自动关联“商品SKU”和“第三方SKU”完全一致的商品
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481869/MTY4ODg1NzYyMTU2ODYyMg_787052_adVKJuJX2ZOsJilh_1744292997)

### 2.4在妙手ERP进行推单至领星WMS

（1）打开妙手ERP-订单-订单管理-订单处理
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481916/MTY4ODg1NzYyMTU2ODYyMg_252643_-yqsHu2NqAXbekbV_1745061669)
（2）在“待处理”页面，点击【申请运单号】，申请平台运单号。如果是走平台线上物流，需要申请运单号，如果自发货，就不需要申请运单号，直接进入下一步
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226481991/MTY4ODg1NzYyMTU2ODYyMg_660449_ar7QFdyaSwgCa9sg_1745061685)
（3）点击【调用库存】，所属仓库可选择【第三方仓库】、设置仓位、出库数量，设置好之后点击【调用库存并出库】或【调用库存】即可使用库存发货
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226482029/MTY4ODg1NzYyMTU2ODYyMg_618747_RuCqA9L41kpE2-oh_1745061744)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226482015/MTY4ODg1NzYyMTU2ODYyMg_911117_6u4tEJ8dOaqM31u__1745061762)
（4）此时单据推送到领星OMS-仓储服务-一件代发出库-草稿状态
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226482052/MTY4ODg1NzYyMTU2ODYyMg_461914_SVN7H_ruFfN-6fHF_1745740497)
（5）使用海外仓打单渠道/平台物流的，会自动流转到一件代发出库-草稿-获取中/待提交的状态，获取到面单之后自动提交到仓库处理中（外部推送订单是定时任务自动提交，无法手动设置是否自动提交）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759226482149/MTY4ODg1NzYyMTU2ODYyMg_629134_Lr-DvyCtJBPvmP2R_1745724335)

## 3.补充说明


### 3.1名词解释

SKU配对：指的是将妙手 ERP 系统中使用的商品 SKU与 OMS 系统中的对应商品 SKU 建立关联配对关系，确保两个系统对同一商品的标识、信息保持一致。当 ERP 向 OMS 推送订单、或 OMS 向 ERP 反馈库存时，双方能准确匹配到同一商品，避免因编码差异导致的数据混乱（如订单商品信息错配、库存数据不同步等），保障跨系统数据流转的准确性。
## 4.常见问题

Q1：已经取消“自动提交已获取面单和无需面单的出库单”按钮，为什么妙手ERP推送过来的订单仍直接进入“仓库处理中”状态？答案：因妙手 ERP 属于外部系统，其订单通过接口推送至领星 OMS 时，接口默认配置为 “推送后自动提交” ，该逻辑不受 OMS 界面手动设置的 “是否自动提交” 按钮控制，因此订单会直接进入 “仓库处理中” 状态。Q2：妙手ERP已经推送的订单，为什么在OMS-平台订单位置查询不到答案：ERP系统推送过来的订单是在OMS-仓储服务-一件代发出库位置查询
              
                
                  
                
                2025-09-30
