const assert=require('assert/strict'),F=require('../assets/record-fields.js');
const images=[{id:'a',record:{kind:'Retrato',author:'Autor A'}},{id:'b',record:{},fieldReviews:{author:'today'}},{id:'c',record:{},status:'done'}];
assert.equal(F.stats(images,'author').total,3);assert.equal(F.stats(images,'author').filled,1);assert.equal(F.stats(images,'author').reviewed,1);assert.deepEqual(F.candidates(images,'author','missing').map(i=>i.id),['c']);assert.equal(F.candidates(images,'author','all').length,3);assert.equal(F.candidates(images,'portrait','missing').length,1);
assert.equal(F.normalize({identifier:' 0000123 '}).identifier,'0000123');assert.deepEqual(F.normalize({identifiedPeople:['Apellido, Nombre',' Persona ','Persona']}).identifiedPeople,['Apellido, Nombre','Persona']);assert.throws(()=>F.normalize({identifier:123}),/inválido/);
console.log('PASS: campos nuevos vacíos, filtros de revisión, retratos aplicables, nombres repetibles y ceros iniciales.');

assert.equal(F.normalize({displayOrder:'2'}).displayOrder,2);
assert.throws(()=>F.normalize({displayOrder:'-1'}),/orden/);
assert.throws(()=>F.validateIdentifier({images:{a:{id:'a',record:{}},b:{id:'b',record:{parent:'a'}}}},'a',{parent:'b'}),/ciclo/);
