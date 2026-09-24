---
sourceId: "JF-OMS-GEN-008"
title: "TEMU店铺授权OMS 以及订单处理全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7109070603-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > TEMU店铺授权OMS 以及订单处理全流程"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7109070603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-11T12:00:38.027Z"
---

# TEMU店铺授权OMS 以及订单处理全流程

## 一、定义
卖家客户没有使用erp，直接把temu店铺授权海外仓，获取订单，批量处理订单。

温馨提示：

1.当前支持欧、美半托管、美国本土店铺、以及全球店铺授权，

2.授权时选择对应的店铺类型，否则授权成功后无法修改店铺类型，只能删除店铺重新授权添加。删除店铺授权，信息会彻底删除，且无法恢复。

3.店铺授权后，需要做SKU产品配对映射，仓库配对、线下物流配对，否则会影响正常发货。

##  二、操作说明

### 1.半托管店铺授权step1：点击链接直达temu店铺授权页面

[https://agentseller-us.temu.com/open-platform/system-manage/client-manage](https://agentseller-us.temu.com/open-platform/system-manage/client-manage)

 step2：获取temu的access token，用于授权

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811091932/caf6f338ceea54f234b30d80aa475a29.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811092019/08acd66c24f10568c9bde783d2ae5f6d.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811092114/90f822d373e47d030d0bcbf884a7390d.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811092224/dc213099444981c0ad21261ae7f52f67.png)

 

step3：在极风OMS进行授权

![f72f2ed25f3c1706f90bda91281f996c.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603090531/d7be4a064fb83ed3a66a2d6a86443441.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603090602/65dcccddd1af1db77a16bd2065055bb0.png)

把前面在Temu里获取的access token填入

![企业微信截图_17864387425501.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811092852/80579c74484b093f8be7e5198f32a47f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811093140/7f10f752dbaf6dd7636e9621b2f5f931.png)

授权成功后，列表会新增一条店铺数据，您可以通过极风OMS完成订单处理、产品映射关系配对等操作。

### 2、本土店铺授权step1:进入Temu卖家后台，点击 应用商店。搜索JFWMS,点击“授权

