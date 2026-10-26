# Source: https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/pack_in_pack.html "Pack-in-pack") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/uom.html "Units of measure") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Product management](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management.html) »
- [Configure product](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure.html) »
- [Packages](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html)

# Packages [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#packages "Permalink to this headline")

A _package_ is a physical container holding one or more products. Packages can also be used to store
items in bulk.

Packages are commonly used for the following purposes:

1. [Grouping products to move them in bulk](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-pack).

2. [Shipping to customers](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-package-type): configure package types
to align with shipping carriers’ size and weight requirements, streamlining the packing process,
and ensuring compliance with carrier shipping specifications.

3. Storing items in bulk.


Package Use is a field on the package type form in Odoo that is only visible by enabling
the Batch, Wave & Cluster Transfers and Packages features
(Inventory app ‣ Configuration ‣ Settings).

By default, the Package Use field on a package type form is set to Disposable
Box. **Only** change this field to Reusable Box when configuring packages for
[cluster pickings](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-cluster-pack).

Package Type is a feature most often used for [calculating shipping cost](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration.html), based on real shipping weight. Create package types
to include the weight of the package itself (e.g. boxes, pallets, other shipping containers) in
shipping cost calculations.

Note

While packages are commonly used in the [three-step delivery route](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/delivery_three_steps.html), they can be used in any
workflow involving products tracked by quantity, lots, or serial numbers.

## Configuration [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#configuration "Permalink to this headline")

To use packages, first go to Inventory app ‣ Configuration ‣ Settings. Under
the Operations heading, activate the Packages feature. Then, click
Save.

