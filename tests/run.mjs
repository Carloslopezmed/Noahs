import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
mkdirSync('.sites-runtime/tests',{recursive:true});
for(const name of ['catalog','service','xlsx']){const js=ts.transpileModule(readFileSync(`lib/noahs/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("from './catalog'","from './catalog.mjs'");writeFileSync(`.sites-runtime/tests/${name}.mjs`,js);}
const {createService}=await import('../.sites-runtime/tests/service.mjs');
const {makeXlsx}=await import('../.sites-runtime/tests/xlsx.mjs');
const {products:fixtureProducts}=await import('../.sites-runtime/tests/catalog.mjs');
const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
function statement(sql){let args=[];const s={bind(...a){args=a;return s;},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};return s;}
const db={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const TEST_BOOTSTRAP_SECRET='noahs-ci-bootstrap-secret';const app=createService(db,TEST_BOOTSTRAP_SECRET);let assertions=0;
async function call(body,cookie='',identity=null){if(body.action==='place'&&Array.isArray(body.items))body={...body,items:body.items.map(i=>fixtureProducts.find(p=>p.id===i.id)?.category==='Hamburguesas'&&i.variant!=='single'&&i.side===undefined?{...i,side:'fries'}:i)};return app.dispatch(new Request('https://noahs.test/api/noahs',{method:'POST',headers:{cookie}}),body,identity);}
const check=(a,b)=>{assert.deepEqual(a,b);assertions++;};
async function denied(body,cookie,status){await assert.rejects(()=>call(body,cookie),e=>!status||e.status===status);assertions++;}

const workbook=makeXlsx([['Nombre','Usuario','Rol','Agencia','Estado'],['José & Ana','user<1>','Maestro','Plaza Balcones','Activo'],['Texto','=1+1','Caja','Peronia','Activo']]);
const workbookView=new DataView(workbook.buffer,workbook.byteOffset,workbook.byteLength);
check(workbookView.getUint32(0,true),0x04034b50);
const eocdOffset=workbook.byteLength-22;
const eocd=new DataView(workbook.buffer,workbook.byteOffset+eocdOffset,22);
check(eocd.getUint32(0,true),0x06054b50);
const entryCount=eocd.getUint16(10,true);check(entryCount,5);
let centralOffset=eocd.getUint32(16,true);
const workbookFiles={};
const decoder=new TextDecoder();
for(let i=0;i<entryCount;i++){
 const central=new DataView(workbook.buffer,workbook.byteOffset+centralOffset);
 check(central.getUint32(0,true),0x02014b50);
 const nameLength=central.getUint16(28,true),extraLength=central.getUint16(30,true),commentLength=central.getUint16(32,true);
 const filename=decoder.decode(workbook.subarray(centralOffset+46,centralOffset+46+nameLength));
 const localOffset=central.getUint32(42,true),dataLength=central.getUint32(24,true);
 const local=new DataView(workbook.buffer,workbook.byteOffset+localOffset);
 const localNameLength=local.getUint16(26,true),localExtraLength=local.getUint16(28,true);
 const dataOffset=localOffset+30+localNameLength+localExtraLength;
 workbookFiles[filename]=decoder.decode(workbook.subarray(dataOffset,dataOffset+dataLength));
 centralOffset+=46+nameLength+extraLength+commentLength;
}
check(Object.keys(workbookFiles).sort(),['[Content_Types].xml','_rels/.rels','xl/_rels/workbook.xml.rels','xl/workbook.xml','xl/worksheets/sheet1.xml'].sort());
const sheetXml=workbookFiles['xl/worksheets/sheet1.xml'];
check(sheetXml.includes('José &amp; Ana'),true);
check(sheetXml.includes('user&lt;1&gt;'),true);
check(sheetXml.includes('<c r="B3" t="inlineStr">'),true);
check(sheetXml.includes('=1+1'),true);


const legacyHoursDefaults=(await import('../.sites-runtime/tests/catalog.mjs')).agencyDefaults;
for(const a of legacyHoursDefaults)sqlite.prepare('INSERT INTO agencies(id,data) VALUES (?,?)').run(a.id,JSON.stringify({...a,open:'09:00',close:'20:00'}));

const cat=await call({action:'catalog'});check(cat.agencies.map(a=>[a.id,a.whatsapp,a.deliveryEnabled,a.freeDelivery]).sort(),[['balcones','50254640659',true,true],['peronia','50259102450',true,true],['satelite','50256142755',true,true]]);check(cat.agencies.length,3);check(cat.agencies.map(a=>[a.open,a.close]),[['11:00','21:00'],['11:00','21:00'],['11:00','21:00']]);
await denied({action:'bootstrap',bootstrapSecret:'wrong-test-secret',name:'Owner',username:'owner',pin:'12345678'},'',401);
const owner=await call({action:'bootstrap',bootstrapSecret:TEST_BOOTSTRAP_SECRET,name:'Owner fixture',username:'owner',pin:'12345678'},'','test-owner');const master=owner.cookie;
await denied({action:'bootstrap',bootstrapSecret:TEST_BOOTSTRAP_SECRET,name:'Other',username:'other',pin:'12345678'},'',409);
check(sqlite.prepare('SELECT hash FROM staff WHERE username=?').get('owner').hash==='12345678',false);
for(const [username,role,agency] of [['manager','manager','peronia'],['cashier','cashier','peronia'],['kitchen','kitchen','peronia'],['driver','driver','peronia'],['driver2','driver','peronia'],['outsider','driver','satelite']])await call({action:'saveUser',username,name:username,role,agency,pin:'12345678',active:true},master);
const cookies={};for(const name of ['manager','cashier','kitchen','driver','driver2','outsider'])cookies[name]=(await call({action:'login',username:name,pin:'12345678'})).cookie;
const staff=sqlite.prepare('SELECT * FROM staff').all(),id=n=>staff.find(u=>u.username===n).id;
const cashierBeforeReset=sqlite.prepare('SELECT salt,version FROM staff WHERE id=?').get(id('cashier'));
await denied({action:'resetUserPin',id:id('outsider')},cookies.manager,403);
await denied({action:'resetUserPin',id:id('cashier')},cookies.cashier,403);
const resetPin=await call({action:'resetUserPin',id:id('cashier')},master);
check(resetPin.ok,true);check(resetPin.username,'cashier');check(/^\d{8}$/.test(resetPin.pin),true);
const cashierAfterReset=sqlite.prepare('SELECT hash,salt,version FROM staff WHERE id=?').get(id('cashier'));
check(cashierAfterReset.salt!==cashierBeforeReset.salt,true);check(cashierAfterReset.version,cashierBeforeReset.version+1);check(cashierAfterReset.hash!==resetPin.pin,true);
await denied({action:'me'},cookies.cashier,401);
const newCashierSession=await call({action:'login',username:'cashier',pin:resetPin.pin});check(!!newCashierSession.cookie,true);
cookies.cashier=newCashierSession.cookie;
await denied({action:'login',username:'cashier',pin:'12345678'},'',401);
check(sqlite.prepare("SELECT COUNT(*) n FROM events WHERE action='reset-user-pin'").get().n,1);
await denied({action:'resetUserPin',id:id('owner')},cookies.manager,403);
await denied({action:'resetUserPin',id:id('owner')},master,400);
await denied({action:'login',username:'driver',pin:'00000000'},'',401);
await denied({action:'saveUser',username:'bad',name:'bad',role:'master',pin:'12345678'},cookies.manager,403);
await denied({action:'saveUser',username:'bad',name:'bad',role:'driver',agency:'satelite',pin:'12345678'},cookies.manager,403);
await denied({action:'configure',agency:'satelite',data:{}},cookies.manager,403);
await denied({action:'configure',agency:'peronia',data:{}},cookies.cashier,403);
let per=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await call({action:'configure',agency:'peronia',revision:per.revision,data:{...per,open:'00:00',close:'23:59',freeDelivery:false,zones:[{name:'Test zone',fee:1200}]}},master);per=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');
const base={location:{lat:14.6,lng:-90.6,confirmed:true},action:'place',key:crypto.randomUUID(),agency:'peronia',agencyRevision:per.revision,customer:'Test customer',phone:'55555555',mode:'delivery',zone:'Test zone',address:'Fictional test address',note:'Fixture, never sent',consent:true,items:[{id:'cheesy',quantity:1,choices:[]}],total:7100};
await denied({...base,key:crypto.randomUUID(),agency:'satelite'},'');
await denied({...base,key:crypto.randomUUID(),total:1},'',409);
await denied({...base,key:crypto.randomUUID(),zone:'Other'},'');
await denied({...base,key:crypto.randomUUID(),agencyRevision:999},'',409);
await denied({...base,key:crypto.randomUUID(),items:[{id:'queso',quantity:1}]},'');
await denied({...base,key:crypto.randomUUID(),items:[{id:'combo6',quantity:1,choices:['cheesy']}],total:34600},'');
const placed=await call(base);check(placed.total,7100);check(placed.whatsapp.startsWith('https://wa.me/50259102450?'),true);check((await call(base)).code,placed.code);check(sqlite.prepare('SELECT COUNT(*) n FROM orders').get().n,1);
const o=()=>sqlite.prepare('SELECT * FROM orders WHERE code=?').get(placed.code);
check((await call({action:'track',code:placed.code})).status,'received');check('phone' in await call({action:'track',code:placed.code}),false);
await denied({action:'transition',id:o().id,status:'confirmed',revision:0},cookies.kitchen,403);
await call({action:'transition',id:o().id,status:'confirmed',revision:o().revision},cookies.cashier);
await denied({action:'transition',id:o().id,status:'preparing',revision:0},cookies.kitchen,409);
await call({action:'transition',id:o().id,status:'preparing',revision:o().revision},cookies.kitchen);
await call({action:'transition',id:o().id,status:'ready',revision:o().revision},cookies.kitchen);
await denied({action:'transition',id:o().id,status:'assigned',driver:id('driver'),revision:o().revision},cookies.driver,403);
await denied({action:'transition',id:o().id,status:'assigned',driver:id('driver'),revision:o().revision},cookies.cashier,403);
await denied({action:'transition',id:o().id,status:'assigned',driver:id('outsider'),revision:o().revision},cookies.manager);
await call({action:'transition',id:o().id,status:'assigned',driver:id('driver'),revision:o().revision},cookies.manager);
check((await call({action:'dashboard'},cookies.outsider)).orders.length,0);check((await call({action:'dashboard',agency:'peronia'},cookies.outsider)).orders.length,0);
await denied({action:'transition',id:o().id,status:'onway',revision:o().revision},cookies.outsider,403);
await denied({action:'transition',id:o().id,status:'onway',revision:o().revision},cookies.driver2,403);
await denied({action:'deleteUser',id:id('driver')},cookies.manager);
await call({action:'transition',id:o().id,status:'onway',revision:o().revision},cookies.driver);
await denied({action:'transition',id:o().id,status:'delivered',revision:o().revision},cookies.driver);
await call({action:'collect',id:o().id,revision:o().revision,method:'cash'},cookies.driver);
await denied({action:'collect',id:o().id,revision:o().revision,method:'cash'},cookies.driver);
await call({action:'transition',id:o().id,status:'delivered',revision:o().revision},cookies.driver);
let f=(await call({action:'dashboard',agency:'peronia'},master)).finance;check(f.pending,7100);check(f.cashInBox,0);check(f.drivers.find(d=>d.id===id('driver')).cash,7100);
const rem={action:'remit',agency:'peronia',driver:id('driver'),amount:3000,key:crypto.randomUUID()};await call(rem,cookies.cashier);f=(await call({action:'dashboard'},cookies.cashier)).finance;check(f.pending,4100);check(f.cashInBox,3000);await denied({...rem,key:crypto.randomUUID(),amount:5000},cookies.cashier);
await denied(rem,cookies.cashier);check(sqlite.prepare('SELECT COUNT(*) n FROM remittances').get().n,1);
await denied({action:'deleteUser',id:id('driver')},cookies.manager);
await call({...rem,key:crypto.randomUUID(),amount:4100},cookies.cashier);check((await call({action:'dashboard'},cookies.cashier)).finance.pending,0);
await call({action:'close',agency:'peronia',amount:7000,note:'Fixture'},cookies.cashier);check(sqlite.prepare('SELECT expected FROM closings').get().expected,7100);
await call({action:'deleteUser',id:id('driver')},cookies.manager);await denied({action:'me'},cookies.driver,401);check(o().collector_name,'driver');check(sqlite.prepare('SELECT deleted FROM staff WHERE id=?').get(id('driver')).deleted,1);
assert.throws(()=>sqlite.prepare('UPDATE orders SET agency=? WHERE id=?').run('satelite',o().id));assertions++;
assert.throws(()=>sqlite.prepare('UPDATE remittances SET amount=1').run());assertions++;
assert.throws(()=>sqlite.prepare('DELETE FROM events').run());assertions++;
assert.throws(()=>sqlite.prepare('UPDATE orders SET total=1 WHERE id=?').run(o().id));assertions++;
assert.throws(()=>sqlite.prepare('UPDATE staff SET active=0 WHERE id=?').run(owner.user.id));assertions++;
const fresh=await call({...base,key:crypto.randomUUID(),mode:'pickup',total:5900});check(fresh.total,5900);
check((await call({action:'catalog'})).products.find(p=>p.id==='americano').price,3500);check((await call({action:'catalog'})).products.find(p=>p.id==='tradicional').includes,'Papalinas Lay’s y gaseosa');
check(sqlite.prepare('SELECT COUNT(*) n FROM orders WHERE agency=?').get('satelite').n,0);
const single=await call({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'cheesy',quantity:1,variant:'single',choices:[]}],total:4900});check(single.total,4900);const storedSingle=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(single.code).items)[0];check(storedSingle.variant,'single');check(storedSingle.includes,'');check(storedSingle.name.includes('Hamburguesa sola'),true);
const mixed=await call({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'cheesy',quantity:1,variant:'combo',choices:[]},{id:'cheesy',quantity:1,variant:'single',choices:[]}],total:10800});check(mixed.total,10800);
await denied({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'cheesy',quantity:1,variant:'single'}],total:3900},'',409);
await denied({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'chicago',quantity:1,variant:'single'}],total:2000},'');
const regularHotDog=await call({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'chicago',quantity:1,variant:'regular'}],total:3000});check(regularHotDog.total,3000);
check((await call({action:'catalog'})).products.find(p=>p.id==='tejana').price-1000,5400);
const {menuEntries,catalogFor,agencyDefaults}=await import('../.sites-runtime/tests/catalog.mjs');const baseMenu=catalogFor(agencyDefaults[1]),listing=menuEntries(baseMenu);check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='single').displayImage,'cheesy');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='combo').displayImage,'cheesy-combo');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='combo').displayCategory,'Combos');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='single').displayPrice,4900);check(listing.some(p=>p.id==='chili'),true);check(listing.find(p=>p.id==='chili').displayCategory,'Complementos');check(listing.find(p=>p.id==='combo6').displayCategory,'Combos');check(listing.find(p=>p.id==='smash2').available,true);
for(const entry of listing){assert.ok(readFileSync('public/menu/'+entry.displayImage+'.webp').length>0);assertions++;}
const chiliOrder=await call({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'cheesy',quantity:1,variant:'single'},{id:'chili',quantity:1,variant:'regular'}],total:7400});check(chiliOrder.total,7400);check(decodeURIComponent(chiliOrder.whatsapp).includes('Chili Garlic'),true);
await denied({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'chili',quantity:1,variant:'regular',price:1}],total:1},'',409);
const configured=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await call({action:'configure',agency:'peronia',revision:configured.revision,data:{...configured,overrides:{...configured.overrides,chili:{available:false}}}},master);const reconfigured=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await denied({...base,key:crypto.randomUUID(),agencyRevision:reconfigured.revision,mode:'pickup',items:[{id:'chili',quantity:1,variant:'regular'}],total:2500});
check((await call({action:'catalog'})).products.find(p=>p.id==='cheesecake').price,2000);const dessertAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');const dessertOrder=await call({...base,key:crypto.randomUUID(),agencyRevision:dessertAgency.revision,mode:'pickup',items:[{id:'cheesecake',quantity:1,variant:'regular'}],total:2000});check(dessertOrder.total,2000);
const catalogBalcones=catalogFor(agencyDefaults.find(a=>a.id==='balcones'));check(catalogBalcones.find(p=>p.id==='wantan-camaron').price,6500);check(catalogBalcones.find(p=>p.id==='wantan-camaron').available,true);check(catalogFor(agencyDefaults.find(a=>a.id==='peronia')).find(p=>p.id==='wantan-camaron').available,false);const latestPer=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await denied({...base,key:crypto.randomUUID(),agencyRevision:latestPer.revision,mode:'pickup',items:[{id:'wantan-camaron',quantity:1,variant:'regular'}],total:6500});const configuredBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');await call({action:'configure',agency:'balcones',revision:configuredBalcones.revision,data:{...configuredBalcones,whatsapp:'50255555555',open:'00:00',close:'23:59'}},master);const readyBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');const wantanOrder=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:readyBalcones.revision,mode:'pickup',items:[{id:'wantan-camaron',quantity:1,variant:'regular'}],total:6500});check(wantanOrder.total,6500);check(decodeURIComponent(wantanOrder.whatsapp).includes('Porción de 10 unidades'),true);const wantanItems=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(wantanOrder.code).items);check(wantanItems[0].includes,'Porción de 10 unidades');
const {comboBurgerOptions}=await import('../.sites-runtime/tests/catalog.mjs');const familyAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');const selectable=comboBurgerOptions(familyAgency);check(selectable.length,productsForTests().filter(p=>p.category==='Hamburguesas').length);check(selectable.some(p=>p.id==='queso'),true);for(const burger of selectable){assert.ok(readFileSync('public/menu/'+burger.image+'.webp').length>0);assertions++;}
function productsForTests(){return baseMenu;}
for(const [comboId,n,price] of [['combo6',6,33400],['combo3',3,16500],['combo4',4,22500],['martes',2,11000]]){
 const product=catalogFor(familyAgency).find(p=>p.id===comboId);check(product.choices,n);check(product.available,true);const expectedIncludes=comboId==='combo4'?'4 hamburguesas a elección + 4 porciones de papas fritas + 1 Coca-Cola de 1.5 litros':comboId==='combo6'?'6 porciones de papas fritas y 1 Coca-Cola de 1.5 litros':`${n} porciones de papas fritas y ${n} bebidas`;check(product.includes,expectedIncludes);
 const chosen=Array.from({length:n},(_,i)=>i===0?'queso':i%2?'master':'cheesy');const completeOrder=await call({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,variant:'regular',choices:chosen}],total:price});check(completeOrder.total,price);const snapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(completeOrder.code).items)[0];check(snapshot.choices.length,n);check(snapshot.choices[0],'Quesoburguesa');check(snapshot.includes,expectedIncludes);check(decodeURIComponent(completeOrder.whatsapp).includes(expectedIncludes),true);
 const repeated=await call({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,choices:Array(n).fill('master')}],total:price});check(repeated.total,price);
 for(const invalid of [[],chosen.slice(1),[...chosen,'cheesy'],Array(n).fill('papas'),Array(n).fill('nonexistent')])await denied({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,choices:invalid}],total:price});
}
await call({action:'configure',agency:'peronia',revision:familyAgency.revision,data:{...familyAgency,overrides:{...familyAgency.overrides,master:{available:false}}}},master);const stockAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');check(comboBurgerOptions(stockAgency).some(p=>p.id==='master'),false);await denied({...base,key:crypto.randomUUID(),agencyRevision:stockAgency.revision,mode:'pickup',items:[{id:'martes',quantity:1,choices:['master','cheesy']}],total:11000});
check((await call({action:'catalog'})).products.find(p=>p.id==='wantan').name,'Wantán de pollo');check((await call({action:'catalog'})).products.find(p=>p.id==='wantan').price,5500);
const tortillaAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');for(const [id,price] of [['gigante-tortilla',4000],['tortiburguer',5000],['quesadilla',4500]]){const p=catalogFor(tortillaAgency).find(p=>p.id===id);check(p.price,price);check(p.includes,'Papas y gaseosa');check(menuEntries(catalogFor(tortillaAgency)).find(p=>p.id===id).displayCategory,'Combos');const order=await call({...base,key:crypto.randomUUID(),agencyRevision:tortillaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(order.total,price);check(decodeURIComponent(order.whatsapp).includes('Papas y gaseosa'),true);await denied({...base,key:crypto.randomUUID(),agencyRevision:tortillaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'single'}],total:price-1000});}
const cheeseAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia'),cheeseProduct=catalogFor(cheeseAgency).find(p=>p.id==='queso');check(cheeseProduct.available,true);check(cheeseProduct.price,4000);check(cheeseProduct.includes,'Papas fritas o bolsa de Lay’s y Coca-Cola en lata de 237 ml');for(const [variant,total] of [['combo',4000],['single',3000]]){const placed=await call({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'queso',quantity:1,variant}],total});check(placed.total,total);const item=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(placed.code).items)[0];check(item.includes,variant==='combo'?'Papas fritas y Coca-Cola en lata de 237 ml':'');if(variant==='combo')check(decodeURIComponent(placed.whatsapp).includes('237 ml'),true);}
const doubleSmash=await call({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'smash2',quantity:1,variant:'regular'}],total:12000});check(doubleSmash.total,12000);const smashSnapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(doubleSmash.code).items)[0];check(smashSnapshot.includes,'2 Smash Burger');check(smashSnapshot.choices.length,0);await denied({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'smash2',quantity:1,variant:'single'}],total:11000});
const chinaAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');check(catalogFor(chinaAgency).some(p=>p.id==='combo-favorito-chino'),false);check(catalogFor(chinaAgency).some(p=>p.id==='combo-favorito'),false);check(catalogFor(chinaAgency).some(p=>p.id==='combo-familiar-chino-pollo'&&p.available),true);check(catalogFor(chinaAgency).some(p=>p.id==='combo-express-chino'&&p.available),true);const latestNonChinese=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');check(catalogFor(latestNonChinese).some(p=>p.id==='combo-favorito-chino'),false);check(catalogFor(latestNonChinese).some(p=>p.id==='combo-favorito'),false);
const expressAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');const express=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:expressAgency.revision,mode:'pickup',items:[{id:'combo-express-chino',quantity:1,variant:'regular'}],total:9500});check(express.total,9500);const expressSnapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(express.code).items)[0];check(expressSnapshot.includes,'Arroz frito + wantán + Pepsi de 1.5 litros');const sidesAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');check(catalogFor(sidesAgency).find(p=>p.id==='salchipapas').category,'Complementos');const salchiOrder=await call({...base,key:crypto.randomUUID(),agencyRevision:sidesAgency.revision,mode:'pickup',items:[{id:'salchipapas',quantity:1,variant:'regular'}],total:3500});check(salchiOrder.total,3500);await denied({...base,key:crypto.randomUUID(),agencyRevision:sidesAgency.revision,mode:'pickup',items:[{id:'combo-express-chino',quantity:1,variant:'regular'}],total:9500});

const noodleAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [id,price] of [['chao-mein-camaron',8500],['chao-mein-pollo',8000],['chao-mein-lomito',8000],['chao-mein-mixto',8500]]){
 const product=catalogFor(noodleAgency).find(p=>p.id===id);check(product.price,price);check(product.category,'Comida china');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:noodleAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:sidesAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const drinkAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');
for(const flavor of ['pepsi','seven-up','mirinda','grapete','coca-cola','tiki','orange']){
 const id='lata-'+flavor,product=catalogFor(drinkAgency).find(p=>p.id===id);check(product.price,1000);check(product.category,'Bebidas');
 const placed=await call({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:1000});check(placed.total,1000);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
}


const riceAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [id,price] of [['arroz-frito-mixto',8500],['arroz-frito-camaron',8500],['arroz-frito-pollo',8000],['arroz-frito-lomito',8000]]){
 const product=catalogFor(riceAgency).find(p=>p.id===id);check(product.price,price);check(product.category,'Comida china');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:riceAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const soupAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const kind of ['mein','ramen'])for(const [meat,basePrice] of [['pollo',7500],['lomito',7500],['mixta',8500],['camaron',8500]]){
 const price=kind==='mein'?(meat==='mixta'?7500:meat==='camaron'?7000:6500):basePrice;const id=`sopa-${kind}-${meat}`,product=catalogFor(soupAgency).find(p=>p.id===id);check(product.price,price);check(product.includes,'1 sopa + bebida');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:soupAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);check(decodeURIComponent(placed.whatsapp).includes('1 sopa + bebida'),true);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
 if(price===8500)await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:soupAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:7500},'',409);
}


const expressMeatAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [id,price] of [['combo-express-chino',9500],['combo-express-chino-lomito',9500],['combo-express-chino-camaron',10000],['combo-express-chino-mixto',10500]]){
 const product=catalogFor(expressMeatAgency).find(p=>p.id===id);check(product.price,price);check(product.includes,'Arroz frito + wantán + Pepsi de 1.5 litros');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:expressMeatAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
 if(price>9500)await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:expressMeatAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:9500},'',409);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const favoriteAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [id,price] of [['combo-favorito-chino',16500],['combo-favorito-chino-camaron',16500],['combo-favorito-chino-lomito',16500],['combo-favorito-chino-mixto',18000]]){
 const product=catalogFor(favoriteAgency).find(p=>p.id===id);check(product.price,price);check(product.includes,'1 arroz frito de 2 lb + 1 chao mein de 2 lb + 10 unidades de wantán + Pepsi de 1.5 litros');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:favoriteAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
 if(price>16500)await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:favoriteAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:16500},'',409);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const superAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones'),superProduct=catalogFor(superAgency).find(p=>p.id==='super-combo-sopas');
const {resolveSoupBundle,itemPrice}=await import('../.sites-runtime/tests/catalog.mjs');
for(const first of ['mein','ramen'])for(const second of ['mein','ramen'])for(const meat of ['lomito','pollo','camaron','mixtas'])for(const wantan of ['pollo','lomito','camaron']){
 const selected={soups:[first,second],meat,wantan};check(itemPrice(superProduct,'regular',selected),wantan==='camaron'?19000:18000);check(resolveSoupBundle(selected).labels.length,3);
}
for(const [selection,quantity,total] of [
 [{soups:['mein','ramen'],meat:'mixtas',wantan:'pollo'},1,18000],
 [{soups:['ramen','ramen'],meat:'camaron',wantan:'lomito'},1,18000],
 [{soups:['mein','mein'],meat:'pollo',wantan:'camaron'},2,38000],
 [{soups:['ramen','mein'],meat:'lomito',wantan:'camaron'},1,19000]
]){const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:superAgency.revision,mode:'pickup',items:[{id:superProduct.id,quantity,variant:'regular',selection}],total});check(placed.total,total);const snapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(placed.code).items)[0];check(snapshot.choices,resolveSoupBundle(selection).labels);check(snapshot.includes,'2 sopas Mein o Ramen + 10 wantanes + 2 gaseosas');check(decodeURIComponent(placed.whatsapp).includes(resolveSoupBundle(selection).labels[2]),true);}
for(const selection of [undefined,{}, {soups:['mein'],meat:'pollo',wantan:'pollo'},{soups:['mein','ramen'],meat:'no-existe',wantan:'pollo'},{soups:['mein','ramen'],meat:'pollo',wantan:'cangrejo'}])await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:superAgency.revision,mode:'pickup',items:[{id:superProduct.id,quantity:1,variant:'regular',selection}],total:18000});
await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:superAgency.revision,mode:'pickup',items:[{id:superProduct.id,quantity:1,variant:'regular',selection:{soups:['mein','ramen'],meat:'pollo',wantan:'camaron'}}],total:18000},'',409);
await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id:superProduct.id,quantity:1,variant:'regular',selection:{soups:['mein','ramen'],meat:'pollo',wantan:'pollo'}}],total:18000});


const chapAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [meat,price] of [['pollo',8000],['lomito',8000],['camaron',8500],['mixto',9000]]){
 const id='chapsuey-'+meat,product=catalogFor(chapAgency).find(p=>p.id===id);check(product.price,price);check(product.category,'Comida china');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:chapAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);
 if(price>8000)await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:chapAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:8000},'',409);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const familyChinaAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
for(const [meat,price] of [['pollo',21500],['camaron',21500],['lomito',21500],['mixto',22500]]){
 const id='combo-familiar-chino-'+meat,product=catalogFor(familyChinaAgency).find(p=>p.id===id);check(product.price,price);check(product.includes,'1 arroz frito de 2 lb + 1 chao mein de 2 lb + Coca-Cola de 1.5 litros');
 const placed=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:familyChinaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(placed.total,price);check(decodeURIComponent(placed.whatsapp).includes(product.name),true);check(decodeURIComponent(placed.whatsapp).includes(product.includes),true);
 if(price>21500)await denied({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:familyChinaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:21500},'',409);
 await denied({...base,key:crypto.randomUUID(),agencyRevision:drinkAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});
}


const {inHours}=await import('../.sites-runtime/tests/catalog.mjs');const hoursAgency=legacyHoursDefaults[0];
check(inHours(hoursAgency,new Date('2026-10-16T16:59:00Z')),false);check(inHours(hoursAgency,new Date('2026-10-16T17:00:00Z')),true);check(inHours(hoursAgency,new Date('2026-10-17T02:59:00Z')),true);check(inHours(hoursAgency,new Date('2026-10-17T03:00:00Z')),false);
check(sqlite.prepare("SELECT count(*) AS n FROM events WHERE action='hours_updated'").get().n,3);
const beforeHoursRevision=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await call({action:'catalog'});const afterHoursRevision=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');check(afterHoursRevision.open,'00:00');check(afterHoursRevision.close,'23:59');check(afterHoursRevision.revision,beforeHoursRevision.revision);


const {chineseDeliveryBlocked,isChineseProduct}=await import('../.sites-runtime/tests/catalog.mjs');
check(chineseDeliveryBlocked(['chapsuey-pollo'],'Ciudad Peronia'),true);check(chineseDeliveryBlocked(['wantan-camaron'],'Otra zona','Casa 2, Ciudad Peronía'),true);check(chineseDeliveryBlocked(['cheesy'],'Ciudad Peronia'),false);check(chineseDeliveryBlocked(['chili'],'Ciudad Peronia'),false);check(chineseDeliveryBlocked(['chapsuey-pollo'],'San Cristóbal'),false);
for(const agencyId of ['peronia','satelite'])check(catalogFor(legacyHoursDefaults.find(a=>a.id===agencyId)).filter(p=>isChineseProduct(p)&&p.available).length,0);
const currentBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');await call({action:'configure',agency:'balcones',revision:currentBalcones.revision,data:{...currentBalcones,freeDelivery:false,zones:[{name:'Ciudad Peronia',fee:1200},{name:'Zona permitida fixture',fee:1200}]}},master);const restrictedBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
const deliveryFixture={...base,agency:'balcones',agencyRevision:restrictedBalcones.revision,mode:'delivery',zone:'Ciudad Peronia',address:'Casa 5, Ciudad Peronia'};
for(const id of ['chapsuey-pollo','wantan','wantan-camaron','wantan-cangrejo','sopa-mein-pollo','combo-familiar-chino-pollo']){const product=catalogFor(restrictedBalcones).find(p=>p.id===id);await denied({...deliveryFixture,key:crypto.randomUUID(),items:[{id,quantity:1,variant:'regular'}],total:product.price+1200});}
await denied({...deliveryFixture,key:crypto.randomUUID(),zone:'Zona permitida fixture',items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'}],total:9200});
await denied({...deliveryFixture,key:crypto.randomUUID(),items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'},{id:'lata-pepsi',quantity:1,variant:'regular'}],total:10200});
const allowedLocal=await call({...deliveryFixture,key:crypto.randomUUID(),zone:'Zona permitida fixture',address:'Casa 5 de zona permitida fixture',items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'}],total:9200});check(allowedLocal.total,9200);
const allowedBurger=await call({...deliveryFixture,key:crypto.randomUUID(),items:[{id:'cheesy',quantity:1,variant:'combo'}],total:7100});check(allowedBurger.total,7100);
const allowedPickup=await call({...deliveryFixture,key:crypto.randomUUID(),mode:'pickup',items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'}],total:8000});check(allowedPickup.total,8000);


const {validDeliveryLocation,deliveryMapUrl,parseLocationLink}=await import('../.sites-runtime/tests/catalog.mjs');
const confirmedPoint={lat:14.6,lng:-90.6,confirmed:true};check(validDeliveryLocation(confirmedPoint),true);check(deliveryMapUrl(confirmedPoint),'https://www.google.com/maps/search/?api=1&query=14.6,-90.6');
for(const p of [null,{}, {lat:91,lng:0,confirmed:true},{lat:0,lng:-181,confirmed:true},{lat:Infinity,lng:0,confirmed:true},{lat:'14.6',lng:-90.6,confirmed:true},{lat:14.6,lng:-90.6,confirmed:false}])check(validDeliveryLocation(p),false);
check(parseLocationLink('14.6, -90.6'),{lat:14.6,lng:-90.6});check(parseLocationLink('https://www.google.com/maps/search/?api=1&query=14.6%2C-90.6'),{lat:14.6,lng:-90.6});check(parseLocationLink('https://maps.google.com/?q=14.6,-90.6'),{lat:14.6,lng:-90.6});check(parseLocationLink('https://www.google.com/maps/place/fixture/data=!3d14.6!4d-90.6'),{lat:14.6,lng:-90.6});
for(const link of ['https://evil.test/?q=14.6,-90.6','javascript:alert(1)','https://maps.app.goo.gl/example','999,0','https://www.google.com/maps/@14.6,-90.6,15z'])check(parseLocationLink(link),null);
const geoDelivery={...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:restrictedBalcones.revision,mode:'delivery',zone:'Zona permitida fixture',address:'Casa 5 zona permitida fixture',location:confirmedPoint,items:[{id:'lata-pepsi',quantity:1,variant:'regular'}],total:2200};
for(const location of [undefined,{lat:14.6,lng:-90.6,confirmed:false},{lat:100,lng:0,confirmed:true}])await denied({...geoDelivery,key:crypto.randomUUID(),location});
const geoOrder=await call(geoDelivery);check(decodeURIComponent(geoOrder.whatsapp).includes(deliveryMapUrl(confirmedPoint)),true);check(JSON.parse(sqlite.prepare('SELECT location FROM orders WHERE code=?').get(geoOrder.code).location),confirmedPoint);
const sameGeoOrder=await call({...geoDelivery,location:{lat:1,lng:2,confirmed:true}});check(sameGeoOrder.code,geoOrder.code);check(decodeURIComponent(sameGeoOrder.whatsapp).includes(deliveryMapUrl(confirmedPoint)),true);
const geoTrack=await call({action:'track',code:geoOrder.code});check(geoTrack.location,undefined);
const kitchenGeo=await call({action:'dashboard',agency:'peronia'},cookies.kitchen);check(kitchenGeo.orders.every(o=>o.location===null),true);
const pickupGeo=await call({...geoDelivery,key:crypto.randomUUID(),mode:'pickup',total:1000});check(sqlite.prepare('SELECT location FROM orders WHERE code=?').get(pickupGeo.code).location,null);check(decodeURIComponent(pickupGeo.whatsapp).includes('Ubicación de entrega:'),false);

// Free shipping accepts address + confirmed point without inventing geographic zones.
for(const initial of cat.agencies){
 const current=(await call({action:'catalog'})).agencies.find(a=>a.id===initial.id);
 await call({action:'configure',agency:current.id,revision:current.revision,data:{...current,open:'00:00',close:'23:59',whatsapp:initial.whatsapp,deliveryEnabled:true,freeDelivery:true,zones:[]}},master);
 const updated=(await call({action:'catalog'})).agencies.find(a=>a.id===initial.id);
 check(updated.freeDelivery,true);check(updated.zones,[]);
 const request={...base,key:crypto.randomUUID(),agency:updated.id,agencyRevision:updated.revision,zone:'',location:confirmedPoint,total:5900};
 const receipt=await call(request);check(receipt.total,5900);check(receipt.whatsapp.startsWith('https://wa.me/'+initial.whatsapp+'?'),true);check(sqlite.prepare('SELECT fee FROM orders WHERE code=?').get(receipt.code).fee,0);
 await denied({...request,key:crypto.randomUUID(),total:7100},'',409);
 await denied({...request,key:crypto.randomUUID(),location:null});
 await denied({...request,key:crypto.randomUUID(),address:'short'});
 if(updated.id==='balcones')await denied({...request,key:crypto.randomUUID(),address:'Casa 10 Ciudad Peronia',items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'}],total:8000});
 else await denied({...request,key:crypto.randomUUID(),items:[{id:'chapsuey-pollo',quantity:1,variant:'regular'}],total:8000});
 await call({action:'configure',agency:updated.id,revision:updated.revision,data:{...updated,deliveryEnabled:false}},master);
 const paused=(await call({action:'catalog'})).agencies.find(a=>a.id===initial.id);check(paused.deliveryEnabled,false);
 await denied({...request,key:crypto.randomUUID(),agencyRevision:paused.revision});
}

// Peronia correction is scoped to its four-person combo and keeps confirmed burger prices.
const peroniaCatalog=catalogFor(agencyDefaults.find(a=>a.id==='peronia'));
check(peroniaCatalog.filter(p=>p.category==='Hamburguesas').map(p=>[p.id,p.price]).sort(),[['bufalo',5900],['cheesy',5900],['clasica',5900],['costena',5900],['crunchy',5900],['master',6000],['queso',4000],['smash',6000],['tejana',6400],['tocino',5900],['tori',5900]].sort());
check(peroniaCatalog.find(p=>p.id==='combo4').price,22500);
for(const id of ['balcones','satelite'])check(catalogFor(agencyDefaults.find(a=>a.id===id)).find(p=>p.id==='combo4').includes,'4 porciones de papas fritas y 4 bebidas');
check(peroniaCatalog.find(p=>p.id==='combo4').description.includes('Coca-Cola de 1.5 litros'),true);

// Required, server-validated side selection, at the same combo price.
const sideAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');
const sideRequest={...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:sideAgency.revision,mode:'pickup',items:[{id:'tori',quantity:1,variant:'combo'}],total:5900};
await assert.rejects(()=>app.dispatch(new Request('https://noahs.test/api/noahs',{method:'POST'}),sideRequest,null),e=>e.message.includes('Lay’s'));assertions++;
for(const side of [null,'invalid',{},123])await denied({...sideRequest,key:crypto.randomUUID(),items:[{id:'tori',quantity:1,variant:'combo',side}]});
for(const [side,label] of [['fries','Papas fritas'],['lays','Bolsa de Lay’s']]){
 const receipt=await call({...sideRequest,key:crypto.randomUUID(),items:[{id:'tori',quantity:2,variant:'combo',side}],total:11800});check(receipt.total,11800);
 const item=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(receipt.code).items)[0];check(item.side,side);check(item.includes,label+' y gaseosa');check(item.choices,['Acompañamiento: '+label]);check(decodeURIComponent(receipt.whatsapp).includes(label),true);
}
const bothSides=await call({...sideRequest,key:crypto.randomUUID(),items:[{id:'tori',quantity:1,variant:'combo',side:'lays'},{id:'tori',quantity:1,variant:'combo',side:'fries'}],total:11800});
check(JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(bothSides.code).items).map(i=>i.side),['lays','fries']);
await denied({...sideRequest,key:crypto.randomUUID(),items:[{id:'tori',quantity:1,variant:'single',side:'fries'}],total:4900});
await denied({...sideRequest,key:crypto.randomUUID(),items:[{id:'chicago',quantity:1,variant:'regular',side:'fries'}],total:3000});

console.log(`PASS: ${assertions} checks; isolated SQLite service tests, no production data, WhatsApp or payment requests.`);
