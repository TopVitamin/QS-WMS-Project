URL: https://help.jfwms.com/zh_CN/doc-article/7114810825-

- WMS帮助文档(新)

  - 出库

  - 其他

  - ERP授权

  - 物流渠道管理

    - 备货中转出库单支持子母件发货（仅线下物流）
    - 日本分区规则匹配
    - 如何对接佐川物流下单并上传单号和面单？
    - 如何注册、授权、使用CJ物流
    - 如何注册、授权、使用Fedex
    - 物流板块-分区规则跟偏远地区规则里面的匹配方式中增加了前缀匹配的功能
    - 物流计费支持最小计费重
    - 物流追踪新增待追踪环节
    - 物流单号截取设置
    - 如何注册、授权、使用dadan.com物流
    - 极风WMS如何通过shipbest打单
    - 分区规则+按规则自定义物流费设置
    - 如何注册、授权、使用SwiftX
    - 如何注册、授权、使用UniUni
    - 日本跨境电商卖家使用黑猫物流发货流程与注意事项
    - 如何注册、授权、使用EzeeShip物流
    - 日本黑猫物流如何授权极风海外仓系统
    - 如何注册、授权、使用DQPOST物流（快运）
    - 如何注册、授权DHL官方
    - 如何注册、授权J&T EXPRESS-MX
    - 如何注册、授权UPS
    - 开启/关闭线下物流
    - 如何注册、授权Correios（巴邮）
    - 物流渠道设置发货地址设置
    - 开启/关闭线上物流
    - 如何注册、授权、使用GNL（全球易）
    - 如何注册、授权、使用GOFO
    - 物流产品管理和物流比价逻辑
    - 美国邮政服务编码
    - 物流商渠道分组管理
    - 自定义物流渠道管理
    - 如何注册、授权、使用USPS美国邮政
    - 添加系统对接物流渠道
    - 为特殊客户设置物流计费
    - 按自定义规则设置物流费
    - 按费率设置物流费
  - 基础设置

  - 跨境直邮

  - 费用

  - 打印设置

  - 库存管理

  - 工单管理

  - 客户管理

  - 官方仓申请资料

  - B2B

  - 入库

  - 代理仓

  - 产品分销

  - PDA

  - FBA退货
- OMS帮助文档(新)

  - OMS

  - 出库

  - B2B

  - ERP授权

  - FBA退货

  - 入库

  - 分销

  - 商品

  - 工单管理

  - 打印设置

  - 提拆派

  - 新卖家入门

  - 退货
- 视频教程

  - 极风WMS介绍

  - 基础设置

  - 客户管理

  - 物流管理

  - 一件代发

  - OMS操作

  - temu直邮

  - 退货

  - 工单

  - 库内操作

  - ERP教程

  - FBA业务

  - 代理仓

  - B2B

  - 货盘分销

  - PDA使用

  - 提拆派
- 常见问题

  - 客户

  - 库存

  - 商品

  - 入库

  - 出库

  - 物流

  - 费用

  - OMS

  - 注册

  - ERP相关

  - 系统设备

  - 其他

[帮助中心](https://help.jfwms.com/zh_CN) [WMS帮助文档(新)](https://help.jfwms.com/zh_CN/module-0-1-get-started/170-%E5%87%BA%E5%BA%93) [物流渠道管理](https://help.jfwms.com/zh_CN/module-0-2-get-started/163-%E7%89%A9%E6%B5%81%E6%B8%A0%E9%81%93%E7%AE%A1%E7%90%86) 备货中转出库单支持子母件发货（仅线下物流）

# 备货中转出库单支持子母件发货（仅线下物流）

更新于 2026年08月25日

复制链接

**需求背景； 为了满足卖家备货中转出库时，同一个出库单可以分不同的包裹运出的需求，系统现在支持物流渠道可以选择预报方式是一票多件了，即子母件。（特殊说明下，当前支持子母件的物流商是Fedex，其他的物流渠道还在陆续更新中）详细操作步骤如下：**

## **第一，正常授权Fedex 的物流账号，并且在物流商渠道管理里面设置好预报方式，最后，正常给客户开好物流产品即可。这样卖家就可以在自己的OMS 系统里面 正常使用了**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825080541_91754c2339cd480b81139aa21cb0be24.png)

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825080631_4262f45eed21487ab426411ec82f0744.png)

