import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
export function database(filename=':memory:') {
  const sqlite=new DatabaseSync(filename);
  sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>name.endsWith('.sql')).sort()) {
    if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)) {
      sqlite.exec(readFileSync(new URL(`../drizzle/${name}`,import.meta.url),'utf8'));
      sqlite.prepare('INSERT INTO local_migrations (name) VALUES (?)').run(name);
    }
  }
  function prepare(sql,params=[]) { return {bind:(...values)=>prepare(sql,values),first:async()=>sqlite.prepare(sql).get(...params)||null,all:async()=>({results:sqlite.prepare(sql).all(...params)}),run:async()=>({success:true,meta:sqlite.prepare(sql).run(...params)})}; }
  return {prepare,batch:async statements=>{sqlite.exec('BEGIN');try{const results=await Promise.all(statements.map(statement=>statement.all()));sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},close:()=>sqlite.close()};
}
