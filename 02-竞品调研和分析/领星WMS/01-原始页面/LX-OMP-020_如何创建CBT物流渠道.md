# 如何创建CBT物流渠道

- 来源编号: LX-OMP-020
- 原始URL: https://help.xlwms.com/2f8e/8a68/8aad/34d9
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用常见问题 > OMP物流渠道常见问题
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-20

---

# 如何创建CBT物流渠道


              
## 1.操作场景

定义：TikTok Shop 的 CBT（Collections by TikTok）是 TikTok Shipping 的升级物流渠道，核心是平台合作物流商上门揽收、集中处理后对接尾程派送，主打成本优化与风险兜底。作用：TK平台出的CBT物流和之前的平台物流的拉面单流程是一致的，只是CBT物流的仓库需要单独处理，单独交货给官方指定物流商，所以仓库单独创建一个自定义可获取平台面单的CBT物流渠道，去区分CBT物流的订单即可。
## 2.操作指引


### 2.1添加自定义物流商账号

在管理后台omp-物流管理-物流商账号-【添加授权】-【自定义物流商】-下一步
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903253946/MTY4ODg1NDkyNzY4Nzg2Mg_454892_UsnXnDl3rUYfMRr-_1763723947)

### 2.2添加授权

填写账户名称（必填），备注（非必填），账户名称是自定义的，用于区分这个自定义物流商，填写后点击授权。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903252905/MTY4ODg1NDkyNzY4Nzg2Mg_817473__rnsi_3Iq8JteJ0v_1763724135)

### 2.3新建物流渠道

在授权好的自定义物流商-【操作】-【新建渠道】
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903252964/MTY4ODg1NDkyNzY4Nzg2Mg_913578_t18bc99N9UXA0HIq_1763724303)

### 2.4填写物流渠道信息

填写【物流渠道代码】/【物流渠道名称】，以及选择承运商，和是否支持保险/签名服务
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903253013/MTY4ODg1NDkyNzY4Nzg2Mg_524352_qWqy-N7Dz9ggp8ZK_1763724873)

### 2.5维护物流渠道的配置信息

物流渠道启用后，可以前往【物流渠道列表】查看和编辑，并维护更多配置信息
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903253185/MTY4ODg1NDkyNzY4Nzg2Mg_911437_pEzUkGJMNLREtrbL_1763725106)

#### （1）必须开启校验存在物流面单，获取平台面单，才可以获取到平台面单（必选）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903253112/MTY4ODg1NDkyNzY4Nzg2Mg_450525_lLN1MhrisRvFrMfv_1763725234)

#### （2）绑定可用仓库（必填），渠道才可使用，其他设置非必填写，按需填写选择。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768903253129/MTY4ODg1NDkyNzY4Nzg2Mg_105136_6mRVjOxj2L4T_R3H_1763725466)

## 常见问题


### Q1：客户在平台下单CBT物流，会有不同的快递承运商，是否需要创建不同承运商的自定义CBT物流渠道呢？

答案：不需要，一个自定义物流渠道是可以自动拉取所有不同承运商的CBT面单，只需创建一个渠道，承运商选择CBT或者TIKTOK CBT即可，仓库只是区分CBT物流进行拣货交给物流公司，并不会再次细分到具体的承运商。
              
                
                  
                
                2026-01-20
