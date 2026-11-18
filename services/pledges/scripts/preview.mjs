import http from 'node:http';
import {mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import worker from '../worker/index.js';
import {database} from './local-db.mjs';
mkdirSync('.preview',{recursive:true});
const env={DB:database('.preview/pledges.sqlite'),PLEDGE_SIGNING_SECRET:randomBytes(32).toString('hex'),ADMIN_EMAIL:'admin@example.test',DEV_ORIGIN:'http://127.0.0.1:4196'};
http.createServer(async(req,res)=>{
  const headers=new Headers(req.headers);headers.set('CF-Connecting-IP','127.0.0.1');
  const body=[];for await(const chunk of req)body.push(chunk);
  const request=new Request(`http://127.0.0.1:4197${req.url}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(body)});
  const response=await worker.fetch(request,env,{waitUntil:promise=>promise.catch(()=>{})});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}).listen(4197,'127.0.0.1',()=>console.log('Pledge API preview: http://127.0.0.1:4197'));
