import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import {NetlifyDB} from '@netlify/database-dev';
import callback from '../netlify/functions/callback.mjs';
import auth from '../netlify/functions/admin-auth.mjs';
import leads from '../netlify/functions/admin-leads.mjs';
import {COOKIE,db,query,validateLead} from '../server/core.mjs';
let local,adminCookie,csrf,leadId,version;
const base='https://render.test',password='Local-testing-password-ONLY';
function request(path,method='GET',data,options={}){
  return new Request(base+path,{method,headers:{Origin:base,...(data?{'Content-Type':'application/json'}:{}),...(options.auth?{Cookie:adminCookie,'X-CSRF-Token':csrf}:{}),...options.headers},...(data?{body:JSON.stringify(data)}:{})});
}
const input=()=>({requestKey:randomUUID(),name:'Render QA',company:'Example brand',phone:'+995 555 010 020',email:'qa@example.invalid',contactMethod:'phone',services:['Motion design','Website design & development'],brief:'A launch campaign for our new website and product.',language:'ka',consent:true,website:''});
before(async()=>{
  const salt=randomBytes(16);process.env.RENDER_ADMIN_PASSWORD_HASH=['scrypt',salt.toString('base64'),scryptSync(password,salt,64,{N:32768,r:8,p:1,maxmem:67108864}).toString('base64')].join('$');process.env.RENDER_SESSION_SECRET=randomBytes(48).toString('base64');
  local=new NetlifyDB();process.env.NETLIFY_DB_URL=await local.start();await local.applyMigrations('netlify/database/migrations');
});
after(async()=>{if(local){await db().pool.end();await local.stop();}});
test('validation requires reachable contact and rejects overlong or forged fields',()=>{
  assert.throws(()=>validateLead({...input(),phone:''}));assert.throws(()=>validateLead({...input(),email:'bad'}));assert.throws(()=>validateLead({...input(),consent:false}));assert.throws(()=>validateLead({...input(),services:['Injected']}));assert.throws(()=>validateLead({...input(),brief:'x'.repeat(3001)}));assert.throws(()=>validateLead({...input(),requestKey:'bad'}));assert.equal(validateLead({...input(),contactMethod:'email',phone:''}).email,'qa@example.invalid');
});
test('public endpoint rejects unauthorized origins and invalid payloads',async()=>{
  let r=await callback(request('/api/callback','POST',input(),{headers:{Origin:'https://attacker.test'}}),{ip:'a'});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
  r=await callback(request('/api/callback','POST',{...input(),phone:''}),{ip:'a'});assert.equal(r.status,400);
  r=await callback(request('/api/callback','POST',input(),{headers:{Origin:''}}),{ip:'a'});assert.equal(r.status,403);
});
test('GitHub Pages preflight is allowed, honeypot cannot create leads',async()=>{
  let r=await callback(request('/api/callback','OPTIONS',undefined,{headers:{Origin:'https://vornato.github.io'}}),{ip:'a'});assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://vornato.github.io');
  r=await callback(request('/api/callback','POST',{...input(),website:'bot'}),{ip:'a'});assert.equal(r.status,202);assert.equal((await query('SELECT count(*)::int AS total FROM render_leads'))[0].total,0);
});
test('submissions persist as unlisted and retries do not duplicate leads',async()=>{
  const data=input();for(let n=0;n<2;n++){const r=await callback(request('/api/callback','POST',data),{ip:'good'});assert.equal(r.status,201);assert.deepEqual(await r.json(),{ok:true});}
  const rows=await query('SELECT * FROM render_leads');assert.equal(rows.length,1);assert.equal(rows[0].status,'unlisted');assert.equal(rows[0].language,'ka');assert.equal(rows[0].name,'Render QA');assert.deepEqual(rows[0].services,data.services);leadId=rows[0].id;version=rows[0].version;
});
test('anonymous callers cannot read or change any CRM data',async()=>{
  assert.equal((await leads(request('/api/admin/leads'))).status,401);assert.equal((await leads(request('/api/admin/leads/'+leadId,'PATCH',{status:'hot',notes:'hacked',version}))).status,401);
});
test('password checked on server and session cookie is private',async()=>{
  assert.equal((await auth(request('/api/admin/login','POST',{password:'wrong'}),{ip:'admin'})).status,401);
  const response=await auth(request('/api/admin/login','POST',{password}),{ip:'admin'});assert.equal(response.status,200);const setCookie=response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);assert.ok(setCookie.startsWith(COOKIE+'='));adminCookie=setCookie.split(';')[0];csrf=(await response.json()).csrf;
  const result=await auth(request('/api/admin/session','GET',undefined,{auth:true}),{});assert.equal(result.status,200);assert.equal((await result.json()).csrf,csrf);
});
test('CRM search/filter/pagination and count summaries use stored data',async()=>{
  const r=await leads(request('/api/admin/leads?q=Render&status=unlisted','GET',undefined,{auth:true}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.total,1);assert.equal(data.leads[0].id,leadId);assert.equal(data.counts.unlisted,1);assert.equal(data.page,1);assert.equal(data.limit,25);
  const escaped=await leads(request('/api/admin/leads?q=%25','GET',undefined,{auth:true}));assert.equal((await escaped.json()).total,0);
});
test('CRM mutations need CSRF and same Origin; updates preserve concurrency',async()=>{
  const path='/api/admin/leads/'+leadId;
  assert.equal((await leads(request(path,'PATCH',{status:'hot',notes:'note',version},{auth:true,headers:{'X-CSRF-Token':''}}))).status,403);
  assert.equal((await leads(request(path,'PATCH',{status:'hot',notes:'note',version},{auth:true,headers:{Origin:'https://attacker.test'}}))).status,403);
  let r=await leads(request(path,'PATCH',{status:'hot',notes:'Call this lead tomorrow.',version},{auth:true}));assert.equal(r.status,200);let data=await r.json();assert.equal(data.lead.status,'hot');assert.equal(data.lead.notes,'Call this lead tomorrow.');assert.equal(data.lead.version,version+1);
  assert.equal((await leads(request(path,'PATCH',{status:'cold',notes:'stale',version},{auth:true}))).status,409);version=data.lead.version;
  r=await leads(request(path,'PATCH',{status:'cold',notes:'Follow up later.',version},{auth:true}));assert.equal(r.status,200);data=await r.json();assert.equal(data.lead.status,'cold');version=data.lead.version;
});
test('rate limiter blocks repeated submissions atomically',async()=>{
  for(let n=0;n<5;n++)assert.equal((await callback(request('/api/callback','POST',input()),{ip:'spam-source'})).status,201);
  assert.equal((await callback(request('/api/callback','POST',input()),{ip:'spam-source'})).status,429);
});
test('logout revokes a session; expired sessions cannot access leads',async()=>{
  assert.equal((await auth(request('/api/admin/logout','POST',{}, {auth:true}),{})).status,200);assert.equal((await leads(request('/api/admin/leads','GET',undefined,{auth:true}))).status,401);
  const r=await auth(request('/api/admin/login','POST',{password}),{ip:'new-admin'});adminCookie=r.headers.get('set-cookie').split(';')[0];csrf=(await r.json()).csrf;await query("UPDATE render_admin_sessions SET expires_at=now()-interval '1 minute'");assert.equal((await leads(request('/api/admin/leads','GET',undefined,{auth:true}))).status,401);
});
