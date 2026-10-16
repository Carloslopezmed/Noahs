import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Noah’s · Pedí tu próxima favorita',description:'Hamburguesas Angus y combos para compartir. Elegí tu agencia Noah’s y hacé tu pedido en línea.',icons:{icon:'/brand/noahs-icon.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
