import { ellipse, poly, star } from './artwork.mjs';
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000">${body}</svg>`;
const path = (d, fill, stroke, width=8) => `<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const bg = (color,body='')=>svg(`<path fill="${color}" d="M0 0H1600V2000H0Z"/>${body}`);
const cloud=(x,y,s=1,color='#ffffff')=>`<path transform="translate(${x} ${y}) scale(${s})" fill="${color}" d="M-130 30C-183-24-130-81-76-65C-69-157 71-164 96-65C173-76 197 23 130 37Z"/>`;
const stars=(color='#d7d4e9')=>[[120,170,25],[1460,140,24],[1440,640,14],[180,1220,21],[1430,1480,22],[340,1850,16],[1310,1830,16]].map(([x,y,r])=>path(star(x,y,r),color)).join('');
const hill=(y,c,offset=0)=>path(`M0 ${y}Q${430+offset} ${y-170} 800 ${y+30}Q1200 ${y-210} 1600 ${y}V2000H0Z`,c);
const flower=(x,y,s=1,color='#edc1cf')=>`<g transform="translate(${x} ${y}) scale(${s})">${[0,1,2,3,4].map(i=>path(ellipse(Math.cos(i*Math.PI*.4)*24,Math.sin(i*Math.PI*.4)*24,20),color)).join('')}${path(ellipse(0,0,13),'#eed7a1')}</g>`;
export const backgrounds = [
 {id:'white',name:'まっしろ',svg:bg('#ffffff')},
 {id:'sky-island',name:'あおぞらのしま',svg:bg('#ecf8fb',cloud(200,330,1.4)+cloud(1390,580,1)+hill(1780,'#dceee0')+hill(1890,'#f3eacb',200))},
 {id:'flower-meadow',name:'お花のひろば',themeId:'flowers',svg:bg('#fffaf2',hill(1780,'#e3efde')+[[150,1810,1.3],[1410,1750,1.1],[360,1920,.9],[1250,1920,1.3],[1450,380,.7]].map(p=>flower(...p)).join(''))},
 {id:'sunset-sea',name:'夕焼けの海',themeId:'ocean',svg:bg('#fff1eb',path(ellipse(1280,500,180),'#f8ded0')+hill(1690,'#e0e7ee')+hill(1820,'#cfdfe8',160)+path('M0 1930Q390 1840 730 1950Q1200 1850 1600 1910V2000H0Z','#f0e7d5'))},
 {id:'starry-sky',name:'ほしぞら',svg:bg('#edf0f9',stars()+path('M1370 270Q1190 357 1260 530Q1060 429 1175 262Q1250 168 1370 270Z','#e4dcae'))},
 {id:'forest-clearing',name:'森のひろば',themeId:'animals',svg:bg('#f2f8ee',hill(1810,'#e1ecda')+path('M60 1840L93 850H139L181 1840Z','#d8d4bc')+path('M1450 1850L1488 740H1529L1571 1850Z','#d8d4bc')+path(ellipse(100,650,228,480),'#deead6')+path(ellipse(1518,550,220,430),'#deead6'))},
 {id:'future-city',name:'みらいのまち',themeId:'robots',svg:bg('#f1f8fa',hill(1860,'#e2eced')+path('M0 1790V1390Q0 1340 50 1340H150V1150Q200 1090 250 1150V1850ZM1600 1850H1360V1230Q1410 1180 1460 1230V1460H1550V1360H1600Z','#dbe9ee')+path('M80 1480H150M80 1570H150M1400 1360H1430M1400 1450H1430M1400 1540H1430','none','#c6dbe2',16)+cloud(190,420,.8,'#e1edf1'))},
 {id:'underwater',name:'うみのなか',themeId:'ocean',svg:bg('#edf9fa',path('M0 0H390L1140 2000H780Z','#f5fcfc')+hill(1850,'#e4ead9')+[ [150,480,46],[1390,800,40],[1460,1140,29],[100,1500,35]].map(([x,y,r])=>path(ellipse(x,y,r),'none','#d4e8ec',8)).join('')+path('M40 2000Q180 1770 50 1540Q280 1700 180 2000M1420 2000Q1380 1680 1570 1520Q1460 1810 1550 2000Z','#d5e8db'))},
 {id:'outer-space',name:'宇宙空間',themeId:'space',svg:bg('#eff0f8',stars('#d2d6e8')+path(ellipse(1385,550,140),'#e0ddef')+path('M1198 595Q1330 670 1570 435M114 1445L181 1445M147 1412L147 1478','none','#d0cce2',17)+path(ellipse(220,1800,70),'#e1e6f0'))},
 {id:'castle-garden',name:'お城の庭',themeId:'princess',svg:bg('#fff7f3',hill(1830,'#e5eddb')+path('M0 1700V960H62V900H114V960H176V1600H235V1120H283V1060H337V1120H381V1770ZM1600 1740H1431V971H1478V909H1527V971H1574V1060H1600Z','#eedfe1')+path('M18 1690Q167 1590 302 1730M1330 1810Q1450 1690 1600 1770','none','#d7e3cb',58)+flower(150,1770,1.1)+flower(1470,1790,1.1))},
 {id:'planet-surface',name:'わくせいのだいち',themeId:'space',svg:bg('#f4f0f8',stars('#d8d0e5')+path(ellipse(1370,420,104),'#e7dbe9')+hill(1760,'#e4dce6')+path(ellipse(320,1880,150,43),'#d5ccdd')+path(ellipse(1340,1840,100,32),'#d5ccdd'))},
];
const motif=(kind,x,y,size=36,color='#b6cde3')=>{
 const g=body=>`<g transform="translate(${x} ${y}) scale(${size/36})">${body}</g>`;
 const line='#8ba4b4';
 const leaf=path('M-31 22Q-47-35 33-28Q49 27-31 22Z',color)+path('M-25 18L26-22','none',line,4);
 if(kind==='star')return path(star(x,y,size),color);
 if(kind==='dot')return path(ellipse(x,y,size*.68),color);
 if(kind==='drop')return g(path('M0-37C60 24 20 49 0 42C-38 41-49 5 0-37Z',color));
 if(kind==='cloud')return cloud(x,y,size/125,'#ffffff');
 if(kind==='rainbow')return g(['#e8a2b9','#ecd393','#b6d8b8','#a6cce8'].map((c,i)=>path(`M${-36+i*8} 23A${36-i*8} ${36-i*8} 0 0 1 ${36-i*8} 23`,'none',c,7)).join(''));
 if(kind==='wave')return g(path('M-39 8Q-26-25-9-5Q6 15 21-10Q24 12 39 15M-39 28Q-19 8 0 23Q19 37 39 21','none',color,7));
 if(kind==='leaf')return g(leaf);
 if(kind==='crown')return g(path('M-34 23L-39-27L-12-6L0-35L16-7L38-26L32 23Z',color,line,3));
 if(kind==='gem')return g(path(poly([[-32,-13],[-13,-33],[17,-33],[33,-13],[0,33]]),color,line,3)+path('M-32-13H33M-13-33L0 33L17-33','none',line,3));
 if(kind==='moon')return g(path('M17-35C-49-38-45 43 14 36C-19 18-17-17 17-35Z',color));
 if(kind==='paw')return g(path(ellipse(0,14,23,18),color)+[[-24,-10],[-8,-24],[12,-23],[27,-7]].map(([a,b])=>path(ellipse(a,b,8,11),color)).join(''));
 if(kind==='shell')return g(path('M-18 31Q-48-1-32-19Q-29-38-11-26Q0-45 13-26Q36-39 37-15Q50 0 18 31Z',color,line,3)+path('M0 25V-21M-7 24L-23-15M8 24L26-14','none',line,3));
 if(kind==='bone')return g(path('M-18-14Q-36-38-43-16Q-49 0-26 5L14 28Q35 48 44 24Q45 7 26 4Z',color,line,3));
 if(kind==='tire')return g(path(ellipse(0,0,34),line)+path(ellipse(0,0,20),color)+path('M0-18V18M-18 0H18','none',line,4));
 if(kind==='road')return g(path('M-35-14H35V14H-35Z',color)+path('M-29 0H-10M9 0H29','none','#ffffff',5));
 if(kind==='cone')return g(path('M-28 23L-7-32H8L28 23Z',color)+path('M-19 0H18L24 12H-24Z','#fffaf3')+path('M-34 24H34V34H-34Z',line));
 if(kind==='gear')return g(path(star(0,0,38,29,10),color)+path(ellipse(0,0,13),'#fffdf8',line,3));
 if(kind==='circuit')return g(path('M-34 20H-8V-20H25M-8 0H25','none',color,7)+path(ellipse(27,-20,7),color)+path(ellipse(27,0,7),color));
 if(kind==='planet')return g(path(ellipse(0,0,27),color)+path('M-39 18Q0 28 40-24','none',line,7));
 if(kind==='fruit')return g(path('M0-18C-38-46-49 22-13 33Q0 27 13 33C49 22 38-46 0-18Z',color)+path('M0-18Q13-43 32-28Q13-8 0-18Z','#aed0ad'));
 if(kind==='candy')return g(path('M-22-9L-45-26V25L-22 9M22-9L45-26V25L22 9',color)+path(ellipse(0,0,24),color,line,3));
 if(kind==='flower')return flower(x,y,size/44,color);
 if(kind==='block')return g(path(poly([[-27,-17],[0,-32],[29,-17],[29,18],[0,33],[-27,18]]),color,line,3)+path('M-27-17L0 0L29-17M0 0V33','none',line,3));
 if(kind==='ball')return g(path(ellipse(0,0,32),color,line,3)+path('M0-32Q-37-3 0 32M0-32Q36-3 0 32','none','#fffaf3',5));
 if(kind==='crayon'||kind==='pencil')return g(path('M-30-10H18L36 0L18 10H-30Z',color,line,3)+path('M-20-10V10M16-9V9','none','#fffaf3',4));
 return '';
};
const colors=['#e8a2b9','#a6cce8','#b6d8b8','#ecd393','#c9b6e3'];
function frame(id,name,kinds,{themeId,base='#f9fcff',outline='#d4e7ed'}={}){
 let body=`<path d="M40 40H1560V1960H40Z" fill="none" stroke="${base}" stroke-width="80" stroke-linejoin="round"/><path d="M16 16H1584V1984H16Z" fill="none" stroke="${outline}" stroke-width="10" stroke-linejoin="round"/>`;
 const positions=[];for(let i=0;i<6;i++){positions.push([100+i*280,55],[100+i*280,1945]);}for(let i=0;i<6;i++){positions.push([55,285+i*285],[1545,285+i*285]);}
 body+=positions.map(([x,y],i)=>motif(kinds[i%kinds.length],x,y,31,colors[i%colors.length])).join('');
 return {id,name,...(themeId?{themeId}:{}),svg:svg(body)};
}
export const frames=[
 {id:'none',name:'なし',svg:svg('')},
 {id:'simple-white',name:'シンプル白',svg:svg('<path d="M35 35H1565V1965H35Z" fill="none" stroke="#ffffff" stroke-width="70"/><path d="M12 12H1588V1988H12Z" fill="none" stroke="#e5e7ec" stroke-width="6"/>')},
 frame('color-dots','カラードット',['dot']),frame('color-drops','色のしずく',['drop']),frame('rainbow-clouds','虹と雲',['cloud','rainbow'],{base:'#e8f5fd'}),frame('little-stars','ちいさな星',['star']),frame('gentle-waves','なみのおと',['wave'],{base:'#e8f6fa'}),frame('crayons','クレヨン',['crayon']),frame('pencils','いろえんぴつ',['pencil']),
 frame('royal-jewels','王冠と宝石',['crown','gem'],{themeId:'princess',base:'#fff7ef'}),
 frame('magic-night','星と月',['star','moon'],{themeId:'magic',base:'#f8f3ff'}),
 frame('forest-paws','足あとと葉っぱ',['paw','leaf'],{themeId:'animals',base:'#f2faf0'}),
 frame('ocean-shells','貝がらとあわ',['shell','dot'],{themeId:'ocean',base:'#edf9fc'}),
 frame('dino-fossils','化石とシダ',['bone','leaf'],{themeId:'dinosaurs',base:'#f4f8ee'}),
 frame('happy-road','タイヤとみち',['tire','road'],{themeId:'vehicles'}),
 frame('work-zone','コーンとしましま',['cone','road'],{themeId:'construction',base:'#fff9e9'}),
 frame('robot-circuit','歯車と回路',['gear','circuit'],{themeId:'robots',base:'#eef7fb'}),
 frame('space-orbit','惑星と星',['planet','star'],{themeId:'space',base:'#f3f1fb'}),
 frame('sweet-fruit','おかしとくだもの',['candy','fruit'],{themeId:'food',base:'#fff7f0'}),
 frame('flower-leaves','お花と葉っぱ',['flower','leaf'],{themeId:'flowers',base:'#fff6f7'}),
 frame('toy-box','つみきとボール',['block','ball'],{themeId:'toys',base:'#f6f9ef'}),
];