![Activate the *Packages* setting in Inventory > Configuration > Settings.](https://www.odoo.com/documentation/19.0/_images/enable-pack1.png)

When moving packages internally, the _Move Entire Packages_ feature can be enabled on an operation
type to update a package’s contained item’s location upon updating the package’s location.

To do that, go to Inventory app ‣ Configuration ‣ Operations Types and select
the desired operation this feature will apply to (may have to set it for multiple).

Open the Barcode App tab, then select the Move Entire Packages checkbox.

![Enable "Move Entire Packages" on the Operation Type.](https://www.odoo.com/documentation/19.0/_images/move-entire-packages.png)

## Pack items [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#pack-items "Permalink to this headline")

Products can be added to packages in any transfer by:

1. Clicking each [Details](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-detailed-operations) link on the
product line.

2. Using the [Put in Pack](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-put-in-pack) button to place
everything in the transfer into a package.


### Details [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#details "Permalink to this headline")

On any warehouse transfer (e.g. receipt, delivery order), add a product to a package by clicking the
Details link in the Operations tab.

![Details link on the product line.](https://www.odoo.com/documentation/19.0/_images/detailed-operations1.png)

Doing so opens the Detailed Operations pop-up window for the Product.

To put the Product in a package, assign the product to a Destination
Package. Split into multiple packages by clicking Add a line. Select an existing
package, or create a new one by typing the name of the new package, then select Create.

![Assign a package to "Destination Package" field.](https://www.odoo.com/documentation/19.0/_images/destination-package.png)

20 units of `Acoustic Bloc Screen` are placed in `PACK0000001`. [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#id1 "Permalink to this image")

Then, specify the quantity of items to go into the package in the Quantity column.
Repeat the above steps to place the Product in different packages. Once finished, click
Save to close the window.

See also

[Ship one order in multiple packages](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration/multipack.html)

### Put in pack [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#put-in-pack "Permalink to this headline")

Alternatively, click the Put in Pack button on **any** warehouse transfer to create a
new package, and place all the items in the transfer in that newly-created package.

Important

The Put in Pack button appears on receipts, delivery orders, and other transfer forms
with the _Packages_ feature enabled in Inventory app ‣ Configuration ‣
Settings.

![Image of the "Put in Pack" button being clicked.](https://www.odoo.com/documentation/19.0/_images/put-in-pack1.png)

In batch transfer `BATCH/00001`, the Put in Pack button was clicked to create a new
package, `PACK0000002`, and assign all items to it in the Destination Package field. [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#id2 "Permalink to this image")

## Create package types [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#create-package-types "Permalink to this headline")

Create package types by navigating to Inventory app ‣ Configuration ‣ Package
Types, in order to set custom dimensions and weight limits. This feature is mainly used to
calculate package weights for shipping costs.

See also

- [Shipping carriers](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration/third_party_shipper.html)

- [Delivery methods](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration.html)


On the Package Types list, clicking New opens a blank package type form.

Define the Package Type name.

### Configuration tab [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#configuration-tab "Permalink to this headline")

The following fields are available in the _Configuration_ tab of a package type form:

- Barcode: Define a barcode to identify the package type from a scan.

- Sequence prefix: Specify the prefix to use when creating new packages of this type.




Example



Stealthy Wood wants to create a package type for cluster packs. They specify `CLU` as the
sequence prefix.

- Routes: Specify the routes for which this package type can be used.

- Company: Specify a company to make the package type available **only** at the selected
company. Leave the field blank if it is available at all companies.

- Package Use: Choose Reusable Box (totes) for packages used for moving
products within the warehouse. Choose Disposable Box for packages used to ship
products to customers.

- Carrier: Specify the intended shipping carrier for this package type.

- Carrier Code: Define a code that is linked to the package type.


![Configuration tab for reusable cluster pack box with sequence prefix.](https://www.odoo.com/documentation/19.0/_images/package-type-config.png)

### Dimensions tab [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#dimensions-tab "Permalink to this headline")

Use the _Dimensions_ tab to specify package dimensions:

- Size: Define the dimensions of the package in millimeters (mm). The fields, from left
to right, define the Length, Width, and Height.

- Weight: Define the weight of an empty package (e.g. an empty box, pallet).


Note

Odoo calculates the package’s weight by adding the weight of the empty package plus the weight of
the items, which can be found in the Weight field in the Inventory tab of
each product form.

- Max Weight: Specify the maximum shipping weight allowed in the package.


![Dimensions tab for FedEx 25 kilogram box package type.](https://www.odoo.com/documentation/19.0/_images/package-type-dimensions.png)

### Capacity tab [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#capacity-tab "Permalink to this headline")

This tab can only be configured if Multi-Step Routes is also enabled in
Inventory app ‣ Configuration ‣ Settings.

Select or create a Storage Category and Quantity by clicking Add
a line.

See also

[Storage categories](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/storage_category.html)

## Cluster packages [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#cluster-packages "Permalink to this headline")

To use _cluster packages_, first navigate to Inventory app ‣ Configuration ‣
Settings, and activate the Batch, Wave & Cluster Transfers feature, located in the
Operations section.

![Activate the Batch, Wave & Cluster Transfers feature in Inventory Settings.](https://www.odoo.com/documentation/19.0/_images/enable-batch.png)

Add new packages by going to Inventory app ‣ Products ‣ Packages. Then, click
New, or select an existing package. Doing so opens the package form, which contains the
following fields:

- Package Reference (required): Define the name of the package.

- Package Type: Specify the [package type](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html#inventory-warehouses-storage-package-type) to use.




Note



Setting a Package Type is unnecessary for configuring packages for cluster
pickings.

- Location: Define the current location of the package.

- Container: If the package is contained within another package, define the container
package.

- Shipping Weight: Used to input the weight of the package after measuring it on a
scale.

- Company: The company that can use this package is defined.

- Pack Date: Specify the date the package was created.


Below the package definition fields is the _Content_ section. Use this field to learn more about the
contents of the package.

![A package form to create a cluster pack.](https://www.odoo.com/documentation/19.0/_images/cluster-package1.png)

See also

[Using cluster packages](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/picking_methods/cluster.html)

## View packages [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html\#view-packages "Permalink to this headline")

To view all packages, go to Inventory app ‣ Products ‣ Packages. By default,
packages are shown in list view.

![Packages dashboard.](https://www.odoo.com/documentation/19.0/_images/packages-list.png)

[Edit on GitHub](https://github.com/odoo/documentation/edit/19.0/content/applications/inventory_and_mrp/inventory/product_management/configure/package.rst)

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/pack_in_pack.html "Pack-in-pack") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/uom.html "Units of measure") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Product management](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management.html) »
- [Configure product](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure.html) »
- [Packages](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/package.html)
