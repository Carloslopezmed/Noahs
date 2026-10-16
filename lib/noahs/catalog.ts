export type Product={id:string;name:string;price:number|null;description:string;image:string;category:string;includes?:string;choices?:number;pending?:string;comboImage?:string;upsell?:boolean};
export const products:Product[]=[
{id:'cheesecake',name:'Cheesecake',price:2000,description:'Una pausa dulce para cerrar tu pedido con el antojo de un cheesecake.',image:'cheesecake',category:'Postres'},
{id:'chili',name:'Chili Garlic',price:2500,description:'Un extra de ajo y picante para darle más sabor a tu pedido.',image:'chili',category:'Acompañamientos',upsell:true},
{id:'smash2',name:'Combo 2 Smash Burger',price:null,description:'Dos Smash Burger para compartir el antojo.',image:'smash2',category:'Para compartir',pending:'Precio por confirmar'},
{id:'papas-bbq',name:'Papas Barbiquiu',price:3500,description:'Papas bañadas con barbacoa y ranch, con tocino y un toque de cilantro. Una combinación intensa para compartir… o no.',image:'papas-bbq',category:'Acompañamientos'},
{id:'cheesy-papas',name:'Cheesy Papas',price:3500,description:'Papas fritas con queso y tocino. El antojo perfecto para quienes siempre quieren un poco más de queso.',image:'cheesy-papas',category:'Acompañamientos'},
{id:'papas',name:'Papas Fritas',price:1000,description:'Seis onzas de papas a la francesa, fritas y listas para acompañar tu favorita.',image:'papas',category:'Acompañamientos'},
{id:'tradicional',name:'Hot Dog Tradicional',price:3000,description:'El antojo de siempre, listo para disfrutar. Un clásico que combina con el crujido de tus papalinas favoritas.',image:'tradicional',category:'Hot dogs',includes:'Papalinas Lay’s y gaseosa'},
{id:'chicago',name:'Hot Dog Chicago',price:3000,description:'Un clásico para disfrutar tu antojo de principio a fin. Acompañalo con el crujido de tus papalinas favoritas.',image:'chicago',category:'Hot dogs',includes:'Papalinas Lay’s y gaseosa'},
{id:'doridog',name:'Hot Dog Doridog',price:3000,description:'Dale un giro a tu antojo con el Doridog. Una opción para disfrutar cada mordida y volver por más.',image:'doridog',category:'Hot dogs',includes:'Papalinas Lay’s y gaseosa'},
{id:'americano',name:'Hot Dog Americano',price:3500,description:'Todo el antojo de un Americano, listo para disfrutar con tus acompañamientos.',image:'americano',category:'Hot dogs',includes:'Papalinas y gaseosa'},
{id:'doggy',name:'Doggy Dog',price:null,description:'Una opción más para tus antojos. Estamos completando la información.',image:'doggy',category:'Hot dogs',pending:'Precio y combo por confirmar'},
{id:'cheesy',name:'Cheesy Burger',price:5900,description:'Jugosa carne 100% Angus, doble cheddar, mozzarella fundida y cebolla sofrita. Cremosa en cada mordida.',image:'cheesy',comboImage:'cheesy-combo',category:'Hamburguesas',includes:'Lay’s y Coca-Cola en lata'},
{id:'clasica',name:'Clásica ¼ de libra',price:5900,description:'Un cuarto de libra de jugosa carne 100% Angus. El sabor de una clásica que siempre se antoja.',image:'clasica',comboImage:'clasica-combo',category:'Hamburguesas',includes:'Lay’s y bebida'},
{id:'tori',name:'Toriburger',price:5900,description:'Carne 100% Angus, queso, huevo estrellado y vegetales frescos, con el toque de nuestros aderezos.',image:'tori',comboImage:'tori-combo',category:'Hamburguesas',includes:'Lay’s y gaseosa'},
{id:'master',name:'La Master',price:6000,description:'Un cuarto de libra Angus, queso fundido y cebolla caramelizada. Jugosa, con un delicioso toque dulce.',image:'master',comboImage:'master-combo',category:'Hamburguesas'},
{id:'crunchy',name:'Crunchy Burger',price:5900,description:'Carne Angus, doble queso, ricito crunchy, tocino, pepinillos y lechuga. Una mordida llena de textura.',image:'crunchy',comboImage:'crunchy-combo',category:'Hamburguesas',includes:'Papas y Coca-Cola en lata'},
{id:'costena',name:'La Costeña',price:5900,description:'Jugosa carne Angus con camarones y aderezo especial. Una combinación de tierra y mar para saborear.',image:'costena',comboImage:'costena-combo',category:'Hamburguesas'},
{id:'tocino',name:'Tocino Barbacoa',price:5900,description:'Un cuarto de libra Angus con tocino y salsa barbacoa. Jugosa, intensa y llena de sabor.',image:'tocino',comboImage:'tocino-combo',category:'Hamburguesas'},
{id:'tejana',name:'Tejana',price:6400,description:'Una hamburguesa para los antojos grandes. Descubrí tu próxima favorita.',image:'tejana',comboImage:'tejana-combo',category:'Hamburguesas'},
{id:'bufalo',name:'Búfalo Steak',price:5900,description:'Un toque picante para despertar el antojo. Sabor que se disfruta de principio a fin.',image:'bufalo',comboImage:'bufalo-combo',category:'Hamburguesas'},
{id:'smash',name:'Smash Burger',price:6000,description:'Una favorita para disfrutar cada mordida. Elegí tu agencia y pedí la tuya.',image:'smash',comboImage:'smash-combo',category:'Hamburguesas'},
{id:'queso',name:'Quesoburguesa',price:null,description:'Estamos completando los detalles de esta hamburguesa.',image:'queso',comboImage:'queso-combo',category:'Hamburguesas',pending:'Precio por confirmar'},
{id:'combo6',name:'Combo para 6',price:33400,description:'Seis hamburguesas a tu elección, seis papas fritas y Coca-Cola de 1.5 litros. El antojo se comparte.',image:'combo6',category:'Para compartir',choices:6},
{id:'combo3',name:'Como pa’ 3',price:16500,description:'Tres hamburguesas a tu elección para disfrutar en compañía.',image:'combo3',category:'Para compartir',pending:'Complementos por confirmar'},
{id:'combo4',name:'Combo Clásico pa’ 4',price:22500,description:'Una opción para compartir entre cuatro.',image:'combo4',category:'Para compartir',pending:'Contenido por confirmar'},
{id:'martes',name:'Combo Martes',price:11000,description:'Un combo para compartir el antojo.',image:'martes',category:'Para compartir',pending:'Condiciones por confirmar'},
];
export type Agency={id:string;name:string;short:string;phone:string;whatsapp:string;address:string;open:string;close:string;accepting:boolean;chinese:boolean;zones:{name:string;fee:number}[];overrides:Record<string,{available?:boolean;price?:number}>};
export const agencyDefaults:Agency[]=[
{id:'balcones',name:'San Cristóbal · Plaza Balcones',short:'Plaza Balcones',phone:'5464 0659',whatsapp:'',address:'5.ª avenida 4-39, Mixco',open:'09:00',close:'20:00',accepting:true,chinese:true,zones:[],overrides:{}},
{id:'peronia',name:'Ciudad Peronia',short:'Ciudad Peronia',phone:'5910 2450',whatsapp:'50259102450',address:'Dirección por confirmar',open:'09:00',close:'20:00',accepting:true,chinese:false,zones:[],overrides:{}},
{id:'satelite',name:'Ciudad Satélite',short:'Ciudad Satélite',phone:'5614 2755',whatsapp:'',address:'Dirección por confirmar',open:'09:00',close:'20:00',accepting:true,chinese:false,zones:[],overrides:{}},
];
export const money=(n:number)=>'Q'+(n/100).toLocaleString('es-GT',{minimumFractionDigits:n%100?2:0,maximumFractionDigits:2});
export const states:Record<string,string>={received:'Recibido',confirmed:'Confirmado por caja',preparing:'En preparación',ready:'Listo',assigned:'Asignado',onway:'En ruta',delivered:'Entregado',cancelled:'Cancelado'};
export function catalogFor(a:Agency){return products.map(p=>({...p,price:a.overrides[p.id]?.price??p.price,available:p.price!==null&&!p.pending&&a.overrides[p.id]?.available!==false}));}
export function inHours(a:Agency,now=new Date()){const t=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Guatemala',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);return t>=a.open&&t<a.close;}
export const roleNames:Record<string,string>={master:'Maestro general',manager:'Encargado',cashier:'Cajero',kitchen:'Cocina',driver:'Motorista'};

// The base hamburger price is its combo price. Single burgers cost Q10 less.
export function itemPrice(p:Pick<Product,'price'|'category'>|undefined,variant?:string){if(!p||p.price===null)return 0;return p.price-(p.category==='Hamburguesas'&&variant==='single'?1000:0);}

export function imageFor(p:Product|undefined,variant?:string){return p?(variant==='combo'&&p.comboImage?p.comboImage:p.image):'';}
export type MenuEntry=Product&{available?:boolean;displayVariant:string;displayCategory:string;displayName:string;displayImage:string;displayPrice:number|null;listingKey:string};
export function menuEntries(items:(Product&{available?:boolean})[]):MenuEntry[]{
 const result:MenuEntry[]=[];
 for(const p of items){if(p.upsell)continue;for(const variant of p.category==='Hamburguesas'?['single','combo']:['regular']){
 const displayCategory=p.category==='Hamburguesas'?(variant==='single'?'Hamburguesas':'Combos'):p.category==='Para compartir'?'Combos':p.category;
 result.push({...p,displayVariant:variant,displayCategory,displayName:p.category==='Hamburguesas'&&variant==='combo'?'Combo '+p.name:p.name,displayImage:imageFor(p,variant),displayPrice:p.price===null?null:itemPrice(p,variant),listingKey:p.id+':'+variant});
 }}return result;
}