![图片](https://download.jfwms.com/prod/static/back_help/img/3/20250328022017/fa905ab575e20b7cc4e125bbda90d322.jpg)

step2: 勾选权限及同意协议，点击“提交”

![图片](https://download.jfwms.com/prod/static/back_help/img/3/20250328022126/db41500d3fa246f4e73eb6f6853cba4f.jpg)

step3: 复制Acess Token

![图片](https://europe.meiyunji.net/europe-erp/notice/20240614095218/a1320805ca6a6acaa93002e1f3788cee.png)

Step4: 打开极风OMS系统，前往：设置-店铺授权-Temu点击“授权店铺”填写授权信息及刚才复制的Acess Token后确定即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811112353/6bba0b0b263474443262da3ad4367f70.png)

## 三、极风OMS创建商品信息
完成授权店铺后，接着就要录入商品SKU信息到系统（也就是推送商品SKU信息到WMS系统里面）

#### 1.单个创建商品SKU

![306237677f1f23023273e68e7335c9f4[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060542/9edf4e29b3fcea0edb044b766b487cb8.png)

![bb44de199fa98e0f2c4cd5d136bc413d[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060555/7948d1919e9974b23d6265c72ad5cffc.png)

#### 2.商品SKU的批量导入

![45a6bb25c09e510cf0d60889430f8507[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060658/5d953aaa052770d1f58b9e783de37a99.png)

![a404dd49901478a44ad2f1adba934b60[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060709/eb5c12c15e89f821fe33a4d585374d4c.png)

商品导入后，可以在商品页面进行商品的编辑，更新，还有打印商品标签

![fe27ee88f428d0bf90935e8927189ee6[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060738/9e3e830b1dfbc21349e96776b7d4c869.png)

## 四、商品配对
处理订单前提：店铺商品与海外仓商品配对

#### 1、OMS商品配对的方法

![293b8df10808ff48e1ba0f73ac90031f.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603075302/00e12d461dc38a9ffab271ab898d2379.png)

![279d88811ad316b9071d3716a66c660e.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605070948/28a3e6b1c421c46e008b64fcf26a8566.png)

特别强提醒，如果您的平台SKU跟商品SKU的名称一样的话，建议可以直接开启： 产品自动映射功能，会大大提高配对效率

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811114838/ee6e813ba70de2690f950aa02cf1fb8a.png)

## 五、推送入库单给海外仓
商品信息录入好并且配对好以后，现在需要做入库单推给海外仓，这样仓库那边完成入库后就会有库存了，有了库存就可以完成推订单的业务了。（当然，如果你的商品SKU在仓库已经有了库存，可以自己联系海外仓录入商品的库存）

![649d210b3096f2397a6adfd484daeafe[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060811/05a2a3dd6259bf820dcf36bcbd0a4962.png)

进入创建入库单的页面后，接下来会按照到仓方式是箱的方式为例子

![7f1edaad4b352fa9d8bf3c13fa2cd7ca[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060828/53ecfb4b652b68fa8a86928d4c9229bb.png)

![b23b7b6d246689f47b3590bb0497c8ee[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060841/76cd7495c81195a87e16735d077e2b7a.png)

![1c498f4dbd952d463c74737777628f54[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060849/a47941adbc169fafc73134509b51452a.png)

![4e2c0b6a599694f4a364ac1056e3ce15[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060857/6823c7fb7c09b29e6a95f06234f57dbe.png)

![3ff0b286df958030d348e6269c8c7426[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060906/eddc27cf49aed1b7db8bd1a9e0d2e85d.png)

![381aba87f3753481406b32b5cea4524b[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060916/4c9910156050af35834339d43e26355c.png)

海外仓完成入库后，可以在OMS的库存板块查看商品库存

![006ebccb53266c40e382c357d1f6e0b8[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630060932/ed5165e14b459fca790446e16119c28e.png)

## 六，推订单到海外仓
找到OMS的订单板块-点击平台订单- 进入待处理订单页面进行推订单（店铺授权后OMS会自动同步店铺后台没有发货的订单)

![a85cd1138f313d48559acfe0eda1068a[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630061056/732c718d3a47e71dd8667ffc591612c0.png)

补充： 如果是因为没有配对才导致订单异常的，有两个方案可以进行配对1.提前进行产品映射关系的设置，如下图

![df9e0d362fccdcb3f238fe5556fdab4d[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630061113/3c90b68bc2da8171354fc12c08a0e4dd.png)

2.或者可以在订单详情里面进行配对，如下图

![bd4ff175f8e76d3ade63b215bb801577[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630061132/254147d38dfa2b7636126de39665ded3.png)

3.处理好异常的订单后，订单进入到待处理板块，可以批量操作推单给海外仓了（没有什么问题的话，一般订单都会推送到发货中，发货中的订单就证明已经成功推给海外仓了）

![0fcc690d37045a2818909f631e1b5bc7[1].png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260630061150/82fdc2791306b743bf63aaf9c1f9461a.png)

订单流转到发货中，OMS可以先不用操作了，等海外仓收到订单发货即可，海外仓发货后，订单会流转到已发货里面（前提是OMS没有开启手动点击发货的功能）

名词释义：
（1）全部：展示全部状态订单数据。
（2）异常：展示同步过来的有异常的订单数据，包含产品未配对、地址信息不完整等订单。
（3）待处理：展示同步过来待处理的订单数据。
（4）获取平台面单：展示获取线上平台面单的订单数据。
（4.1）获取异常：展示获取面单失败的订单数据。
（4.2）获取中：展示正在获取平台面单的订单数据。
（4.3）生成出库单失败：展示获取平台面单成功，但是生成出库单失败的订单数据。
（5）发货中：展示已经获取面单成功，成功推送到WMS的订单数据。
（6）已发货：展示已经发货的订单数据。
（7）已搁置：展示由于订单各种情况，暂时搁置不处理的订单数据
