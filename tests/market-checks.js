import { createGameState } from '../storage/state.js';
import { createSaveStore, migrateSave, SAVE_KEY } from '../storage/save.js';
import { createMarketService, generateMarket, priceBreakdown, localMarketDay, nextMarketRefresh, validateMarketState } from '../engine/market.js';
import { createAnimal, getAnimalPhenotype } from '../engine/animal.js';
import { getAllBreeds, getBreedAppearance } from '../data/species/dog/breeds.js';
import { getNormalAlleles, getRareAlleles, hasMutation } from '../engine/genetics.js';
import { applyDevAction, commitDevState, DEV_SAVE_KEY } from '../engine/devTools.js';
import { createFormalBreeding } from '../engine/formalBreeding.js';
import { renderAnimalDetail } from '../ui/animalView.js';
const T=new Date(2026,10,24,23,59,59).getTime(), H=3600000;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const ok=r=>{if(!r.success)throw Error(r.message);return r;};
function fresh(){const s=createGameState();s.initialized=true;s.money=10000;return s;}
function setup(){const s=fresh(),disk=memory(),store=createSaveStore(disk);let t=T;store.save(s);const service=createMarketService({state:s,persist:d=>store.save(d),now:()=>t});ok(service.refresh());return {s,disk,store,service,advance:ms=>t+=ms,first:()=>s.market.listings[0]};}
function dog(s,id,location){const a=createAnimal({id,breedId:getAllBreeds()[0].id,location});s.activeAnimals[id]=a;s.pedigreeRecords[id]=structuredClone(a);}
export function runMarketChecks(){
 const results=[];const test=(name,fn)=>{try{if(!fn())throw Error('结果不符');results.push({name,success:true});}catch(e){results.push({name,success:false,message:e.message});}};
 test('旧0.4.0存档迁移不丢数据',()=>{const s=fresh();s.version='0.4.0';delete s.market;delete s.marketClockOffsetMs;s.money=321;s.inventory.foo=2;dog(s,'DOG00001','nursery');const d=migrateSave(s);return d.version==='1.0.1'&&d.market.day===null&&d.marketClockOffsetMs===0&&d.money===321&&same(d.activeAnimals.DOG00001.genotype,s.activeAnimals.DOG00001.genotype)&&d.inventory.foo===2&&s.version==='0.4.0';});
 test('每天六只且商品ID唯一',()=>{const m=generateMarket(localMarketDay(T),T);return m.listings.length===6&&new Set(m.listings.map(l=>l.id)).size===6&&validateMarketState(m);});
 test('所有现有犬种均可被随机抽取',()=>{const ids=new Set();for(let i=0;i<100;i++)for(const l of generateMarket(localMarketDay(T),T).listings)ids.add(l.animal.breedId);return getAllBreeds().every(b=>ids.has(b.id));});
 test('各犬种市场来源无突变且等位基因合法',()=>getAllBreeds().every(b=>{const pools=getBreedAppearance(b.id);for(let i=0;i<100;i++){const a=createAnimal({id:'TEST',breedId:b.id,source:'market'});if(hasMutation(a.genotype)||Object.entries(a.genotype).some(([l,v])=>v.some(x=>![...getNormalAlleles(pools[l],l),...getRareAlleles(pools[l],l)].includes(x.allele))))return false;}return true;}));
 test('市场犬为无已知血统初代',()=>generateMarket(localMarketDay(T),T).listings.every(({animal:a})=>a.source==='market'&&a.pedigree.generation===1&&a.pedigree.motherId===null&&a.pedigree.fatherId===null&&a.breeding.count===0));
 test('三个年龄定价差符合配置',()=>{const a=createAnimal({id:'TEST',breedId:getAllBreeds()[0].id,source:'market'}),p=priceBreakdown(a);return priceBreakdown({...a,stage:'juvenile'}).total-p.total===60&&priceBreakdown({...a,stage:'adult'}).total-p.total===140;});
 test('个体值价格差可计算',()=>{const a=createAnimal({id:'TEST',breedId:getAllBreeds()[0].id,source:'market'});const z=Object.fromEntries(Object.keys(a.iv).map(k=>[k,0])),m=Object.fromEntries(Object.keys(a.iv).map(k=>[k,10]));return priceBreakdown({...a,iv:m}).total-priceBreakdown({...a,iv:z}).total===180;});
 test('稀有犬种基础价与常见犬种不同',()=>{const b=getAllBreeds().find(b=>b.rarity==='rare');return !b||priceBreakdown(createAnimal({id:'TEST',breedId:b.id,source:'market'})).base===220;});
 test('外貌加价仅计算实际可见稀有色',()=>{for(const b of getAllBreeds())for(let i=0;i<50;i++){const a=createAnimal({id:'TEST',breedId:b.id,source:'market'}),p=priceBreakdown(a),ph=getAnimalPhenotype(a);if(p.appearance!==35*p.rareColors.length||(!ph.patternVisible&&p.rareColors.includes('patternColor')))return false;}return true;});
 test('同日重复刷新保持库存和价格',()=>{const {s,service}=setup(),before=JSON.stringify(s);return ok(service.refresh()).changed===false&&JSON.stringify(s)===before;});
 test('重载存档保持库存',()=>{const {s,store}=setup();return same(s.market,store.load().market);});
 test('零点精确跨日刷新',()=>{const {s,service,advance}=setup(),day=s.market.day;advance(999);if(ok(service.refresh()).changed)return false;advance(1);return ok(service.refresh()).changed&&s.market.day!==day&&s.market.listings.length===6;});
 test('零点后旧商品不能购买',()=>{const {service,advance,first,s}=setup(),id=first().id,b=JSON.stringify(s);advance(1000);return !service.buy(id).success&&JSON.stringify(s)===b;});
 test('系统时间倒退不会重新抽取商品',()=>{const {s,service,advance}=setup(),b=JSON.stringify(s);advance(-48*H);return ok(service.refresh()).changed===false&&JSON.stringify(s)===b;});
 test('距离零点计算正确',()=>nextMarketRefresh(fresh(),T)===T+1000);
 test('购买精确扣款，登记家谱事件编号',()=>{const {s,service,first,store}=setup(),l=first(),money=s.money;const a=ok(service.buy(l.id)).animal;const d=store.load();return d.money===money-l.price&&a.id==='DOG00001'&&d.nextAnimalId===2&&d.events[0].type==='acquisition'&&d.pedigreeRecords[a.id].id===a.id&&d.market.listings[0].purchasedAnimalId===a.id;});
 test('购买不重抽属性、年龄与名称',()=>{const {service,first}=setup(),l=first(),a=ok(service.buy(l.id)).animal;return ['name','genotype','iv','ev','personality','sex','stage','weightGene','exp'].every(k=>same(a[k],l.animal[k]));});
 test('购买后犬只以购买时间开始成长',()=>{const {service,advance,first}=setup();advance(-10*H);const a=ok(service.buy(first().id)).animal;return a.timestamps.lastGrowthAt===T-10*H;});
 test('重复购买与重载后重复购买均拦截',()=>{const {s,service,first,store}=setup(),id=first().id;ok(service.buy(id));const b=JSON.stringify(s);const d=store.load(),r=createMarketService({state:d,persist:x=>store.save(x),now:()=>T});return !service.buy(id).success&&!r.buy(id).success&&JSON.stringify(s)===b;});
 test('余额恰好等于售价可购买',()=>{const {s,service,first}=setup();s.money=first().price;return ok(service.buy(first().id)).success&&s.money===0;});
 test('余额不足不扣款不占用编号',()=>{const {s,service,first}=setup();s.money=first().price-1;const b=JSON.stringify(s);return !service.buy(first().id).success&&JSON.stringify(s)===b;});
 test('饲育屋满则进入电脑盒子',()=>{const {s,service,first}=setup();s.facilities.nursery.capacity=1;dog(s,'DOG00001','nursery');return ok(service.buy(first().id)).animal.location==='computer';});
 test('两个设施均满则拒绝购买',()=>{const {s,service,first}=setup();s.facilities.nursery.capacity=1;s.facilities.computer.capacity=1;dog(s,'DOG00001','nursery');dog(s,'DOG00002','computer');const b=JSON.stringify(s);return !service.buy(first().id).success&&JSON.stringify(s)===b;});
 test('编号避开永久家谱和预留犬蛋编号',()=>{const {s,service,first}=setup();s.pedigreeRecords.DOG00001={id:'DOG00001'};s.incubationTasks.push({id:'EGG00002',offspringId:'DOG00002'});return ok(service.buy(first().id)).animal.id==='DOG00003';});
 test('保存失败完整回滚购买',()=>{const {s,first}=setup(),b=JSON.stringify(s);const r=createMarketService({state:s,persist:()=>false,now:()=>T});return !r.buy(first().id).success&&JSON.stringify(s)===b;});
 test('存档抛错不改变市场库存',()=>{const s=fresh(),b=JSON.stringify(s);const r=createMarketService({state:s,persist:()=>{throw Error('模拟错误');},now:()=>T});return !r.refresh().success&&JSON.stringify(s)===b;});
 test('跨标签页过期存档拒绝购买',()=>{const {s,service,first,disk}=setup(),other=createSaveStore(disk);const d=other.load();d.money++;other.save(d);const b=JSON.stringify(s);return !service.buy(first().id).success&&JSON.stringify(s)===b;});
 test('损坏市场拒绝迁移而非重抽',()=>{const {s}=setup();s.market.listings[1].id=s.market.listings[0].id;try{migrateSave(s);}catch{return true;}return false;});
 test('开发快进更新市场日且不改变正式存档',()=>{const {s,disk}=setup(),original=disk.getItem(SAVE_KEY),dev=createSaveStore(disk,DEV_SAVE_KEY),day=s.market.day;commitDevState(s,d=>dev.save(d),d=>{applyDevAction(d,'advance',{now:T,hours:24});return d;});return s.market.day>day&&s.marketClockOffsetMs===24*H&&disk.getItem(SAVE_KEY)===original&&same(dev.load().market,s.market);});
 test('开发资金增加且独立保存',()=>{const {s,disk}=setup(),before=disk.getItem(SAVE_KEY),money=s.money,dev=createSaveStore(disk,DEV_SAVE_KEY);commitDevState(s,d=>dev.save(d),d=>{applyDevAction(d,'market-money',{now:T});return d;});return s.money===money+1000&&disk.getItem(SAVE_KEY)===before;});
 test('市场详情只读无改名和移动按钮',()=>{const {first}=setup(),html=renderAnimalDetail(first().animal,{readOnly:true});return html.includes('市场待售')&&!html.includes('data-action="rename-animal"')&&!html.includes('data-action="move-animal"')&&html.includes('完整基因型');});
 test('买入成年犬可繁育，使用正式家谱',()=>{const {s,service,first}=setup();const l=first(),breed=l.animal.breedId;l.animal=createAnimal({id:l.id,breedId:breed,stage:'adult',sex:'female',source:'market'});l.animal.breeding={count:0,lastSuccessAt:null};l.price=priceBreakdown(l.animal).total;const a=ok(service.buy(l.id)).animal;const male=createAnimal({id:'DOG00002',breedId:breed,stage:'adult',sex:'male'});s.activeAnimals[male.id]=male;s.pedigreeRecords[male.id]=structuredClone(male);const r=createFormalBreeding({state:s,persist:()=>true,now:()=>T});return ok(r.breed(a.id,male.id)).egg.motherId===a.id;});
 return results;
}
