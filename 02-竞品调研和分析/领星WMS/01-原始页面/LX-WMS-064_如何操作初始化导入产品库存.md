# 如何操作初始化导入产品库存

- 来源编号: LX-WMS-064
- 原始URL: https://help.xlwms.com/12d0/daf7/3d57/2301
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > WMS板块帮助文档 > WMS使用常见问题 > WMS库存相关问题
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2025-05-26

---

# 如何操作初始化导入产品库存


              
## 1. 
    操作场景

**定义**：将线下实际已在仓的产品库存录入系统，并按照指定的上架时间统计库龄。**作用**：增加指定上架日期的产品库存量，为出库等系统运行奠定库存基准。
## 2. 
    操作指引

操作路径：【WMS】-【库内】-【产品库存】-【按库位查询】-【导入】-【库存初始化导入】
### 2.1. 
    下载导入模版


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902265130/MTY4ODg1NzYyMTU2ODYyMg_761340_lmi2hH4bmKEE4BjH_1748224714)
打开模板填写信息（注意导入数据不要超过5000条）
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264631/MTY4ODg1NzYyMTU2ODYyMg_906102_m8gh0uia11Dj6F1T_1748226554)

### 2.2. 
    填写模版


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902582137/image.png)
具体填写如下：
- 客户代码：OMP-客户列表-客户代码（七位数）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264691/MTY4ODg1NzYyMTU2ODYyMg_900311_OF8A9--EhezwG7XY_1748227616)

- SKU：确认SKU在客户的OMS系统是创建并且已审核的状态


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264776/MTY4ODg1NzYyMTU2ODYyMg_306839_2vXEjuOjy7BA2sf__1748229181)

- 库存属性：默认是正品，下拉可以选择更换为次品。请填写与下拉框内一致的信息，其余信息可能报错。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264741/MTY4ODg1NzYyMTU2ODYyMg_650101_2lhaoRaWWzwkaFbz_1748229369)

- 库位编码：在WMS-基础数据-库位编码查看


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264816/MTY4ODg1NzYyMTU2ODYyMg_848410_x8m6QerOwKHEhRxH_1748229279)

- 库存数：当前行的SKU对应指定的上架时间，需要上架的库存数量


- 上架日期：填写货物到仓的上架时间，可填写历史时间，填写格式为XXXX/XX/XX或者XXXX-XX-XX。例如：2025年5月26日，正确的填写格式为：2025/05/26或者2025-05-26


- 备注：备注字段仅限WMS查看，客户OMS端口是无法查询的


- 生产日期：如果产品已开启【有效期管理】，则需要补充填写该产品的生产日期、有效期及失效日期


### 2.3. 
    选择文件进行导入

将2.2填写好的表格进行导入
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264836/MTY4ODg1NzYyMTU2ODYyMg_645114_TGe4ZGzrrWI_5-Tm_1748239846)
再到WMS-右上角的【任务中心】查看导入进度，若导入失败，可下载失败文件查看原因
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264845/MTY4ODg1NzYyMTU2ODYyMg_584085_1yDmilIW8aEQNmbc_1748520601)

## 常见问题


### Q1：导入库存失败，提示：客户代码有误

**答案：确认客户代码填写是否和OMP查询的一致，不需要填写客户名称**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781247881943/image.png)
**如果客户代码和OMP显示一致，请确认客户是否有绑定当前导入库存的仓库**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/e5b7ee59-f680-481e-b0da-5daef37e6528/1781247858019/image.png)

### Q2：导入库存失败，提示：上架日期有误

**答案：上架日期要求数据格式为XXXX/XX/XX或者XXXX-XX-XX。例如：2025年5月26日，正确的填写格式为：2025/05/26或者2025-05-26。建议将单元格格式设置为“文本”，再录入上架日期，确认日期与要求的格式一致。**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264961/MTY4ODg1NzQ5NjY5ODMzNw_241348_GPjvujUnA50kGYgL_1768902145)

### Q3：导入库存失败，提示：库位编码有误

**答案：在WMS-基础数据-库位，如果导入的是正品/次品库存，则确认填写的是否是正品区/次品区的库位编码**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902264969/MTY4ODg1NzYyMTU2ODYyMg_686091_7-N2GYOGhL_JZT56_1748604547)

### Q4：导入库存失败，提示：SKU不存在

**答案：确认表格里填写的SKU在OMS-产品管理-产品是否是已审核状态，且SKU大小写一致**
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1768902265034/MTY4ODg1NzYyMTU2ODYyMg_568044_s45YKZoYzRP94ObV_1748604740)

              
                
                  
                
                2026-06-12
