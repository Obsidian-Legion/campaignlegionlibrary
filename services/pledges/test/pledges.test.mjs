import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import worker, {validatePledge} from '../worker/index.js';
import {database} from '../scripts/local-db.mjs';
const origin='https://obsidian-legion.github.io';
const secret='unit-test-only-signing-secret';
const sign=value=>createHmac('sha256',secret).update(value).digest('base64url');
const form={company:'Example Company',contactName:'Test Person',contactEmail:'contact@example.test',amount:'1250.50',inKind:'50 books',message:'For future readers.',consent:true,authorized:true,website:''};
function fixture(){const env={DB:database(),PLEDGE_SIGNING_SECRET:secret,ADMIN_EMAIL:'admin@example.test'};return {env,request:async(path,body,headers={})=>worker.fetch(new Request(`https://pledges.test${path}`,{method:body?'POST':'GET',headers:{Origin:origin,'CF-Connecting-IP':'127.0.0.1',...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined}),env,{waitUntil:p=>p.catch(()=>{})})};}
function token(issued=Date.now()-2000){const payload=Buffer.from(JSON.stringify({id:randomUUID(),issued,ip:sign('127.0.0.1')})).toString('base64url');return `${payload}.${sign(payload)}`;}
test('accepts cash, in-kind, or both; rejects invalid and empty pledges',()=>{
  assert.equal(validatePledge(form).amountCents,125050);
  assert.equal(validatePledge({...form,inKind:''}).amountCents,125050);
  assert.equal(validatePledge({...form,amount:''}).amountCents,0);
  for(const overrides of [{amount:'',inKind:'   '},{amount:'0'},{amount:'-1'},{amount:'0.001'},{amount:'1e6'},{company:'   '},{contactEmail:'invalid'},{consent:false},{authorized:false},{website:'spam'},{inKind:'x'.repeat(601)}])assert.throws(()=>validatePledge({...form,...overrides}));
});
test('durable publication, exact totals, privacy, retries, and withdrawal',async()=>{
  const f=fixture();const t=token();
  const response=await f.request('/api/pledges',{...form,token:t});assert.equal(response.status,201);
  const receipt=await response.json();assert.equal(receipt.status,'published');
  const duplicate=await f.request('/api/pledges',{...form,token:t});assert.equal(duplicate.status,200);assert.equal((await duplicate.json()).id,receipt.id);
  await f.request('/api/pledges',{...form,company:'In-kind Company',amount:'',token:token()});
  const listed=await(await f.request('/api/pledges')).json();assert.deepEqual(listed.summary,{count:2,amountCents:125050,inKindCount:2});
  assert.equal(listed.items.length,2);assert(!JSON.stringify(listed).includes('contact@example.test'));assert(!JSON.stringify(listed).includes('withdrawal'));
  const bad=await f.request('/api/withdraw',{id:receipt.id,token:'wrong'});assert.equal(bad.status,403);
  const withdrawn=await f.request('/api/withdraw',{id:receipt.id,token:receipt.withdrawalToken});assert.equal(withdrawn.status,200);
  const after=await(await f.request('/api/pledges')).json();assert.deepEqual(after.summary,{count:1,amountCents:0,inKindCount:1});f.env.DB.close();
});
test('origin checks, challenges, consent, and admin authorization',async()=>{
  const f=fixture();
  const foreign=await f.request('/api/pledges',{...form,token:token()},{Origin:'https://elsewhere.test'});assert.equal(foreign.status,403);assert.equal(foreign.headers.get('Access-Control-Allow-Origin'),null);
  assert.equal((await f.request('/api/pledges',{...form,token:'tampered'})).status,400);
  assert.equal((await f.request('/api/pledges',{...form,token:token(Date.now()-1900000)})).status,400);
  assert.equal((await f.request('/api/pledges',{...form,token:token(),consent:false})).status,400);
  const challenge=await f.request('/api/challenge');assert.equal(challenge.status,200);assert.equal(typeof (await challenge.json()).token,'string');
  assert.equal((await f.request('/api/manage/withdraw',{id:randomUUID()},{Origin:'https://pledges.test'})).status,403);
  const admin=await f.request('/api/manage/withdraw',{id:randomUUID()},{Origin:'https://pledges.test','oai-authenticated-user-id':'admin','oai-authenticated-user-email':'admin@example.test'});assert.equal(admin.status,200);f.env.DB.close();
});
test('limits repeated submissions without inserting excess pledges',async()=>{
  const f=fixture();for(let i=0;i<5;i++)assert.equal((await f.request('/api/pledges',{...form,token:token()})).status,201);
  assert.equal((await f.request('/api/pledges',{...form,token:token()})).status,429);
  assert.equal((await(await f.request('/api/pledges')).json()).summary.count,5);f.env.DB.close();
});
