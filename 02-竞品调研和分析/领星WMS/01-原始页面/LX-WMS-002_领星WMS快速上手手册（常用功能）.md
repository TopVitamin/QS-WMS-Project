# 领星WMS快速上手手册（常用功能）

- 来源编号: LX-WMS-002
- 原始URL: https://help.xlwms.com/12d0/5dc2/afcd
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > WMS板块帮助文档 > WMS入门必读
- 页面类型: 系统概览/入门指南
- 抓取日期: 2026-09-24
- 更新日期: 2026-06-12

---

# 领星WMS快速上手手册（常用功能）


              
## 1. 
    操作场景

**定义：**WMS系统主要用于海外仓仓库操作人员使用，本文将为新用户介绍WMS系统的常用功能及常见业务操作。**作用：**协助新用户更快熟悉WMS系统的基础功能，快速开展业务。
## 2. 
    操作指引

登录网址：https://wms.xlwms.com/dashboard
### 2.1. 
    系统语言设置

仓库人员在登录WMS系统界面时，可以在右上角进行语言切换。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810371/MTY4ODg1NjY1ODQ5NjQzNA_897114_69Lc9Tyy_-vnxG_E_1758246803)
登录后如需切换，可点击右上角的头像，在语言信息中进行选择。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781227684193/image.png)

### 2.2. 
    时区配置

仓库人员登录WMS后，点击右上角的头像，可以在下方的时区列表中，选择仓库当地的时区。切换后，WMS系统界面内的时间均按该时区进行显示。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781227613633/image.png)

### 2.3. 
    创建库区库位

开展实际业务前，需要将仓库的区域划分录入到系统，在接收产品时将产品上架到指定库位，或是录入库存时记录存储库位，方便出库时快速定位产品所在位置。路径：领星WMS - 基础数据 - 库区※请注意：
                ● 请注意区分【库区类型】中的正品区与残次品区，对应仅能存放正品库存与次品库存；
                ● 【代理仓】也需要创建至少一个正品区与残次品区。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810365/MTMxMDI3MDI5ODU3NzA1MDg_427739_q_K6lQ8f09MWCXk0_1756384904)
路径：领星WMS - 基础数据 - 库位※请注意：
                ● 优先级数字越大，优先级越高
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810453/MTY4ODg1NjY1ODQ5NjQzNA_769559_TXE8eND1umnVaBy5_1758245989)

### 2.4. 
    库存管理


#### 2.4.1. 
    库存查询

领星WMS的库存类型分为产品库存、箱库存及退货库存，仓库可以在WMS系统中分别查看各类型库存，在当前仓库的可用库存量及锁定库存（尚未完成出库的库存）量。按产品查询：查看相同SKU在当前仓库的剩余库存情况。可支持按库存量范围搜索指定产品。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781229638613/image.png)
按库位查询：按库位展示当前仓库不同SKU的库存情况。可支持按库存量范围搜索指定库区/库位的制定产品。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781229615369/image.png)
库存流水：按记录时间展示当前仓库不同批次SKU在对应库位上的库存变化情况。可支持按记录时间搜索指定单据号/指定批次号/指定产品/指定库位产生的库存变化量。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781229721817/image.png)
批次管理：批次管理主要用于管理产品库存，使仓库的管理达到更精细化的维度，比如入库/上架追踪、有效期管理等方面。可支持查询库存对应的入库上架时间，库内移库、调整库存等操作可以指定到具体批次。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781229694796/image.png)

#### 2.4.2. 
    库存初始化导入

对于WMS系统切换或是客户移仓的业务场景，仓库线下实际已存放库存，无需预报入库单重复操作上架。可使用库存初始化导入，增加指定上架日期的SKU/箱/退货库存量。路径：领星WMS - 库内 - 产品库存/箱库存/退货库存 - 按库位查询 - 导入 - 库存初始化导入
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810546/MTY4ODg1NjY1ODQ5NjQzNA_939162_KBmEyPsofpFpdD5E_1758510110)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810616/MTY4ODg1NjY1ODQ5NjQzNA_967188_vj_GlUSrAEXEa0hW_1758510406)

#### 2.4.3. 
    库存调整

领星WMS系统支持对指定库位上的可用库存量，通过【库存调整】进行增加或减少。方式一（针对有过库存流水，但可用库存量为0的SKU）：按库位查询 - 库存调整 - 添加产品
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810623/MTY4ODg1NjY1ODQ5NjQzNA_33405_9ierKMnQsTol3Hzp_1758511076)
方式二（针对可用库存量不为0的SKU）：按库位查询 - 勾选需要调整的SKU - 库存调整
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810658/MTY4ODg1NjY1ODQ5NjQzNA_621731_zrby9im5UCyPWDcC_1758510886)
方式三（针对批量调整）：按库位查询 - 导入 - 库存调整导入
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810713/MTY4ODg1NjY1ODQ5NjQzNA_170880_zMGPmWUuWfLQL780_1758511535)

