import {createServer} from '/Users/mpp/Documents/AI&SC Course/QS-WMS项目/09-产品原型/qs-wms-demo/node_modules/vite/dist/node/index.js';
const root='/Users/mpp/Documents/AI&SC Course/QS-WMS项目/09-产品原型/qs-wms-demo';
const server=await createServer({configFile:false,root,resolve:{alias:{'@':root+'/src'}},cacheDir:'/tmp/qs-wms-full-audit/vite-cache',server:{middlewareMode:true},logLevel:'error'});
try {
 const {createSeedData}=await server.ssrLoadModule('/src/mock/seed.ts');
 const {applyReturnReceipt}=await server.ssrLoadModule('/src/mock/return-actions.ts');
 function fixture(sn=false){const s=createSeedData();const base=s.returnOrders[0];const sku=s.skuMasters.find(x=>x.customerId===base.customerId&&!x.snEnabled&&!x.batchEnabled&&!x.expiryEnabled);s.skuMasters=s.skuMasters.map(x=>x===sku?{...x,snEnabled:sn}:x);const order={...base,status:'PENDING_RECEIVE',items:[{lineNo:1,skuCode:sku.code,plannedQty:5,receivedQty:0,goodQty:0,defectQty:0,rejectedQty:0,putawayQty:0,status:'PENDING_RECEIVE'}]};s.returnOrders=[order];return {s,sku,order};}
 {
 const {s,sku,order}=fixture();const before=s.inventory.filter(x=>x.customerId===order.customerId&&x.warehouseCode===order.warehouseCode&&x.skuCode===sku.code).reduce((n,x)=>n+x.onHandQty,0);
 const r=applyReturnReceipt(s,{returnNo:order.returnNo,operator:'audit',containers:[{containerNo:'AUDIT-C1',lines:[{skuCode:sku.code,goodQty:4,defectQty:0}]},{containerNo:'AUDIT-C2',lines:[{skuCode:sku.code,goodQty:4,defectQty:0}]}]});
 const after=r.patch?.inventory.filter(x=>x.customerId===order.customerId&&x.warehouseCode===order.warehouseCode&&x.skuCode===sku.code).reduce((n,x)=>n+x.onHandQty,0);
 console.log(JSON.stringify({test:'multiContainerOverReceipt',ok:r.ok,error:r.errorKey,expected:5,received:r.patch?.returnOrders[0].items[0].receivedQty,inventoryIncrease:after-before}));
 }
 {
 const {s,sku,order}=fixture(true);order.originalOutboundNo='AUDIT-OB';s.outboundOrders.push({...s.outboundOrders[0],no:'AUDIT-OB'});s.outboundVerifications.push({orderNo:'AUDIT-OB',deleted:false,lines:[{skuCode:sku.code,serialNos:['AUDIT-X-001']},{skuCode:'OTHER-SKU',serialNos:['AUDIT-Y-001']}]});
 const r=applyReturnReceipt(s,{returnNo:order.returnNo,operator:'audit',containers:[{containerNo:'AUDIT-C3',lines:[{skuCode:sku.code,goodQty:1,defectQty:0,goodSerialNos:['AUDIT-Y-001']}]}]});
 console.log(JSON.stringify({test:'foreignSkuSerialAccepted',ok:r.ok,error:r.errorKey,returnedSku:sku.code,suppliedSN:'AUDIT-Y-001',originalSNSku:'OTHER-SKU',storedSN:r.patch?.returnReceipts[0].lines[0].goodSerialNos}));
 }
}finally{await server.close();}
