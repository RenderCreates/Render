import {randomUUID} from 'node:crypto';
import {ApiError,body,cors,failure,json,publicOrigin,query,rate,validateLead} from '../../server/core.mjs';
export default async function handler(req,context){
  let origin;
  try{
    origin=publicOrigin(req);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors(origin),'Cache-Control':'no-store'}});
    if(req.method!=='POST')throw new ApiError(405,'method_not_allowed');
    const input=await body(req);
    if(typeof input.website==='string'&&input.website.trim())return json({ok:true},202,cors(origin));
    const lead=validateLead(input);
    await rate(context,'callback',5,600);
    await query('INSERT INTO render_leads(id,request_key,name,company,phone,email,contact_method,services,brief,language) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) ON CONFLICT(request_key) DO NOTHING',[randomUUID(),lead.requestKey,lead.name,lead.company,lead.phone,lead.email,lead.contactMethod,JSON.stringify(lead.services),lead.brief,lead.language]);
    return json({ok:true},201,cors(origin));
  }catch(error){return failure(error,cors(origin));}
}
export const config={path:'/api/callback'};
