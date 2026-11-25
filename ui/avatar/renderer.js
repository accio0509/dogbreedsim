import {getAnimalPhenotype} from '../../engine/animal.js';
import {HEADS,EARS,BREED_TEMPLATES,BREED_PROFILES} from './templates.js';
import {patternMarkup} from './patterns.js';
import {SVG_AVATARS_ENABLED} from './settings.js';
const hex=(v,f)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 独立纯函数：不修改犬只、基因型或存档。输出 SVG，供未来手绘实现替换。
export function renderPortrait(breedId,p){
 const [head,ear,mw,mh]=Object.hasOwn(BREED_TEMPLATES,breedId)?BREED_TEMPLATES[breedId]:['round','drop',20,14];
 const base=hex(p?.coatColor?.hex,'#B0A096'),mark=hex(p?.patternColor?.hex,base),eye=hex(p?.eyeColor?.hex,'#493124');
 const long=p?.hairLength?.allele==='L3',medium=p?.hairLength?.allele==='L2';
 const [custom,dx,ey,er,my,nw,fw]=Object.hasOwn(BREED_PROFILES,breedId)?BREED_PROFILES[breedId]:[null,16,44,5,61,7,1];
 const ears=EARS[ear], face=custom||HEADS[head];
 // 顺时针的附加毛发轮廓，与头部组成非零绕组并集。
 const fur=long?'M22 39 L78 39 Q84 47 90 55 L82 54 Q86 63 91 68 L79 66 Q81 74 83 78 L68 74 L63 84 L50 79 L37 84 L32 74 L17 78 Q19 74 21 66 L9 68 Q14 63 18 54 L10 55 Q16 47 22 39Z':medium?'M24 43 L76 43 Q81 49 85 56 L79 55 Q83 63 86 67 L75 65 L72 76 L61 73 L50 81 L39 73 L28 76 L25 65 L14 67 Q17 63 21 55 L15 56 Q19 49 24 43Z':'';
 const fittedFur=fur.replace(/([MLQ])([^MLQZ]+)/g,(_,cmd,coords)=>{let i=0;return cmd+coords.replace(/-?\d+(?:\.\d+)?/g,n=>i++%2===0?String(Math.round((50+(Number(n)-50)*fw)*10)/10):n);});
 const silhouette=face+(fittedFur?' '+fittedFur:'');
 // 先画全部外轮廓，再以同色填充并集，覆盖内部交叠线。
 const headMarkup=fur?`<path d="${silhouette}" fill="none" stroke-width="1.7"/><path d="${silhouette}" stroke="none"/>`:`<path d="${face}"/>`;
 const pattern=p?.patternVisible?patternMarkup(p.pattern?.allele,mark,base):'';
 return `<svg class="dog-portrait-svg" viewBox="0 0 100 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="${base}" stroke="#78695e" stroke-width="0.85" stroke-linejoin="round"><path d="${ears}"/><path d="${ears}" transform="translate(100 0) scale(-1 1)"/>${headMarkup}</g><g style="clip-path:path('${silhouette}')"><rect width="100" height="88" fill="transparent"/>${pattern}<ellipse cx="50" cy="${my}" rx="${mw}" ry="${mh}" fill="none" stroke="#78695e" stroke-opacity=".25" stroke-width=".7"/></g><g fill="${eye}" stroke="#272126" stroke-width=".9"><circle cx="${50-dx}" cy="${ey}" r="${er}"/><circle cx="${50+dx}" cy="${ey}" r="${er}"/></g><g fill="#211e21"><circle cx="${50-dx}" cy="${ey}" r="${er*.54}"/><circle cx="${50+dx}" cy="${ey}" r="${er*.54}"/><path d="M${50-nw} ${my-6} Q50 ${my-10} ${50+nw} ${my-6} Q${51+nw} ${my-1} 50 ${my+3} Q${49-nw} ${my-1} ${50-nw} ${my-6}Z" stroke="#888186" stroke-width="1.05" stroke-linejoin="round"/><ellipse cx="${50-nw*.18}" cy="${my-5.7}" rx="${nw*.40}" ry="1.05" fill="#b6adb3" opacity=".66"/></g><g fill="#fff"><circle cx="${49-dx}" cy="${ey-2}" r="1.4"/><circle cx="${49+dx}" cy="${ey-2}" r="1.4"/></g><path transform="translate(0 ${my-61})" d="M50 63 V67 M42 67 Q46 73 50 67 Q54 73 58 67" fill="none" stroke="#a29a9c" stroke-width="2.8" stroke-opacity=".8" stroke-linecap="round"/><path transform="translate(0 ${my-61})" d="M50 63 V67 M42 67 Q46 73 50 67 Q54 73 58 67" fill="none" stroke="#282327" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
export function renderDogAvatar(animal,{large=false,phenotype=null}={}){
 let p=phenotype;try{p??=getAnimalPhenotype(animal);}catch{p=null;}
 const base=hex(p?.coatColor?.hex,'#B0A096');
 const label=esc(animal?.name??'犬只');
 const cls=`animal-placeholder${large?' large':''}`;
 if(!SVG_AVATARS_ENABLED||!p)return `<div class="${cls}" style="background:${base}" role="img" aria-label="${label}"></div>`;
 return `<div class="${cls} dog-portrait" style="background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden" role="img" aria-label="${label}">${renderPortrait(animal.breedId,p).replace('class="dog-portrait-svg"','class="dog-portrait-svg" width="100%" height="100%"')}</div>`;
}
