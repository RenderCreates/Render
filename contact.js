'use strict';
(() => {
  const form=document.querySelector('#project-form'),status=document.querySelector('#form-status'),submit=document.querySelector('#callback-submit'),wa=document.querySelector('#whatsapp-brief');
  const t=s=>window.RenderI18n?.t(s)||s;
  const endpoint=location.hostname==='vornato.github.io'?'https://render-studio-creates.netlify.app/api/callback':'/api/callback';
  let pendingKey='',pendingPayload='',busy=false;
  const contactRequirements=required=>{
    form.elements.phone.required=required&&form.elements.contactMethod.value!=='email';
    form.elements.email.required=required&&form.elements.contactMethod.value==='email';
    form.elements.consent.required=required;
    form.elements.phone.setCustomValidity('');form.elements.email.setCustomValidity('');form.elements.consent.setCustomValidity('');
  };
  form.elements.contactMethod.addEventListener('change',()=>contactRequirements(false));
  form.addEventListener('input',()=>{status.classList.remove('is-success');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;contactRequirements(true);if(!form.reportValidity())return;
    const data=new FormData(form),payload={name:String(data.get('name')||'').trim(),company:String(data.get('company')||'').trim(),phone:String(data.get('phone')||'').trim(),email:String(data.get('email')||'').trim(),contactMethod:data.get('contactMethod'),services:data.getAll('service'),brief:String(data.get('brief')||'').trim(),consent:data.has('consent'),website:String(data.get('website')||''),language:document.documentElement.lang==='ka'?'ka':'en'};
    const fingerprint=JSON.stringify(payload);if(!pendingKey||pendingPayload!==fingerprint){pendingKey=crypto.randomUUID();pendingPayload=fingerprint;}
    payload.requestKey=pendingKey;busy=true;submit.disabled=true;wa.disabled=true;submit.querySelector('[data-submit-label]').textContent=t('Sending request…');status.classList.remove('is-success');status.textContent='';
    try{
      const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      const result=await response.json().catch(()=>({error:'unavailable'}));
      if(!response.ok){const message={phone_required:'Please add a phone number for a call or WhatsApp reply.',invalid_phone:'Please enter a valid phone number, including your country code.',email_required:'Please add an email address for our reply.',invalid_email:'Please enter a valid email address.',consent_required:'Please allow us to contact you about this request.',rate_limited:'You have sent several requests. Please try again in 10 minutes or chat on WhatsApp.',invalid_details:'Please check your details and add at least 10 characters about your project.'}[result.error];throw new Error(message||'We could not save your request. Please try again or chat on WhatsApp.');}
      pendingKey='';pendingPayload='';form.reset();contactRequirements(false);status.classList.add('is-success');status.textContent=t('Request received. We will contact you using your preferred method.');
    }catch(error){status.textContent=t(error.message.includes('Please')||error.message.startsWith('We could')||error.message.startsWith('You have')?error.message:'We could not save your request. Please try again or chat on WhatsApp.');}
    finally{busy=false;submit.disabled=false;wa.disabled=false;submit.querySelector('[data-submit-label]').textContent=t('Submit request');}
  });
  wa.addEventListener('click',()=>{
    contactRequirements(false);if(!form.reportValidity())return;
    const data=new FormData(form),name=String(data.get('name')||'').trim(),brief=String(data.get('brief')||'').trim(),company=String(data.get('company')||'').trim(),services=data.getAll('service'),phone=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim();
    const ka=document.documentElement.lang==='ka';
    const message=ka?[`გამარჯობა, Render Studio! მე ვარ ${name}.`,company?`ბრენდი / კომპანია: ${company}`:'',services.length?`მაინტერესებს: ${services.map(t).join(', ')}`:'',phone?`ტელეფონი: ${phone}`:'',email?`ელფოსტა: ${email}`:'',`პროექტის აღწერა: ${brief}`].filter(Boolean).join('\n\n'):[`Hi Render Studio! I'm ${name}.`,company?`Brand / company: ${company}`:'',services.length?`Interested in: ${services.join(', ')}`:'',phone?`Phone: ${phone}`:'',email?`Email: ${email}`:'',`Project brief: ${brief}`].filter(Boolean).join('\n\n');
    const url=whatsappURL(message);window.open(url,'_blank','noopener,noreferrer');const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t('Open your brief in WhatsApp');status.classList.remove('is-success');status.replaceChildren(document.createTextNode(t('Your brief is ready to review and send.')+' '),link);
  });
  window.addEventListener('render-language-change',()=>{if(!busy)submit.querySelector('[data-submit-label]').textContent=t('Submit request');});
})();