#### 2.4.4. 
    移库

领星WMS系统支持将指定库存量的SKU在不同库位间进行转移，并支持通过调整至正品区/残次品区库位，对库存属性进行转换。路径：领星WMS - 库内 - 产品库存 - 按产品查询 - 勾选指定SKU - 移库
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810719/MTY4ODg1NjY1ODQ5NjQzNA_579481_jpijiZOqPn_Tfq-g_1758513388)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810780/MTY4ODg1NjY1ODQ5NjQzNA_70956_IZGT_Lc5c1sm_Snt_1758513362)
可通过【移库导入】，批量操作移库。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810810/MTY4ODg1NjY1ODQ5NjQzNA_697596_jJDeiJBAzdFqsFlY_1758513514)

### 2.5. 
    新品维护

领星WMS系统计费以仓库测量填写的WMS尺寸及重量为准。因此所有新录入系统的SKU，首次入仓都需要记录【新品维护】信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810845/MTY4ODg1NjY1ODQ5NjQzNA_144431_4Fqf3HVt6lQT8gNI_1758519909)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810884/MTY4ODg1NjY1ODQ5NjQzNA_774817_jik2PN-m4rlLSrJ9_1758520008)
如果SKU的首条库存流水记录是通过【库存初始化导入】增加的，需要另外进行测量填写。路径：领星WMS - 入库 - 新品维护 - 测量
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790810947/MTY4ODg1NjY1ODQ5NjQzNA_564535_9ZTfi2pG5lgcucSu_1758519659)

### 2.6. 
    标准入库流程

详细操作说明可参考：※请注意：
                ● 如果客户预报数量与实际到仓数量不一致，请在收货环节按实际情况填写实收数量，系统支持超收少收。上架环节不支持差异收货上架。
                ● 收货环节不会生成库存，需要继续操作上架，将产品放置库位才能对应生成库存。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790811278/MTY4ODg1NjY1ODQ5NjQzNA_693053_uqGeSFibH5SQ36md_1758521729)

### 2.7. 
    标准上架流程

详细操作说明可参考：※请注意：上架单内的产品必须全部上架，系统暂不支持上架数量与收货数量不一致。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790811019/MTY4ODg1NjY1ODQ5NjQzNA_139154_yQHwdxVDVtb9N7_A_1758522067)

### 2.8. 
    一件代发出库

详细操作说明可参考：
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790812552/MTY4ODg1NjY1ODQ5NjQzNA_670141_unqOIUDnWJJBEFRp_1758526784)

## 3. 
    补充说明


### 3.1. 
    名词解释


#### 3.1.1. 
    拣货单库位展示优先级

仓库可以根据货架位设置S型或者Z型拣货路径，在WMS系统内对应配置【拣货单库位展示优先级】，减少拣货人员步行时间，有效提高出库效率。数字越大，展示优先级越高。如图所示，库位A-01-01的拣货单库位展示优先级为10，大于库位0808及库位A03，因此在汇总拣货单上，优先显示A-01-01库位需要拣货的SKU，依次为0808库位、A03库位。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790811076/MTY4ODg1NjY1ODQ5NjQzNA_467026_THKSwVXGphBT_pAD_1758529079)

#### 3.1.2. 
    拣货推荐优先级

当相同SKU分布在不同库位上时，领星WMS系统按库位的【拣货推荐优先级】顺序推荐拣货。如图所示，SKU：0201在多个库位均有可用库存，由于库位：E-2的拣货推荐优先级大于其余库位，在拣货界面展示的默认拣货库位为E-2。仓库可通过该功能实现产品按生产日期顺序出库，生产日期越早的产品存放于【拣货推荐优先级】数字更大的库位，优先出库。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758790811410/MTY4ODg1NjY1ODQ5NjQzNA_619775_o4DvlrSUfzVXHvfR_1758531523)

#### 3.1.3. 
    锁定库存

被出库单或是盘点单占用，暂未完成出库的库存部分。可通过在库内 - 产品库存/箱库存/退货库存 - 按产品查询，点击锁定库存下方蓝色的数字，在弹窗内查看当前锁定这部分库存的单据。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781230017100/image.png)

## 4. 
    常见问题


#### Q1：仓库类型为代理仓的WMS系统，是否需要创建库区库位？

**答案：需要。系统需要将库存量记录在具体的库区库位，所以代理仓也需要创建至少一个正品区库位，以及一个残次品区库位。**
#### Q2：客户预报的退货入库单，上架后生成了退货库存，无法用于一件代发，仓库如何将退货库存转换为产品库存？

**答案：系统暂不支持一键转换。可考虑通过【库存初始化导入】功能增加指定上架日期及数量的产品库存，并使用【库存调整】扣减相同数量的退货库存。**
              
                
                  
                
                2026-06-12
