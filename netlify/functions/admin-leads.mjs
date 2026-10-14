import {ApiError,STATUSES,UUID,body,failure,json,query,session,validateChange} from '../../server/core.mjs';
export default async function handler(req){
  try{
    await session(req,req.method!=='GET');
    const url=new URL(req.url),id=url.pathname.split('/')[4];
    if(id){
      if(!UUID.test(id))throw new ApiError(400,'invalid_details');
      if(req.method!=='PATCH')throw new ApiError(405,'method_not_allowed');
      const change=validateChange(await body(req));
      const [lead]=await query('UPDATE render_leads SET status=$1,notes=$2,version=version+1,updated_at=now() WHERE id=$3 AND version=$4 RETURNING *',[change.status,change.notes,id,change.version]);
      if(!lead){const [existing]=await query('SELECT id FROM render_leads WHERE id=$1',[id]);throw new ApiError(existing?409:404,existing?'conflict':'not_found');}
      return json({lead});
    }
    if(req.method!=='GET')throw new ApiError(405,'method_not_allowed');
    const status=url.searchParams.get('status')||'all',search=(url.searchParams.get('q')||'').trim();
    const page=Number(url.searchParams.get('page')||1),limit=25;
    if((status!=='all'&&!STATUSES.includes(status))||search.length>100||!Number.isInteger(page)||page<1||page>100000)throw new ApiError(400,'invalid_details');
    const needle='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
    const condition="($1='all' OR status=$1) AND (name ILIKE $2 OR company ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2 OR brief ILIKE $2)";
    const [leads,totals,counts]=await Promise.all([
      query('SELECT * FROM render_leads WHERE '+condition+' ORDER BY created_at DESC,id DESC LIMIT $3 OFFSET $4',[status,needle,limit,(page-1)*limit]),
      query('SELECT count(*)::int AS total FROM render_leads WHERE '+condition,[status,needle]),
      query('SELECT status,count(*)::int AS count FROM render_leads GROUP BY status')
    ]);
    const summary={all:0,unlisted:0,hot:0,cold:0};for(const row of counts){summary[row.status]=row.count;summary.all+=row.count;}
    return json({leads,total:totals[0].total,page,limit,counts:summary});
  }catch(error){return failure(error);}
}
export const config={path:['/api/admin/leads','/api/admin/leads/:id']};
