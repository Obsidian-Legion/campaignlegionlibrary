const CAMPAIGN = 'https://obsidian-legion.github.io/campaignlegionlibrary';
const encoder = new TextEncoder();
const publicColumns = 'id, company, amount_cents, in_kind, message, created_at';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control':'no-store'}});
const bytes = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
const base64 = value => btoa(String.fromCharCode(...value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function key(secret) { return crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']); }
async function sign(value, secret) { return base64(new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(value)))); }
async function hash(value) { return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }
function textField(value, label, max, required = false) {
  if (typeof value !== 'string') throw new HttpError(400, `${label} must be text.`);
  const text = value.trim();
  if ((required && !text) || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new HttpError(400, `Please check ${label.toLowerCase()}.`);
  return text;
}
export function validatePledge(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400,'Please check your pledge details.');
  const company = textField(data.company, 'Company name', 120, true);
  const contactName = textField(data.contactName, 'Contact name', 100, true);
  const contactEmail = textField(data.contactEmail, 'Contact email', 160, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new HttpError(400,'Enter a valid contact email.');
  const amount = textField(data.amount ?? '', 'Amount', 12);
  if (amount && !/^\d{1,8}(?:\.\d{1,2})?$/.test(amount)) throw new HttpError(400,'Enter a CAD amount using up to two decimal places.');
  const amountCents = amount ? Number(amount.split('.')[0]) * 100 + Number((amount.split('.')[1] || '').padEnd(2,'0')) : 0;
  if (amount && amountCents < 1) throw new HttpError(400,'The cash amount must be greater than zero, or left blank for an in-kind pledge.');
  const inKind = textField(data.inKind ?? '', 'Donation description', 600);
  const message = textField(data.message ?? '', 'Public message', 400);
  if (!amountCents && !inKind) throw new HttpError(400,'Enter a dollar amount, describe an in-kind donation, or both.');
  if (data.consent !== true || data.authorized !== true) throw new HttpError(400,'Confirm your authority and consent to public display.');
  if (data.website) throw new HttpError(400,'Unable to accept this submission.');
  return {company,contactName,contactEmail,amountCents,inKind,message};
}
async function readJSON(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Please submit the form as JSON.');
  if (Number(request.headers.get('content-length')) > 12000) throw new HttpError(413,'The submission is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400,'Missing submission.');
  let total = 0; const chunks = [];
  for (;;) { const {value,done} = await reader.read(); if (done) break; total += value.length; if (total > 12000) { await reader.cancel(); throw new HttpError(413,'The submission is too large.'); } chunks.push(value); }
  const body = new Uint8Array(total); let offset=0; for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  try { return JSON.parse(new TextDecoder().decode(body)); } catch { throw new HttpError(400,'Invalid submission.'); }
}
async function rateLimit(env, identity, kind, max, ctx) {
  const now = Date.now(); const window = Math.floor(now / 3600000);
  const row = await env.DB.prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(`${kind}:${identity}:${window}`, (window+1)*3600000).first();
  ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run());
  if (row.count > max) throw new HttpError(429,'Too many attempts. Please try again in an hour.');
}
async function identity(request, env) { return sign(request.headers.get('CF-Connecting-IP') || 'unknown', env.PLEDGE_SIGNING_SECRET); }
async function challenge(request, env, ctx) {
  const ip = await identity(request,env);
  await rateLimit(env,ip,'challenge',40,ctx);
  const payload = base64(encoder.encode(JSON.stringify({id:crypto.randomUUID(),issued:Date.now(),ip})));
  return json({token:`${payload}.${await sign(payload,env.PLEDGE_SIGNING_SECRET)}`});
}
async function verifyChallenge(token, request, env) {
  if(typeof token !== 'string' || token.length > 1000) throw new HttpError(400,'Please refresh the form and try again.');
  try {
    const [payload,signature,...rest] = token.split('.');
    if(rest.length || !signature || !await crypto.subtle.verify('HMAC',await key(env.PLEDGE_SIGNING_SECRET),bytes(signature),encoder.encode(payload))) throw new Error();
    const claim = JSON.parse(new TextDecoder().decode(bytes(payload)));
    if(!/^[0-9a-f-]{36}$/.test(claim.id) || typeof claim.issued !== 'number' || Date.now()-claim.issued < 1000 || Date.now()-claim.issued > 1800000 || claim.ip !== await identity(request,env)) throw new Error();
    return claim;
  } catch { throw new HttpError(400,'The form session has expired. Please refresh the form and try again.'); }
}
async function submit(request, env, ctx) {
  const data = await readJSON(request);
  const pledge = validatePledge(data);
  const claim = await verifyChallenge(data.token,request,env);
  const withdrawalToken = await sign(`withdraw:${claim.id}`,env.PLEDGE_SIGNING_SECRET);
  const existing = await env.DB.prepare('SELECT id, status FROM pledges WHERE id = ?').bind(claim.id).first();
  if(existing) return json({id:existing.id,status:existing.status,withdrawalToken},200);
  await rateLimit(env,claim.ip,'submit',5,ctx);
  await env.DB.prepare('INSERT INTO pledges (id, company, amount_cents, in_kind, message, contact_name, contact_email, created_at, status, withdrawal_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(claim.id,pledge.company,pledge.amountCents,pledge.inKind,pledge.message,pledge.contactName,pledge.contactEmail,new Date().toISOString(),'published',await hash(withdrawalToken)).run();
  return json({id:claim.id,status:'published',withdrawalToken},201);
}
async function list(request, env) {
  const raw = new URL(request.url).searchParams.get('page') || '1';
  if(!/^[1-9]\d{0,4}$/.test(raw)) throw new HttpError(400,'Invalid page.');
  const page = Number(raw); const limit = 12;
  const [summary,items] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS amountCents, COALESCE(SUM(CASE WHEN in_kind <> '' THEN 1 ELSE 0 END),0) AS inKindCount FROM pledges WHERE status = 'published'"),
    env.DB.prepare(`SELECT ${publicColumns} FROM pledges WHERE status = 'published' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(limit,(page-1)*limit)
  ]);
  return json({summary:summary.results[0],items:items.results,page,pageSize:limit});
}
async function withdraw(request,env) {
  const data=await readJSON(request);
  if(typeof data.id!=='string' || typeof data.token!=='string' || data.token.length>100) throw new HttpError(400,'Invalid withdrawal details.');
  const row=await env.DB.prepare('SELECT withdrawal_hash FROM pledges WHERE id = ?').bind(data.id).first();
  if(!row || row.withdrawal_hash !== await hash(data.token)) throw new HttpError(403,'The private withdrawal link is invalid.');
  await env.DB.prepare("UPDATE pledges SET status = 'withdrawn' WHERE id = ?").bind(data.id).run();
  return json({status:'withdrawn'});
}
function isAdmin(request,env) { return Boolean(env.ADMIN_EMAIL && request.headers.get('oai-authenticated-user-id') && request.headers.get('oai-authenticated-user-email')?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()); }
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function manage(request,env) {
  if(!request.headers.get('oai-authenticated-user-id')) return Response.redirect(new URL('/signin-with-chatgpt?return_to=%2Fmanage',request.url),302);
  if(!isAdmin(request,env)) throw new HttpError(403,'This page is for the campaign administrator.');
  const {results}=await env.DB.prepare('SELECT id, company, amount_cents, in_kind, message, contact_name, contact_email, created_at, status FROM pledges ORDER BY created_at DESC LIMIT 200').all();
  const rows=results.map(p=>`<article><h2>${escape(p.company)}</h2><p>${escape(p.status)} · CAD ${(p.amount_cents/100).toFixed(2)} · ${escape(p.created_at)}</p><p>${escape(p.in_kind)}</p><p>${escape(p.message)}</p><p>Private contact: ${escape(p.contact_name)} · ${escape(p.contact_email)}</p>${p.status==='published'?`<button data-remove="${escape(p.id)}">Remove from public board</button>`:''}</article>`).join('');
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Manage Gronlid pledges</title><style>body{background:#070403;color:#e9dfd0;font:16px/1.6 system-ui;max-width:950px;margin:40px auto;padding:20px}a{color:#e6c477}article{border-top:1px solid #795b31;padding:24px 0;overflow-wrap:anywhere}button{padding:12px;background:#ebcd82;border:0;cursor:pointer}#status{color:#ffc77d}</style><h1>Manage public pledges</h1><p>Private administration. Latest 200 pledges. Public amounts are offers of support, not payments received.</p><p><a href="${CAMPAIGN}/pledges.html">View public board</a> · <a href="/signout-with-chatgpt?return_to=%2Fmanage" target="_top">Sign out</a></p><p id="status" role="status"></p>${rows||'<p>No pledges yet.</p>'}<script>document.addEventListener('click',async event=>{const button=event.target.closest('[data-remove]');if(!button||!confirm('Remove this pledge from the public board?'))return;button.disabled=true;try{const response=await fetch('/api/manage/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:button.dataset.remove})});if(!response.ok)throw Error('Could not remove pledge.');location.reload();}catch(error){document.getElementById('status').textContent=error.message;button.disabled=false;}});</script></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url); const origin=request.headers.get('Origin');
    const allowed=[new URL(CAMPAIGN).origin,url.origin,...(env.DEV_ORIGIN?[env.DEV_ORIGIN]:[])];
    let response;
    try {
      if(origin && !allowed.includes(origin)) throw new HttpError(403,'This origin is not allowed.');
      if(request.method==='OPTIONS') response=new Response(null,{status:204});
      else if(request.method==='GET' && url.pathname==='/') response=Response.redirect(`${CAMPAIGN}/pledges.html`,302);
      else if(request.method==='GET' && url.pathname==='/health') response=json({ok:true});
      else {
        if(!env.DB || !env.PLEDGE_SIGNING_SECRET) throw new HttpError(503,'Pledge submissions are temporarily unavailable. Please try again later.');
        if(request.method==='GET' && url.pathname==='/api/pledges') response=await list(request,env);
        else if(request.method==='GET' && url.pathname==='/api/challenge') response=await challenge(request,env,ctx);
        else if(request.method==='GET' && url.pathname==='/manage') response=await manage(request,env);
        else if(request.method==='POST') {
          if(!origin || !allowed.includes(origin)) throw new HttpError(403,'Please submit through the campaign website.');
          if(url.pathname==='/api/pledges') response=await submit(request,env,ctx);
          else if(url.pathname==='/api/withdraw') response=await withdraw(request,env);
          else if(url.pathname==='/api/manage/withdraw') {
            if(origin!==url.origin || !isAdmin(request,env)) throw new HttpError(403,'Administrator access required.');
            const data=await readJSON(request); if(typeof data.id!=='string') throw new HttpError(400,'Invalid pledge.');
            await env.DB.prepare("UPDATE pledges SET status = 'withdrawn' WHERE id = ?").bind(data.id).run(); response=json({status:'withdrawn'});
          } else throw new HttpError(404,'Not found.');
        } else throw new HttpError(404,'Not found.');
      }
    } catch(error) { response=json({error:error instanceof HttpError?error.message:'The pledge service is temporarily unavailable. Please try again.'},error instanceof HttpError?error.status:500); }
    const headers=new Headers(response.headers);
    if(origin && allowed.includes(origin)) headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Vary','Origin'); headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS'); headers.set('Access-Control-Allow-Headers','Content-Type'); headers.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,headers});
  }
};
