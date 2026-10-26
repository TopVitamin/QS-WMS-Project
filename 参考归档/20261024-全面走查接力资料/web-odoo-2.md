# Source: https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/cycle_counts.html "Cycle counts") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/operation_type.html "Operation types") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Warehouses and storage](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage.html) »
- [Inventory management](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management.html) »
- [Inventory adjustments](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html)

# Inventory adjustments [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#inventory-adjustments "Permalink to this headline")

In any warehouse management system, the recorded inventory counts in the database might not always
match the actual inventory counts in the warehouse. Discrepancy between counts can be due to damage,
human error, theft, or other factors. As such, inventory adjustments must be made to reconcile the
differences, and ensure that the recorded counts in the database match the actual counts in the
warehouse.

## Physical Inventory page [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#physical-inventory-page "Permalink to this headline")

To view the _Physical Inventory_ page, navigate to Inventory app ‣ Operations ‣
Physical Inventory.

![Products listed on the Physical Inventory page.](https://www.odoo.com/documentation/19.0/_images/physical-inventory-page.png)

On the _Physical Inventory_ page, all products with stock history are listed, even if the quantity
in stock is less than zero.

Tip

Products that do not have a stock history do not appear on the _Physical Inventory_ page.

Each product line contains the following information:

- Location: The specific location in the warehouse where a product is stored. This
column is **only** visible if [Storage Locations](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/use_locations.html) are enabled.

- Product: The product whose quantity is listed on the inventory adjustment line.

- Lot/Serial Number: the tracking identifier assigned to the specific product listed. It
can contain letters, numbers, or a combination of both.


> Note
>
> If a specific product has a quantity of more than `1.00` in stock, and more than one serial
> number or lot number assigned to it, each uniquely-identified product is displayed on its own
> product line with its own lot/serial number, displayed under the Lot/Serial Number
> column.

- Counted: The real quantity counted during an inventory count. This field is left blank
by default but can be changed, depending on if it matches the On Hand quantity or not.

- Difference: The difference between the On Hand quantity and
Counted quantity once an inventory adjustment is made. The difference is automatically
calculated after every inventory adjustment.

- Unit: The [unit of measure](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure/uom.html) in which the
product is measured. Unless otherwise specified (e.g., in Pounds or
Ounces), the default UoM is Units.

- Inventory Frequency: The frequency in days for inventory counts. The default value of
this field is set to `0`.

- Product Category: The category of the product list on the inventory adjustment line.

- Last Count Date: The last time the quantity was updated.

- Scheduled: The date at which a count should be made. If not otherwise specified, this
date defaults to December 31st of the current year.

- User: The person assigned to the count in the database. This can either be the person
physically counting the inventory, or the person applying the count in the database.

- On Hand: The quantity of the product currently recorded in the database.

- Company: The company whose database these inventory adjustments are being made on. The
company is listed in the top corner of the database, next to the current user.


Tip

Some columns are hidden by default. To reveal these columns, click the (adjust) icon to the top corner of the form’s top row, and reveal any desired column
by selecting the checkbox next to that option.

The following additional columns are available, depending on the settings in the database:

- Accounting Date: The date on which the adjustments are accounted for in the Odoo
**Accounting** app.

- Expiration Date: The date on which the goods with this serial number are due to
expire. This column is only available if [Expiration Dates](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/product_tracking/expiration_dates.html) is enabled in the **Inventory**
app’s settings.

- Package: The package containing the quantity listed.


### Create an inventory adjustment [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#create-an-inventory-adjustment "Permalink to this headline")

To update an existing physical inventory entry, click into the corresponding field in the
Counted column for the product that must be adjusted. Adjust the count, then click
Apply All.

To create a new inventory adjustment from the _Physical Inventory_ page, click New.
Doing so creates a new, blank inventory adjustment line at the bottom of the page.

Tip

Inventory adjustments can also be created from the _Forecasted Report_ on an individual product record. To open
the report, navigate to a product record and click the Forecasted smart button. Then,
at the top of the page, click Update Quantity, then New.

![The Update Quantity button on a Forecast report in the Inventory app.](https://www.odoo.com/documentation/19.0/_images/forecast-report.png)

On this blank inventory adjustment line, click the drop-down menu under the Product
column, and select a product. If the selected product is tracked using either lots or serial
numbers, the desired lot or serial number must be chosen from the drop-down menu under the
Lot/Serial Number column.

Tip

The inventory adjustment line can also be used to create or record lots and serial numbers.

Next, set the value in the Counted column to the quantity counted for that product
during the inventory adjustment process.

The Scheduled date and User can also be changed via their respective
drop-down menus. Changing the Scheduled date changes the date that the inventory
adjustment should be processed on, and selecting a responsible User assigns a user to
the specific inventory adjustment for traceability purposes.

Once all changes have been made to the new inventory adjustment line, click away from the line.
Doing so saves the adjustment, and moves the line alphabetically with the other products in
inventory.

If the Counted quantity is greater than the On Hand quantity, the value in
the Difference column is _green_. If the Counted quantity is less than the
On Hand quantity, the value in the Difference column is _red_ with a
negative value. If the quantities match, and have not been changed at all, `0.00` appears in the
Difference column.

![Difference column on Physical Inventory page.](https://www.odoo.com/documentation/19.0/_images/difference-column.png)

At this stage, the count ( _inventory adjustment_) is recorded, but not yet applied. This means that
the quantity on hand before the adjustment has not yet been updated to match the new, real counted
quantity.

### Apply adjusted count [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#apply-adjusted-count "Permalink to this headline")

Inventory adjustments can be completed in three ways.

#### Apply a single adjustment [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#apply-a-single-adjustment "Permalink to this headline")

Some companies do not require adjustment reasons to be recorded. In this circumstance, apply
adjustments to a single line at a time by clicking the Apply button on
the line at the far side of the page.

#### Apply multiple adjustments [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#apply-multiple-adjustments "Permalink to this headline")

To apply multiple adjustments at once, or to ensure that reasons for adjustments are recorded, use
one of the following methods to apply multiple adjustments at once:

- Click the Apply All button on the top corner of the page.

- Select the checkbox on the far side of the line. Doing so reveals new button options at the top of
the page, one of which is an Apply button.


Note

It may be necessary to click the Save button at the top corner of the screen before
applying the changes.

Clicking these buttons opens a _Physical Inventory_ pop-up window.

In the _Physical Inventory_ window, a reference or reason can be assigned to the inventory
adjustment. By default, the Inventory Reason field is pre-populated with `Physical
Inventory`. Modify this text as necessary. Today’s date is populated in the Counting
Date field. Once ready, click Update Quantities to apply the inventory adjustment.

![Apply All option applies the inventory adjustment once a reason is specified.](https://www.odoo.com/documentation/19.0/_images/apply-inventory-adjustment.png)

Example

An FDA-regulated factory is required by law to trace, log, and explain all inventory adjustments
to ensure that it remains in compliance with federal law. Any product stock moves and associated
reasonings would need to be documented thoroughly to ensure that all product is accounted for in
case of a recall.

Note

Applying an inventory adjustment simultaneously creates a [stock move record](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/reporting/moves_history.html) in the _Moves History_ report for traceability.

## Relocate products [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#relocate-products "Permalink to this headline")

Inventory adjustments can also be used to relocate products to different storage locations, or to different packages.
To relocate a product, click on the checkbox at the far side of the line for the desired product. At
the top of the page, click the Actions button, then select
Relocate. Doing so opens a pop-up.

On the resulting pop-up, enter the following information:

- To Location: The new location for the products.

- To Package: The new package for the products. This field only appears if you have
Packages enabled in the **Inventory** settings.

- Reason for relocation: The reason for the move.


Click Confirm to confirm the move.

![The Relocate products pop-up on the Physical Inventory page.](https://www.odoo.com/documentation/19.0/_images/relocate-popup.png)

Important

Product relocations **only** work on internal locations. Products **cannot** be moved between
companies.

Only users with _Administrator_ rights can perform product relocations.

## Set to zero [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#set-to-zero "Permalink to this headline")

Inventory adjustments can also be used to clear inventory counts by setting the quantity to zero. To do this, select
the checkbox at the far side of the line for the desired product. At the top of the page, click the
Actions button to open a drop-down menu. Click Set to 0.
Once this is complete, [apply](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html#inventory-apply-adjustment) the adjusted count.

Important

Setting the quantity to zero for a product that has already been reserved for sales orders will
set the forecasted quantity to negative. The product will be marked as unavailable for current
delivery orders.

## Count products [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#count-products "Permalink to this headline")

Counting products is a recurring activity in a warehouse. Once a count is complete, go to
Inventory app ‣ Operations ‣ Physical Inventory to update the
Counted quantity for each product line.

On each product line, identify whether the value in the On Hand column recorded in the
database matches the newly-counted value. If the recorded value and the counted value match, enter
the _On Hand_ quantity in the Counted column.

Doing so sets the value of the Difference column to `0.00`. Subsequently, once applied,
an inventory move with `0.00`Done is recorded in the product’s inventory adjustment
history.

![Zero count inventory adjustment move.](https://www.odoo.com/documentation/19.0/_images/zero-move.png)

If the newly-counted value for a given product does **not** match the value in the On
Hand column recorded in the database, record the real value in the field in the Counted
column.

To do so, click the field in the Counted column on the specific inventory adjustment
line for the product whose count is being changed. Specify the updated count in the field.

To change this value, type in a new value that matches the real, newly-counted value. Then, click
away from the line. Doing so saves the adjustment, and automatically adjusts the value in the
Difference column.

If the Counted quantity is greater than the On Hand quantity, the value in
the Difference column is _green_. If the Counted quantity is less than the
On Hand quantity, the value in the Difference column is _red_ and is a
negative value. If the quantities match, and have not been changed at all, `0.00` appears in the
Difference column.

Subsequently, once applied, a move with the difference between the On Hand quantity and
the Counted quantity is recorded in the product’s inventory adjustment history.

![Inventory Adjustments History dashboard detailing a list of prior product moves.](https://www.odoo.com/documentation/19.0/_images/history-inventory-adjustments.png)

The Actions menu appears when one or more products’ checkboxes are
selected. The Actions menu includes the option to Set to
quantity on hand, which sets the selected products’ Counted quantity to the
On Hand quantity.

![Physical Inventory Actions menu.](https://www.odoo.com/documentation/19.0/_images/inventory-adjustment-actions.png)

Note

If other inventory adjustments were created during the count process, click Save in
the top corner to save the current entry. Make sure this is done before opening the
Actions menu to set the count.

Important

Sometimes a count occurs, but cannot be applied in the database right away. In the time between
the actual count and applying the inventory adjustment, product moves can occur. In that case,
the on-hand quantity in the database can change and no longer be consistent with the counted
quantity. As an extra precaution, Odoo asks for confirmation before applying the inventory
adjustment.

## Revert an inventory adjustment [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#revert-an-inventory-adjustment "Permalink to this headline")

To revert the changes made in an inventory adjustment, navigate to Inventory ‣
Reporting ‣ Moves History.

Select the checkbox at the far side of the line for the desired product. At the top of the page,
click the Actions button to open a drop-down menu, and click
Revert Inventory Adjustment.

Note

After an inventory adjustment is reverted, the line is not removed from the _Moves History_
report. Instead, an additional line is added, this time with the word `[reverted]` added to the
Reference column.

![The reference fields on the Moves History report in the Inventory app.](https://www.odoo.com/documentation/19.0/_images/reverted-adjustment.png)

## Change inventory count frequency [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#change-inventory-count-frequency "Permalink to this headline")

By default, the _scheduled date_ for inventory adjustments are always scheduled for the 31st of December of the
current year. However, for some companies, it is crucial that they have an accurate inventory count
at all times. In such cases, the default scheduled date can be modified.

To modify the default scheduled date, go to Inventory app ‣ Configuration ‣
Settings. Then, in the _Operations_ section, locate the Annual Inventory Day and Month
setting, which includes a drop-down menu that is set to `31 December` by default.

![Adjust the next inventory count date with the Annual Inventory Day and Month setting.](https://www.odoo.com/documentation/19.0/_images/annual-inventory.png)

To change the day, click the `31`, enter a number from `1-31`, depending on the desired month of the
year.

Then, to change the month, click December to reveal the drop-down menu, and select the
desired month.

Once all desired changes have been made, click Save to save all changes.

### Plan big inventory counts [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#plan-big-inventory-counts "Permalink to this headline")

To plan big inventory counts, such as a full count of everything currently in stock, first navigate
to Inventory app ‣ Operations ‣ Physical Inventory.

Then, select the desired products to be counted by selecting the checkbox on the far side of each
product line.

Tip

To request a count of **all** products currently in stock, select the checkbox at the top of the
table, in the header row next to the Location label. This selects **all** product
lines.

Once all desired products have been selected, click the Request a Count button at the
top of the page. Doing so opens the _Inventory Request_ pop-up window, where the following
information can be filled:

- Assign to: The user responsible for the count.

- Scheduled at: The planned date of the count.

- Show Expected Quantity: Whether the assigned user can see the expected quantity.


![Request a count pop-up on the Physical Inventory page.](https://www.odoo.com/documentation/19.0/_images/count-popup.png)

Finally, once ready, click Confirm to request the count.

Important

In the Odoo **Barcode** app, users can only view inventory counts that are assigned to _them_,
and are scheduled for _today_ or _earlier_.

Sometimes a count occurs, but cannot be applied in the database right away. In the time between
the actual count and applying the inventory adjustment, product moves can occur. In that case,
the on-hand quantity in the database can change and no longer be consistent with the counted
quantity. As an extra precaution, Odoo asks for confirmation before applying the inventory
adjustment.

## Adjustment history [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#adjustment-history "Permalink to this headline")

Details regarding inventory adjustment can be viewed by clicking the History icon.

The user who performed the count is listed in parenthesis in the Reference field, while
the user who applied the count is listed in the Done By.

![The history record for an inventory adjustment.](https://www.odoo.com/documentation/19.0/_images/adjustment-history.png)

### Inventory audit [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html\#inventory-audit "Permalink to this headline")

An inventory audit can be accessed from the _Physical Inventory_ page. This audit includes an
inventory record both before and after a count is completed, to track what changed.

On the _Physical Inventory_ page, select the checkbox at the top corner of the page to select all of
the lines. Then click the Request a Count button. On the pop-up, click
Confirm.

After returning to the _Physical Inventory_ page, select all of the lines again. Click
Print ‣ Count Sheet. The Count Sheet exports in PDF form.

See also

[Cycle counts](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/cycle_counts.html)

[Edit on GitHub](https://github.com/odoo/documentation/edit/19.0/content/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.rst)

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/cycle_counts.html "Cycle counts") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/operation_type.html "Operation types") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Warehouses and storage](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage.html) »
- [Inventory management](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management.html) »
- [Inventory adjustments](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management/count_products.html)
