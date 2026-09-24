# 领星ERP如何推送入库单至领星OMS

- 来源编号: LX-OMS-031
- 原始URL: https://help.xlwms.com/d458/dc94/fe0f/6c1e
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS常见问题 > 领星ERP相关问题处理
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-20

---

# 领星ERP如何推送入库单至领星OMS


              
### 流程概要


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895028798/MTY4ODg1NjY1ODQ5NjQzNA_819421__Ti0WCE111gjg-eU_1754019477)

### 1. 
    添加海外仓备货单

路径：仓库 - 海外仓备货单 - 添加单据 - 添加海外备货单/导入添加备货单※请注意：【下单至三方仓】一定要选择”是“，才能推送至领星OMS
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895028803/MTY4ODg1NjY1ODQ5NjQzNA_187408_Q0iojyv50mIwgKN6_1753954006)

### 2. 
    审核备货单

上一步点击添加后，系统会对比发货仓库的可用量及备货量。
                ● 当可用量大于备货量时，单据状态会更新为”待申报“-”待发货“-”待拣货“状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029705/MTY4ODg1NjY1ODQ5NjQzNA_489501_RyRPQjrWJGwc0Uji_1753956229)

                ● 当可用量小于备货量时，单据状态会更新为”待申报“-”待配货“，需要操作”分配库存“。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029873/MTY4ODg1NjY1ODQ5NjQzNA_508840_E6a9-kdipvsmiEkV_1753956245)

### 3. 
    申报备货单

需对备货单进行申报（申报后，领星ERP把备货单传到领星OMS - 入库界面)，申报后才可点击发货。点击申报后，左上角的第三方单号，会显示领星OMS的入库单号。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895028973/MTY4ODg1NjY1ODQ5NjQzNA_113168_Tupxt1l4eurwxbXR_1753957081)
客户可以登录领星OMS - 仓储服务 - 入库 - 待入库，搜索对应的入库单号（对应领星ERP界面的第三方单号）/参考单号（对应领星ERP的系统单号）进行查看。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029041/MTY4ODg1NjY1ODQ5NjQzNA_227264_0LQqY5aEaN3_mqiE_1753957163)

### 4. 
    备货单发货

已申报的备货单需要点击“发货”，进入【待收货】状态才能同步海外仓的收货情况。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029061/MTY4ODg1NjY1ODQ5NjQzNA_958192_605HH5-bfkSHQnkO_1754018871)

### 5. 
    同步海外仓收货数据

路径：设置 - 业务配置 - 仓库 - 基础 - 海外仓 - 自动处理，【开启】自动收货
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029220/MTY4ODg1NjY1ODQ5NjQzNA_892184_VDIt7Ah7o6d33n7c_1754019685)
海外仓备货单每隔30分钟自动同步领星OMS的上架状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029301/MTY4ODg1NjY1ODQ5NjQzNA_599700_p07YlW9XyTntloyr_1753957965)
可以在海外仓备货单 - 待收货界面，手动点击“立即更新”，即时同步收货情况。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029356/MTY4ODg1NjY1ODQ5NjQzNA_632419_7iJdFZWxqlQHiDTD_1754019774)
当仓库完成单据内所有产品的收货上架后，海外仓备货单会自动更新为【已完成】状态。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029412/MTY4ODg1NjY1ODQ5NjQzNA_572433_gz8vk2l9tj1orZAe_1754027325)

### 常见问题


#### Q1：海外仓备货单已上传了附件，领星OMS未显示

A1：领星ERP的海外仓备货单暂不支持推送附件至领星OMS，如有附件需要提交仓库，请登录领星OMS操作上传。步骤可参考：领星OMS - 仓储服务 - 入库，点击入库单号进入单据详情页内，点击留言板 - 上传附件，附件上传完成后，需要点击【回复】，才能提交至仓库。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029455/MTY4ODg1NjY1ODQ5NjQzNA_316537_z-Wp-_cVA3EGLMKJ_1754020715)

#### Q2：海外仓备货单如何填写自定义箱条码

A2：如需推送自定义箱条码至领星OMS，请先勾选“下推自定义箱号“。装箱信息界面，点击编辑标识，在输入框内按顺序分行填写每箱对应的自定义箱条码。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029510/MTY4ODg1NjY1ODQ5NjQzNA_997706_f67-Q_WaZBhs9d70_1754021033)

#### Q3：领星ERP是否支持打印箱唛

A3：当备货单更新为“待收货”状态时，可点击操作 - 打印箱唛，会自动同步领星OMS生成的箱唛并进行打印。请先按照提示下载安装打印控件。如果您需要在箱唛上展示箱内产品信息，打印尺寸请选择100×100mm，或是100×150mm。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029524/MTY4ODg1NjY1ODQ5NjQzNA_630415_Zq4zDs4lD7EwAnOY_1754027078)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768895029541/MTY4ODg1NjY1ODQ5NjQzNA_296433_Igr63hpRNXRqv-2j_1754027066)

              
                
                  
                
                2026-01-20
