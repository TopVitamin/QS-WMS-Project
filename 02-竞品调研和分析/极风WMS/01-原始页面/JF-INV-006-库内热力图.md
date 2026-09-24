---
sourceId: "JF-INV-006"
title: "库内热力图"
url: "https://help.jfwms.com/zh_CN/doc-article/7115310911-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 库存管理 > 库内热力图"
category: "库存管理"
categoryId: 161
docId: 7115310911
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-15T09:09:42.499Z"
---

# 库内热力图

## **一、背景**
**库内热力图可以帮助您直观查看仓库货架的库存占用率与商品热度分布，优化拣货路径与货架布局，提升仓储作业效率。**

**需要使用到库内热力图的用户可以按照以下步骤进行设置：**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912072216_06dffd34b155463590a6c5df77c22b7e.png)

## **二、功能入口**

### **1、进入路径：仓库→库内作业→库内热力图**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911025118_d1398be6163b4e49b29bd48a953d4961.png)

**注意：本功能仅支持拣货区与备货区，暂不支持不良品区、拆转区、转运区。**

## **三、使用前准备**
**⚠️**** ****首次使用时，系统会提示请先设置货架编号(整个货架的编号)。货架编号是热力图展示、3D布局和智能诊断的基础，请先完成配置。(注意：货架位编号与货架编号有所不同，货架编号是给一整个货架设置一个编号，目的是为了3D视图可以展示对应的货架，而货架位编号则是具体到货架中的某一个货架位(库位)，两者需要区分开来。)**

### **1、设置货架编号**

#### **①在提示弹窗中点击【去设置】，跳转至货架位页面。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911030329_e5ace00d1859406ba40cc16b8da2b221.png)

#### **②批量新建货架位时，货区类型选择拣货区或备货区，填写货架编号。（仅支持字母和数字，最长25字符）**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912073947_90c19d32a3754b2eba33fd348627e9e1.png)

#### **③支持在货架位列表设置单个货架位所属的货架编号**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911030424_cb6cce2688b84e75b971b283159ee393.png)

#### **④也可在货架位列表中勾选已有货架位，点击【添加所属货架编号】，支持编号匹配和手动输⼊两种方式。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911030515_9287e03b5a2d4aa988e7e67315f51281.png)

#### **⑤亦支持通过表格批量导入货架编号**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912074321_a67fccf184c244b390c9b053450061b3.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912074523_14f7f3408f854b478c07c57df24ffacb.png)

### **2、设置货架位规格**

#### **①请在仓库→仓库管理中维护货架位规格（体积），用于计算货架位使用率。未维护规格时，使用率显示为0%。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911030735_f253de66daa74b0a9c6931c5ab50487a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911030917_34c887cb7cd941ad90b3af4e2865c016.png)

## **四、核心配置功能**

### **1、货架热度设置：**
用户可自行定义货架的冷热属性，用于智能诊断：

#### **①热货架：靠近拣货动线，拣货效率高**

#### **②冷货架：位置较远，拣货效率低**

#### **③不设置：默认状态，不参与智能诊断**

![图片15.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911032952_69a799559c834d0fbf25abc5a5a66a09.png)

### **2、SKU热度分类设置：**

#### **①点击【SKU热度分类】可配置：销量参考范围（近3/7/15/30/60/90天）、各类别销量阈值、是否仅统计有效天数。默认按近3天计算。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085416_e60b8021862b497286abd67cd09f6a21.png)

#### **②系统根据日均销量将SKU自动分为三类：**

| 分类 | 判定规则 |
| --- | --- |
| 爆品 | 日均销量 ≥ 爆品阈值 |
| 普通品 | 普通品阈值 ≤ 日均销量 < 爆品阈值 |
| 滞销品 | 日均销量 < 普通品阈值 |

### **五、2D热力图视图**

### **1、打开库内热力图默认进入2D视图，以卡片形式展示各货架位的使用情况。**

#### **①筛选区**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911031349_fe5f80faac184ecdbd3aa33770de3f39.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911031443_bf30a0e73183488bb4817242ad3ff3f5.png)

| **筛选项** | **说明** |
| --- | --- |
| 仓库 | 选择要查看的仓库，单次仅选一个 |
| 位置 | 按货区类型 → 货区编号 → 巷道编号 → 货架编号级联筛选，支持多选 |
| 货架位状态 | 按存放爆品/普通品/滞销品/空闲货架位筛选 |
| 组合搜索 | 支持按商品SKU、名称、编码、客户、货架位编号搜索 |

#### **②展示区(每个货架位以卡片展示，包含以下信息)**

![企业微信截图_17890430587908.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912075959_100cde8afd3c4bec832bd5a07e25c66e.png)

