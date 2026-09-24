---
sourceId: "JF-FAQ-OTH-001"
title: "浏览器预览面单和打印出来的面单不一致"
url: "https://help.jfwms.com/zh_CN/doc-article/1001161012-"
breadcrumb: "帮助中心 > 常见问题 > 其他 > 浏览器预览面单和打印出来的面单不一致"
module: "常见问题"
category: "其他"
categoryId: 28
docId: 1001161012
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2024-10-12T06:27:35.279Z"
---

# 浏览器预览面单和打印出来的面单不一致

浏览器预览面单和打印出来的面单不一致，预览的有sku，但是打印出来没有显示sku，是因为获取ERP上的自定义面单有延迟，打印插件缓存了标准面单，两个处理方法：

1、使用浏览器打印，预览是什么打印出来就是什么2、清理打印插件缓存的面单，一般默认的缓存目录是C:\meiyunji\pdfprinter\temp ，让用户清空下这个目录下的所有文件重新再打印就好了
