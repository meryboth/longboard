export const PICKUPS={pancho:{label:'PANCHO',points:100},disco:{label:'CALIFORNICATION',points:200},sticker:{label:'STICKER',points:150}};
export function makePickupLayout(length,obstacles=[]){
 const types=Object.keys(PICKUPS),items=[];
 for(let i=0,s=24;s<length-35;i++,s+=22){
   if(obstacles.some(o=>Math.abs(o.s-s)<7))continue;
   items.push({id:i,s,lane:i<3?0:[-3.2,-1.6,0,1.6,3.2,1.6,0,-1.6][Math.floor(i/3)%8],type:types[i%3]});
 }
 return items;
}
export function newCollection(){return {counts:{pancho:0,disco:0,sticker:0},collected:new Set(),sets:0,points:0};}
export function collectBetween(state,items,previous,next,previousLane,lane){
 const hits=[];
 for(const item of items){
   if(state.collected.has(item.id)||item.s<previous-0.7||item.s>next+0.7)continue;
   const t=Math.max(0,Math.min(1,(item.s-previous)/Math.max(.0001,next-previous)));
   const crossingLane=previousLane+(lane-previousLane)*t;
   if(Math.abs(item.lane-crossingLane)>.95)continue;
   state.collected.add(item.id);state.counts[item.type]++;
   const completeSets=Math.min(...Object.values(state.counts)),bonus=completeSets>state.sets?250:0;
   state.sets=completeSets;const points=PICKUPS[item.type].points+bonus;state.points+=points;hits.push({...item,points,bonus});
 }
 return hits;
}
