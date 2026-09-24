# 如何设置分区规则

- 来源编号: LX-OMP-051
- 原始URL: https://help.xlwms.com/2f8e/8a68/eeac/a854
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用常见问题 > OMP费用设置常见问题（操作费、仓租费、物流费、总报价方案）
- 页面类型: 配置说明
- 抓取日期: 2026-09-24
- 更新日期: 2025-09-28

---

# 如何设置分区规则


              
### 1、获取原始邮编分区表

可以联系渠道账号的服务商，或是直接通过承运商官网下载，可参考：[https://m.sohu.com/a/758052565_121823486/](https://m.sohu.com/a/758052565_121823486/)以usps官网下载为例，登录[https://postcalc.usps.com/DomesticZoneChart](https://postcalc.usps.com/DomesticZoneChart)，输入发货地址邮编前三位，点击Submit，复制生成的数据至excel表格中。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911195642/%EF%BC%91%EF%BC%8D%EF%BC%91.png)

### 2、整理邮编分区表

最终导入系统的邮编分区表格式，如下图所示。需要将上一步官网获取到的数据表进行整理。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911232455/%EF%BC%91%EF%BC%8D%EF%BC%92.png)

#### 2.1、确认原始邮编的实际分区


- 带以下特殊符号的分区需留意：

星号*：发件人邮编和收件人邮编归属于同一个中转中心，实际制作分区表时，可删除星号；加号+：在这个邮编范围内会有少量的邮编不在这个区域，单独有对应的邮编分区；需根据官网注释进行调整，例如962-966，如果渠道是Priority Mail service或USPS Ground Advantage(<16 oz.)，则属于7区。其余渠道则属于3区。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911446990/%EF%BC%91%EF%BC%8D%EF%BC%93.png)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911456623/%EF%BC%91%EF%BC%8D%EF%BC%94.png)

#### 2.2、将原始邮编分为开始邮编及结束邮编


- 提取结束邮编

公式可参考：=IF(ISNUMBER(FIND("---",D2)),RIGHT(D2,3),D2)公式运算后，建议使用Ctrl+C及Ctrl+Shift+V，固定当前列的数据，避免因下一步操作而更新。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911530668/%EF%BC%91%EF%BC%8D%EF%BC%95.png)

- 提取开始邮编

可使用分列功能，参考下列选项操作
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911564476/%EF%BC%91%EF%BC%8D%EF%BC%96.png)

#### 2.3、给所有邮编添加通配符

在辅助列输入末尾带通配符*的数据，并在第二行点击Ctrl+E。复制辅助列数据覆盖原数据。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911613372/%EF%BC%91%EF%BC%8D%EF%BC%97.png)

#### 2.4、补充国家地区信息（填写国家二字简码）


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911648007/%EF%BC%91%EF%BC%8D%EF%BC%98.png)

### 3、领星OMP新建分区规则

路径：领星OMP - 物流设置 - 分区规则 - 新建分区规则 - Excel快速导入
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911685266/%EF%BC%91%EF%BC%8D%EF%BC%99.png)
全选复制表格内容，粘贴在弹窗界面内，点击导入。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911709744/%EF%BC%91%EF%BC%8D%EF%BC%91%EF%BC%90.png)
导入后仍可在OMP界面，对数据进行调整。确认无误后点击确定，即可保存。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/c1757e46-f14b-4f1c-8be6-3037669274ac/1738911739356/%EF%BC%91%EF%BC%8D%EF%BC%91%EF%BC%91.png)

              
                
                  
                
                2025-09-28
