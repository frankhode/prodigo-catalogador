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
};ctx.RecordFields=require('../assets/record-fields.js');vm.createContext(ctx);vm.runInContext(fs.readFileSync('prodigo-catalogador/assets/github-store.js','utf8')+'\nglobalThis.store=GithubStore;',ctx);const store=ctx.store;
(async()=>{
 await store.open('bixio');await assert.rejects(()=>store.mutate('save',{}),/Conectá/);await store.connect('TEST_TOKEN_IN_MEMORY_ONLY');
 const saved=await store.mutate('save',{id:'x',revision:0,complete:true,record:{side:'Frente',kind:'Retrato',signature:'BIX-02',people:['Niños'],objects:['Triciclo']}});assert.equal(saved.image.status,'done');assert.equal(saved.image.record.side,'Frente');assert.equal(commits.get(head).files['data/collections/bixio.json'].images.x.record.objects[0],'Triciclo');
 const backup=JSON.stringify(store.db);assert(!backup.includes('TEST_TOKEN'));assert(calls.every(c=>!c.options.body?.includes('TEST_TOKEN')));
 const oldVersion=store.db.version;rejectRef=true;await assert.rejects(()=>store.mutate('save',{id:'x',revision:1,complete:false,record:{side:'Frente'}}),/repositorio cambió/);assert.equal(store.db.version,oldVersion);assert.equal(store.db.images.x.status,'done');rejectRef=false;
 const remote=commits.get(head).files['data/index.json'];remote.collections[0].version='someone-else';await assert.rejects(()=>store.mutate('save',{id:'x',revision:1,complete:false,record:{side:'Frente'}}),/otra ventana/);remote.collections[0].version=oldVersion;
 await store.create('Rodin');assert.equal(store.id,'rodin');assert.equal(store.db.name,'Rodin');assert(!store.db.signatures['BIX-01']);const signature=await store.mutate('add_signature',{name:'Firma Rodin'});assert.equal(signature.code,'FIR-01');await store.mutate('add_signature',{name:'Otra firma'});assert(store.db.signatures['FIR-02']);
 await store.open('bixio');assert.equal(store.db.images.x.record.side,'Frente');
 const apply=async(field,value,extra={})=>store.mutate('patch_field',{id:'x',revision:store.db.images.x.revision,field,value,...extra});
 await apply('identifier','0000123',{identifierType:'Barcode Aleph'});assert.equal(store.db.images.x.record.identifier,'0000123');
 await apply('author','Fotógrafo A');assert.equal(store.db.authors[0],'Fotógrafo A');
 await apply('identifiedPeople',['Ortiz, Fran','Otra persona','Ortiz, Fran']);assert.equal(store.db.images.x.record.identifiedPeople.length,2);assert.equal(store.db.images.x.status,'done');assert.equal(store.db.images.x.record.objects[0],'Triciclo');assert(store.db.images.x.fieldReviews.identifiedPeople);
 await assert.rejects(()=>apply('not-a-field','dato'),/Campo de revisión/);
 let snapshot=store.db;snapshot.images.y={id:'y',relative:'otra.tif',record:{},status:'pending',revision:0};await store.commit(snapshot);
 await assert.rejects(()=>store.mutate('patch_field',{id:'y',revision:0,field:'identifier',value:'0000123',identifierType:'Inventario'}),/ya pertenece/);
 snapshot=store.db;snapshot.images.y.record={parent:'x',side:'Reverso'};await store.commit(snapshot);
 await store.mutate('patch_field',{id:'y',revision:0,field:'identifier',value:'0000123',identifierType:'Barcode Aleph'});assert.equal(store.db.images.y.status,'pending');
 await store.mutate('patch_field',{id:'y',revision:1,field:'author',value:''});assert(store.db.images.y.fieldReviews.author);assert.equal(store.db.images.y.record.parent,'x');

 const targets=()=>['x','y'].map(id=>({id,revision:store.db.images[id].revision||0}));
 const beforeBulk=store.db,headBefore=head;
 await store.mutate('bulk_field',{field:'color',value:'sepia',targets:targets()});
 assert.notEqual(head,headBefore);for(const id of ['x','y']){assert.equal(store.db.images[id].record.color,'sepia');assert.equal(store.db.images[id].status,beforeBulk.images[id].status);assert.equal(store.db.images[id].record.identifier,beforeBulk.images[id].record.identifier);assert.equal(store.db.images[id].revision,beforeBulk.images[id].revision+1);assert(store.db.images[id].fieldReviews.color);}
 const stable=JSON.stringify(store.db),stableHead=head;
 const stale=targets();stale[1].revision--;
 await assert.rejects(()=>store.mutate('bulk_field',{field:'color',value:'byn',targets:stale}),/registro cambió/);assert.equal(JSON.stringify(store.db),stable);assert.equal(head,stableHead);
 await assert.rejects(()=>store.mutate('bulk_field',{field:'color',value:'Inválido',targets:targets()}),/listado/);
 await assert.rejects(()=>store.mutate('bulk_field',{field:'identifier',value:'duplicado',targets:targets()}),/combo/);
 await assert.rejects(()=>store.mutate('bulk_field',{field:'portrait',value:'Grupal',targets:targets()}),/corresponde/);
 rejectRef=true;await assert.rejects(()=>store.mutate('bulk_field',{field:'color',value:'byn',targets:targets()}),/repositorio cambió/);rejectRef=false;assert.equal(JSON.stringify(store.db),stable);
 await store.mutate('bulk_field',{field:'color',value:'',targets:targets()});assert.equal(store.db.images.x.record.color,'');
 const y=store.db.images.y;await assert.rejects(()=>store.mutate('patch_field',{id:'x',revision:store.db.images.x.revision,field:'parent',value:'y'}),/ciclo/);
 console.log('PASS: edición global atómica, color, revisión, estados conservados y rechazo total ante conflictos, valores inválidos o campos no aplicables.');
 store.disconnect();await assert.rejects(()=>store.create('Prueba'),/Conectá/);
 console.log('PASS: lectura pública, guardado atómico, autorización en memoria, protección contra conflictos y colecciones independientes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
