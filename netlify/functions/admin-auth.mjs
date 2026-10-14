import {ApiError,body,cookie,createSession,failure,hash,json,query,rate,sameOrigin,session,verifyPassword} from '../../server/core.mjs';
export default async function handler(req,context){
  try{
    const route=new URL(req.url).pathname;
    if(route==='/api/admin/session'&&req.method==='GET'){
      const {csrf,expiresAt}=await session(req);return json({authenticated:true,csrf,expiresAt});
    }
    if(route==='/api/admin/login'&&req.method==='POST'){
      sameOrigin(req);await rate(context,'login',8,900);
      const input=await body(req);
      if(typeof input.password!=='string'||input.password.length<1||input.password.length>128)throw new ApiError(401,'invalid_password');
      if(!await verifyPassword(input.password))throw new ApiError(401,'invalid_password');
      const {token,csrf,expiresAt}=await createSession();
      return json({authenticated:true,csrf,expiresAt},200,{'Set-Cookie':cookie(token)});
    }
    if(route==='/api/admin/logout'&&req.method==='POST'){
      const {token}=await session(req,true);
      await query('DELETE FROM render_admin_sessions WHERE token_hash=$1',[hash('session:'+token)]);
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    throw new ApiError(405,'method_not_allowed');
  }catch(error){return failure(error);}
}
export const config={path:['/api/admin/login','/api/admin/session','/api/admin/logout']};
