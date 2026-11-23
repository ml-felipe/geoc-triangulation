const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({console: {log() {}}});
vm.runInContext(fs.readFileSync(process.argv[2] || `${__dirname}/../src/triangulation.js`, 'utf8') + '\nthis.api={DCEL,computeTriangulation,pruneTriangulation};', context);
const {DCEL,computeTriangulation,pruneTriangulation}=context.api;
const calls={insert:0,splitEdge:0,flipEdge:0};
function topology(d) {
  const n=d.edgeNext.length;
  assert.equal(n,d.twinEdge.length);
  assert.equal(n,d.vertexBegin.length);
  assert.equal(n,d.faceRight.length);
  for(let e=0;e<n;e++) {
    assert.equal(d.twinEdge[d.twinEdge[e]],e,'twin involution');
    assert.equal(d.vertexBegin[d.edgeNext[e]],d.vertexBegin[d.twinEdge[e]],'edge endpoints');
    assert.equal(d.faceRight[d.edgeNext[e]],d.faceRight[e],'face cycle ownership');
  }
  for(let f=0;f<d.faceTable.edgeIndex.length;f++) {
    let e=d.faceTable.edgeIndex[f], start=e;
    for(let j=0;j<3;j++){assert.equal(d.faceRight[e],f);e=d.edgeNext[e];}
    assert.equal(e,start,'triangular face cycle');
  }
  let vertices=0;
  d.vertexTable.edgeIndex.forEach((e,v)=>{vertices++;assert.equal(d.vertexBegin[e],v,'vertex outgoing edge');});
  assert.equal(vertices-n/2+d.faceTable.edgeIndex.length,2,'Euler characteristic');
}
for(const method of Object.keys(calls)) {
  const original=DCEL.prototype[method];
  DCEL.prototype[method]=function(...args){const result=original.apply(this,args);calls[method]++;topology(this);return result;};
}
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function hull(points) {
 const p=[...new Map(points.map(p=>[`${p.x},${p.y}`,p])).values()].sort((a,b)=>a.x-b.x||a.y-b.y);
 const half=list=>{const out=[];for(const x of list){while(out.length>1&&orient(out.at(-2),out.at(-1),x)<=0)out.pop();out.push(x);}return out;};
 return half(p).slice(0,-1).concat(half([...p].reverse()).slice(0,-1));
}
function run(input) {
 const p=input.map(x=>({...x})), triangles=computeTriangulation(p);
 let area=0;const edges=new Map();
 for(const t of triangles) {
  assert(t.every(i=>i>=3&&i<p.length),'only real vertices in output');
  const [a,b,c]=t.map(i=>p[i]);const o=orient(a,b,c);assert(o>0,'nondegenerate CCW triangle');area+=o;
  for(let j=0;j<3;j++){const key=[t[j],t[(j+1)%3]].sort((a,b)=>a-b).join(',');edges.set(key,(edges.get(key)||0)+1);}
  for(let i=3;i<p.length;i++) {
   if(t.includes(i))continue;const q=p[i];
   const ax=a.x-q.x,ay=a.y-q.y,bx=b.x-q.x,by=b.y-q.y,cx=c.x-q.x,cy=c.y-q.y;
   const determinant=(ax*ax+ay*ay)*(bx*cy-by*cx)-(bx*bx+by*by)*(ax*cy-ay*cx)+(cx*cx+cy*cy)*(ax*by-ay*bx);
   assert(determinant<=1e-7,'empty circumcircle');
  }
 }
 for(const n of edges.values())assert(n<=2,'manifold output');
 const h=hull(input);let hullArea=0;for(let i=0;i<h.length;i++)hullArea+=h[i].x*h[(i+1)%h.length].y-h[i].y*h[(i+1)%h.length].x;
 assert(Math.abs(area-hullArea)<1e-7,`hull coverage: ${area} != ${hullArea}`);
 return {p,triangles};
}
const point=(x,y)=>({x,y});
run([point(0,0),point(10,0),point(0,10)]);
run([point(0,0),point(10,0),point(10,10),point(0,10),point(5,5)]);
run([point(0,0),point(10,0),point(0,10),point(5,0),point(0,0)]);
run([point(0,0),point(1,0),point(2,0)]);
run([]);run([point(2,3)]);
vm.runInContext(fs.readFileSync(`${__dirname}/../demo/toy_example.json.js`,'utf8'),context);
const toy=run(context.inputJSON.points);
const pruned=pruneTriangulation(toy.triangles,toy.p,context.inputJSON.boundaries);
assert(pruned.length<=toy.triangles.length);
let seed=17;
for(let k=0;k<50;k++) {const pts=[];for(let j=0;j<25;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%1000;seed=(Math.imul(seed,1664525)+1013904223)>>>0;pts.push(point(x,seed%1000));}run(pts);}
assert(calls.splitEdge>0);assert(calls.flipEdge>0);
console.log('PASS 57 point sets; topology after each operation; hull coverage and empty circumcircles',calls);