**授权完毕Fedex后，再去设置物流商渠道管理，有些物流商的物流渠道是在授权物流商的时候系统会自动同步过来的，但是有的物流渠道是需要手动添加的。根据情况灵活操作即可**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825081208_0f993d91bda940a3a077a698636800aa.png)

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825081343_fbbf01a38a644161af3c70e71995ab50.png)

**备注：1.一票一件模式适用于一件代发小包裹，一个订单一个包裹；一票多件模式适用于备货转运，一个订单内多个包裹。**

**2.一票多件模式下物流计费默认按照包裹维度计费，一个订单有多个包裹则有多个物流费，业务费用内运费合并展示**

**物流商渠道设置好后，就可以设置物流产品给对应的客户使用了**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825082715_198c132e0b3645ad8e1ffd3203d75cf5.png)

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825083008_797c4f71f1a5461fbbf9d72a985cff10.png)

## **第二，仓库在WMS 按照上述步骤设置好后，现在卖家在OMS 创建备货中转出库时就可以使用预报方式是：一票多件的物流产品了**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825083523_e7b10dc685ed4571ae580d5d67a20831.png)

### **1.出库类型是 按箱出库的情况下，(按箱出库的话，最小单位就是箱)操作如下:**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825085522_05c9aecc06ac41758b8a02f291263d84.png)

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825103628_138510ae96ef43ea9155155506906c4c.png)

**仓库WMS 收到卖家按箱出库出库单后，在出库-备货中转出库环节-待拣货（有时也会在获取运单号环节，要看下获取运单号的状态，是待获取还是获取中，还是获取失败），接下来按照备货中转出库的流程正常操作出库即可。（关于备货中转出库的流程之前有详细的文档，在此不再赘述）**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825092224_227cd52d226c4fed93c7edd6f0a68792.png)

### **2.出库类型是 按产品出库的情况下，操作如下:**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825105014_95e863f5885b465584d0c61031e3f131.png)

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825105830_cb797d8c3f10424ba197c6a2dc417cd1.png)

**仓库WMS 收到卖家按产品出库的出库单后，在出库-备货中转出库环节-待拣货（有时也会在获取运单号环节，要看下获取运单号的状态，是待获取还是获取中，还是获取失败），接下来按照备货中转出库的流程正常操作出库即可。（关于备货中转出库的流程之前有详细的文档，在此不再赘述）**

![](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260825092224_227cd52d226c4fed93c7edd6f0a68792.png)

TOP

查找和替换

0 / 0

区分大小写(英文)

替换全部替换查找

关于 Umo Editor

