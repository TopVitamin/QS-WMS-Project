# 使用WMS实现FBA换标

- 来源编号: LX-WMS-009
- 原始URL: https://help.xlwms.com/12d0/d5f9/6655/6443
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > WMS板块帮助文档 > WMS使用功能介绍 > FBA退货换标篇
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-06-12

---

# 使用WMS实现FBA换标


              
## 1.操作场景

**定义：**换标服务，就是对需要发往亚马逊FBA仓库的货物进行一系列高效、准确、可追溯的更换商品标签（FNSKU）和包装的操作流程。**作用：**本章将指导您如何将换标这一系列复杂的、易出错的手工操作，转变为由WMS系统驱动和管理的标准化、流程化、数字化的作业模式。
## 2.操作指引

（1）进入WMS系统： 登录您的WMS管理后台，导航至FBA退货菜单。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799050890/MTY4ODg1Nzg1NDY5NDk5MA_960036_i_VbR-Hhs2Ge5FVm_1757668384)
（2）处理FBA换标服务单：导航至换标服务菜单，待处理状态点击确认并开始处理按钮，点击确认，单据会流转到待拣货状态。同时可打印退货换标清单和下载单据的附件。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799050906/MTY4ODg1Nzg1NDY5NDk5MA_378427_1aqptBAmhHyRgYsf_1757995321)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051025/MTY4ODg1Nzg1NDY5NDk5MA_341611_OiGClC3dsnNvtaqX_1757995486)
（3）选择待拣货单据：在待拣货状态，点击操作下的拣货按钮。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051200/MTY4ODg1Nzg1NDY5NDk5MA_709668_oA0rK4F6Os5dirBd_1758006282)
（4）进行拣货：进入到单据详情，勾选要拣货的产品，填写拣货库位和拣货数量。同时也可打印拣货换标单和附件。a. 实际拣货数量 = 预报拣货数量：点击确认按钮，单据会直接流转到处理中状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051095/MTY4ODg1Nzg1NDY5NDk5MA_966888_2PzuoKRBk4FtO1mb_1758013281)
b. 
    实际拣货数量 < 预报拣货数量：点击确认按钮，再重回单据列表操作单据点击拣货按钮，点击拣货完结按钮，单据才可完成拣货，流转到处理中状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051133/MTY4ODg1Nzg1NDY5NDk5MA_689579_IO5TmLghPr2m02Qw_1758014120)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051288/MTY4ODg1Nzg1NDY5NDk5MA_666131_CiiefgM_GnH4U2J-_1758014231)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051365/MTY4ODg1Nzg1NDY5NDk5MA_791978_WNMapYhiitZ49_hS_1758014263)
（5）填写装箱信息：在处理中状态，点击填写装箱信息按钮。填写的换标总数量 = 箱数 * 箱内产品数量之和。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051423/MTY4ODg1Nzg1NDY5NDk5MA_373431_GUiwygwC-wEM8hRB_1758015383)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051514/MTY4ODg1Nzg1NDY5NDk5MA_399921_q8aHZH-BlXE7GRAv_1758016947)
（6）确认附件补充需求：如有装箱清单或其他附件需上传在单据中，可在填写装箱信息时上传附件。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051595/MTY4ODg1Nzg1NDY5NDk5MA_370541_xA_YvC7y1_DZu-Wv_1758017026)
（7）完成装箱信息填写：信息确认无误后，点击提交到OMS按钮，系统将根据您填写的信息，完成单据装箱信息的填写，同时单据流转到已处理状态，完成订单的操作。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051665/MTY4ODg1Nzg1NDY5NDk5MA_681651_5Xde3IHsYHJzXiPD_1758017684)
（8）查看单据预报和实际装箱信息：单据处理完成后，在已处理状态点击换标服务单号，在单据详情中可查看预报产品信息和仓库实际装箱信息（可按箱类型、单箱、FNSKU三个维度进行查看）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051750/MTY4ODg1Nzg1NDY5NDk5MA_475842_bkCs6X7WkbwquQ5Z_1758018176)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051840/MTY4ODg1Nzg1NDY5NDk5MA_534825_oWk5P5IkVj8hvrBY_1758018191)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799051976/MTY4ODg1Nzg1NDY5NDk5MA_543165_7HZauAuTYj_0tHPd_1758018254)

## 3.补充说明


### (1)名词解释

换标服务单状态
                ● 全部：汇总展示所有状态的换标服务单（用于筛选查询）。
                ● 待处理：客户在OMS新建换标服务单并提交，表示退货换标单已成功提交至仓库系统，点击“确认并开始处理”，操作成功后即为待拣货状态，可打印退货换标清单和下载附件。
                ● 待拣货：仓库可开始进行拣货操作。此时可打印换标拣货单和下载附件，此时退货换标单不可取消。
                ● 处理中：仓库已完成拣货后，填写换标信息和装箱信息，提交到OMS，同时完成换标服务单的处理。
                ● 已处理：仓库已完成该换标服务单拣货和换标。
                ● 已取消：该换标服务单已被作废，不再执行后续操作。
## 4.常见问题

Q1：如何取消换标服务单?**答案：单据在待处理状态，可以在OMS操作进行取消**Q2：待拣货的换标服务单操作拣货完结，提示请拣货
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799052001/MTY4ODg1Nzg1NDY5NDk5MA_843676_KSsFfoDf9Mqmi1t4_1758078898)
**答案：需要先点击确认按钮。如果拣货数量和预报数量一致，单据会直接流转到处理中状态；如果拣货数量和预报数量不一致，点击确认按钮后，再操作单据进行拣货，点击拣货完结按钮。**Q3：换标服务发能否进行多次拣货？**答案：可以。操作单据进行拣货，点击确认按钮，单据仍会停留在待拣货状态，可继续进行拣货操作，直至拣货数量与预报数量一致后，单据会自动流转到处理中状态。**Q4：如何下载新FNSKU条码？**答案：点击换标服务单号，进入到单据详情页面，勾选需要下载的条码产品，点击下载条码按钮**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799052177/MTY4ODg1Nzg1NDY5NDk5MA_82142_VVbac5fVu_a60am7_1758088405)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758799052098/MTY4ODg1Nzg1NDY5NDk5MA_712936_PrBNMR0sHkzAHVf-_1758088443)

              
                
                  
                
                2026-06-12