#### **②-①货架位编号：如A01-01-01**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912080816_a9892694d49d4ce283cfaf7c88909ea1.png)

#### **②-②容量占比：右上角百分比，<60%黑色（空间充足）、60%-80%橙色（空间较少）、≥80%红色（空间不足）**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912081250_b09cab72645747d3b02482bc5c19fbe6.png)

#### **②-③SKU热度色块：按爆品、普通品、滞销品以不同颜色区分，混放时多色展示，点击货架位卡片可查看明细：客户、商品SKU、商品名称货架位使用率、热度类别、可用库存、总库存等信息。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912082050_6d9c211c99e9434db48a991b58d6477c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912082152_513263882836473c8fbdbea6ac6d91da.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912082729_9ed849b65887485798f1c3661c40e185.png)

#### **③信息区（右上角）**
展示当前范围内的商品统计：总SKU数及爆品、普通品、滞销品的数量与占比。点击图例可隐藏/显示对应热度的色块。

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085520_c8622fb376c24c59a0fcbd4755a7edd7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085600_5bfcc04539a5454f96302c09f8413537.png)

## **六、3D仓库视图**

### **1、点击【切换3D视图】进入三维仓库布局，可直观查看货架空间分布。**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085639_64408df284204feb814149b52c80ab59.png)

![企业微信截图_17891173141976.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085654_b4aa2259c0144377bede91c9448c65bd.png)

### **2、首次进入3D视图时弹出初始化设置：**

#### **①选择货区类型（拣货区/备货区）**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085814_679327e70ef9420cadd593825d0b5b5c.png)

#### **②选择编码排序方式：从上到下或从左到右**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085919_1f594d8614b64308b3582377958f0ba5.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912085938_bf945c4a54bd4c9aa77e34895307a7cb.png)

#### **③点击【保存】生成3D布局**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912090127_bc0febe0143646dda2644f2575c5bfbf.png)

### **3、3D视图操作(点击货架编号可查看该货架下所有货架位的SKU信息弹窗。)：**

#### **①左键：平移视图**

#### **②滚轮：缩放视图**

#### **③右键：旋转试图**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912090254_4a228bc8e7fc462f8e80655db9be4ec7.png)

## **七、智能诊断**

### **1、诊断场景：**

| 诊断类型 | 触发条件 | 建议操作 |
| --- | --- | --- |
| 可用库存不足（移货） | 爆品拣货区库存不足，但备货区充足 | 创建移货单，从备货区移至拣货区 |
| 可用库存不足（补货） | 爆品总可用库存不满足未来X天日均销量 | 考虑补货（不支持创建移货单） |
| 爆品位置优化 | 爆品存放在冷货架上 | 建议移入热货架，可创建移货单 |
| 滞销品位置调整 | 滞销品占用拣货区货架位 | 建议移入备货区，可创建移货单 |

### **2、启用设置：**
首次点击【智能诊断】时，需设置可用库存覆盖天数（默认2天，仅支持正整数），用于判断爆品库存是否充足。

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912091112_57289389f74047b28cb1c0eedba88548.png)

#### **①2D视图智能诊断页面：**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912091210_44e8910fa1d849a6be5858b5936a255e.png)

#### **②3D视图智能诊断页面：**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912091307_6248e5d488874abba8a5564f334a916e.png)

### **3、处理诊断问题：**

#### **①在智能诊断弹窗中勾选一条或多条诊断记录并且点击【创建移货单】，系统自动带入商品与货架位信息，保存后生成移货单**
2D视图处理诊断问题：

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260915033701_f675b2f242d64aad9a3a38f158bc0d87.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912091951_e0eeaf1287d24c11bdd427accef6f857.png)

3D视图处理诊断问题：

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912092311_08d3490141bf4f2db67d93204ee100af.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912091545_48fb5a141ac641bc9ef02bcd71a13091.png)

#### **②支持按客户、位置、诊断类型筛选，以及导出诊断列表**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260912092458_c8cbd3fe2f544bbbbcb4bd64de4ef93d.png)

## **八、数据刷新（修改SKU热度分类或货架热度设置并保存后，数据自动刷新）**

### **1、自动刷新：SKU热度、货架热度、热力图数据、智能诊断结果每日凌晨00:00自动更新**

![图片22.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911034248_6f35a9b30f154b80b5f52033a7f9883e.png)

### **2、手动刷新：点击【全局刷新】立即更新所有数据**

![图片23.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911034318_6a8879146ed34d6098f4ec4a7ef71236.png)

### **3、库存信息：点击货架位查看明细时为准实时数据**

![图片24.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/156/20260911034350_fcb32a0962e24384a6d5556e45690c72.png)
