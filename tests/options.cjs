const assert=require('node:assert/strict'),F=require('../assets/record-fields.js'),seed=require('../options.json');
const config=structuredClone(seed);config.options.side.push('Detalle nuevo');config.options.environment=['Campo'];config.terms.objects=['Cámara'];F.configure(config);
assert(F.definitions.side.options.includes('Interior'));assert.deepEqual(F.terms.objects,['Cámara']);F.validateOptions({side:'Interior',environment:'Campo'});
assert.throws(()=>F.validateOptions({side:'Inventado'}),/listado/);
F.validateOptions({side:'Frente',environment:'Estudio'},{side:'Frente',environment:'Estudio'});
assert.throws(()=>F.validateOptions({environment:'Estudio'},{environment:'Campo'}),/listado/);
const invalid=structuredClone(config);invalid.options.side=['Frente','Frente'];assert.throws(()=>F.configure(invalid),/inválida/);assert(F.definitions.side.options.includes('Interior'));
assert.throws(()=>F.configure({}),/inválida/);F.configure(seed);
console.log('PASS: JSON único, nuevas opciones, términos configurables, valores anteriores conservados y rechazo de configuraciones inválidas.');
