import {createHmac, randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {getDatabase} from '@netlify/database';
export const SERVICES = ['Website design & development','Brand identity & design','Video creation','Motion design','Social media & posting','Brand & creative strategy','Paid campaigns','Analytics & reporting'];
export const STATUSES = ['unlisted','hot','cold'];
export const COOKIE = '__Host-render_admin';
export const SESSION_SECONDS = 8 * 60 * 60;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class ApiError extends Error { constructor(status, code){super(code);this.status=status;this.code=code;} }
export const env = name => globalThis.Netlify?.env?.get(name) ?? process.env[name];
let database;
export function db(){return database ||= getDatabase();}
export const query = (sql,values=[]) => db().sql.unsafe(sql,values);
export function json(value,status=200,extra={}) {
  return Response.json(value,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Vary':'Origin',...extra}});
}
export function failure(error,extra={}){
  // Log diagnostic identifiers only: never request details, passwords, or query values.
  if(!(error instanceof ApiError))console.error('Render backend unavailable',{name:error?.name||'Error',code:error?.code||'unknown'});
  return json({error:error instanceof ApiError?error.code:'unavailable'},error instanceof ApiError?error.status:503,extra);
}
export async function body(req){
  if(!req.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415,'invalid_format');
  const reader=req.body?.getReader(); if(!reader)throw new ApiError(400,'invalid_request');
  let size=0;const chunks=[];
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new ApiError(413,'too_large');}chunks.push(value);}}
  finally{reader.releaseLock();}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ApiError(400,'invalid_request');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'invalid_request');
  return value;
}
export function sameOrigin(req){
  if(req.headers.get('origin')!==new URL(req.url).origin)throw new ApiError(403,'forbidden');
}
export function publicOrigin(req){
  const origin=req.headers.get('origin');
  // Cross-origin requests are needed only for the existing GitHub Pages website.
  if(!origin || ![new URL(req.url).origin,'https://vornato.github.io'].includes(origin))throw new ApiError(403,'forbidden');
  return origin;
}
export const cors = origin => origin?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}:{};
function secret(){const value=env('RENDER_SESSION_SECRET');if(!value||value.length<32)throw new ApiError(503,'unavailable');return value;}
export function hash(value){return createHmac('sha256',secret()).update(value).digest('hex');}
export async function rate(context,kind,limit,seconds){
  const now=Date.now(),window=Math.floor(now/(seconds*1000));
  const bucket=hash(`${kind}:${context.ip||'unknown'}:${window}`);
  const [row]=await query('INSERT INTO render_rate_limits(bucket,expires_at) VALUES ($1,$2) ON CONFLICT(bucket) DO UPDATE SET attempts=render_rate_limits.attempts+1 RETURNING attempts',[bucket,new Date((window+1)*seconds*1000)]);
  if(row.attempts>limit)throw new ApiError(429,'rate_limited');
  await query('DELETE FROM render_rate_limits WHERE expires_at < now()');
}
function text(value,max,required=false){
  if(value===undefined||value===null)value='';
  if(typeof value!=='string')throw new ApiError(400,'invalid_details');
  value=value.trim();if(value.length>max || (required&&!value) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))throw new ApiError(400,'invalid_details');return value;
}
export function validateLead(input){
  const name=text(input.name,100,true),company=text(input.company,120),phone=text(input.phone,40),email=text(input.email,254).toLowerCase(),brief=text(input.brief,3000,true);
  if(brief.length<10||!UUID.test(input.requestKey||''))throw new ApiError(400,'invalid_details');
  const contactMethod=input.contactMethod;
  if(!['phone','email','whatsapp'].includes(contactMethod))throw new ApiError(400,'invalid_contact');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'invalid_email');
  if(phone&&(!/^[+()\d\s.\-]+$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>18))throw new ApiError(400,'invalid_phone');
  if(contactMethod==='email'&&!email)throw new ApiError(400,'email_required');
  if(contactMethod!=='email'&&!phone)throw new ApiError(400,'phone_required');
  if(input.consent!==true)throw new ApiError(400,'consent_required');
  if(!Array.isArray(input.services)||input.services.length>8||input.services.some(s=>!SERVICES.includes(s)))throw new ApiError(400,'invalid_services');
  return {name,company,phone,email,brief,contactMethod,services:[...new Set(input.services)],language:input.language==='ka'?'ka':'en',requestKey:input.requestKey};
}
const derive=promisify(scrypt);
export async function verifyPassword(password){
  const [type,salt,key]=String(env('RENDER_ADMIN_PASSWORD_HASH')||'').split('$');
  if(type!=='scrypt'||!salt||!key)throw new ApiError(503,'unavailable');
  const expected=Buffer.from(key,'base64');if(expected.length!==64)throw new ApiError(503,'unavailable');
  const actual=await derive(password,Buffer.from(salt,'base64'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return timingSafeEqual(actual,expected);
}
export function cookie(token,maxAge=SESSION_SECONDS){return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
function sessionToken(req){
  const token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
  if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(401,'unauthorized');return token;
}
export async function session(req,mutation=false){
  const token=sessionToken(req);const csrf=hash('csrf:'+token);
  const [row]=await query('SELECT expires_at FROM render_admin_sessions WHERE token_hash=$1 AND expires_at>now()',[hash('session:'+token)]);
  if(!row)throw new ApiError(401,'unauthorized');
  if(mutation){sameOrigin(req);const given=req.headers.get('x-csrf-token')||'';if(!/^[a-f0-9]{64}$/.test(given)||!timingSafeEqual(Buffer.from(given),Buffer.from(csrf)))throw new ApiError(403,'forbidden');}
  return {token,csrf,expiresAt:row.expires_at};
}
export async function createSession(){
  const token=randomBytes(32).toString('hex'),expiresAt=new Date(Date.now()+SESSION_SECONDS*1000);
  await query('DELETE FROM render_admin_sessions WHERE expires_at<now()');
  await query('INSERT INTO render_admin_sessions(token_hash,expires_at) VALUES($1,$2)',[hash('session:'+token),expiresAt]);
  return {token,csrf:hash('csrf:'+token),expiresAt};
}
export function validateChange(input){
  if(!STATUSES.includes(input.status)||!Number.isInteger(input.version)||input.version<1)throw new ApiError(400,'invalid_details');
  return {status:input.status,notes:text(input.notes,5000),version:input.version};
}
