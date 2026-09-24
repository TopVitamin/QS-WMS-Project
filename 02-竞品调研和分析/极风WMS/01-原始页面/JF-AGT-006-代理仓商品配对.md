---
sourceId: "JF-AGT-006"
title: "代理仓商品配对"
url: "https://help.jfwms.com/zh_CN/doc-article/7107610602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 代理仓 > 代理仓商品配对"
category: "代理仓"
categoryId: 171
docId: 7107610602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-08T04:45:47.974Z"
---

# 代理仓商品配对

## **一、定义**
将主仓库的sku和极风代理仓系统内的sku进行配对。​

## ** 二、操作路径**

### 1、仓库端WMS>设置>代理设置>配对>商品配对>新增配对

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908043455_b0b8a522751d4e389dd95251a4bd4229.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908043354_150fbe0ee78045599f47f7e2b4e6e371.png)

### 2、商品sku比较多，也可以批量导入配对
①、点击导入配对

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908043518_c963b16c71c24f7c967a9943ccb7c035.png)

②、下载模板

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908043543_14f50624b7e242868e5f707efc79a16b.png)

③、填写模板。代理SKU为主仓SKU，SKU为卖家创建SKU，自定义代理商复制代理授权页面的自定义代理商名称即可。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628171644/cdda91e7a85cfb6749c19891036cbd37.png)

④填写好表格保存后，上传。

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908043558_c77cda13eccc4229b210dff391efdbd1.png)

### 注意：如果代理仓和主仓都是使用极风WMS，卖家首次接入，则不需要在主仓OMS创建SKU，也不需要在代理仓WMS做商品配对，卖家创建入库单推送给代理仓的时候，代理仓会自动创建SKU到主仓并且做好SKU配对，这种情况下，不需要代理仓再做商品配对。

### 3、也可以进行自动配对，如果主仓SKU与代理仓SKU完全一致，可以自动配对

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908044043_bd4752dce3df4b4ab5fd3351976052d8.png)

4、同步主仓商品

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/84/20260908044401_3340ffa0446b43d8bd9bc321be1f4cc9.png)

注：只会同步已生效的商品sku。
