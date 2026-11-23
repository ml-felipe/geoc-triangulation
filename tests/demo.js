// Exercise the recovered demo's index handling without a browser dependency.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
let draws = 0;
const ctx = new Proxy({}, {get: (_, key) => (...args) => {
  if (['arc', 'moveTo', 'lineTo'].includes(key)) {
    assert.ok(args.slice(0, key === 'arc' ? 5 : 2).every(Number.isFinite)); draws++;
  }
}, set: () => true});
const canvas = {width:1024, height:768, getContext:()=>ctx};
const label = {innerHTML:''};
const sandbox = {console:{log(){}}, performance, window:{addEventListener(_,fn){fn();}},
  document:{getElementsByTagName:()=>[canvas], getElementById:id=>id==='time_label'?label:{checked:true}}};
vm.createContext(sandbox);
for (const file of ['demo/toy_example.json.js','src/triangulation.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
const html=fs.readFileSync(path.join(root,'demo/index.html'),'utf8');
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
vm.runInContext(script,sandbox);
sandbox.doTriangulate();
const first=JSON.stringify(sandbox.triangles);
sandbox.toggleShowBoundaries();
sandbox.doPruneBoundaries();
sandbox.doTriangulate();
assert.equal(JSON.stringify(sandbox.triangles),first);
assert.equal(sandbox.points.length,sandbox.inputJSON.points.length+3);
assert.ok(draws>0);
console.log('PASS demo callbacks: finite drawing coordinates, boundaries, pruning, repeat triangulation');
