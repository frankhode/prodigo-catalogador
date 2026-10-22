const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
let serial=0,head='c0',rejectRef=false,trees=new Map(),commits=new Map(),calls=[];
const initial=JSON.parse(fs.readFileSync('prodigo-catalogador/data/collections/bixio.json'));
initial.images.x={id:'x',relative:'imagen.tif',folder:'f',record:{},status:'pending',revision:0};
const files={'data/index.json':JSON.parse(fs.readFileSync('prodigo-catalogador/data/index.json')),'data/collections/bixio.json':initial};commits.set(head,{tree:'t0',files:structuredClone(files)});trees.set('t0',structuredClone(files));
const ctx={console,structuredClone,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64')};
ctx.fetch=async(url,options={})=>{
 calls.push({url,options});const path=url.replace('https://api.github.com/repos/frankhode/prodigo-catalogador',''),method=options.method||'GET',body=options.body?JSON.parse(options.body):null;let data,status=200;
 if(url.startsWith('https://raw.githubusercontent.com/')){assert(!options.headers?.Authorization);data=commits.get(head).files[url.split('/main/')[1].split('?')[0]];}
 else if(path==='')data={permissions:{push:true}};
 else if(path==='/git/ref/heads/main')data={object:{sha:head}};
 else if(path.startsWith('/git/commits/')&&method==='GET')data={tree:{sha:commits.get(path.split('/').at(-1)).tree}};
 else if(path.startsWith('/contents/')){const [file,ref]=path.slice(10).split('?ref=');data={content:Buffer.from(JSON.stringify(commits.get(ref).files[file])).toString('base64')};}
 else if(path==='/git/trees'){const snapshot=structuredClone(trees.get(body.base_tree));for(const entry of body.tree)if(entry.content)snapshot[entry.path]=JSON.parse(entry.content);const sha='t'+(++serial);trees.set(sha,snapshot);data={sha};}
 else if(path==='/git/commits'){const sha='c'+(++serial);commits.set(sha,{tree:body.tree,files:structuredClone(trees.get(body.tree)),parent:body.parents[0]});data={sha};}
 else if(path==='/git/refs/heads/main'){assert.equal(body.force,false);if(rejectRef){status=422;data={message:'Race'};}else{assert.equal(commits.get(body.sha).parent,head);head=body.sha;data={};}}
 else if(path==='/git/blobs')data={sha:'blob'+(++serial)};
 else throw Error('Unexpected '+method+' '+path);
 return {ok:status===200,status,json:async()=>structuredClone(data)};
};vm.createContext(ctx);vm.runInContext(fs.readFileSync('prodigo-catalogador/assets/github-store.js','utf8')+'\nglobalThis.store=GithubStore;',ctx);const store=ctx.store;
(async()=>{
 await store.open('bixio');await assert.rejects(()=>store.mutate('save',{}),/Conectá/);await store.connect('TEST_TOKEN_IN_MEMORY_ONLY');
 const saved=await store.mutate('save',{id:'x',revision:0,complete:true,record:{side:'Frente',kind:'Retrato',signature:'BIX-02',people:['Niños'],objects:['Triciclo']}});assert.equal(saved.image.status,'done');assert.equal(saved.image.record.side,'Frente');assert.equal(commits.get(head).files['data/collections/bixio.json'].images.x.record.objects[0],'Triciclo');
 const backup=JSON.stringify(store.db);assert(!backup.includes('TEST_TOKEN'));assert(calls.every(c=>!c.options.body?.includes('TEST_TOKEN')));
 const oldVersion=store.db.version;rejectRef=true;await assert.rejects(()=>store.mutate('save',{id:'x',revision:1,complete:false,record:{side:'Frente'}}),/repositorio cambió/);assert.equal(store.db.version,oldVersion);assert.equal(store.db.images.x.status,'done');rejectRef=false;
 const remote=commits.get(head).files['data/index.json'];remote.collections[0].version='someone-else';await assert.rejects(()=>store.mutate('save',{id:'x',revision:1,complete:false,record:{side:'Frente'}}),/otra ventana/);remote.collections[0].version=oldVersion;
 await store.create('Rodin');assert.equal(store.id,'rodin');assert.equal(store.db.name,'Rodin');assert(!store.db.signatures['BIX-01']);const signature=await store.mutate('add_signature',{name:'Firma Rodin'});assert.equal(signature.code,'FIR-01');await store.mutate('add_signature',{name:'Otra firma'});assert(store.db.signatures['FIR-02']);
 await store.open('bixio');assert.equal(store.db.images.x.record.side,'Frente');store.disconnect();await assert.rejects(()=>store.create('Prueba'),/Conectá/);
 console.log('PASS: lectura pública, guardado atómico, autorización en memoria, protección contra conflictos y colecciones independientes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
