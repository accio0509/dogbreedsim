// Completion flags belong to tasks, so reloading does not repeat notices.
const kinds={trainingTasks:'训练',explorationTasks:'探索',competitionTasks:'比赛'};
const stageNames={puppy:'幼犬',juvenile:'青年犬',adult:'成年犬'};
const rank={puppy:0,juvenile:1,adult:2};
export function notificationSnapshot(state){
 return {stages:Object.fromEntries(Object.values(state.activeAnimals).map(a=>[a.id,a.stage])),tasks:Object.fromEntries(Object.keys(kinds).map(k=>[k,(state[k]??[]).map(t=>({...t}))]))};
}
export function collectNotifications(state,previous,now){
 const messages=[];
 if(!state.initialized)return messages;
 for(const a of Object.values(state.activeAnimals)){
  const old=previous.stages[a.id];
  if(rank[a.stage]>rank[old])messages.push(`${a.name} 成长为${stageNames[a.stage]}！`);
 }
 for(const [key,label] of Object.entries(kinds)){
  const list=state[key]??[];
  for(const t of list){
   if(now>=t.endsAt&&!t.completionNotified){t.completionNotified=true;messages.push(`${state.activeAnimals[t.animalId]?.name??'犬只'} ${label}结束，可以领取奖励。`);}
  }
  // Handle a claim made before the next periodic check.
  for(const t of previous.tasks[key]??[]){
   if(!t.completionNotified&&now>=t.endsAt&&!list.some(x=>x.animalId===t.animalId&&x.startedAt===t.startedAt))messages.push(`${state.activeAnimals[t.animalId]?.name??'犬只'} ${label}结束。`);
  }
 }
 return messages;
}
export function hasReadyNotice(state,now){return Object.keys(kinds).some(k=>(state[k]??[]).some(t=>now>=t.endsAt&&!t.completionNotified));}
