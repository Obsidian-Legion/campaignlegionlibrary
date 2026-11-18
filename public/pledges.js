(() => {
  'use strict';
  const api = 'https://gronlid-library-pledges.littlecrowsbe.chatgpt.site';
  const form = document.getElementById('pledge-form');
  const formStatus = document.getElementById('pledge-form-status');
  const boardStatus = document.getElementById('pledge-board-status');
  const submit = document.getElementById('pledge-submit');
  const refreshSession = document.getElementById('pledge-session-refresh');
  const receipt = document.getElementById('pledge-receipt');
  const views = [...document.querySelectorAll('.pledge-view')];
  const tabs = [...document.querySelectorAll('.pledge-tabs a')];
  const money = new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'});
  let session = null;
  let sessionRequest = null;
  let currentPage = 1;
  let boardRequest = 0;
  let withdrawal = null;

  async function request(path, body) {
    const response = await fetch(`${api}${path}`, {method:body?'POST':'GET',credentials:'omit',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
    let data; try { data = await response.json(); } catch { throw new Error('The pledge service is unavailable. Please try again.'); }
    if(!response.ok) throw new Error(data.error || 'The pledge service could not complete your request.');
    return data;
  }
  function friendlyError(error) { return error.name==='TimeoutError' || error.name==='TypeError' ? 'Unable to reach the pledge service. Your details are still here; please try again.' : error.message; }
  function element(tag, className, text) { const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
  async function loadPledges(page=1) {
    const number=++boardRequest;
    boardStatus.textContent='Loading public pledges…';
    document.getElementById('pledge-refresh').disabled=true;
    try {
      const data=await request(`/api/pledges?page=${page}`);
      if(number!==boardRequest)return;
      const maxPage=Math.max(1,Math.ceil(data.summary.count/data.pageSize));
      if(page>maxPage)return loadPledges(maxPage);
      currentPage=page;
      document.getElementById('pledge-count').textContent=data.summary.count.toLocaleString('en-CA');
      document.getElementById('pledge-cash').textContent=money.format(data.summary.amountCents/100);
      document.getElementById('pledge-kind-count').textContent=data.summary.inKindCount.toLocaleString('en-CA');
      document.getElementById('pledge-totals').hidden=false;
      const list=document.getElementById('pledge-list'); list.replaceChildren();
      for(const pledge of data.items) {
        const card=element('article','pledge-card');
        card.append(element('p','chapter-eyebrow','PUBLIC PLEDGE'),element('h3','',pledge.company));
        if(pledge.amount_cents)card.append(element('p','pledge-card-amount',`${money.format(pledge.amount_cents/100)} CAD pledged`));
        if(pledge.in_kind){card.append(element('h4','','GOODS / SERVICES'),element('p','pledge-description',pledge.in_kind));}
        if(pledge.message)card.append(element('p','pledge-description pledge-message',pledge.message));
        const date=element('time','pledge-date',new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'short',day:'numeric',timeZone:'America/Regina'}).format(new Date(pledge.created_at)));
        date.dateTime=pledge.created_at;
        card.append(date); list.append(card);
      }
      boardStatus.textContent=data.summary.count?'Cash totals exclude any estimated value of goods or services.':'No public pledges yet. Be the first company to put its support on record.';
      document.getElementById('pledge-board-pagination').hidden=maxPage<=1;
      document.getElementById('pledge-previous').disabled=page<=1;
      document.getElementById('pledge-next').disabled=page>=maxPage;
      document.getElementById('pledge-page-number').textContent=`Page ${page} of ${maxPage}`;
    } catch(error) {
      if(number!==boardRequest)return;
      document.getElementById('pledge-list').replaceChildren();
      document.getElementById('pledge-totals').hidden=true;
      document.getElementById('pledge-board-pagination').hidden=true;
      boardStatus.textContent=`Public pledges could not be loaded. ${friendlyError(error)}`;
    } finally { if(number===boardRequest)document.getElementById('pledge-refresh').disabled=false; }
  }
  async function prepareSession() {
    if(session)return session;
    if(sessionRequest)return sessionRequest;
    sessionRequest=request('/api/challenge').then(data=>{session={token:data.token,readyAt:Date.now()+1100};refreshSession.hidden=true;return session;}).catch(error=>{refreshSession.hidden=false;throw error;}).finally(()=>{sessionRequest=null;});
    return sessionRequest;
  }
  function selectView(focus=false) {
    if(location.hash.startsWith('#withdraw=')) {
      const parts=location.hash.slice(10).split('.');
      if(parts.length===2 && /^[0-9a-f-]{36}$/.test(parts[0]) && /^[A-Za-z0-9_-]{43}$/.test(parts[1])) withdrawal={id:parts[0],token:parts[1]};
      history.replaceState(null,'','#withdraw-pledge');
    }
    const id=location.hash.slice(1);
    const active=views.find(view=>view.id===id)||views[0];
    for(const view of views)view.hidden=view!==active;
    for(const tab of tabs){if(tab.hash===`#${active.id}`)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');}
    if(active.id==='make-a-pledge' && !form.hidden)prepareSession().catch(error=>{formStatus.textContent=friendlyError(error);});
    if(active.id==='withdraw-pledge' && !withdrawal){document.getElementById('pledge-withdraw').disabled=true;document.getElementById('pledge-withdraw-status').textContent='Open the complete private withdrawal link you saved when submitting your pledge.';}
    if(focus){const heading=document.getElementById(active.getAttribute('aria-labelledby'));heading.tabIndex=-1;heading.focus({preventScroll:true});}
    window.scrollTo(0,0);
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!link || link.origin!==location.origin || link.pathname!==location.pathname || !['#public-pledges','#make-a-pledge'].includes(link.hash) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button!==0)return;
    event.preventDefault();if(location.hash!==link.hash)history.pushState(null,'',link.hash);selectView(true);
    if(link.hash==='#public-pledges')loadPledges();
  });
  addEventListener('hashchange',()=>selectView(true));
  addEventListener('popstate',()=>selectView(true));
  function validate() {
    for(const name of ['company','contactName','contactEmail']){const field=form.elements.namedItem(name);field.setCustomValidity(field.value.trim()?'':'Please enter a value.');}
    const amount=form.elements.namedItem('amount'), inKind=form.elements.namedItem('inKind');
    inKind.setCustomValidity(!amount.value && !inKind.value.trim()?'Enter a cash amount, describe goods or services, or both.':'');
  }
  form.addEventListener('input',validate);
  form.addEventListener('submit',async event=>{
    event.preventDefault();validate();if(!form.reportValidity())return;
    submit.disabled=true;formStatus.textContent='Publishing your pledge…';
    const fields=new FormData(form);
    try {
      const challenge=await prepareSession();
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,challenge.readyAt-Date.now())));
      const data=await request('/api/pledges',{company:String(fields.get('company')).trim(),contactName:String(fields.get('contactName')).trim(),contactEmail:String(fields.get('contactEmail')).trim(),amount:String(fields.get('amount')).trim(),inKind:String(fields.get('inKind')).trim(),message:String(fields.get('message')).trim(),website:fields.get('website'),consent:fields.get('consent')==='on',authorized:fields.get('authorized')==='on',token:challenge.token});
      if(data.status!=='published')throw new Error('This pledge was already withdrawn. Refresh the form session to submit a replacement.');
      document.getElementById('pledge-private-link').value=`${location.origin}${location.pathname}#withdraw=${data.id}.${data.withdrawalToken}`;
      form.hidden=true;receipt.hidden=false;formStatus.textContent='Published successfully. Save your private withdrawal link below.';
      document.getElementById('pledge-receipt-title').focus();
      form.reset();session=null;loadPledges();
    } catch(error) { formStatus.textContent=friendlyError(error);if(/session has expired|already withdrawn/.test(error.message))refreshSession.hidden=false; }
    finally { submit.disabled=false; }
  });
  refreshSession.addEventListener('click',async()=>{session=null;refreshSession.disabled=true;try{await prepareSession();formStatus.textContent='Form session refreshed. Your details are ready to submit.';}catch(error){formStatus.textContent=friendlyError(error);}finally{refreshSession.disabled=false;}});
  document.getElementById('pledge-copy-link').addEventListener('click',async()=>{const field=document.getElementById('pledge-private-link');try{await navigator.clipboard.writeText(field.value);formStatus.textContent='Private link copied. Save it somewhere safe.';}catch{field.focus();field.select();formStatus.textContent='Select and copy the private link.';}});
  document.getElementById('pledge-withdraw').addEventListener('click',async event=>{
    if(!withdrawal)return;
    const button=event.currentTarget,status=document.getElementById('pledge-withdraw-status');button.disabled=true;status.textContent='Withdrawing your pledge…';
    try{await request('/api/withdraw',withdrawal);status.textContent='Your pledge has been removed from the public board and totals.';withdrawal=null;loadPledges();}
    catch(error){status.textContent=friendlyError(error);button.disabled=false;}
  });
  document.getElementById('pledge-refresh').hidden=false;
  document.getElementById('pledge-refresh').addEventListener('click',()=>loadPledges(currentPage));
  document.getElementById('pledge-previous').addEventListener('click',()=>loadPledges(currentPage-1));
  document.getElementById('pledge-next').addEventListener('click',()=>loadPledges(currentPage+1));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(pointer: fine)');
  for(const surface of document.querySelectorAll('.gold-button')) {
    surface.addEventListener('pointermove',event=>{if(reduced.matches||!fine.matches||document.body.classList.contains('motion-paused'))return;const box=surface.getBoundingClientRect();surface.style.setProperty('--gold-x',`${(event.clientX-box.left)/box.width*100}%`);surface.style.setProperty('--gold-y',`${(event.clientY-box.top)/box.height*100}%`);});
    surface.addEventListener('pointerleave',()=>{surface.style.removeProperty('--gold-x');surface.style.removeProperty('--gold-y');});
  }
  form.hidden=false;document.body.classList.add('has-pledge-views');selectView();loadPledges();
})();
