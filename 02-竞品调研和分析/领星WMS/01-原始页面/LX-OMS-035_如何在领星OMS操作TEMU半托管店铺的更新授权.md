# 如何在领星OMS操作TEMU半托管店铺的更新授权

- 来源编号: LX-OMS-035
- 原始URL: https://help.xlwms.com/d458/dc94/fe65/1700
- 所属板块: OMS货主端
- 面包屑路径: 首页 > OMS帮助文档 > OMS常见问题 > OMS平台订单常见问题
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2026-01-20

---

# 如何在领星OMS操作TEMU半托管店铺的更新授权


              
## 1. 
    操作场景

**定义**：领星 OMS 同步已授权的 TEMU 店铺订单时，核心前提是OMS端填写的access_token，必须与店铺后台当前生效的授权信息完全一致。若两者信息不匹配，需在领星 OMS 中操作更新授权，重新录入正确的 access_token。**作用**：确保 TEMU 店铺订单正常同步至领星 OMS，避免因授权信息不一致导致的订单同步失败、获取平台面单及标发异常等问题。
## 2. 
    操作指引


### 2.1. 
    确认领星OMS已授权的TEMU店铺基础信息

为避免前后授权不一致，请确认当前领星OMS已授权店铺的站点及店铺ID，需要登录对应店铺的主账号获取access_token。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894727857/MTY4ODg1NzQ5NjY5ODMzNw_622429_UvMG7pCAb2LLQluG_1768892000)

### 2.2. 
    登录店铺后台，重新授权，获取最新的access_token

**第一步**：进入Seller Center-服务市场-授权管理，先在左上角切换为订单所属的站点，再点击重新授权
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728998/MTY4ODg1NzY1NTU3NTU3MA_420149_-hTO_vCGpTxzwlzL_1751174887)
**第二步**：点击重新授权之后，勾选所有的常规权限以及特殊权限
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728011/MTY4ODg1NzY1NTU3NTU3MA_568737_xMv8h4QZrXHpHQGo_1751175070)
**第三步**：复制生成的access_token
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728037/MTY4ODg1NzY1NTU3NTU3MA_673365_K46P6WcXp7dv2EPg_1751175142)

### 2.3. 
    返回领星OMS界面，操作更新授权

回到OMS-平台店铺-TEMU-选择对应的店铺，点击右侧的更新授权
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728217/MTY4ODg1NzY1NTU3NTU3MA_588448_Mv-dLa3lZ6anwqVC_1751175220)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728059/MTY4ODg1NzY1NTU3NTU3MA_582546_2mUm3OQd5bPmwerB_1751175273)

### 2.4. 
    确认所有授权了同一店铺的领星OMS账号都已粘贴了相同的access_token

若同一店铺授权了多个领星OMS账号，在店铺后台完成重新授权并生成新的授权码后，需将该授权码同步录入所有关联的领星OMS账号完成更新操作，确保所有OMS账号使用的都是同一个access_token，并与店铺后台最新的授权信息保持一致。
## 常见问题

Q1：领星OMS操作更新授权，报错“access_token not exists".
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728100/MTY4ODg1NzQ5NjY5ODMzNw_687118_nBclsvyO26c38qJ9_1768893173)
**答案**：报错原因为当前粘贴的授权码不属于领星WMS应用，或是生成授权码的站点与OMS选择的不一致。请返回TEMU店铺后台，确认授权的是【领星WMS】应用，且页面显示的站点与OMS选择的一致。
### Q2：领星OMS操作更新授权，报错“更新后的店铺ID为***，与原店铺不一致”


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728150/MTY4ODg1NzQ5NjY5ODMzNw_595851_BRHlpyP_gvct9aeD_1768893584)
**答案**：当前仅支持更新归属同一店铺的授权码，可通过领星 OMS - 平台授权 - TEMU界面展示的店铺 ID进行核实。※需注意，该界面的「店铺名称」「店铺代码」均为客户自定义信息，授权流程中不做校验，务必以店铺 ID为准，确认实际授权的店铺账号。如果填写的店铺名称及店铺代码，实际与店铺ID不属于同一个店铺，请在OMS操作停用该店铺，重新“添加授权”，使用新的店铺名称及店铺代码，授权于店铺ID对应一致的店铺。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768894728227/MTY4ODg1NzQ5NjY5ODMzNw_876502_VWX3aGUtL1zYvB1n_1768893784)

### Q3：客户的同个TEMU店铺同时授权了两个领星OMS账号，A账号操作更新授权后，B账号就同步不到订单了。

**答案**：领星 OMS 同步已授权的 TEMU 店铺订单时，核心前提是OMS端填写的access_token，必须与店铺后台当前生效的授权信息完全一致。因为在TEMU店铺后台操作重新授权，会导致历史的授权码失效，所以B账号没有粘贴和A账号一致的新的授权码，仍使用历史的授权码就会无法同步订单。※在TEMU店铺后台操作重新授权后，要确保所有关联了当前店铺的领星OMS账号都粘贴了相同的最新的授权码。
              
                
                  
                
                2026-01-20
