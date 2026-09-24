# 使用领星OMP授权shippo

- 来源编号: LX-WMS-059
- 原始URL: https://help.xlwms.com/12d0/daf7/07ce/7086
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用功能介绍 > 物流管理篇 > 授权物流商
- 页面类型: 集成与对接
- 抓取日期: 2026-09-24
- 更新日期: 2025-09-28

---

# 使用领星OMP授权shippo


              
## 1.操作场景

定义：在OMP管理后台授权shippo，实现领星WMS跟shippo的API对接作用：授权完成之后，可以直接在领星WMS获取shippo的面单，简化面单获取流程，方便进行渠道管理。
## 2.操作指引

（1）进入OMP管理后台： 登录您的OMP，导航至物流管理菜单展开，点击物流商账号。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165306/e8cc3de4)
（2）选择物流商shippo：点击添加授权，在弹出来的界面中选中打单系统一栏，搜索shippo找到对应物流商并点击选择，然后点击下一步。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165898/500d81d9)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879166164/f6f74e82)
（3）填写API授权信息：账户名称自定义填写备注填写后可在物流商账号主页面看到Access Token需要在“路径：shippo - API - Token -Live Token - Generate Token”获取，然后把复制到的Live Token粘贴在此处，填写完后点击授权。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165817/f4dfab00)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879166094/ca1c8271)
（4）新建渠道：在新授权好的物流商账号列点击操作，然后点击新建渠道。API服务代码，即填写shippo后台Service Levels界面的Token；物流渠道代码和物流渠道名称都为自定义填写，填写适合辨认的名字就好，其中物流渠道代码创建完后不可修改，物流渠道名称支持修改；承运商为自定义选择，选择对应的承运商即可，承运商在创建完后支持修改；保险服务和签名服务根据shippo支持的服务和您的实际需求进行选择，其中签名服务选择后oms客户可以在创建出库单界面手动选择是否需要签名服务以及选择哪种签名服务；insuranceProvider选择保险服务对应的承保方，有FEDEX、UPS，ONTRAC三种选项可供选择；最后点击确定即可。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165468/d55c6386)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165394/7f4e06ed)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879166214/756fdd1c)
（5）编辑物流渠道：来到物流渠道列表，提供物流渠道代码和物流渠道列表找到刚才创建好的物流渠道，点击编辑。绑定仓库，绑定仓库用于指定该渠道可使用的仓库；发货地址指定该渠道不同仓库对应的发货地址，可以与仓库地址一致，地址填写中的服务商地址编码填写shippo后台Carrier accounts界面的OBJECT ID。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165980/0bc4b612)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165508/711bdf29)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165564/25cadbd0)
（6）OMS下单使用已授权渠道：刚授权的物流商账号，授权状态仍为“未知”，在OMS创建单据成功获取面单后会自动更新为“授权成功”。在OMS ＞ 仓储服务 ＞ 一件代发出库 ＞ 新建 ＞ 填写单据信息 ＞ 提交 ＞ 草稿 ＞ 待获取面单 ＞ 获取面单。获取面单提示异常，若为【物流商系统返回】开头，需联系复制报文联系shippo确认报错原因。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165670/c37b5a61)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1758879165547/6c17b7fd)

## 3.补充说明


### (1)名词解释


- 物流商账号：用于授权的官方接口、打单系统的导航栏，也可以创建自定义的渠道。
- 物流渠道列表：用于展示所有在授权完物流商账号后创建的物流渠道，也就是oms客户可以选择到的物流渠道。


## 4.常见问题

Q1:物流商账号授权状态为“未知”？答案：需要在OMS创建单据成功获取面单后会自动更新为“授权成功”
              
                
                  
                
                2025-09-28
