# Source: https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/storage_category.html "Storage categories") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/delivery_three_steps.html "Three-step delivery") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Shipping and receiving](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving.html) »
- [Inbound and outbound flows](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations.html) »
- [Putaway rules](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html)

# Putaway rules [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html\#putaway-rules "Permalink to this headline")

Putaway is the process of routing products to appropriate storage locations upon shipment arrival.

Odoo can accomplish this seamlessly using _putaway rules_, which dictate how products move through
specified warehouse locations.

Upon shipment arrival, operations are generated based on putaway rules to efficiently move products
to specified locations, and ensure easy retrieval for future delivery orders.

In warehouses that process specific kinds of products, putaway rules can also prevent volatile
substances from being stored in close proximity, by directing them to different locations determined
by the warehouse manager.

See also

[Odoo Tutorials: Putaway Rules](https://www.youtube.com/watch?v=nCQMf6sj_w8)

## Configuration [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html\#configuration "Permalink to this headline")

To use putaway rules, navigate to Inventory app ‣ Configuration ‣ Settings, and
activate the Multi-Step Routes feature under the Warehouse section. By doing
so, the Storage Locations feature is also automatically activated.

Finally, click Save.

![Activate Multi-Step Routes in Inventory configuration settings.](https://www.odoo.com/documentation/19.0/_images/activate-multi-step-routes.png)

### Define putaway rule [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html\#define-putaway-rule "Permalink to this headline")

To manage where specific products are routed for storage, navigate to Inventory app
‣ Configuration ‣ Putaway Rules. Use the New button to configure a new putaway
rule on a Product or Product Category that the rule affects.

Important

Putaway rules can be defined either per product/product category, and/or package type (the
_Packages_ setting must be enabled in Inventory app ‣ Configuration ‣
Settings for that). Additionally, a [storage category](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/storage_category.html)
can be defined to limit capacities of a storage location and route products accordingly.

In the same line, the When product arrives in location is where the putaway rule is
triggered to create an operation to move the product to the Store to location.

For this to work, the Store to location must be a _sub-location_ of the first (e.g.,
`WH/Stock/Fruits` is a specific, named location inside `WH/Stock` to make the products stored here
easier to find).

Example

In a warehouse location, **WH/Stock**, there are the following sub-locations:

- WH/Stock/Fruits

- WH/Stock/Vegetables


Ensure all apples are stored in the fruits section by filling the field Store to with
the location `WH/Stock/Fruits` when the Product, `Apple` arrives in `WH/Stock`.

Repeat this for all products and hit Save.

![Create putaway rules for apples and carrots.](https://www.odoo.com/documentation/19.0/_images/create-putaway-rules.png)

Use the Sublocation field to specify whether to use a sublocation or specify a
storage category:

- No: no sublocation is used. Products are directed to whatever is specified in the
Store to field.

- Last Used: the last location that had a move associated with it for that product or
product category is used. If there is no last location used, the destination is whatever is
specified in the Store to field.

- Closest Location: the locations specified as part of a storage category are used. A
storage category is mandatory in the Having Category field.


To apply a putaway rule to _all_ products, create an empty putaway rule with no specified
Product or Product Category. All products are stored in the location
specified in the Store to field.

Note

A best practice for an empty putaway rule is to specify the Last usedSublocation. Specifying Last used ensures that Odoo suggests the last
location used to store a product.

### Putaway rule priority [¶](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html\#putaway-rule-priority "Permalink to this headline")

Odoo selects a putaway rule based on the following priority list (from highest to lowest) until a
match is found:

1. Package type and product

2. Package type and product category

3. Package type

4. Product

5. Product category


Example

> The product `Lemonade can` has the following putaway rules configured:
>
> 1. When receiving a `Pallet` (Package Type) of `Lemonade cans`, it is redirected to
> `WH/Stock/Pallets/PAL1`.
>
> 2. `Lemonade can`’s Product Category is `All/drinks`, and when receiving a `Box` of
> any item in this product category, items are redirected to `WH/Stock/Shelf 1`.
>
> 3. Any product on a `Pallet` is redirected to `WH/Stock/Pallets`
>
> 4. The product `Lemonade can` is redirected to `WH/Stock/Shelf 2`
>
> 5. Items in the `All/drinks` product category are redirected to `WH/Stock/Small Refrigerator`.

![Some examples of putaway rules.](https://www.odoo.com/documentation/19.0/_images/putaway-example.png)

[Edit on GitHub](https://github.com/odoo/documentation/edit/19.0/content/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.rst)

### Navigation

- [index](https://www.odoo.com/documentation/19.0/genindex.html "General Index")
- [modules](https://www.odoo.com/documentation/19.0/py-modindex.html "Python Module Index") \|
- [next](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/storage_category.html "Storage categories") \|
- [previous](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/delivery_three_steps.html "Three-step delivery") \|
- [Odoo 19.0 documentation](https://www.odoo.com/documentation/19.0/index.html) »
- [User Docs](https://www.odoo.com/documentation/19.0/applications.html) »
- [Supply Chain](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html) »
- [Inventory](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html) »
- [Shipping and receiving](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving.html) »
- [Inbound and outbound flows](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations.html) »
- [Putaway rules](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/putaway.html)
