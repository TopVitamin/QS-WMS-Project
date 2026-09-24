# 如何在领星OMS授权旺店通ERP跨境版

- 来源编号: LX-OMS-015
- 原始URL: https://help.xlwms.com/d458/aabc/b26d/1fa4
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS平台相关 > OMS主流ERP授权相关问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-19

---

# 如何在领星OMS授权旺店通ERP跨境版


              
## 1. 操作场景

定义：旺店通ERP跨境版授权领星OMS，是指通过预先在旺店通ERP中配置好的API接口，将旺店通处理完毕的订单数据（包括订单基本信息、商品详情、最重要的成本信息和最终确定的物流信息）推送到领星OMS系统中的过程。作用：旺店通ERP 向领星OMS推单的模式，结合了两者优势，形成了“旺店通管流程、降本增效；领星管数据、决策支持”的最佳实践。它确保了企业既拥有高效稳定的日常运营能力，又具备基于真实数据进行精细化管理和科学决策的能力，是跨境电商企业迈向规模化、专业化管理的标志。
## 2. 
    操作指引


### 2.1获取领星的授权信息

登录OMS系统，点击OMS右上角的头像，点击API信息，获取App Key 和App Secret
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124368/MTY4ODg1NzU4MzcwMzgzNg_124250_rzkczcKPeRpDliHN_1757986654)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124386/MTY4ODg1NzU4MzcwMzgzNg_2696_uO0snZkxWTzlwZh4_1757986647)

### 2.2授权旺店通ERP跨境版


#### （1）登录旺店通ERP跨境版

登录网址：[https://kj.qizhishangke.com/s/erp/](https://kj.qizhishangke.com/s/erp/)填写登录信息后，点击登录
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227126509/MTMxMDI3MDEwMjEwODY2MDc_703651_C7QjuV168-WuGcuH_1757986495)

#### （2）三方仓新建授权

a.仓库-库内管理-仓库一览-新建仓库，选择需要授权的三方海外仓
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124395/MTY4ODg1NzU4MzcwMzgzNg_861224_2sko7xEeJcRjZQUR_1757986887)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124419/MTY4ODg1NzU4MzcwMzgzNg_600745_WgFz60uGuWNRFPw3_1757986892)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124526/MTY4ODg1NzU4MzcwMzgzNg_211494_9EkjOjx4EOoJWoyY_1757986897)
注：开启外部库存：旺店通ERP会根据接口返回的海外仓库存数据作为库存的判断依据，定时拉取更新海外仓库存至ERP；不开启外部库存：旺店通ERP根据ERP系统入库单据的入库量判断货品库存是否可发，由于三方仓备货周期长，可能导致与三方仓实际库存不一致的情况，无法正常推送订单b.填写相应信息后，点击授权，填写第一步获取到的授权信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124588/MTY4ODg1NzU4MzcwMzgzNg_631976_X-b9QYND7sGQTOby_1757986999)

### 2.3仓库初始化流程


#### （1）三方仓物流新建映射

设置路径：设置-授权管理-物流设置-国际自定义物流-新建物流方式注：当海外仓获取面单时（非ERP推送），使用国际自定义物流；当使用平台物流时，选择平台物流新建即可，按需选择新建。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124636/MTY4ODg1NzU4MzcwMzgzNg_514797_d5Lv1E4iw5PilDk7_1757987217)
分别维护物流基本信息、配送范围及限制、模板及物流设置以及地址信息；维护完所有必填字段后，点击【保存】保存当前物流入方式。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124641/MTY4ODg1NzU4MzcwMzgzNg_280970_teV0W2iNjwAd8LVu_1757987223)
若需要使用该物流方式，则需要点击【启用状态】启用当前物流方式方可使用该物流。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124684/MTY4ODg1NzU4MzcwMzgzNg_208536_2MxjAQEH3f_CqoFO_1757987228)

#### （2）下载三方仓物流

设置路径：仓库-库内管理-仓库一览-下载物流公司
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124737/MTY4ODg1NzU4MzcwMzgzNg_204042_M0k_SzMmJhVLwf6N_1757987336)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124773/MTY4ODg1NzU4MzcwMzgzNg_594206_-O7l6hZNlG8oGrBC_1757987341)
物流渠道映射更新
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124800/MTY4ODg1NzU4MzcwMzgzNg_347706_tFF_5XjJbTyLtNp-_1757987357)

#### （3）下载三方仓的货品

设置路径：仓库-库内管理-仓库一览-库存初始化手动点击库存初始化后会同步三方仓货品信息至ERP系统中，然后再点击刷新货品数据查看即可。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124854/MTY4ODg1NzU4MzcwMzgzNg_762412_2nef3Hg7lS1p8W6I_1757987454)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124894/MTY4ODg1NzU4MzcwMzgzNg_917098_1S3_BcsfzdKgmYfD_1757987460)

#### （4）ERP系统SKU与三方仓货品配对

当ERP系统SKU与三方仓SKU一致时，可以点击自动匹配系统货品进行匹配；也支持通过表格导入匹配关系，或手动匹配货品完成映射。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124942/MTY4ODg1NzU4MzcwMzgzNg_484935_HnLcqfUkNpQVT85n_1757987518)

### 2.4如何推单到海外仓


#### （1）移入配货

操作路径：订单-订单处理-待处理状态界面，给要发货的订单选择好对应仓库和物流，点击移入配货中注：仓库库存不能少于发货数量
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227125368/MTY4ODg1NzU4MzcwMzgzNg_129231_2UxOpQ-AIG9yJbJT_1757987578)

#### （2）查看推送状态

成功移入配货中后，来到【外部仓配货中】状态，在这个界面可以在外部仓信息中查看是否推送成功；a.如果推送失败，可以查看具体失败原因，点击订单详情做相应修改，修改后再勾选此订单，然后点击重新推送订单。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227124986/MTY4ODg1NzU4MzcwMzgzNg_242626_3hLzTUVGp18AgCBX_1757987696)
b.成功推送到领星OMS后，会在OMS-仓储服务-一件代发出库单中显示这些订单
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759227125010/MTY4ODg1NzU4MzcwMzgzNg_289272_K9sNIaHJNMY-uuBf_1757987741)

## 3.补充说明


### （1）名词解释

a.国际物流：指国内直发国际的物流b.平台物流：指客户使用平台自己的物流，c.平台仓物流：指平台提供仓和物流，如:速卖通、FBA等;d.国内物流：指从国内仓运输至货运代理的头程物流;e.自定义物流：包括无单号物流或者自定义物流，没有对接的一些物流公司，一般发生在线下;
## 4.常见问题

Q1:对接旺店通新建仓库，仓库子类别那里没有仓库代码怎么办A1:需要联系旺店通的IT进行添加
              
                
                  
                
                2026-01-19