[![](data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='460.224'%20height='128'%3e%3cg%20fill='none'%3e%3cpath%20d='M450.627%2039.41l9.597%2013.658c-2.724%2015.076-5.577%2030.28-8.3%2045.486-4.886%204.594-9.771%209.19-14.654%2013.787h-65.878c-3.113-4.768-6.355-9.406-9.467-14.174%202.723-15.076%205.576-30.023%208.3-45.099l14.524-13.658h65.878zm-240.182-1.057l-8.99%2049.222h41.483l4.238-22.936%2020.678%2017.653-2.826%2015.205-14.512%2013.787h-65.244l-9.375-13.787%2010.66-59.144h23.888zm57.537%200l32.574%2029.302%2045.733-29.302h15.636l-16.027%2072.931h-27.492l7.297-33.34-31.662%2017.712-45.213-38.55%204.17-18.753h14.984zM430.397%2062.99H396.16l-4.539%203.866c-1.037%205.798-2.205%2011.725-3.242%2017.653l3.112%204.252h35.014c1.297-1.289%202.594-2.577%203.632-3.737.291-1.514.575-3.028.855-4.542l1.661-9.084.855-4.542-3.112-3.866h.001zM78.005%200L65.638%2082.444l-48.62%206.342-.846%205.496%2062.256-1.48%2011.31-68.28%2041.75-10.464-15.855%2091.851-32.026%2021.985H0L18.074%2015.432%2078.005%200zM56.971%2064.581l-37.523%209.302-.422%202.854%2037.522-9.302.423-2.854zm2.431-15.009L21.88%2058.874l-.423%202.853%2037.522-9.301.423-2.854zm2.431-15.009L24.31%2043.865l-.422%202.853%2037.522-9.301.423-2.854zm2.431-15.115L26.742%2028.75l-.423%202.854%2037.522-9.302.423-2.854z'%20fill='%234376F8'/%3e%3cpath%20fill-opacity='.7'%20fill='%23FFF'%20d='M115.633%20106.015l-28.855-.106L83.607%20128z'/%3e%3c/g%3e%3cscript/%3e%3c/svg%3e)](https://www.umodoc.com/)

当前版本: v10.1.0 (开源版)

由 [Umodoc](https://www.umodoc.com/) 用爱发电

[Github](https://github.com/umodoc/editor) \| [开发文档](https://dev.umodoc.com/cn/docs/editor) \| [NPM](https://www.npmjs.com/package/@umoteam/editor)

感谢每一位贡献者

[Cassielxd](https://github.com/Cassielxd) · [china-wangxu](https://github.com/china-wangxu) · [Na'aman Hirschfeld](https://github.com/Goldziher) · [SevenDreamYang](https://github.com/SevenDreamYang) · [ChenErik](https://github.com/ChenErik) · [SerRashin](https://github.com/SerRashin) · [Sunny Wisozk](https://github.com/SunnyWisozk) · [Sherman Xu](https://github.com/xuzhenjun130k) · [vace](https://github.com/vace) · [Mikasa33](https://github.com/Mikasa33)

了解功能更强大的 [Umo Editor Next](https://www.umodoc.com/business)

快捷键列表

常用快捷键

- 复制
`Ctrl`  `C`

- 粘贴
`Ctrl`  `V`

- 粘贴为纯文本
`Ctrl`  `Shift`  `V`

- 撤消
`Ctrl`  `Z`

- 重做
`Ctrl`  `Y`

- 全选
`Ctrl`  `A`

- 查找替换
`Ctrl`  `F`

- 插入新段落
`Enter`

- 换行
`Shift`  `Enter`

- 保存文档
`Ctrl`  `S`

- 打印
`Ctrl`  `P`


文字格式

- **粗体**
`Ctrl`  `B`

- _斜体_
`Ctrl`  `I`

- 下划线
`Ctrl`  `U`

- ~~中划线~~
`Ctrl`  `Shift`  `X`

- 增加缩进
`Tab`

- 减少缩进
`Shift`  `Tab`


页面显示

- 分页符
`Ctrl`  `Enter`

- 页面放大
`Ctrl`  `+`

- 页面缩小
`Ctrl` `-`

- 缩放到初始比例
`Ctrl`  `1`

- 缩放到最佳比例
`Ctrl`  `0`

- 全屏模式
`Ctrl`  `F11`


![](https://help.jfwms.com/zh_CN/doc-article/7114810825-)

[下一篇:日本分区规则匹配](https://help.jfwms.com/zh_CN/doc-article/7107370601-)

[下一篇](https://help.jfwms.com/zh_CN/doc-article/7107370601-)

目录

[第一，正常授权Fedex 的物流账号，并且在物流商渠道管理里面设置好预报方式，最后，正常给客户开好物流产品即可。这样卖家就可以在自己的OMS 系统里面 正常使用了](https://help.jfwms.com/zh_CN/doc-article/7114810825-#be589867ac "第一，正常授权Fedex 的物流账号，并且在物流商渠道管理里面设置好预报方式，最后，正常给客户开好物流产品即可。这样卖家就可以在自己的OMS 系统里面 正常使用了")

[第二，仓库在WMS 按照上述步骤设置好后，现在卖家在OMS 创建备货中转出库时就可以使用预报方式是：一票多件的物流产品了](https://help.jfwms.com/zh_CN/doc-article/7114810825-#494f1b62fc "第二，仓库在WMS 按照上述步骤设置好后，现在卖家在OMS 创建备货中转出库时就可以使用预报方式是：一票多件的物流产品了")

[1.出库类型是 按箱出库的情况下，(按箱出库的话，最小单位就是箱)操作如下:](https://help.jfwms.com/zh_CN/doc-article/7114810825-#7008cbd638 "1.出库类型是 按箱出库的情况下，(按箱出库的话，最小单位就是箱)操作如下:")

[2.出库类型是 按产品出库的情况下，操作如下:](https://help.jfwms.com/zh_CN/doc-article/7114810825-#2346b86d0d "2.出库类型是 按产品出库的情况下，操作如下:")

[![logo](https://help.jfwms.com/_nuxt/logo_blue_cn.K0kHFjDi.png)](https://www.jfwms.com/zh_CN)

- [预约演示](https://wms.jfwms.com/user/apply) [免费试用](https://wms.jfwms.com/register)
