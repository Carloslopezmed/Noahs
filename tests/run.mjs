import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
mkdirSync('.sites-runtime/tests',{recursive:true});
for(const name of ['catalog','service']){const js=ts.transpileModule(readFileSync(`lib/noahs/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("from './catalog'","from './catalog.mjs'");writeFileSync(`.sites-runtime/tests/${name}.mjs`,js);}
const {createService}=await import('../.sites-runtime/tests/service.mjs');
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_known_annihilus.sql','utf8'));
function statement(sql){let args=[];const s={bind(...a){args=a;return s;},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};return s;}
const db={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const app=createService(db);let assertions=0;
async function call(body,cookie='',identity=null){return app.dispatch(new Request('https://noahs.test/api/noahs',{method:'POST',headers:{cookie}}),body,identity);}
const check=(a,b)=>{assert.deepEqual(a,b);assertions++;};
async function denied(body,cookie,status){await assert.rejects(()=>call(body,cookie),e=>!status||e.status===status);assertions++;}
const cat=await call({action:'catalog'});check(cat.agencies.length,3);check(cat.agencies.map(a=>[a.open,a.close]),[['09:00','20:00'],['09:00','20:00'],['09:00','20:00']]);
await denied({action:'bootstrap',name:'Owner',username:'owner',pin:'12345678'},'',401);
const owner=await call({action:'bootstrap',name:'Owner fixture',username:'owner',pin:'12345678'},'','test-owner');const master=owner.cookie;
await denied({action:'bootstrap',name:'Other',username:'other',pin:'12345678'},'',401);
check(sqlite.prepare('SELECT hash FROM staff WHERE username=?').get('owner').hash==='12345678',false);
for(const [username,role,agency] of [['manager','manager','peronia'],['cashier','cashier','peronia'],['kitchen','kitchen','peronia'],['driver','driver','peronia'],['driver2','driver','peronia'],['outsider','driver','satelite']])await call({action:'saveUser',username,name:username,role,agency,pin:'12345678',active:true},master);
const cookies={};for(const name of ['manager','cashier','kitchen','driver','driver2','outsider'])cookies[name]=(await call({action:'login',username:name,pin:'12345678'})).cookie;
const staff=sqlite.prepare('SELECT * FROM staff').all(),id=n=>staff.find(u=>u.username===n).id;
await denied({action:'login',username:'driver',pin:'00000000'},'',401);
await denied({action:'saveUser',username:'bad',name:'bad',role:'master',pin:'12345678'},cookies.manager,403);
await denied({action:'saveUser',username:'bad',name:'bad',role:'driver',agency:'satelite',pin:'12345678'},cookies.manager,403);
await denied({action:'configure',agency:'satelite',data:{}},cookies.manager,403);
await denied({action:'configure',agency:'peronia',data:{}},cookies.cashier,403);
let per=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await call({action:'configure',agency:'peronia',revision:per.revision,data:{...per,open:'00:00',close:'23:59',zones:[{name:'Test zone',fee:1200}]}},master);per=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');
const base={action:'place',key:crypto.randomUUID(),agency:'peronia',agencyRevision:per.revision,customer:'Test customer',phone:'55555555',mode:'delivery',zone:'Test zone',address:'Fictional test address',note:'Fixture, never sent',consent:true,items:[{id:'cheesy',quantity:1,choices:[]}],total:7100};
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
const {menuEntries,catalogFor,agencyDefaults}=await import('../.sites-runtime/tests/catalog.mjs');const baseMenu=catalogFor(agencyDefaults[1]),listing=menuEntries(baseMenu);check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='single').displayImage,'cheesy');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='combo').displayImage,'cheesy-combo');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='combo').displayCategory,'Combos');check(listing.find(p=>p.id==='cheesy'&&p.displayVariant==='single').displayPrice,4900);check(listing.some(p=>p.id==='chili'),false);check(listing.find(p=>p.id==='combo6').displayCategory,'Combos');check(listing.find(p=>p.id==='smash2').available,true);
for(const entry of listing){assert.ok(readFileSync('public/menu/'+entry.displayImage+'.webp').length>0);assertions++;}
const chiliOrder=await call({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'cheesy',quantity:1,variant:'single'},{id:'chili',quantity:1,variant:'regular'}],total:7400});check(chiliOrder.total,7400);check(decodeURIComponent(chiliOrder.whatsapp).includes('Chili Garlic'),true);
await denied({...base,key:crypto.randomUUID(),mode:'pickup',items:[{id:'chili',quantity:1,variant:'regular',price:1}],total:1},'',409);
const configured=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await call({action:'configure',agency:'peronia',revision:configured.revision,data:{...configured,overrides:{...configured.overrides,chili:{available:false}}}},master);const reconfigured=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await denied({...base,key:crypto.randomUUID(),agencyRevision:reconfigured.revision,mode:'pickup',items:[{id:'chili',quantity:1,variant:'regular'}],total:2500});
check((await call({action:'catalog'})).products.find(p=>p.id==='cheesecake').price,2000);const dessertAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');const dessertOrder=await call({...base,key:crypto.randomUUID(),agencyRevision:dessertAgency.revision,mode:'pickup',items:[{id:'cheesecake',quantity:1,variant:'regular'}],total:2000});check(dessertOrder.total,2000);
const catalogBalcones=catalogFor(agencyDefaults.find(a=>a.id==='balcones'));check(catalogBalcones.find(p=>p.id==='wantan-camaron').price,6500);check(catalogBalcones.find(p=>p.id==='wantan-camaron').available,true);check(catalogFor(agencyDefaults.find(a=>a.id==='peronia')).find(p=>p.id==='wantan-camaron').available,false);const latestPer=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');await denied({...base,key:crypto.randomUUID(),agencyRevision:latestPer.revision,mode:'pickup',items:[{id:'wantan-camaron',quantity:1,variant:'regular'}],total:6500});const configuredBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');await call({action:'configure',agency:'balcones',revision:configuredBalcones.revision,data:{...configuredBalcones,whatsapp:'50255555555',open:'00:00',close:'23:59'}},master);const readyBalcones=(await call({action:'catalog'})).agencies.find(a=>a.id==='balcones');const wantanOrder=await call({...base,key:crypto.randomUUID(),agency:'balcones',agencyRevision:readyBalcones.revision,mode:'pickup',items:[{id:'wantan-camaron',quantity:1,variant:'regular'}],total:6500});check(wantanOrder.total,6500);check(decodeURIComponent(wantanOrder.whatsapp).includes('Porción de 10 unidades'),true);const wantanItems=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(wantanOrder.code).items);check(wantanItems[0].includes,'Porción de 10 unidades');
const {comboBurgerOptions}=await import('../.sites-runtime/tests/catalog.mjs');const familyAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');const selectable=comboBurgerOptions(familyAgency);check(selectable.length,productsForTests().filter(p=>p.category==='Hamburguesas').length);check(selectable.some(p=>p.id==='queso'),true);for(const burger of selectable){assert.ok(readFileSync('public/menu/'+burger.image+'.webp').length>0);assertions++;}
function productsForTests(){return baseMenu;}
for(const [comboId,n,price] of [['combo6',6,33400],['combo3',3,16500],['combo4',4,22500],['martes',2,11000]]){
 const product=catalogFor(familyAgency).find(p=>p.id===comboId);check(product.choices,n);check(product.available,true);check(product.includes,`${n} porciones de papas fritas y ${n} bebidas`);
 const chosen=Array.from({length:n},(_,i)=>i===0?'queso':i%2?'master':'cheesy');const completeOrder=await call({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,variant:'regular',choices:chosen}],total:price});check(completeOrder.total,price);const snapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(completeOrder.code).items)[0];check(snapshot.choices.length,n);check(snapshot.choices[0],'Quesoburguesa');check(snapshot.includes,`${n} porciones de papas fritas y ${n} bebidas`);check(decodeURIComponent(completeOrder.whatsapp).includes(`${n} bebidas`),true);
 const repeated=await call({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,choices:Array(n).fill('master')}],total:price});check(repeated.total,price);
 for(const invalid of [[],chosen.slice(1),[...chosen,'cheesy'],Array(n).fill('papas'),Array(n).fill('nonexistent')])await denied({...base,key:crypto.randomUUID(),agencyRevision:familyAgency.revision,mode:'pickup',items:[{id:comboId,quantity:1,choices:invalid}],total:price});
}
await call({action:'configure',agency:'peronia',revision:familyAgency.revision,data:{...familyAgency,overrides:{...familyAgency.overrides,master:{available:false}}}},master);const stockAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');check(comboBurgerOptions(stockAgency).some(p=>p.id==='master'),false);await denied({...base,key:crypto.randomUUID(),agencyRevision:stockAgency.revision,mode:'pickup',items:[{id:'martes',quantity:1,choices:['master','cheesy']}],total:11000});
check((await call({action:'catalog'})).products.find(p=>p.id==='wantan').name,'Wantán de pollo');check((await call({action:'catalog'})).products.find(p=>p.id==='wantan').price,5500);
const tortillaAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia');for(const [id,price] of [['gigante-tortilla',4000],['tortiburguer',5000],['quesadilla',4500]]){const p=catalogFor(tortillaAgency).find(p=>p.id===id);check(p.price,price);check(p.includes,'Papas y gaseosa');check(menuEntries(catalogFor(tortillaAgency)).find(p=>p.id===id).displayCategory,'Combos');const order=await call({...base,key:crypto.randomUUID(),agencyRevision:tortillaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'regular'}],total:price});check(order.total,price);check(decodeURIComponent(order.whatsapp).includes('Papas y gaseosa'),true);await denied({...base,key:crypto.randomUUID(),agencyRevision:tortillaAgency.revision,mode:'pickup',items:[{id,quantity:1,variant:'single'}],total:price-1000});}
const cheeseAgency=(await call({action:'catalog'})).agencies.find(a=>a.id==='peronia'),cheeseProduct=catalogFor(cheeseAgency).find(p=>p.id==='queso');check(cheeseProduct.available,true);check(cheeseProduct.price,4000);check(cheeseProduct.includes,'Papas y Coca-Cola en lata de 237 ml');for(const [variant,total] of [['combo',4000],['single',3000]]){const placed=await call({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'queso',quantity:1,variant}],total});check(placed.total,total);const item=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(placed.code).items)[0];check(item.includes,variant==='combo'?'Papas y Coca-Cola en lata de 237 ml':'');if(variant==='combo')check(decodeURIComponent(placed.whatsapp).includes('237 ml'),true);}
const doubleSmash=await call({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'smash2',quantity:1,variant:'regular'}],total:12000});check(doubleSmash.total,12000);const smashSnapshot=JSON.parse(sqlite.prepare('SELECT items FROM orders WHERE code=?').get(doubleSmash.code).items)[0];check(smashSnapshot.includes,'2 Smash Burger');check(smashSnapshot.choices.length,0);await denied({...base,key:crypto.randomUUID(),agencyRevision:cheeseAgency.revision,mode:'pickup',items:[{id:'smash2',quantity:1,variant:'single'}],total:11000});
console.log(`PASS: ${assertions} checks; isolated SQLite service tests, no production data, WhatsApp or payment requests.`);
