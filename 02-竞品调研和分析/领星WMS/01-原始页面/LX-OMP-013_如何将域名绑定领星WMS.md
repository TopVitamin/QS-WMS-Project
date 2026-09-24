# 如何将域名绑定领星WMS

- 来源编号: LX-OMP-013
- 原始URL: https://help.xlwms.com/2f8e/8a68/2928/7c91
- 所属板块: 管理后台(OMP)
- 面包屑路径: 首页 > 管理后台板块帮助文档 > 管理后台使用常见问题 > OMP特殊场景配置或跨境相关其他知识
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2025-11-18

---

# 如何将域名绑定领星WMS


              
## 1.操作场景

定义：支持使用二级域名作为您登录系统的域名链接，本篇将指导您进行配置。作用：本篇以腾讯云备案为例（如果使用阿里云可能出现备案信息隔离，影响一些场景使用的情况，推荐使用腾讯云）
## 2.操作指引


### （1） 注册腾讯云账户

[点击前往注册界面](https://cloud.tencent.com/register?&s_url=https%3A%2F%2Fconsole.cloud.tencent.com%2F)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602993/182530c2)

### （2）完成腾讯云账号的实名认证

支持个人认证，或是企业认证。[账号相关 实名认证账号归属介绍-实名认证-文档中心-腾讯云](https://cloud.tencent.com.cn/document/product/378/3629)实名认证直接影响账号和资源的归属，如果企业用户使用个人信息进行实名认证，后续出现人员变动或账号纠纷时，可能会影响企业用户的业务，甚至造成经济损失。在进行实名认证之前，请确认您在腾讯云购买和使用的资源是属于个人还是企业。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602431/20ea492e)

### （3）创建域名信息模板

根据[关于加强域名注册实名核验的要求](https://cloud.tencent.com/document/product/242/66514)，域名新注、域名转入时，必须选择已完成实名审核的信息模板，否则将禁止进行域名新注、域名转入。所以在域名注册前您需创建域名信息模板并审核通过后才可进行域名注册。
- 创建域名信息模板。单击进入[信息模板](https://console.cloud.tencent.com/domain/template/list)页面。
- 验证您的短信、邮件信息。具体操作请参见[手机邮箱验证](https://cloud.tencent.com/document/product/242/62035)。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602723/c82eaab0)
填写您的域名信息模板。具体操作请参见[信息模板管理](https://cloud.tencent.com/document/product/242/15435)。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602765/2d2ec5d4)
模板实名审核一般情况下需要1 - 3工作日。待模板审核通过后，即可在进行域名新注、域名转入时绑定该域名信息模板。
### （4）域名注册

点击[域名注册](https://dnspod.cloud.tencent.com/)，输入您想要的域名，点击查询 - 添加购物车 - 立即购买，根据页面操作提示绑定您在上一步中已审核通过的域名信息模板并完成支付操作。
### （5）准备云服务器

前往[云服务器购买页](https://buy.cloud.tencent.com/cvm)，仔细查阅页面信息，灵活地选择云服务器所在地域、机型、镜像、公网带宽、购买数量及购买时长，以确保满足您实际的业务需求。您可参见[快速配置 Linux 云服务器](https://cloud.tencent.com/document/product/213/2936)或[快速配置 Windows 云服务器](https://cloud.tencent.com/document/product/213/2764)文档，了解快速创建方法。如下图所示：
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602551/9412941b)

### （6）域名备案

可参考：[ICP 备案 如何快速备案您的网站或 APP-快速入门-文档中心-腾讯云](https://cloud.tencent.com/document/product/243/39038)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602589/d496c3c4)

### （7）购买SSL证书

登录[SSL 证书购买页](https://buy.cloud.tencent.com/ssl?fromSource=ssl)。请务必选择国际标准 - 域名型（DV） - 通配符
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602909/a7b0fcec)

### （8）认证DV（域名型）SSL证书

购买证书完成后，请登录[SSL 证书控制台](https://console.cloud.tencent.com/certoverview)，选择并进入待提交管理页面，提交资料并完成域名所有权认证后，CA 机构将签发证书。可参考：[DV（域名型）SSL 证书提交流程](https://cloud.tencent.com/document/product/400/47285)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602443/062384d3)

### （9）提供证书及三级域名给领星WMS客服进行配置


- CA 机构认证审核通过后，将会正式颁发证书。请在[SSL 证书控制台](https://console.cloud.tencent.com/ssl)中选择您需要安装的证书并单击下载。在弹出的 “证书下载” 窗口中，服务器类型选择Nginx，单击下载。无需解压，请将压缩包源文件提供领星WMS客服；
- 请提供三级域名，格式为oms-xxxxx.xlwms.com（其中xxxxx为自定义内容）；
配置预计需要等待5-10个工作日，处理完成后领星WMS客服将会及时在您的专属客户群内进行通知，届时可访问您证书定制的域名。
- 需提供**付费版**通配符证书，免费版无法完成配置。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/870e52cb-ae00-4da1-a5f0-30a966e55a43/1759059602335/4c5ef0ab)

### （10）添加CNAME记录

返回域名服务商，添加CNAME记录，将您的域名与上一步配置的三级域名做映射。可参考：[云解析 DNS CNAME 记录-操作指南-文档中心-腾讯云](https://cloud.tencent.com/document/product/302/3450)
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1763451273927/image.png)
主机记录：至少添加3条，分别填写omp、oms、wms。记录类型：选择 “CNAME”。记录值：填写上一步已配置的三级域名，以oms-lingxing.xlwms.com为例
## 3.补充说明


### （1）注意事项


- 使用二级域名，也是需要按格式提供一个三级域名，只是为了做管理区分。
- 在配置二级域名前，请确认您的领星WMS套餐包含品牌设置功能


### （2）名词解释


- **域名级别**：互联网名称与数字地址分配机构（ICANN）负责管理和协调国际互联网络域名系统。根据ICANN的定义，一个完整的域名至少有两个部分，各部分之间用“.”来分隔，最后一个“.”的右边部分称为顶级域名，也称为一级域名；最后一个“.”的左边部分称为二级域名；二级域名的左边部分称为三级域名，以此类推，每一级的域名控制它下一级域名的分配。下图以www.example.com.cn为例，为您介绍域名的级别。


![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/7f819745-0ec5-4131-abe0-4c5cc7689a72/1763451657663/image.png)

## 4.常见问题

Q1:三级域名的格式是怎么样的？
答案：三级域名格式为oms-xxxxx.xlwms.com（其中xxxxx为自定义内容）
              
                
                  
                
                2025-11-18
