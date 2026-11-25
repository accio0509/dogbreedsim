// IDs are internal only. One node per recorded dog; parent edges always point downward.
export function buildFamilyGraph(records,focus,full=false,eggs=[]){
 const by=new Map(Object.values(records).map(a=>[a.id,a]));if(!by.has(focus))return {nodes:[],pairs:[],edges:[],routes:[],junctions:[],width:0,height:0};
 const parents=new Map(),children=new Map(),mates=new Map(),pairs=new Map();
 const add=(m,k,v)=>{if(!m.has(k))m.set(k,new Set());m.get(k).add(v);};
 function pair(f,m){if(!f||!m||!by.has(f)||!by.has(m))return null;const key=JSON.stringify([f,m]);if(!pairs.has(key))pairs.set(key,{father:f,mother:m,children:[],pending:0});add(mates,f,m);add(mates,m,f);return pairs.get(key);}
 for(const a of by.values()){const {fatherId:f,motherId:m}=a.pedigree??{};for(const p of [f,m])if(by.has(p)&&p!==a.id){add(parents,a.id,p);add(children,p,a.id);}const u=pair(f,m);if(u)u.children.push(a.id);}
 for(const e of eggs){const u=pair(e.fatherId,e.motherId);if(u)u.pending++;}
 const selected=new Set([focus]);function walk(map,limit){let layer=[focus];const seen=new Set(layer);for(let d=0;d<limit&&layer.length;d++){const next=[];for(const id of layer)for(const v of map.get(id)??[])if(!seen.has(v)){seen.add(v);selected.add(v);next.push(v);}layer=next;}}
 if(full){const queue=[focus];for(let i=0;i<queue.length;i++)for(const map of [parents,children,mates])for(const id of map.get(queue[i])??[])if(!selected.has(id)){selected.add(id);queue.push(id);}}else{walk(parents,4);walk(children,4);}
 const nodes=[...selected].map(id=>({id,animal:by.get(id),rank:0}));const nodeMap=new Map(nodes.map(n=>[n.id,n]));const edges=[];const indegree=new Map(nodes.map(n=>[n.id,0]));for(const id of selected)for(const p of parents.get(id)??[])if(selected.has(p)){edges.push({parent:p,child:id});indegree.set(id,indegree.get(id)+1);}
 const q=nodes.filter(n=>!indegree.get(n.id));for(let i=0;i<q.length;i++){const n=q[i];for(const c of children.get(n.id)??[])if(selected.has(c)){const child=nodeMap.get(c);child.rank=Math.max(child.rank,n.rank+1);indegree.set(c,indegree.get(c)-1);if(!indegree.get(c))q.push(child);}}
 const rows=new Map();for(const n of nodes){if(!rows.has(n.rank))rows.set(n.rank,[]);rows.get(n.rank).push(n);}
 // Barycentric sweeps reduce crossings; deterministic ties retain existing order.
 const ranks=[...rows.keys()].sort((a,b)=>a-b);for(let pass=0;pass<6;pass++){const down=pass%2===0;for(const rank of down?ranks:[...ranks].reverse()){const row=rows.get(rank),positions=new Map();for(const r of rows.values())r.forEach((n,i)=>positions.set(n.id,(i+.5)/r.length));const avg=n=>{const ids=[...(down?parents:children).get(n.id)??[]].filter(id=>selected.has(id));return ids.length?ids.reduce((v,id)=>v+positions.get(id),0)/ids.length:positions.get(n.id);};row.sort((a,b)=>avg(a)-avg(b));}}
 const visiblePairs=[...pairs.values()].filter(p=>selected.has(p.father)&&selected.has(p.mother)&&(full||p.children.some(c=>selected.has(c)))).map(p=>({...p,children:p.children.filter(c=>selected.has(c))}));
 const rowMax=Math.max(1,...[...rows.values()].map(r=>r.length)),step=208,margin=48;
 const demands=new Map();const bump=rank=>demands.set(rank,(demands.get(rank)??0)+1);for(const p of visiblePairs){bump(nodeMap.get(p.father).rank);bump(nodeMap.get(p.mother).rank);}for(const e of edges)bump(nodeMap.get(e.parent).rank);
 const bandFor=r=>Math.max(88,26+(demands.get(r)??0)*4),rowY=new Map();let height=margin;for(let rank=0;rank<=ranks.at(-1);rank++){rowY.set(rank,height);height+=84+bandFor(rank);}height+=margin;const width=rowMax*step+2*margin;
 // Fixed column grid guarantees vertical routing channels never pass through cards.
 for(const [rank,row] of rows){const offset=Math.floor((rowMax-row.length)/2);row.forEach((n,i)=>{n.x=margin+(offset+i)*step;n.y=rowY.get(rank);});}
 const lanes=Array.from({length:rowMax+1},(_,i)=>[-15,-23,-31,-39].map(dx=>margin+i*step+dx)).flat(),used=new Map(),bandUse=new Map();
 function corridor(rank){const count=bandUse.get(rank)??0;bandUse.set(rank,count+1);return rowY.get(rank)+84+10+count*4;}
 function channel(a,b){const lo=Math.min(a.rank,b.rank),hi=Math.max(a.rank,b.rank),center=(a.x+b.x)/2+80;const sorted=lanes.map((x,i)=>({x,i,conflicts:used.get(i)?.filter(r=>r[0]<=hi&&r[1]>=lo).length??0,score:Math.abs(x-center)})).sort((a,b)=>a.conflicts-b.conflicts||a.score-b.score);const l=sorted[0];if(!used.has(l.i))used.set(l.i,[]);used.get(l.i).push([lo,hi]);return l.x;}
 const path=pts=>'M'+pts.map(p=>p.join(' ')).join(' L');const routes=[],junctions=[];const pairedEdges=new Set();
 for(const p of visiblePairs){const f=nodeMap.get(p.father),m=nodeMap.get(p.mother),x=channel(f,m),fy=corridor(f.rank),my=corridor(m.rank),joinY=Math.max(fy,my);junctions.push({x,y:joinY,pending:p.pending});routes.push({type:full?'mate':'parent',points:[[f.x+80,f.y+84],[f.x+80,fy],[x,fy],[x,joinY],[x,my],[m.x+80,my],[m.x+80,m.y+84]]});for(const id of p.children){const c=nodeMap.get(id);if(c.rank<=Math.max(f.rank,m.rank))continue;const y=c.y-9;routes.push({type:'parent',points:[[x,joinY],[x,y],[c.x+80,y],[c.x+80,c.y]]});pairedEdges.add(JSON.stringify([p.father,id]));pairedEdges.add(JSON.stringify([p.mother,id]));}}
 for(const e of edges){if(pairedEdges.has(JSON.stringify([e.parent,e.child])))continue;const a=nodeMap.get(e.parent),b=nodeMap.get(e.child);if(a.rank>=b.rank)continue;const x=channel(a,b),y=corridor(a.rank),yy=b.y-9;routes.push({type:'parent',points:[[a.x+80,a.y+84],[a.x+80,y],[x,y],[x,yy],[b.x+80,yy],[b.x+80,b.y]]});}
 for(const r of routes)r.d=path(r.points);
 return {nodes,edges,pairs:visiblePairs,routes,junctions,width,height,cycle:q.length!==nodes.length};
}
