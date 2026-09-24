# 使用WMS处理工单

- 来源编号: LX-WMS-005
- 原始URL: https://help.xlwms.com/12d0/d5f9/3eb5/dad3
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > WMS板块帮助文档 > WMS使用功能介绍 > 工单篇
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-06-12

---

# 使用WMS处理工单


              
## 1. 
    操作场景

OMS客户端经常需要与仓库端进行沟通，可以使用工单来替代微信的线下沟通。如当客户对仓库发起加工组装、拆分产品、产品翻新，次品销毁等需求时，可以给仓库下关联库存类的工单，仓库处理工单完成后，系统会自动按照处理结果对库存进行调整，满足上述库内操作需求，或者客户需要仓库盘点库存、产品拍照等需求时，可以给仓库下对应的工单。
## 2. 
    操作指引

（1）进入WMS系统：登录您的WMS后台，导航至工单菜单。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081660/MTY4ODg1Nzk0NTczODUyMw_445968_Ik8sGBgrX4Wni1RH_1756204770)
（2）处理客户工单：客户从OMS端成功创建工单，海外仓WMS端需要根据工单内容进行对应的处理。a. 审核工单：待审核状态--点击审核--进入订单详情页--拒绝/审核通过（点击拒绝，单据进入已作废状态，点击审核通过，单据进入已审核状态）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081685/MTY4ODg1Nzk0NTczODUyMw_110556_dzbDs28QA7-INXIH_1756292286)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081794/MTY4ODg1Nzk0NTczODUyMw_93037_H8t0aLTHN9kZoWJL_1756206002)
 b. 处理工单：审核通过的工单进入已审核状态--点击处理---处理完毕点击提交，单据进入处理完成状态
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081812/MTY4ODg1Nzk0NTczODUyMw_221413_4hyPrXjD_2KMIuCd_1756378501)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081888/MTY4ODg1Nzk0NTczODUyMw_773015_78leh30Fsd5hRM2T_1756293254)
 c. 结算工单：点击详情--点击结算完成--生成计费流水，结算状态变成已结算，工单完结。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081920/MTY4ODg1Nzk0NTczODUyMw_226215_nMMrEWCIp9Rs4hoM_1756293477)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797081974/MTY4ODg1Nzk0NTczODUyMw_856194_L0wV2FVw0y1Vhfdk_1756293524)
注意：有费用的工单结算后才会生成费用单据号！！
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082032/MTY4ODg1Nzk0NTczODUyMw_416932_XXfP1qAW0Fukf9nN_1756378574)

## 3. 
    常见问题

Q1:OMS下工单时添加增值服务为什么是空白？答案：需要创建单据类型是工单的增值服务计费项，操作路径：OMP--应收报价--操作费设置--增值服务--新建计费项--单据类型（工单）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082327/MTY4ODg1Nzk0NTczODUyMw_44399_Eurx8W7mPXL7gUAY_1756460568)
Q2：为什么WMS界面工单没有“处理“的选项？**答案：确认WMS登录账号是否是主账号。如不是，需要主账号开处理工单权限。**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082412/MTY4ODg1Nzk0NTczODUyMw_59603_Nwvw6YkwtVG9PHH9_1756295064)
Q3：工单结算状态怎么从”未结算“变成“已结算”。**答案：处理完成状态点击工单详情--右上角点击结算完成。**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082056/MTY4ODg1Nzk0NTczODUyMw_912913_7pihXHYXbrJrbXSt_1756295208)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082138/MTY4ODg1Nzk0NTczODUyMw_537607_-WivwiTOKzut5Shb_1756295144)
Q4：如何创建“工单类型”？**答案：进入工单模块--点击工单类型管理-- 点击创建工单类型--填写工单类型名称＋选择是否关联库存（关联库存=客户选择此工单类型调整对应的产品，仓库处理后实际的产品库存会随工单调整）**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082142/MTY4ODg1Nzk0NTczODUyMw_75561_vrjML_quIab-w7yZ_1756207000)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082203/MTY4ODg1Nzk0NTczODUyMw_228848_wgrDS3v33PBxvCPe_1756207259)
**注：创建成功的工单类型：工单类型名称和是否关联库存可编辑修改；工单类型支持停用（停用后OMS客户创建工单时不显示该工单类型），不支持删除，停用后支持再次激活使用。**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758797082253/MTY4ODg1Nzk0NTczODUyMw_24596_IManuvbqI8yWLyFl_1756207610)
Q5：为什么工单结算之后没有生成费用单据号？**答案：结算之前需先确认工单是否有添加增加服务计算费用，无费用的工单结算完成是没有费用单据号的**Q6：我修改了增值服务的单价，为什么不能重新计费工单？**答案：工单不支持重新计费，可以直接操作手动调整费用**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781253206470/image.png)

              
                
                  
                
                2026-06-12
