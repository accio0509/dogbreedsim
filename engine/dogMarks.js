// Optional, non-heritable management labels. Old saves need no migration.
export const DOG_MARKS=Object.freeze({heart:{icon:'❤️',name:'爱心'},dumbbell:{icon:'🏋️',name:'哑铃'},dna:{icon:'🧬',name:'DNA'}});
export function getDogMarks(a){return Object.keys(DOG_MARKS).filter(k=>Array.isArray(a?.marks)&&a.marks.includes(k));}
export function toggleDogMark(s,id,key){
 const a=Object.hasOwn(s.activeAnimals,id)?s.activeAnimals[id]:null;
 if(!a||a.retired||a.source==='rental')return {success:false,message:'只能标记自有犬只'};
 if(!Object.hasOwn(DOG_MARKS,key))return {success:false,message:'未知标记'};
 const record=s.pedigreeRecords[id];if(!record)return {success:false,message:'血统档案不存在'};
 const next=new Set(getDogMarks(a));const removed=next.delete(key);if(!removed)next.add(key);
 a.marks=Object.keys(DOG_MARKS).filter(k=>next.has(k));record.marks=[...a.marks];
 return {success:true,message:`${removed?'已取消':'已添加'}${DOG_MARKS[key].name}标记`};
}
export function dogMarkText(a){return getDogMarks(a).map(k=>DOG_MARKS[k].icon+' '+DOG_MARKS[k].name).join('、');}
