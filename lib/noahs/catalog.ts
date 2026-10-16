export type Product={id:string;name:string;price:number|null;description:string;image:string;category:string;includes?:string;choices?:number;pending?:string;comboImage?:string;upsell?:boolean;agencyIds?:string[]};
export const products:Product[]=[
{id:'lata-pepsi',name:'Pepsi en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-seven-up',name:'Seven Up en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-mirinda',name:'Mirinda en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-grapete',name:'Grapete en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-coca-cola',name:'Coca-Cola en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-tiki',name:'Tiki en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'lata-orange',name:'Orange en lata',price:1000,description:'Tu gaseosa para acompañar el pedido. Fotografía ilustrativa de la presentación en lata.',image:'gaseosas-lata',category:'Bebidas'},
{id:'chao-mein-camaron',name:'Chao Mein de camarón',price:8500,description:'Fideos con camarón para disfrutar tu antojo de comida china. Fotografía ilustrativa.',image:'chao-mein',category:'Comida china',agencyIds:['balcones']},
{id:'chao-mein-pollo',name:'Chao Mein de pollo',price:8000,description:'Fideos con pollo para disfrutar tu antojo de comida china.',image:'chao-mein',category:'Comida china',agencyIds:['balcones']},
{id:'chao-mein-lomito',name:'Chao Mein de lomito',price:8000,description:'Fideos con lomito para disfrutar tu antojo de comida china. Fotografía ilustrativa.',image:'chao-mein',category:'Comida china',agencyIds:['balcones']},
{id:'chao-mein-mixto',name:'Chao Mein mixto',price:8500,description:'Todo el antojo del Chao Mein en su versión mixta. Fotografía ilustrativa.',image:'chao-mein',category:'Comida china',agencyIds:['balcones']},
{id:'salchipapas',name:'Salchipapas',price:3500,description:'Papas fritas doraditas con salchicha y aderezos. Un antojo para compartir… o disfrutar vos solo.',image:'salchipapas',category:'Complementos'},
{id:'combo-express-chino',name:'Combo Express',price:9500,description:'Arroz frito, wantán y una Pepsi para acompañar. Tu antojo de comida china en un solo combo.',image:'combo-express-chino',category:'Comida china',includes:'Arroz frito + wantán + Pepsi de 1.5 litros',agencyIds:['balcones']},
{id:'combo-favorito-chino',name:'Combo Favorito',price:16500,description:'Compartí el antojo con arroz frito, chao mein, wantán y Pepsi. Todo en un solo combo.',image:'combo-favorito-chino',category:'Comida china',includes:'1 arroz frito de 2 lb + 1 chao mein de 2 lb + 10 unidades de wantán + Pepsi de 1.5 litros',agencyIds:['balcones']},
{id:'gigante-tortilla',name:'Gigante Tortilla',price:4000,description:'Tu antojo envuelto en tortilla de harina, con papas y gaseosa para completar el combo.',image:'gigante-tortilla',category:'Combos',includes:'Papas y gaseosa'},
{id:'tortiburguer',name:'Tortiburguer',price:5000,description:'Otra forma de disfrutar tu antojo: un combo en tortilla de harina, acompañado de papas y gaseosa.',image:'tortiburguer',category:'Combos',includes:'Papas y gaseosa'},
{id:'quesadilla',name:'Quesadilla',price:4500,description:'Una quesadilla para consentir tu antojo. Disfrutala en combo con papas y gaseosa.',image:'quesadilla',category:'Combos',includes:'Papas y gaseosa'},
{id:'wantan',name:'Wantán de pollo',price:5500,description:'Diez unidades de wantán de pollo para acompañar tu pedido y compartir el antojo.',image:'wantan-pollo',category:'Complementos',includes:'Porción de 10 unidades',agencyIds:['balcones']},
{id:'wantan-camaron',name:'Wantán de camarón',price:6500,description:'Diez unidades de wantán de camarón. Un complemento para disfrutar cada bocado.',image:'wantan-camaron',category:'Complementos',includes:'Porción de 10 unidades',agencyIds:['balcones']},
{id:'wantan-cangrejo',name:'Wantán de cangrejo',price:5500,description:'Diez unidades de wantán de cangrejo para completar tu pedido. Fotografía ilustrativa de wantán.',image:'wantan',category:'Complementos',includes:'Porción de 10 unidades',agencyIds:['balcones']},
{id:'cheesecake',name:'Cheesecake',price:2000,description:'Una pausa dulce para cerrar tu pedido con el antojo de un cheesecake.',image:'cheesecake',category:'Postres'},
{id:'chili',name:'Chili Garlic',price:2500,description:'Un extra de ajo y picante para darle más sabor a tu pedido.',image:'chili',category:'Acompañamientos',upsell:true},
{id:'smash2',name:'Combo 2 Smash Burger',price:12000,description:'Dos Smash Burger para compartir el antojo.',image:'smash2',category:'Para compartir',includes:'2 Smash Burger'},
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
{id:'queso',name:'Quesoburguesa',price:4000,description:'Una torta de ¼ de libra en pan gourmet, con aderezos y pepinillos. Una clásica para disfrutar en cada mordida.',image:'queso',comboImage:'queso-combo',category:'Hamburguesas',includes:'Papas y Coca-Cola en lata de 237 ml'},
{id:'combo6',name:'Combo para 6',price:33400,description:'Seis hamburguesas a tu elección, con una porción de papas y una bebida por hamburguesa. El antojo se comparte.',image:'combo6',category:'Para compartir',choices:6,includes:'6 porciones de papas fritas y 6 bebidas'},
{id:'combo3',name:'Como pa’ 3',price:16500,description:'Elegí tres hamburguesas del menú. Cada una lleva su porción de papas y su bebida.',image:'combo3',category:'Para compartir',choices:3,includes:'3 porciones de papas fritas y 3 bebidas'},
{id:'combo4',name:'Combo Clásico pa’ 4',price:22500,description:'Cuatro hamburguesas a tu elección para compartir, cada una con papas y bebida.',image:'combo4',category:'Para compartir',choices:4,includes:'4 porciones de papas fritas y 4 bebidas'},
{id:'martes',name:'Combo Martes',price:11000,description:'Elegí dos hamburguesas del menú. Cada una viene con su porción de papas y su bebida.',image:'martes',category:'Para compartir',choices:2,includes:'2 porciones de papas fritas y 2 bebidas'},
];
export type Agency={id:string;name:string;short:string;phone:string;whatsapp:string;address:string;open:string;close:string;accepting:boolean;chinese:boolean;zones:{name:string;fee:number}[];overrides:Record<string,{available?:boolean;price?:number}>};
export const agencyDefaults:Agency[]=[
{id:'balcones',name:'San Cristóbal · Plaza Balcones',short:'Plaza Balcones',phone:'5464 0659',whatsapp:'',address:'5.ª avenida 4-39, Mixco',open:'09:00',close:'20:00',accepting:true,chinese:true,zones:[],overrides:{}},
{id:'peronia',name:'Ciudad Peronia',short:'Ciudad Peronia',phone:'5910 2450',whatsapp:'50259102450',address:'Dirección por confirmar',open:'09:00',close:'20:00',accepting:true,chinese:false,zones:[],overrides:{}},
{id:'satelite',name:'Ciudad Satélite',short:'Ciudad Satélite',phone:'5614 2755',whatsapp:'',address:'Dirección por confirmar',open:'09:00',close:'20:00',accepting:true,chinese:false,zones:[],overrides:{}},
];
export const money=(n:number)=>'Q'+(n/100).toLocaleString('es-GT',{minimumFractionDigits:n%100?2:0,maximumFractionDigits:2});
export const states:Record<string,string>={received:'Recibido',confirmed:'Confirmado por caja',preparing:'En preparación',ready:'Listo',assigned:'Asignado',onway:'En ruta',delivered:'Entregado',cancelled:'Cancelado'};
export function catalogFor(a:Agency){return products.map(p=>({...p,price:a.overrides[p.id]?.price??p.price,available:p.price!==null&&!p.pending&&a.overrides[p.id]?.available!==false&&(!p.agencyIds||p.agencyIds.includes(a.id))}));}
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

// Family combos have a fixed total: standalone prices do not restrict the burger choice.
export function comboBurgerOptions(a:Agency){return products.filter(p=>p.category==='Hamburguesas'&&a.overrides[p.id]?.available!==false&&(!p.agencyIds||p.agencyIds.includes(a.id)));}
