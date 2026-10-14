'use strict';
(() => {
  // GitHub Pages cannot run the private CRM backend.
  if(location.hostname==='vornato.github.io'){location.replace('https://rendercreates.com/admin/');return;}
  const ge={
    'Private workspace':'პირადი სამუშაო სივრცე','Every opportunity, in focus.':'ყველა შესაძლებლობა ყურადღების ცენტრში.','Sign in to review project requests and plan your next conversation.':'შედით პროექტის მოთხოვნების სანახავად და მომხმარებლებთან კომუნიკაციის დასაგეგმად.','Admin password':'ადმინისტრატორის პაროლი','Sign in':'შესვლა','Back to website':'ვებსაიტზე დაბრუნება','Workspace':'სამუშაო სივრცე','Project requests':'პროექტის მოთხოვნები','Good conversations start here.':'კარგი კომუნიკაცია აქ იწყება.','View website':'ვებსაიტის ნახვა','Your next connections.':'თქვენი მომავალი კავშირები.','Sign out':'გასვლა','All requests':'ყველა მოთხოვნა','Your complete inbox':'ყველა შემოსული მოთხოვნა','Unlisted':'შეუფასებელი','Hot':'აქტიური','Cold':'ნაკლებად აქტიური','Ready for a first look':'პირველი შეფასების მოლოდინში','Prioritize these conversations':'პრიორიტეტული კომუნიკაცია','Keep for later':'მოგვიანებით დასაკავშირებელი','Search':'ძიება','Refresh':'განახლება','Previous':'წინა','Next':'შემდეგი','A little context goes a long way.':'დეტალები ბევრ რამეს გვიჩვენებს.','Select a request to see the brief, contact details, and your notes.':'აირჩიეთ მოთხოვნა აღწერის, საკონტაქტო ინფორმაციისა და შენიშვნების სანახავად.','Search name, brand, or contact':'მოძებნეთ სახელი, ბრენდი ან კონტაქტი','Search requests':'მოთხოვნების ძიება','Switch language':'ენის შეცვლა','Loading requests…':'მოთხოვნები იტვირთება…','Signing in…':'შესვლა…','Please check your password.':'გთხოვთ, გადაამოწმოთ პაროლი.','Too many attempts. Please try again in 15 minutes.':'ძალიან ბევრი მცდელობაა. სცადეთ 15 წუთში.','Could not connect. Please try again.':'დაკავშირება ვერ მოხერხდა. გთხოვთ, სცადოთ ხელახლა.','Your session has expired. Sign in again.':'სესია ამოიწურა. გთხოვთ, ხელახლა შეხვიდეთ.','No requests yet.':'მოთხოვნები ჯერ არ არის.','New website requests will appear here.':'ვებსაიტიდან შემოსული ახალი მოთხოვნები აქ გამოჩნდება.','No matching requests.':'მოთხოვნები ვერ მოიძებნა.','Try another search or status.':'შეცვალეთ საძიებო სიტყვა ან სტატუსი.','Phone':'ტელეფონი','Email':'ელფოსტა','WhatsApp':'WhatsApp','Preferred contact':'კავშირის სასურველი გზა','Services':'მომსახურებები','Project brief':'პროექტის აღწერა','Lead status':'მოთხოვნის სტატუსი','Internal notes':'შიდა შენიშვნები','Add context, next steps, or a conversation summary.':'მიუთითეთ დეტალები, შემდეგი ნაბიჯები ან საუბრის შეჯამება.','Save changes':'ცვლილებების შენახვა','Saving…':'ინახება…','Changes saved.':'ცვლილებები შენახულია.','This request changed in another tab. Your draft is kept below. Refresh and review the latest version before saving.':'მოთხოვნა სხვა ჩანართში შეიცვალა. თქვენი ტექსტი შენარჩუნებულია. განაახლეთ გვერდი და შეამოწმეთ ბოლო ვერსია შენახვამდე.','You have unsaved notes. Continue without saving?':'შენიშვნები არ არის შენახული. გავაგრძელოთ შენახვის გარეშე?','Not provided':'არ არის მითითებული','No service selected':'მომსახურება არ არის არჩეული','Submitted':'გამოგზავნილია','Updated':'განახლებულია','requests':'მოთხოვნა','Page':'გვერდი','of':'/','Website design & development':'ვებსაიტის დიზაინი და დეველოპმენტი','Brand identity & design':'ბრენდის იდენტობა და დიზაინი','Video creation':'ვიდეოს შექმნა','Motion design':'ანიმაციური დიზაინი','Social media & posting':'სოციალური მედიის მართვა','Brand & creative strategy':'ბრენდისა და კრეატიული სტრატეგია','Paid campaigns':'ფასიანი კამპანიები','Analytics & reporting':'ანალიტიკა და ანგარიშები'
  };
  let language;try{language=localStorage.getItem('render-language');}catch{}language=language==='ka'?'ka':'en';
  const t=s=>language==='ka'?(ge[s]||s):s;
  const $=s=>document.querySelector(s);
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  let csrf='',leads=[],counts={all:0,unlisted:0,hot:0,cold:0},filter='all',page=1,total=0,selected=null,dirty=false,requestNumber=0;
  const statusText=s=>t({unlisted:'Unlisted',hot:'Hot',cold:'Cold'}[s]);
  function date(value,short=false){return new Intl.DateTimeFormat(language==='ka'?'ka-GE':'en-GB',{dateStyle:short?'medium':'medium',...(short?{}:{timeStyle:'short'})}).format(new Date(value));}
  function translate(){
    document.documentElement.lang=language;
    document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
    $('#search').placeholder=t('Search name, brand, or contact');$('#search').setAttribute('aria-label',t('Search requests'));
    document.querySelectorAll('.language').forEach(n=>{n.textContent=language==='ka'?'GE / EN':'EN / GE';n.setAttribute('aria-label',t('Switch language'));});
  }
  async function api(path,options={}){
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...options.headers}});
    const data=await response.json().catch(()=>({error:'unavailable'}));
    if(!response.ok){const error=new Error(data.error||'unavailable');error.status=response.status;throw error;}return data;
  }
  function errorMessage(error){if(error.status===429)return t('Too many attempts. Please try again in 15 minutes.');if(error.status===401)return t('Please check your password.');return t('Could not connect. Please try again.');}
  function showLogin(message=''){
    requestNumber++;csrf='';leads=[];selected=null;dirty=false;$('#lead-list').replaceChildren();$('#lead-detail').replaceChildren();$('#workspace').hidden=true;$('#login-view').hidden=false;$('#admin-password').value='';$('#login-status').textContent=message;
  }
  async function showWorkspace(data){csrf=data.csrf;$('#login-view').hidden=true;$('#workspace').hidden=false;await load();}
  function mayLeave(){return !dirty||window.confirm(t('You have unsaved notes. Continue without saving?'));}
  function badge(value){const span=el('span','badge '+value);span.append(el('i','dot '+value),el('span','',statusText(value)));return span;}
  function renderList(){
    $('#result-count').textContent=language==='ka'?`${total} მოთხოვნა`:`${total} ${total===1?'request':'requests'}`;
    for(const key of Object.keys(counts))$('#count-'+key).textContent=counts[key];
    document.querySelectorAll('[data-filter]').forEach(n=>{const active=n.dataset.filter===filter;n.classList.toggle('active',active);n.setAttribute('aria-pressed',String(active));});
    const fragment=document.createDocumentFragment();
    for(const lead of leads){
      const card=el('button','lead-card'+(selected?.id===lead.id?' selected':''));card.type='button';card.setAttribute('aria-pressed',String(selected?.id===lead.id));
      const top=el('div','lead-top'),summary=el('div','lead-summary');summary.append(el('strong','',lead.name),el('p','',lead.company||t('Not provided')));top.append(el('span','avatar',lead.name.slice(0,1).toUpperCase()),summary,badge(lead.status));
      const meta=el('div','lead-meta');meta.append(el('span','',t({phone:'Phone',email:'Email',whatsapp:'WhatsApp'}[lead.contact_method])),el('span','',date(lead.created_at,true)));
      card.append(top,el('p','lead-preview',lead.brief),meta);
      card.addEventListener('click',()=>{if(!mayLeave())return;selected=lead;dirty=false;renderList();renderDetail();if(matchMedia('(max-width:600px)').matches)$('#lead-detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});});fragment.append(card);
    }
    if(!leads.length){const empty=el('div','list-empty');empty.append(el('strong','',t(total||filter!=='all'||$('#search').value?'No matching requests.':'No requests yet.')),el('span','',t(filter!=='all'||$('#search').value?'Try another search or status.':'New website requests will appear here.')));fragment.append(empty);}
    $('#lead-list').replaceChildren(fragment);
    $('#pagination').hidden=total<=25;$('#page-label').textContent=`${t('Page')} ${page} ${t('of')} ${Math.max(1,Math.ceil(total/25))}`;$('#previous').disabled=page<=1;$('#next').disabled=page*25>=total;
  }
  function renderDetail(){
    const panel=$('#lead-detail');
    if(!selected){const empty=el('div','empty-detail');empty.append(el('span','cube'),el('h3','',t('A little context goes a long way.')),el('p','',t('Select a request to see the brief, contact details, and your notes.')));panel.replaceChildren(empty);return;}
    const lead=selected,header=el('div','detail-head'),title=el('div');title.append(el('p','detail-label',t('Submitted')+' '+date(lead.created_at)),el('h2','',lead.name),el('p','',lead.company||t('Not provided')));header.append(title,badge(lead.status));
    const contacts=el('div','contacts detail-section');
    for(const [label,value,href] of [['Phone',lead.phone,lead.phone?'tel:'+lead.phone.replace(/[^+\d]/g,''):''],['Email',lead.email,lead.email?'mailto:'+lead.email:'']]){const wrap=el('div');const node=el(href?'a':'span','contact-value',value||t('Not provided'));if(href)node.href=href;wrap.append(el('p','detail-label',t(label)),node);contacts.append(wrap);}
    const preference=el('div','detail-section');preference.append(el('p','detail-label',t('Preferred contact')),el('p','',t({phone:'Phone',email:'Email',whatsapp:'WhatsApp'}[lead.contact_method])));
    const services=el('div','detail-section'),tags=el('div','service-tags');for(const s of lead.services)tags.append(el('span','service-tag',t(s)));if(!lead.services.length)tags.append(el('span','muted',t('No service selected')));services.append(el('p','detail-label',t('Services')),tags);
    const brief=el('div','detail-section');brief.append(el('p','detail-label',t('Project brief')),el('p','',lead.brief));
    const editor=el('form','lead-editor'),select=el('select');select.id='lead-status';select.name='status';for(const s of ['unlisted','hot','cold']){const option=el('option','',statusText(s));option.value=s;select.append(option);}select.value=lead.status;
    const notes=el('textarea');notes.id='lead-notes';notes.name='notes';notes.maxLength=5000;notes.rows=5;notes.value=lead.notes;notes.placeholder=t('Add context, next steps, or a conversation summary.');
    const slabel=el('label','',t('Lead status'));slabel.htmlFor=select.id;const nlabel=el('label','',t('Internal notes'));nlabel.htmlFor=notes.id;
    const bottom=el('div','editor-bottom'),save=el('button','primary',t('Save changes'));save.type='submit';bottom.append(el('span','saved-label',t('Updated')+' '+date(lead.updated_at,true)),save);
    const feedback=el('p','editor-status');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');editor.append(slabel,select,nlabel,notes,bottom,feedback);
    editor.addEventListener('input',()=>dirty=true);editor.addEventListener('change',()=>dirty=true);
    editor.addEventListener('submit',async event=>{
      event.preventDefault();save.disabled=true;save.textContent=t('Saving…');feedback.textContent='';
      try{const data=await api('/api/admin/leads/'+lead.id,{method:'PATCH',body:JSON.stringify({status:select.value,notes:notes.value,version:lead.version})});selected=data.lead;dirty=false;await load();const status=$('#lead-detail .editor-status');if(status)status.textContent=t('Changes saved.');}
      catch(error){if(error.status===401)showLogin(t('Your session has expired. Sign in again.'));else feedback.textContent=error.status===409?t('This request changed in another tab. Your draft is kept below. Refresh and review the latest version before saving.'):errorMessage(error);}
      finally{save.disabled=false;save.textContent=t('Save changes');}
    });
    panel.replaceChildren(header,contacts,preference,services,brief,editor);
  }
  async function load(){
    const number=++requestNumber;$('#workspace-status').textContent=t('Loading requests…');
    try{const params=new URLSearchParams({status:filter,q:$('#search').value.trim(),page:String(page)}),data=await api('/api/admin/leads?'+params);if(number!==requestNumber)return;
      leads=data.leads;counts=data.counts;total=data.total;
      if(page>1&&!leads.length){page=Math.max(1,Math.ceil(total/25));return load();}
      if(selected&&!dirty)selected=leads.find(l=>l.id===selected.id)||null;
      renderList();if(!dirty)renderDetail();$('#workspace-status').textContent='';
    }catch(error){if(number!==requestNumber)return;if(error.status===401)showLogin(t('Your session has expired. Sign in again.'));else $('#workspace-status').textContent=errorMessage(error);}
  }
  $('#login-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#login-form button[type=submit]');button.disabled=true;$('#login-status').textContent=t('Signing in…');try{const data=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:$('#admin-password').value})});$('#admin-password').value='';await showWorkspace(data);}catch(error){$('#login-status').textContent=errorMessage(error);}finally{button.disabled=false;}});
  $('#logout').addEventListener('click',async()=>{if(!mayLeave())return;try{await api('/api/admin/logout',{method:'POST',body:'{}'});showLogin();}catch(error){if(error.status===401)showLogin();else $('#workspace-status').textContent=errorMessage(error);}});
  document.querySelectorAll('[data-filter]').forEach(n=>n.addEventListener('click',()=>{if(!mayLeave())return;dirty=false;filter=n.dataset.filter;page=1;selected=null;load();}));
  $('#search-form').addEventListener('submit',e=>{e.preventDefault();if(!mayLeave())return;dirty=false;page=1;selected=null;load();});
  $('#refresh').addEventListener('click',()=>{if(!mayLeave())return;dirty=false;load();});
  $('#previous').addEventListener('click',()=>{if(!mayLeave())return;dirty=false;page--;selected=null;load();});$('#next').addEventListener('click',()=>{if(!mayLeave())return;dirty=false;page++;selected=null;load();});
  document.querySelectorAll('.language').forEach(n=>n.addEventListener('click',()=>{if(!mayLeave())return;language=language==='ka'?'en':'ka';try{localStorage.setItem('render-language',language);}catch{}dirty=false;translate();renderList();renderDetail();}));
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  translate();api('/api/admin/session').then(showWorkspace).catch(()=>showLogin());
})();
