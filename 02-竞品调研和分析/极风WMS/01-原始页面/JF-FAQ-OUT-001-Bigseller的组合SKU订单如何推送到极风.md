---
sourceId: "JF-FAQ-OUT-001"
title: "Bigseller的组合SKU订单如何推送到极风"
url: "https://help.jfwms.com/zh_CN/doc-article/1001271105-"
breadcrumb: "帮助中心 > 常见问题 > 出库 > Bigseller的组合SKU订单如何推送到极风"
module: "常见问题"
category: "出库"
categoryId: 23
docId: 1001271105
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2024-11-08T02:02:34.944Z"
---

# Bigseller的组合SKU订单如何推送到极风

1、由于极风WMS上只认单个商品SKU，订单推送到WMS会自动拆分为单个商品SKU；

2、所以单个商品SKU已推送到极风后，在BS上先创建组合SKU ，然后再在Bigseller上在海外仓仓库清单上面添加该组合商品SKU，

3.最后在订单处理板块，配对好组合SKU的订单之后，直接推送订单给三方仓（极风）即可

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20241108020015/ddb4fc462df369f5c11f5e62fe55c94d.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/7/20241105122906/17cd4ac224e21bf3cc1b5c6492456dd3.jpg)
