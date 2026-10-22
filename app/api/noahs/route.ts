import { env } from 'cloudflare:workers';
import { createService } from '../../../lib/noahs/service';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 try{
  const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Origen no permitido.'},{status:403});
  if(Number(req.headers.get('content-length')||0)>40000)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
  const text=await req.text();if(text.length>40000)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
  const body=JSON.parse(text);if(!body||typeof body!=='object')throw new Error('Datos inválidos');
  const runtimeEnv=env as typeof env & { NOAHS_BOOTSTRAP_SECRET?: string };
  const result=await createService(runtimeEnv.DB as any,runtimeEnv.NOAHS_BOOTSTRAP_SECRET).dispatch(req,body,(await getChatGPTUser())?.userId||null);
  const {cookie,...data}=result as any;const headers:Record<string,string>={'Cache-Control':'no-store'};if(cookie)headers['Set-Cookie']=cookie;
  return Response.json(data,{headers});
 }catch(e:any){const known=e.status;console.error('noahs-api',known?e.message:'database-or-request-error');return Response.json({error:known?e.message:/UNIQUE constraint/.test(e.message)?'Ese registro ya existe. Actualizá e intentá de nuevo.':/cash_balance/.test(e.message)?'El efectivo pendiente cambió. Actualizá.':'No pudimos completar la operación. Revisá los datos e intentá de nuevo.'},{status:known||409,headers:{'Cache-Control':'no-store'}});}
}
