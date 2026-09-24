---
sourceId: "JF-LOG-004"
title: "如何注册、授权、使用CJ物流"
url: "https://help.jfwms.com/zh_CN/doc-article/7106670525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 如何注册、授权、使用CJ物流"
category: "物流渠道管理"
categoryId: 163
docId: 7106670525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T07:42:47.803Z"
---

# 如何注册、授权、使用CJ物流

# **第一步：申请CJ账号**
1.办理企业**营业至执照**（注：个人或个体户需确认CJ是否支持）。

2.致电CJ物流客户经理或合同负责人，申请成为CJ物流合作客户，签署合同3.注册CJ物流系统账号（网址由CJ工作人员提供）。

4.登录CJ客户物流管理系统，找到并记录您的**客户号（CUST_ID）**，如图：

![图片](https://download.jfwms.com/prod/static/back_help/img/77/20260418062214/b453942087ccd623c0693127ee8e94ef.jpg)

# **第二步：发送申请邮件**
发送邮件给CJ物流API技术支持团队，申请开通开发环境CJ OPEN API授权，同时抄送极风团队（[developer@jfwms.com](mailto:developer@jfwms.com)），邮件模板如下（建议复制使用）：**

邮件标题：申请CJ OPEN API正式环境调用权限（客户号：______）

收件人：CJ物流API技术支持 / 合同负责人

[抄送：developer@jfwms.com](mailto:抄送：developer@jfwms.com)

邮件正文：

您好，

我公司（名称：______，客户号：______，营业执照号：______）正在使用JFWMS系统与CJ OPEN API进行对接，在调用CJ OPEN API时，系统提示 “Token Key发放尚未获得批准”，如下所示：

{

"RESULT_CD": "E",

"RESULT_DETAIL": "아직 Token Key 발급 승인이 되지 않았습니다. 택배 계약 담당자에게 문의하여 주시기 바랍니다."

}

请帮忙协助批准开发环境的Token Key发放，或指导下一步操作，如需更多信息，请随时联系：

公司名称：______

联系人：______

电话：______

（注：收到CJ回复“已开通开发环境API授权”后，联系极风客服团队进入下一步。）

# 第三步：极风协助创建测试订单**
1.极风团队用您的CJ账号创建10个测试订单并将生成的面单文件发给您2.您将测试面单打印出来并**转换成图片格式**，通过邮件发送给CJ工作人员审核，邮件模板如下：**

邮件标题：【审核测试运单】客户号__ 申请开通正式环境API授权

收件人：CJ物流API技术支持 / 合同负责人

[抄送：developer@jfwms.com](mailto:抄送：developer@jfwms.com)

邮件正文：

您好！

我公司（名称：______，客户号：______，营业执照号：______）在极风WMS技术团队协助下，已在CJ OPEN API开发环境完成联调。

目前已成功在测试环境创建订单，运单号如下：______，打印的面单文件图片请见附件。

请审核以上测试运单的数据及面单格式是否符合CJ要求。若无问题，请协助开通正式环境的CJ OPEN API授权，**如有问题或需任何补充信息，请随时与我们联系，感谢您的支持与配合！**

公司名称：______

联系人：______

电话：______

（注：审核通常需要1-3个工作日，通过后CJ会邮件通知）

# 第四步：物流商授权**
**1.添加物流商授权**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260520083113/095cab061c260dff999843f47b34706a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604073532/8d2073ebc90e0aef5773f92a53020234.png)

**2.物流渠道编辑**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604073724/87dde518ff8d6ed972b1c359a5a9a5a5.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604073827/3bfa569280f763df385e8ba9b5502dd4.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604073930/1f6fb125db85ae7a0022aed98ce05fef.png)

**3.创建物流产品**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604074244/3075c916ac5f1cbfe2b20ad9aacd443f.png)

**最后参考这篇文档配置“物流计费策略”**

[https://help.jfwms.com/zh_CN/doc-article/1002020425-?origin=search](https://help.jfwms.com/zh_CN/doc-article/1002020425-?origin=search)
