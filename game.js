(()=>{
let W=960;const H=540,GY=420,HOME=700;
const APP=!!window.NINJA_APP;
const cv=document.getElementById('game');
const ctx=cv.getContext('2d');
// In the phone app the playfield widens to the screen shape (16:9 up to ~21:9), so there are no black bars.
function fit(){
  if(APP){
    const st=cv.parentElement,sw=st.clientWidth||innerWidth,sh=st.clientHeight||innerHeight;
    W=Math.round(Math.max(960,Math.min(1280,540*sw/sh)));
    const k=Math.min(sw/W,sh/H);cv.style.width=W*k+'px';cv.style.height=H*k+'px';
  }
  const d=Math.min(window.devicePixelRatio||1,APP?3:2);cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
}
fit();addEventListener('resize',fit);

const C={blood:'#e0383f',gold:'#d9a441',paper:'#ece4d4',ink:'#15151c',rim:'#545a9a'};
const FONT='"Russo One","Arial Black",sans-serif';
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{const s=Math.sin(n*127.1+.3)*43758.5453;return s-Math.floor(s);};
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

const LEVELS=[
 {name:'Ночной город',sub:'Крыши спящей столицы',en:"Night City",enSub:'Rooftops of the sleeping capital',es:"Ciudad nocturna",esSub:'Tejados de la capital dormida',len:1400,speed:340,
  sky:['#070818','#1d1536','#46213d'],stars:true,moon:{x:760,y:115,r:54,c:'#f6ead2',glow:'255,230,200',craters:true},
  far:'#231a3c',farType:'hills',mid:'pagoda',midCol:'#160f29',fog:'70,33,61',roof:'tile',amb:'petal',flyer:'crow',
  sam:['#6e1d2a','#8a2635'],mix:{sam:.42,spike:.22,fly:.18,archer:0},boss:'shogun',accent:'#e0383f'},
 {name:'Бамбуковый лес',sub:'Мосты над туманом',en:"Bamboo Forest",enSub:'Bridges above the mist',es:"Bosque de bambú",esSub:'Puentes sobre la niebla',len:1600,speed:355,
  sky:['#0b1f1c','#244a38','#b9a86a'],stars:false,moon:{x:700,y:160,r:72,c:'#f3e6b8',glow:'250,230,170'},
  far:'#1d3a30',farType:'hills',mid:'bamboo',midCol:'#123024',fog:'70,100,70',roof:'bridge',amb:'leaf',flyer:'bat',
  sam:['#2f5a3a','#3d7048'],mix:{sam:.32,spike:.25,fly:.25,archer:.3},boss:'tengu',accent:'#6fae6a'},
 {name:'Снежные горы',sub:'Перевал над облаками',en:"Snowy Mountains",enSub:'A pass above the clouds',es:"Montañas nevadas",esSub:'Un paso sobre las nubes',len:1800,speed:370,
  sky:['#0b1430','#33497e','#a9bce0'],stars:true,moon:{x:240,y:100,r:40,c:'#eef4ff',glow:'220,235,255',craters:true},
  far:'#2b3d6b',farType:'peaks',mid:'pines',midCol:'#18234a',fog:'190,205,235',roof:'ice',amb:'snow',flyer:'owl',
  sam:['#cfd6e6','#8fa2c4'],mix:{sam:.36,spike:.3,fly:.3,archer:.32},boss:'yuki',accent:'#9fc8ff'},
 {name:'Замок сёгуна',sub:'Последняя ночь',en:"Shogun's Castle",enSub:'The last night',es:"Castillo del shogun",esSub:'La última noche',len:2000,speed:385,
  sky:['#12040a','#3d0b12','#8a2a14'],stars:true,moon:{x:720,y:130,r:84,c:'#e8693a',glow:'255,110,60'},
  far:'#2a0a12',farType:'hills',mid:'castle',midCol:'#1a060c',fog:'120,30,20',roof:'stone',amb:'ember',flyer:'wisp',
  sam:['#26262e','#44444f'],mix:{sam:.45,spike:.3,fly:.3,archer:.36},boss:'oni',accent:'#ff7a3a'}
];
const BOSSES={
 shogun:{name:'Красный Сёгун',en:'Red Shogun',es:'Shogun Rojo',hp:16,w:70,h:112,fly:false,attacks:['wave','slash','charge']},
 tengu:{name:'Тэнгу',en:'Tengu',es:'Tengu',hp:22,w:76,h:70,fly:true,attacks:['feathers','dive','feathers','gust']},
 yuki:{name:'Юки-онна',en:'Yuki-onna',es:'Yuki-onna',hp:26,w:60,h:100,fly:true,attacks:['shards','icicles','wave']},
 oni:{name:'Демон Они',en:'Oni Demon',es:'Demonio Oni',hp:34,w:110,h:150,fly:false,attacks:['pound','fireballs','sweep','fireballs']}
};

let best=0;try{best=+localStorage.getItem('ninja-best2')||0}catch(e){}
let saved=0;try{saved=+localStorage.getItem('ninja-level')||0}catch(e){}
let lang=null;try{const v=localStorage.getItem('ninja-lang');if(v==='ru'||v==='en'||v==='es')lang=v;}catch(e){}
const LANGS=['ru','en','es'];
let langSel=(()=>{const n=(navigator.language||'').toLowerCase();return n.startsWith('ru')?0:n.startsWith('es')?2:1;})();
if(lang==='es'){} // keep stored choice
const STR={
 ru:{scrolls:'свитки',foes:'враги',best:'рекорд',loc:'ЛОКАЦИЯ',clear:'ЛОКАЦИЯ ПРОЙДЕНА',bonus:'бонус за жизни +',next:'Дальше: ',last:'Остался последний шаг…',
  resume:'ПРОДОЛЖИТЬ',keyP:'клавиша P',restart:'ЗАНОВО',locN:'Локация ',toMenu:'В ГЛАВНОЕ МЕНЮ',saved:'прогресс сохранён',pause:'ПАУЗА',
  fsT:'ВО ВЕСЬ ЭКРАН НА IPHONE',fs1:'Safari не даёт сайтам открываться на весь экран.',fs2:'Добавь игру на главный экран:',fs3:'1. Нажми «Поделиться» (квадрат со стрелкой вверх)',fs4:'2. Выбери «На экран Домой»',fs5:'3. Запускай игру с новой иконки',fs6:'коснись, чтобы закрыть',
  t1:'НИНДЗЯ',t2:'КРАСНОЙ ЛУНЫ',tag:'RED MOON NINJA · 4 локации · 4 босса',newG:'НОВАЯ ИГРА',tapHere:'коснись здесь',keyN:'клавиша N',cont:'ПРОДОЛЖИТЬ',tap:'коснись',space:'ПРОБЕЛ',
  tapStart:'Коснись экрана, чтобы начать',spaceStart:'ПРОБЕЛ — начать',fell:'ТЫ ПАЛ',points:'очки',fromStart:'С НАЧАЛА',firstLoc:'первая локация',again:'ЕЩЁ РАЗ',
  spaceCont:'ПРОБЕЛ — продолжить с этой локации',rRestart:'R — начать заново с первой локации',win:'ПОБЕДА',winTxt:'Демон Они повержен. Замок сёгуна свободен.',
  scrollsN:'свитков',foesN:'врагов',newBest:'Новый рекорд!',tapMenu:'Коснись экрана — в меню',spaceMenu:'ПРОБЕЛ — в меню',
  life:'+1 жизнь!',hitBy:' задел тебя',beaten:' повержен!',moon:'Луна наливается кровью…',wall:'Врезался в стену',fall:'Сорвался вниз',spike:'Наступил на шипы',air:'Атака с воздуха',archer:'Лучник рядом',katana:'Удар катаной',shot:'Попадание'},
 es:{scrolls:'pergaminos',foes:'enemigos',best:'récord',loc:'ZONA',clear:'¡ZONA SUPERADA!',bonus:'bonus de vidas +',next:'Siguiente: ',last:'Solo queda un paso…',
  resume:'CONTINUAR',keyP:'tecla P',restart:'REINICIAR',locN:'Zona ',toMenu:'MENÚ PRINCIPAL',saved:'progreso guardado',pause:'PAUSA',
  fsT:'PANTALLA COMPLETA EN IPHONE',fs1:'Safari no deja que las webs ocupen toda la pantalla.',fs2:'Añade el juego a tu pantalla de inicio:',fs3:'1. Toca Compartir (el cuadrado con una flecha)',fs4:'2. Elige «Añadir a pantalla de inicio»',fs5:'3. Abre el juego desde el nuevo icono',fs6:'toca para cerrar',
  t1:'NINJA',t2:'DE LA LUNA ROJA',tag:'RED MOON NINJA · 4 zonas · 4 jefes',newG:'NUEVA PARTIDA',tapHere:'toca aquí',keyN:'tecla N',cont:'CONTINUAR',tap:'toca',space:'ESPACIO',
  tapStart:'Toca la pantalla para empezar',spaceStart:'ESPACIO para empezar',fell:'HAS CAÍDO',points:'puntos',fromStart:'DESDE EL INICIO',firstLoc:'primera zona',again:'OTRA VEZ',
  spaceCont:'ESPACIO para repetir esta zona',rRestart:'R para empezar desde la primera zona',win:'¡VICTORIA!',winTxt:'El Demonio Oni ha caído. El castillo del shogun es libre.',
  scrollsN:'pergaminos',foesN:'enemigos',newBest:'¡Nuevo récord!',tapMenu:'Toca la pantalla para ir al menú',spaceMenu:'ESPACIO para ir al menú',
  life:'¡+1 vida!',hitBy:' te ha golpeado',beaten:' ha caído!',moon:'La luna se tiñe de sangre…',wall:'Te chocaste con un muro',fall:'Te caíste',spike:'Pisaste unos pinchos',air:'Ataque desde el aire',archer:'Un arquero cerca',katana:'Golpe de katana',shot:'Te han dado'},
 en:{scrolls:'scrolls',foes:'foes',best:'best',loc:'LOCATION',clear:'LOCATION CLEARED',bonus:'life bonus +',next:'Next: ',last:'One last step…',
  resume:'RESUME',keyP:'key P',restart:'RESTART',locN:'Location ',toMenu:'MAIN MENU',saved:'progress saved',pause:'PAUSED',
  fsT:'FULL SCREEN ON IPHONE',fs1:'Safari does not let websites go full screen.',fs2:'Add the game to your Home Screen:',fs3:'1. Tap Share (the square with an arrow)',fs4:'2. Choose “Add to Home Screen”',fs5:'3. Launch the game from the new icon',fs6:'tap to close',
  t1:'RED MOON',t2:'NINJA',tag:'4 worlds · 4 bosses',newG:'NEW GAME',tapHere:'tap here',keyN:'key N',cont:'CONTINUE',tap:'tap',space:'SPACE',
  tapStart:'Tap the screen to start',spaceStart:'SPACE to start',fell:'YOU FELL',points:'score',fromStart:'START OVER',firstLoc:'first location',again:'TRY AGAIN',
  spaceCont:'SPACE to retry this location',rRestart:'R to start over from the first location',win:'VICTORY',winTxt:"The Oni Demon is defeated. The shogun's castle is free.",
  scrollsN:'scrolls',foesN:'foes',newBest:'New best!',tapMenu:'Tap the screen for the menu',spaceMenu:'SPACE for the menu',
  life:'+1 life!',hitBy:' hit you',beaten:' is defeated!',moon:'The moon turns blood red…',wall:'Hit a wall',fall:'Fell down',spike:'Stepped on spikes',air:'Attack from above',archer:'Archer close by',katana:'Katana strike',shot:'You were hit'}
};
const T=k=>STR[lang||'ru'][k];
const LN=l=>lang==='en'?l.en:lang==='es'?l.es:l.name, LS=l=>lang==='en'?l.enSub:lang==='es'?l.esSub:l.sub, BN=d=>lang==='en'?d.en:lang==='es'?d.es:d.name;
function setLang(v){lang=v;try{localStorage.setItem('ninja-lang',v)}catch(e){}try{document.documentElement.lang=v}catch(e){}}
let muted=false;try{muted=localStorage.getItem('ninja-muted')==='1'}catch(e){}
const TOUCH=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}

/* ---------- sound: everything is synthesized, no audio files ---------- */
let AC=null,master=null,noiseBuf=null,nextNote=0,step=0;
function audioInit(){
  // iPhone: play sound even when the side switch is on silent (Safari 17+)
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(e){}
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{
    AC=new(window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=muted?0:.55;master.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*.6,AC.sampleRate);
    const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }catch(e){AC=null;}
}
function tone(f,dur,type='square',vol=.15,slide=0,delay=0){
  if(!AC)return;const t0=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t0+dur);
  g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+.03);
}
function noise(dur,vol=.2,freq=1000,type='highpass',delay=0){
  if(!AC)return;const t0=AC.currentTime+delay,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=noiseBuf;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.001,t0+dur);
  s.connect(f);f.connect(g);g.connect(master);s.start(t0);s.stop(t0+dur+.03);
}
const SFX={
  jump:()=>tone(380,.12,'square',.1,280),
  jump2:()=>tone(560,.14,'square',.1,420),
  throw:()=>noise(.09,.16,3200),
  kill:()=>{tone(320,.16,'sawtooth',.12,-220);noise(.12,.14,1400);},
  scroll:()=>{tone(988,.08,'triangle',.14);tone(1480,.14,'triangle',.14,0,.07);},
  hurt:()=>{tone(220,.3,'sawtooth',.2,-150);noise(.22,.2,500);},
  bossHit:()=>tone(160,.09,'square',.14,-60),
  tele:()=>tone(980,.2,'sine',.1,-420),
  thud:()=>{noise(.35,.3,180,'lowpass');tone(80,.35,'sine',.3,-40);},
  boom:()=>{noise(.6,.4,140,'lowpass');tone(70,.7,'sine',.35,-35);},
  life:()=>[784,988,1319,1568].forEach((f,i)=>tone(f,.16,'square',.09,0,i*.07)),
  clear:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.22,'triangle',.16,0,i*.12)),
  win:()=>[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.28,'triangle',.16,0,i*.15)),
  over:()=>[392,330,262,196].forEach((f,i)=>tone(f,.32,'triangle',.16,0,i*.2))
};
function setMuted(m){muted=m;store('ninja-muted',m?'1':'0');if(master)master.gain.value=m?0:.55;}
// music: hirajoshi scale, one 16-step pattern per location, taiko drums during boss fights
const SCALE=[0,2,3,7,8,12,14,15,19,20];
const ROOTS=[220,196,246.94,174.61];
function music(){
  if(!AC||muted||state!=='play'||paused){nextNote=0;return;}
  const tempo=phase==='boss'?.12:.15;
  if(nextNote<AC.currentTime)nextNote=AC.currentTime+.05;
  while(nextNote<AC.currentTime+.2){
    const i=step%16,k=lvl*97,dl=nextNote-AC.currentTime;
    if(hash(k+i)>.38){const n=SCALE[Math.floor(hash(k+i+50)*SCALE.length)];tone(ROOTS[lvl]*Math.pow(2,n/12),.28,'triangle',.045,0,dl);}
    if(i%8===0)tone(ROOTS[lvl]/2,.5,'sine',.08,0,dl);
    if(phase==='boss'&&i%4===0)noise(.18,i%8===0?.22:.12,160,'lowpass',dl);
    else if(i%4===2)noise(.04,.03,6000,'highpass',dl);
    nextNote+=tempo;step++;
  }
}

const G=2300,JUMP=-820,JUMP2=-700;
const P={x:180,y:0,vy:0,w:30,h:52,onGround:true,jumps:0,coyote:0,inv:0,throwT:0,anim:0};
let state=lang?'menu':'lang',paused=false,moonRed=1;
let roofs=[],enemies=[],items=[],shots=[],parts=[],bullets=[],amb=[];
let lvl=0,L=LEVELS[0],phase='run',levelDist=0,boss=null;
let speed=340,dist=0,pts=0,levelStartPts=0,kills=0,scrollsN=0,lives=5,nextLife=1000,lifePulse=0;
const START_LIVES=5,MAX_LIVES=9,LIFE_EVERY=1000;
let t=0,shake=0,flash=0,msg='',msgT=0,overT=0,cardT=0,clearT=0,clearBonus=0;
let jumpQ=false,throwQ=false;

const stars=Array.from({length:110},()=>({x:Math.random()*1280,y:Math.random()*300,r:Math.random()*1.4+.3,p:Math.random()*6}));

function initAmb(){amb=Array.from({length:L.amb==='snow'?70:30},()=>({x:Math.random()*W,y:Math.random()*H,s:rand(.6,1.4),p:Math.random()*6}));}

function newWorld(){
  roofs=[{x:-60,w:840,y:400,seed:Math.random()*999}];
  enemies=[];items=[];shots=[];
  if(phase!=='boss')bullets=[];
  P.y=400-P.h;P.vy=0;P.onGround=true;P.jumps=0;
  genRoofs();
}
function startLevel(i){
  moonRed=0;
  lvl=i;L=LEVELS[i];speed=L.speed;levelDist=0;phase='run';boss=null;bullets=[];shots=[];
  lives=Math.max(START_LIVES,lives);levelStartPts=pts;nextLife=(Math.floor(pts/LIFE_EVERY)+1)*LIFE_EVERY;P.inv=0;initAmb();newWorld();cardT=2.8;msgT=0;step=0;
  if(i>saved){saved=i;store('ninja-level',i);}
}
const inIntro=()=>state==='play'&&phase==='run'&&cardT>0&&levelDist<1;
function skipIntro(){if(inIntro()&&cardT>.45){cardT=.45;return true;}return inIntro();}
function newGame(){lives=START_LIVES;pts=0;kills=0;scrollsN=0;state='play';paused=false;startLevel(0);}
function resumeSaved(){lives=START_LIVES;pts=0;kills=0;scrollsN=0;state='play';paused=false;startLevel(saved);}
function continueGame(){lives=START_LIVES;pts=levelStartPts;state='play';paused=false;startLevel(lvl);}
function say(s){msg=s;msgT=1.6;}

function genRoofs(){
  let last=roofs[roofs.length-1];
  while(!last.arena&&last.x+last.w<W+500){
    if(phase!=='run'){
      const r={x:last.x+last.w+90,w:1e6,y:GY,seed:Math.random()*999,arena:true};
      roofs.push(r);last=r;break;
    }
    const d=clamp(lvl*.22+levelDist/(L.len*10)*.3,0,1);
    const gap=rand(70,100+d*110);
    const y=clamp(last.y+rand(-85,85),300,460);
    const w=rand(300-d*60,580-d*120);
    const r={x:last.x+last.w+gap,w,y,seed:Math.random()*999};
    roofs.push(r);populate(r,d);last=r;
  }
}
function populate(r,d){
  const half=r.w/2,m=L.mix,k=1+d;
  const slots=[r.x+rand(90,half-30),r.x+half+rand(20,half-70)];
  if(Math.random()<.5)slots.reverse();
  if(Math.random()<m.archer*k)enemies.push({type:'archer',x:slots[0],y:r.y-50,w:28,h:50,roof:r,cd:rand(.2,.8),anim:0});
  else if(Math.random()<m.sam*k)enemies.push({type:'sam',x:slots[0],y:r.y-58,w:34,h:58,roof:r,anim:Math.random()*6});
  if(Math.random()<m.spike*k)enemies.push({type:'spike',x:slots[1],y:r.y-14,w:48,h:14});
  if(Math.random()<m.fly*k)enemies.push({type:'fly',x:r.x+r.w*rand(.3,.9),by:r.y-rand(140,200),y:0,w:36,h:22,ph:Math.random()*6});
  if(Math.random()<.6){
    const n=Math.random()<.35?3:1,hi=Math.random()<.5;
    for(let i=0;i<n;i++)items.push({x:r.x+rand(40,r.w-120)+i*42,y:r.y-(hi?165:85),w:22,h:26,ph:Math.random()*6});
  }
}

function burst(x,y,col,n,sp=260){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=Math.random()*sp;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,life:rand(.35,.7),max:.7,col,s:rand(2,4)});}
}
function hurt(why){
  if(P.inv>0||phase==='clear')return;
  lives--;shake=.35;flash=.25;burst(P.x+15,P.y+26,C.blood,22);SFX.hurt();buzz(140);
  if(lives<=0){gameOver();return;}
  P.inv=1.6;say(why);
}
function fallDeath(why){
  lives--;shake=.4;flash=.3;SFX.hurt();buzz(200);
  if(lives<=0){gameOver();return;}
  newWorld();P.inv=1.6;say(why);
}
function saveBest(){const s=Math.floor(pts);if(s>best){best=s;try{localStorage.setItem('ninja-best2',best)}catch(e){}}}
function gameOver(){state='over';overT=0;saveBest();SFX.over();}
function victory(){state='win';overT=0;saveBest();SFX.win();}

function doJump(){
  if(P.onGround||P.coyote>0){P.vy=JUMP;P.jumps=1;P.onGround=false;P.coyote=0;burst(P.x+15,P.y+P.h,'#8a86a8',6,120);SFX.jump();}
  else if(P.jumps<2){P.vy=JUMP2;P.jumps=2;burst(P.x+15,P.y+P.h,'#cfd2ff',10,160);SFX.jump2();}
}
function doThrow(){if(P.throwT>0)return;shots.push({x:P.x+P.w,y:P.y+22,w:16,h:16,r:0});P.throwT=.26;SFX.throw();}

/* ---------- boss ---------- */
function spawnBoss(){
  const d=BOSSES[L.boss];
  boss={d,key:L.boss,x:W+60,y:d.fly?GY-220:GY-d.h,w:d.w,h:d.h,hp:d.hp,max:d.hp,mode:'enter',t:0,last:'',atk:'',hurtT:0,ev:[],vy:0,anim:0,homeY:GY-215,deadFx:0};
  bullets=[];say(d.name);
}
function waveKind(){return ['wave','wave','frost','firewave'][lvl];}
function wave(x){bullets.push({kind:waveKind(),x:x-10,y:GY-36,w:26,h:36,vx:-(speed+330),vy:0});}
function aimed(n,spread,sp,kind){
  const b=boss,sx=b.x,sy=b.y+b.h*.4,a=Math.atan2(P.y+26-sy,P.x+15-sx);
  for(let k=0;k<n;k++){const an=a+(k-(n-1)/2)*spread;
    bullets.push({kind,x:sx,y:sy,w:18,h:10,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,des:kind==='feather'});}
}
function doAttack(b){
  const rage=1-b.hp/b.max;b.ev=[];
  const ev=(at,fn)=>b.ev.push({at,fn,done:false});
  switch(b.atk){
    case 'wave':ev(0,()=>wave(b.x));if(rage>.35)ev(.6,()=>wave(b.x));if(rage>.7)ev(1.2,()=>wave(b.x));break;
    case 'slash':ev(0,()=>bullets.push({kind:'slash',x:b.x-20,y:GY-135,w:34,h:56,vx:-640,vy:0}));ev(.75,()=>wave(b.x));break;
    case 'charge':b.mode='charge';return;
    case 'dive':b.mode='charge';b.y=GY-80;return;
    case 'feathers':ev(0,()=>aimed(3,.2,480,'feather'));if(rage>.4)ev(.65,()=>aimed(3,.2,480,'feather'));break;
    case 'gust':for(let i=0;i<2+Math.round(rage*2);i++)ev(i*.7,()=>bullets.push({kind:'gust',x:b.x,y:GY-34,w:40,h:34,vx:-(speed+300),vy:0}));break;
    case 'shards':ev(0,()=>aimed(5,.17,430,'shard'));if(rage>.45)ev(.8,()=>aimed(3,.25,470,'shard'));break;
    case 'icicles':for(let i=0;i<4+Math.round(rage*3);i++)ev(i*.2,()=>bullets.push({kind:'icicle',x:rand(380,880),y:-50,w:16,h:40,vx:-speed,vy:0,grav:1300}));break;
    case 'pound':b.mode='pound';b.vy=-950;return;
    case 'fireballs':for(let i=0;i<3+Math.round(rage*2);i++)ev(i*.28,()=>bullets.push({kind:'fire',x:b.x+10,y:b.y+30,w:26,h:26,vx:-rand(260,470),vy:-rand(450,750),grav:1400,bn:0}));break;
    case 'sweep':ev(0,()=>bullets.push({kind:'sweep',x:b.x-30,y:GY-32,w:70,h:32,vx:-(speed+390),vy:0}));if(rage>.5)ev(.8,()=>bullets.push({kind:'slash',x:b.x-20,y:GY-140,w:34,h:56,vx:-600,vy:0}));break;
  }
  b.mode='act';b.t=0;
}
function updBoss(dt){
  const b=boss;b.t+=dt;b.anim+=dt;b.hurtT=Math.max(0,b.hurtT-dt);
  const rage=1-b.hp/b.max;
  if(b.d.fly&&['enter','idle','tele','act','return'].includes(b.mode))b.y+=((b.homeY+Math.sin(b.anim*1.5)*75)-b.y)*Math.min(1,dt*4);
  switch(b.mode){
    case 'enter':b.x-=320*dt;if(b.x<=HOME){b.x=HOME;b.mode='idle';b.t=0;}break;
    case 'idle':if(b.t>1.25-rage*.55){const list=b.d.attacks.filter(a=>a!==b.last);b.atk=list[Math.floor(Math.random()*list.length)];b.last=b.atk;b.mode='tele';b.t=0;}break;
    case 'tele':if(!b.beeped){b.beeped=true;SFX.tele();}if(b.t>.62-rage*.15){b.beeped=false;doAttack(b);}break;
    case 'act':{let maxAt=0;for(const e of b.ev){maxAt=Math.max(maxAt,e.at);if(!e.done&&b.t>=e.at){e.done=true;e.fn();}}
      if(b.t>maxAt+.45){b.mode='idle';b.t=0;}break;}
    case 'charge':b.x-=(b.atk==='dive'?820:980)*dt;if(b.x<-b.w-60){b.x=W+80;b.mode='return';}break;
    case 'return':b.x-=380*dt;if(b.x<=HOME){b.x=HOME;b.mode='idle';b.t=0;}break;
    case 'pound':b.vy+=2600*dt;b.y+=b.vy*dt;if(b.y>=GY-b.h&&b.vy>0){b.y=GY-b.h;b.vy=0;shake=.45;SFX.thud();buzz(60);wave(b.x);if(rage>.4)setTimeout(()=>{if(boss&&boss.mode!=='dead'&&state==='play')wave(boss.x)},450);b.mode='idle';b.t=0;}break;
    case 'dead':b.deadFx-=dt;if(b.deadFx<=0){b.deadFx=.1;burst(b.x+Math.random()*b.w,b.y+Math.random()*b.h,Math.random()<.5?C.gold:L.accent,16,300);shake=.2;}
      if(b.d.fly)b.y+=120*dt;
      if(b.t>1.8){boss=null;phase='clear';clearBonus=lives*150;pts+=clearBonus;clearT=3.4;SFX.clear();}return;
  }
  if(b.mode==='dead')return;
  // shots
  for(const s of shots){if(!s.dead&&b.mode!=='enter'&&hit(s,b)){s.dead=true;damage(b,1);if(b.mode==='dead')return;}}
  // body contact
  const box={x:P.x+4,y:P.y+4,w:P.w-8,h:P.h-6};
  if(hit(box,b)){
    if(P.vy>0&&P.y+P.h<b.y+26){damage(b,2);P.vy=-760;P.jumps=1;}
    else hurt(BN(b.d)+T('hitBy'));
  }
}
function damage(b,n){
  b.hp-=n;b.hurtT=.12;burst(b.x+b.w*.3,b.y+b.h*.4,C.gold,8,180);SFX.bossHit();buzz(25);
  if(b.hp<=0){b.hp=0;b.mode='dead';b.t=0;bullets=[];pts+=500*(lvl+1);kills++;flash=.2;say((lang==='es'?'¡':'')+BN(b.d)+T('beaten'));SFX.boom();buzz([80,40,160]);}
}

/* ---------- update ---------- */
function updAmb(dt){
  for(const p of amb){
    switch(L.amb){
      case 'petal':p.x-=(30+speed*.08)*p.s*dt;p.y+=28*p.s*dt+Math.sin(t*2+p.p)*.4;break;
      case 'leaf':p.x-=(50+speed*.1)*p.s*dt;p.y+=40*p.s*dt+Math.sin(t*1.6+p.p)*.8;break;
      case 'snow':p.x-=(20+speed*.06)*p.s*dt;p.y+=60*p.s*dt;break;
      case 'ember':p.x-=(20+speed*.05)*p.s*dt+Math.sin(t*3+p.p)*.5;p.y-=45*p.s*dt;break;
    }
    if(p.x<-10)p.x=W+10;if(p.y>H+10)p.y=-10;if(p.y<-10)p.y=H+10;
  }
}
function update(dt){
  t+=dt;updAmb(dt);
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=900*dt;q.life-=dt;if(q.life<=0)parts.splice(i,1);}
  moonRed+=(moonTarget()-moonRed)*Math.min(1,dt*(phase==='clear'?.9:1.6));
  shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt);msgT=Math.max(0,msgT-dt);cardT=Math.max(0,cardT-dt);
  if(state!=='play'){overT+=dt;jumpQ=throwQ=false;return;}
  // Level intro: the world stands still until the location card is gone
  if(inIntro()){jumpQ=throwQ=false;P.anim=0;return;}

  if(phase==='boss'||phase==='clear')speed+=(270-speed)*Math.min(1,dt*1.5);
  else speed=Math.min(L.speed*1.15,speed+4*dt);
  const dx=speed*dt;dist+=dx;pts+=dx/10;
  if(phase==='run'){levelDist+=dx;if(levelDist>=L.len*10){phase='toBoss';say(T('moon'));}}
  for(const r of roofs)r.x-=dx;
  for(const e of enemies)e.x-=dx;
  for(const it of items)it.x-=dx;
  roofs=roofs.filter(r=>r.x+r.w>-120);
  genRoofs();
  if(phase==='toBoss'){const a=roofs.find(r=>r.arena);if(a&&a.x<P.x-80){phase='boss';spawnBoss();}}

  // player
  if(jumpQ)doJump();
  if(throwQ)doThrow();
  jumpQ=throwQ=false;
  P.throwT-=dt;P.inv=Math.max(0,P.inv-dt);
  P.anim+=dt*speed*.035;
  const prevBottom=P.y+P.h;
  P.vy+=G*dt;P.y+=P.vy*dt;
  const wasGround=P.onGround;P.onGround=false;
  for(const r of roofs){
    if(P.x+P.w>r.x+4&&P.x<r.x+r.w){
      if(prevBottom<=r.y+4&&P.y+P.h>=r.y&&P.vy>=0){
        P.y=r.y-P.h;P.vy=0;P.onGround=true;P.jumps=0;
        if(!wasGround)burst(P.x+15,r.y,'#6d6890',5,90);
      }else if(P.y+P.h>r.y+12&&P.y<r.y+200){fallDeath(T('wall'));return;}
    }
  }
  if(P.onGround)P.coyote=.09;else P.coyote-=dt;
  if(P.y>H+80){fallDeath(T('fall'));return;}

  for(const s of shots){s.x+=900*dt;s.r+=dt*22;}

  // enemies
  const box={x:P.x+4,y:P.y+4,w:P.w-8,h:P.h-6};
  for(const e of enemies){
    if(e.type==='sam'){e.anim+=dt*4;e.x-=45*dt;if(e.x<e.roof.x+4)e.x=e.roof.x+4;}
    if(e.type==='fly'){e.x-=130*dt;e.ph+=dt*3;e.y=e.by+Math.sin(e.ph)*26;}
    if(e.type==='archer'){e.anim+=dt;if(e.x<W-30&&e.x>P.x+140){e.cd-=dt;if(e.cd<=0){e.cd=1.9;e.anim=0;bullets.push({kind:'arrow',x:e.x-14,y:e.y+14,w:26,h:6,vx:-(speed+360),vy:0,des:true});}}}
    if(e.type!=='spike')for(const s of shots){if(!s.dead&&hit(s,e)){s.dead=true;e.dead=true;kills++;pts+=25;SFX.kill();burst(e.x+e.w/2,e.y+e.h/2,e.type==='fly'?'#8a8aa8':C.gold,18);}}
    if(e.dead)continue;
    if(hit(box,e)){
      if(e.type!=='spike'&&P.vy>0&&P.y+P.h<e.y+22){e.dead=true;kills++;pts+=25;SFX.kill();P.vy=-620;P.jumps=1;burst(e.x+e.w/2,e.y+10,C.gold,16);}
      else hurt(T(e.type==='spike'?'spike':e.type==='fly'?'air':e.type==='archer'?'archer':'katana'));
      if(state!=='play')return;
    }
  }
  enemies=enemies.filter(e=>!e.dead&&e.x>-80);

  // bullets
  for(const b of bullets){
    b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.grav)b.vy+=b.grav*dt;
    if(b.kind==='icicle'&&!b.landed&&b.y+b.h>=GY){b.y=GY-b.h;b.vy=0;b.grav=0;b.landed=true;burst(b.x+8,GY,'#dff1ff',8,140);}
    if(b.kind==='icicle')b.vx=-speed;
    if(b.kind==='fire'&&b.y+b.h>=GY&&b.vy>0){if(b.bn<1){b.vy=-b.vy*.5;b.bn++;}else{b.vy=0;b.grav=0;b.y=GY-b.h;b.vx=-(speed+180);}}
    if(b.des)for(const s of shots)if(!s.dead&&hit(s,b)){s.dead=true;b.dead=true;burst(b.x,b.y,'#c9c4e0',6,120);}
    if(!b.dead&&hit(box,b)){b.dead=true;hurt(T('shot'));if(state!=='play')return;}
  }
  bullets=bullets.filter(b=>!b.dead&&b.x>-120&&b.x<W+200&&b.y<H+60);

  if(boss){updBoss(dt);if(state!=='play')return;}
  shots=shots.filter(s=>s.x<W+40&&!s.dead);

  for(const it of items){
    it.ph+=dt*3;
    if(!it.taken&&hit({x:P.x,y:P.y,w:P.w,h:P.h},{x:it.x,y:it.y+Math.sin(it.ph)*5,w:it.w,h:it.h})){it.taken=true;scrollsN++;pts+=50;SFX.scroll();burst(it.x+11,it.y+13,C.gold,14,200);}
  }
  items=items.filter(it=>!it.taken&&it.x>-40);

  if(phase==='clear'){clearT-=dt;if(clearT<=0){if(lvl<LEVELS.length-1)startLevel(lvl+1);else victory();}}
}

/* ---------- background ---------- */
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgbOf=s=>s.split(',').map(Number);
const mixRGB=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(',');
function moonTarget(){
  if(state==='menu'||state==='win'||state==='lang')return 1;
  if(phase==='toBoss'||phase==='boss')return 1;
  if(phase==='clear')return 0;
  return clamp((levelDist/(L.len*10)-.5)/.5,0,1);
}
function drawSky(){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,L.sky[0]);g.addColorStop(.55,L.sky[1]);g.addColorStop(1,L.sky[2]);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(L.stars)for(const s of stars){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*.8+s.p));ctx.fillStyle='#e9e6ff';ctx.fillRect(s.x,s.y,s.r,s.r);}
  ctx.globalAlpha=1;
  // Red moon: the closer the boss, the redder the moon and the sky
  const rr=moonRed,ease=rr*rr*(3-2*rr);
  if(ease>0){ctx.fillStyle=`rgba(150,8,24,${.32*ease})`;ctx.fillRect(0,0,W,H);}
  const m={...L.moon,x:Math.min(L.moon.x*W/960,W-300),r:L.moon.r*(1+.22*ease)};
  const glow=mixRGB(rgbOf(m.glow),[255,40,40],ease),core=mixRGB(hexRGB(m.c),[214,22,34],ease);
  const gr=m.r*(3.2+1.4*ease);
  const mg=ctx.createRadialGradient(m.x,m.y,m.r*.7,m.x,m.y,gr);
  mg.addColorStop(0,`rgba(${glow},${.35+.25*ease})`);mg.addColorStop(1,`rgba(${glow},0)`);
  ctx.fillStyle=mg;ctx.fillRect(m.x-gr,m.y-gr,gr*2,gr*2);
  ctx.fillStyle=`rgb(${core})`;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,7);ctx.fill();
  if(ease>.02){const sh=ctx.createRadialGradient(m.x-m.r*.3,m.y-m.r*.3,m.r*.1,m.x,m.y,m.r);
    sh.addColorStop(0,`rgba(255,120,90,${.35*ease})`);sh.addColorStop(1,`rgba(90,0,10,${.45*ease})`);
    ctx.fillStyle=sh;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,7);ctx.fill();}
  if(m.craters){ctx.fillStyle=`rgba(${mixRGB([120,120,150],[110,0,10],ease)},.25)`;[[-.3,-.28,.18],[.33,.27,.13],[.18,-.42,.09]].forEach(([a,b,c])=>{ctx.beginPath();ctx.arc(m.x+a*m.r,m.y+b*m.r,c*m.r,0,7);ctx.fill();});}
}
function drawFar(){
  const off=dist*.05;ctx.fillStyle=L.far;
  if(L.farType==='hills'){
    ctx.beginPath();ctx.moveTo(0,H);
    for(let x=0;x<=W;x+=8){const wx=x+off;ctx.lineTo(x,330+Math.sin(wx*.004)*42+Math.sin(wx*.013)*16);}
    ctx.lineTo(W,H);ctx.fill();return;
  }
  const sp=260,peakH=k=>120+hash(k)*90;
  ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<=W;x+=6){const wx=x+off,k=Math.floor(wx/sp),p=(wx-k*sp)/sp;ctx.lineTo(x,330-(1-Math.abs(p*2-1))*peakH(k));}
  ctx.lineTo(W,H);ctx.fill();
  ctx.fillStyle='#e6eeff';
  for(let k=Math.floor(off/sp);k<=Math.floor((off+W)/sp)+1;k++){
    const ax=k*sp+sp/2-off,h=peakH(k),ay=330-h,sl=h/(sp/2),c=34;
    ctx.beginPath();ctx.moveTo(ax-c,ay+c*sl);ctx.lineTo(ax,ay);ctx.lineTo(ax+c,ay+c*sl);
    ctx.lineTo(ax+c*.4,ay+c*sl-8);ctx.lineTo(ax,ay+c*sl+4);ctx.lineTo(ax-c*.5,ay+c*sl-8);ctx.closePath();ctx.fill();
  }
}
function towers(sp,w0,par,base,lamps){
  const o=dist*par,b0=Math.floor(o/sp),off=o%sp;
  ctx.fillStyle=L.midCol;ctx.fillRect(0,420,W,H);
  for(let i=-1;i<Math.ceil(W/sp)+2;i++){
    const k=b0+i,x=i*sp-off+hash(k)*sp*.4,tiers=3+Math.floor(hash(k+9)*3);
    let y=420,w=w0;
    if(base){ctx.fillRect(x-w*.55,y-60,w*1.1,60);y-=60;}
    for(let j=0;j<tiers;j++){
      ctx.fillStyle=L.midCol;
      ctx.fillRect(x-w*.32,y-30,w*.64,30);
      ctx.beginPath();ctx.moveTo(x-w*.62,y-28);ctx.quadraticCurveTo(x-w*.4,y-36,x-w*.3,y-50);
      ctx.lineTo(x+w*.3,y-50);ctx.quadraticCurveTo(x+w*.4,y-36,x+w*.62,y-28);ctx.closePath();ctx.fill();
      if(lamps&&hash(k+j)>.3){ctx.fillStyle='rgba(255,150,70,.6)';ctx.fillRect(x-w*.2,y-22,6,9);ctx.fillRect(x+w*.12,y-22,6,9);}
      y-=50;w*=.8;
    }
    ctx.fillStyle=L.midCol;ctx.fillRect(x-2,y-34,4,34);
    if(!base&&hash(k+3)>.4){ctx.fillStyle='rgba(255,170,90,.55)';ctx.fillRect(x-4,410,8,10);}
  }
}
function bamboo(){
  const sp=34,o=dist*.3,b0=Math.floor(o/sp),off=o%sp;
  for(let i=-1;i<W/sp+2;i++){
    const k=b0+i,x=i*sp-off+hash(k)*14,w=5+hash(k+1)*6,sh=hash(k+2);
    ctx.fillStyle=sh>.5?'#163a2b':'#11301f';ctx.fillRect(x,0,w,H);
    ctx.fillStyle='#0b2015';for(let y=(hash(k+4)*50)|0;y<H;y+=52)ctx.fillRect(x-1,y,w+2,3);
    ctx.fillStyle='#1d4a33';
    for(let j=0;j<3;j++){const ly=40+hash(k+j*5)*300;ctx.save();ctx.translate(x+w,ly);ctx.rotate(-.5+hash(k+j)*.3);ctx.beginPath();ctx.ellipse(12,0,14,3.5,0,0,7);ctx.fill();ctx.restore();}
  }
}
function pines(){
  const sp=90,o=dist*.22,b0=Math.floor(o/sp),off=o%sp;
  ctx.fillStyle=L.midCol;ctx.fillRect(0,420,W,H);
  for(let i=-1;i<W/sp+2;i++){
    const k=b0+i,x=i*sp-off+hash(k)*40,h=110+hash(k+1)*100;
    for(let j=0;j<3;j++){
      const ty=420-h+j*h*.28,bw=24+j*16;
      ctx.fillStyle=L.midCol;ctx.beginPath();ctx.moveTo(x,ty);ctx.lineTo(x+bw,ty+h*.42);ctx.lineTo(x-bw,ty+h*.42);ctx.closePath();ctx.fill();
      ctx.fillStyle='#d6e2fa';ctx.beginPath();ctx.moveTo(x,ty);ctx.lineTo(x+bw*.3,ty+h*.13);ctx.lineTo(x,ty+h*.1);ctx.lineTo(x-bw*.3,ty+h*.13);ctx.closePath();ctx.fill();
    }
  }
  ctx.fillStyle='#b9c8e8';ctx.fillRect(0,418,W,4);
}
function drawMid(){
  if(L.mid==='pagoda')towers(320,110,.22,false,false);
  else if(L.mid==='castle')towers(560,190,.2,true,true);
  else if(L.mid==='bamboo')bamboo();
  else pines();
}

/* ---------- platforms ---------- */
function drawRoof(r){
  const a=Math.max(r.x,-60),b=Math.min(r.x+r.w,W+60);if(b<=a)return;
  const le=r.x>-60,re=r.x+r.w<W+60,st=L.roof;
  if(st==='tile'||st==='stone'){
    ctx.fillStyle=st==='tile'?'#0c0a15':'#211820';ctx.fillRect(a,r.y,b-a,H-r.y);
    if(st==='tile'){
      const i0=Math.max(0,Math.floor((a-r.x-26)/44)),i1=Math.floor((b-r.x-26)/44);
      for(let i=i0;i<=i1;i++){const wx=r.x+26+i*44;if(wx+16>r.x+r.w-8)continue;
        for(let j=0;j<4;j++){const h=hash(r.seed+i*7.1+j*13.3);ctx.fillStyle=h>.62?(h>.9?'#ffb45e':'#a8622f'):'#16121f';ctx.fillRect(wx,r.y+40+j*52,16,22);}}
    }else{
      ctx.strokeStyle='#120c10';ctx.lineWidth=2;
      for(let j=0;j<6;j++){const yy=r.y+16+j*24;ctx.beginPath();ctx.moveTo(a,yy);ctx.lineTo(b,yy);ctx.stroke();
        const sh=j%2?22:0,i0=Math.floor((a-r.x-sh)/44);
        for(let i=i0;r.x+sh+i*44<b;i++){const xx=r.x+sh+i*44;if(xx<a)continue;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,yy+24);ctx.stroke();}}
      const i0=Math.max(0,Math.floor((a-r.x-60)/220));
      for(let i=i0;r.x+60+i*220<b;i++){const tx=r.x+60+i*220;if(tx>r.x+r.w-20)break;
        const f=Math.sin(t*12+i)*2;
        const g=ctx.createRadialGradient(tx,r.y+38,2,tx,r.y+38,34);g.addColorStop(0,'rgba(255,140,50,.45)');g.addColorStop(1,'rgba(255,140,50,0)');
        ctx.fillStyle=g;ctx.fillRect(tx-34,r.y+4,68,68);
        ctx.fillStyle='#3a2a20';ctx.fillRect(tx-2,r.y+42,4,16);
        ctx.fillStyle='#ffb347';ctx.beginPath();ctx.ellipse(tx,r.y+36+f*.3,4,8+f,0,0,7);ctx.fill();}
    }
    ctx.fillStyle=st==='tile'?'#2c2340':'#4a1620';
    ctx.beginPath();ctx.moveTo(a-18,r.y-4);ctx.lineTo(b+18,r.y-4);ctx.lineTo(b+6,r.y+16);ctx.lineTo(a-6,r.y+16);ctx.closePath();ctx.fill();
    ctx.strokeStyle=st==='tile'?'#3e3258':'#6a2430';ctx.lineWidth=1;
    for(let x=a-((a-r.x)%10);x<b;x+=10){ctx.beginPath();ctx.moveTo(x,r.y);ctx.lineTo(x,r.y+14);ctx.stroke();}
    ctx.strokeStyle=st==='tile'?C.blood:C.gold;ctx.lineWidth=3;
    ctx.beginPath();
    if(le){ctx.moveTo(r.x-26,r.y-14);ctx.quadraticCurveTo(r.x-14,r.y-2,r.x,r.y-3);}else ctx.moveTo(a,r.y-3);
    ctx.lineTo(re?r.x+r.w:b,r.y-3);
    if(re)ctx.quadraticCurveTo(r.x+r.w+14,r.y-2,r.x+r.w+26,r.y-14);
    ctx.stroke();
  }else if(st==='bridge'){
    const i0=Math.max(0,Math.floor((a-r.x-16)/90));
    const pole=x=>{ctx.fillStyle='#2f5a34';ctx.fillRect(x,r.y+10,9,H-r.y);ctx.fillStyle='#1d3c22';for(let y=r.y+40;y<H;y+=42)ctx.fillRect(x-1,y,11,3);};
    for(let i=i0;r.x+16+i*90<b;i++){const px=r.x+16+i*90;if(px>r.x+r.w-30)break;pole(px);}
    if(re)pole(r.x+r.w-22);
    ctx.fillStyle='#6b4a2a';ctx.fillRect(a,r.y-3,b-a,15);
    ctx.fillStyle='#4a3119';for(let x=a-((a-r.x)%18);x<b;x+=18)ctx.fillRect(x,r.y-3,2,15);
    ctx.fillStyle='#9a7346';ctx.fillRect(a,r.y-3,b-a,3);
    ctx.strokeStyle='#c9b27a';ctx.lineWidth=1.5;ctx.beginPath();
    for(let x=a;x<=b;x+=12)ctx.lineTo(x,r.y+16+Math.abs(Math.sin((x-r.x)/90*Math.PI))*8);ctx.stroke();
  }else{
    ctx.fillStyle='#1b2544';ctx.fillRect(a,r.y,b-a,H-r.y);
    const i0=Math.max(0,Math.floor((a-r.x)/60));
    for(let i=i0;r.x+i*60<b;i++){const fx=r.x+i*60;if(fx>r.x+r.w-30)break;const h=hash(r.seed+i);
      ctx.fillStyle=h>.5?'#24305a':'#151d38';ctx.beginPath();ctx.moveTo(fx,r.y+20+h*30);ctx.lineTo(fx+30+h*20,r.y+60+h*40);ctx.lineTo(fx+10,r.y+110+h*30);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#9fd0ff';ctx.fillRect(a,r.y+5,b-a,3);
    ctx.fillStyle='#eef3ff';ctx.fillRect(a,r.y-6,b-a,12);
    const j0=Math.max(0,Math.floor((a-r.x)/26));
    for(let i=j0;r.x+i*26<b;i++){const dx=r.x+i*26+8;if(dx>r.x+r.w-6)break;const h=hash(r.seed+i*3.3);ctx.beginPath();ctx.ellipse(dx,r.y+6,6+h*5,3+h*6,0,0,Math.PI);ctx.fill();}
    if(le){ctx.beginPath();ctx.arc(r.x,r.y,6,0,7);ctx.fill();}
    if(re){ctx.beginPath();ctx.arc(r.x+r.w,r.y,6,0,7);ctx.fill();}
  }
}

/* ---------- characters ---------- */
function limb(x1,y1,x2,y2,col,w,rim=C.rim){
  ctx.strokeStyle=rim;ctx.lineWidth=w+2.5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function drawNinja(){
  if(P.inv>0&&Math.floor(t*14)%2)return;
  ctx.save();ctx.translate(P.x+15,P.y);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=C.blood;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-9,5);
  for(let i=1;i<=5;i++)ctx.lineTo(-9-i*7,5+Math.sin(t*14-i*.9)*3*i*.5+i*1.5);ctx.stroke();
  limb(-11,30,9,6,'#1c1c28',3);ctx.strokeStyle=C.blood;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(7,8);ctx.lineTo(12,2);ctx.stroke();
  const a=Math.sin(P.anim)*.9;
  if(P.onGround){limb(0,38,Math.sin(a)*14,38+Math.cos(a)*14,C.ink,6);limb(0,38,Math.sin(-a)*14,38+Math.cos(-a)*14,C.ink,6);}
  else{limb(0,38,10,46,C.ink,6);limb(0,38,-7,50,C.ink,6);}
  ctx.fillStyle=C.rim;ctx.beginPath();ctx.roundRect(-10.5,18.5,21,23,6);ctx.fill();
  ctx.fillStyle=C.ink;ctx.beginPath();ctx.roundRect(-9,20,18,20,5);ctx.fill();
  ctx.fillStyle='#7a1f26';ctx.fillRect(-9,32,18,3);
  if(P.throwT>.1){limb(0,25,17,21,C.ink,5);limb(0,25,-10,30,C.ink,5);}
  else{limb(0,25,-Math.sin(a)*11,25+Math.cos(a)*11,C.ink,5);limb(0,25,Math.sin(a)*11,25+Math.cos(a)*11,C.ink,5);}
  ctx.fillStyle=C.rim;ctx.beginPath();ctx.arc(0,10,12.5,0,7);ctx.fill();
  ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(0,10,11,0,7);ctx.fill();
  ctx.fillStyle=C.blood;ctx.fillRect(-11,1,22,4);
  ctx.fillStyle='#e8c9a0';ctx.fillRect(-1,7,12,5);
  ctx.fillStyle='#111';ctx.fillRect(5,8,4,2.4);
  ctx.restore();
}
function samuraiBody(colA,colB,anim,flag){
  ctx.lineCap='round';
  const a=Math.sin(anim)*.5;
  if(flag){ctx.strokeStyle='#3a2a20';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,20);ctx.lineTo(10,-22);ctx.stroke();
    ctx.fillStyle=C.blood;ctx.beginPath();ctx.moveTo(10,-22);ctx.lineTo(24,-20+Math.sin(t*6)*2);ctx.lineTo(24,0+Math.sin(t*6+1)*2);ctx.lineTo(10,-2);ctx.closePath();ctx.fill();
    ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(17,-11,3.5,0,7);ctx.fill();}
  limb(0,40,Math.sin(a)*13,40+Math.cos(a)*17,'#2a1218',7);limb(0,40,-Math.sin(a)*13,40+Math.cos(a)*17,'#2a1218',7);
  ctx.fillStyle=colA;ctx.beginPath();ctx.roundRect(-14,16,28,28,5);ctx.fill();
  ctx.strokeStyle=C.gold;ctx.lineWidth=1.5;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-13,24+i*7);ctx.lineTo(13,24+i*7);ctx.stroke();}
  ctx.fillStyle=colB;ctx.fillRect(-19,17,9,12);ctx.fillRect(10,17,9,12);
  limb(-6,24,-18,14,'#2a1218',5);
  ctx.strokeStyle='#d8dbe8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,14);ctx.lineTo(-30,-14);ctx.stroke();
  ctx.strokeStyle=C.gold;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,18);ctx.lineTo(-19,11);ctx.stroke();
  ctx.fillStyle='#1a1a24';ctx.beginPath();ctx.arc(0,9,10,0,7);ctx.fill();
  ctx.fillStyle='#2e2e3c';ctx.beginPath();ctx.arc(0,6,13,Math.PI,0);ctx.fill();ctx.fillRect(-15,5,30,3);
  ctx.strokeStyle=C.gold;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-8,-12);ctx.lineTo(0,-3);ctx.lineTo(8,-12);ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillRect(-7,10,4,2);ctx.fillRect(1,10,4,2);
}
function drawSamurai(e){ctx.save();ctx.translate(e.x+17,e.y);samuraiBody(L.sam[0],L.sam[1],e.anim,false);ctx.restore();}
function drawArcher(e){
  ctx.save();ctx.translate(e.x+14,e.y);ctx.lineCap='round';
  limb(0,34,-6,50,'#1d1a22',6);limb(0,34,6,50,'#1d1a22',6);
  ctx.fillStyle=L.sam[0];ctx.beginPath();ctx.moveTo(-10,16);ctx.lineTo(10,16);ctx.lineTo(12,38);ctx.lineTo(-12,38);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1d1a22';ctx.beginPath();ctx.arc(0,9,10,0,7);ctx.fill();
  ctx.fillStyle=L.sam[1];ctx.beginPath();ctx.moveTo(-14,8);ctx.lineTo(0,-4);ctx.lineTo(14,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.fillRect(-6,9,4,2);
  const pull=Math.min(1,e.anim/1.5);
  ctx.strokeStyle='#7a5a32';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-6,22,18,Math.PI*.62,Math.PI*1.38);ctx.stroke();
  ctx.strokeStyle='#ddd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-13,5);ctx.lineTo(-6+pull*8,22);ctx.lineTo(-13,39);ctx.stroke();
  limb(0,22,-20,22,'#1d1a22',4);
  ctx.restore();
}
function drawFlyer(e){
  ctx.save();ctx.translate(e.x+18,e.y+11);
  const f=Math.sin(e.ph*4)*10;
  if(L.flyer==='wisp'){
    const g=ctx.createRadialGradient(0,0,2,0,0,26);g.addColorStop(0,'rgba(255,200,80,.9)');g.addColorStop(1,'rgba(255,80,30,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.fill();
    ctx.fillStyle='#ff8a3a';ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(0,-14,22,-6+f*.4);ctx.quadraticCurveTo(8,0,22,8-f*.4);ctx.quadraticCurveTo(0,14,-10,0);ctx.fill();
    ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.arc(-2,0,8,0,7);ctx.fill();
    ctx.fillStyle='#3a0a0a';ctx.fillRect(-7,-2,3,3);ctx.fillRect(-1,-2,3,3);
  }else if(L.flyer==='bat'){
    ctx.fillStyle='#1a1028';ctx.strokeStyle='#5b4a80';ctx.lineWidth=1.2;
    for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*18,-8-f);ctx.lineTo(s*14,-1-f*.4);ctx.lineTo(s*20,4-f*.3);ctx.lineTo(s*8,4);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.beginPath();ctx.ellipse(0,2,6,7,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffde4a';ctx.fillRect(-4,0,2,2);ctx.fillRect(1,0,2,2);
  }else{
    const owl=L.flyer==='owl';
    ctx.fillStyle=owl?'#e8eefa':'#08080e';ctx.strokeStyle=owl?'#6f86b8':C.rim;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(10,-6-f);ctx.lineTo(16,0);ctx.lineTo(-2,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,2,14,6,0,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-22,3);ctx.lineTo(-13,5);ctx.fill();
    ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(-20,2);ctx.lineTo(-13,3);ctx.fill();
    ctx.fillStyle=owl?'#2a6cd8':C.blood;ctx.fillRect(-9,-1,2.5,2.5);
  }
  ctx.restore();
}
function drawSpike(e){
  const ice=L.roof==='ice',wood=L.roof==='bridge';
  ctx.fillStyle=ice?'#bfe3ff':wood?'#5c8a3a':'#6f7086';ctx.strokeStyle=ice?'#ffffff':wood?'#9cc46a':'#b9bbd0';ctx.lineWidth=1;
  for(let i=0;i<4;i++){const x=e.x+i*12;ctx.beginPath();ctx.moveTo(x,e.y+14);ctx.lineTo(x+6,e.y);ctx.lineTo(x+12,e.y+14);ctx.closePath();ctx.fill();ctx.stroke();}
}
function drawShot(s){
  ctx.save();ctx.translate(s.x+8,s.y+8);ctx.rotate(s.r);ctx.fillStyle='#dfe2f2';
  ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?3:9,a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(0,0,1.8,0,7);ctx.fill();ctx.restore();
}
function drawScroll(it){
  const y=it.y+Math.sin(it.ph)*5;
  const g=ctx.createRadialGradient(it.x+11,y+13,2,it.x+11,y+13,26);g.addColorStop(0,'rgba(217,164,65,.45)');g.addColorStop(1,'rgba(217,164,65,0)');
  ctx.fillStyle=g;ctx.fillRect(it.x-16,y-14,54,54);
  ctx.fillStyle=C.paper;ctx.fillRect(it.x+3,y+3,16,20);
  ctx.fillStyle='#7a4a24';ctx.fillRect(it.x,y,22,4);ctx.fillRect(it.x,y+22,22,4);
  ctx.fillStyle=C.blood;ctx.fillRect(it.x+3,y+11,16,3);
  ctx.fillStyle='#3a2a20';ctx.fillRect(it.x+7,y+6,8,1.5);ctx.fillRect(it.x+7,y+17,6,1.5);
}

/* ---------- bosses ---------- */
function drawTengu(b){
  const cx=b.x+38,cy=b.y+36,f=Math.sin(b.anim*8)*14;
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='#2a1a14';ctx.strokeStyle='#6b4a32';ctx.lineWidth=2;
  for(const s of [1,-1]){ctx.beginPath();ctx.moveTo(4*s,-6);ctx.quadraticCurveTo(40*s,-46-f,70*s,-30-f);ctx.lineTo(56*s,-18-f*.6);ctx.lineTo(62*s,-6-f*.4);ctx.lineTo(44*s,0);ctx.lineTo(46*s,10);ctx.quadraticCurveTo(20*s,14,4*s,8);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.fillStyle='#e9e2d0';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.lineTo(24,36);ctx.lineTo(-24,36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e07a2a';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-8+i*8,8,3.5,0,7);ctx.fill();}
  ctx.fillStyle='#2f4a3a';ctx.fillRect(-24,30,48,6);
  ctx.fillStyle='#c4302b';ctx.beginPath();ctx.arc(0,-14,14,0,7);ctx.fill();
  ctx.beginPath();ctx.moveTo(-8,-16);ctx.lineTo(-38,-10);ctx.lineTo(-8,-9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f1eee6';ctx.beginPath();ctx.moveTo(-12,-6);ctx.quadraticCurveTo(0,14,12,-6);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-14,-22);ctx.quadraticCurveTo(-4,-34,14,-24);ctx.lineTo(18,-8);ctx.lineTo(12,-18);ctx.closePath();ctx.fill();
  ctx.fillStyle='#111';ctx.fillRect(-6,-34,10,8);
  ctx.fillStyle='#ffd23a';ctx.fillRect(-9,-19,4,3);
  ctx.fillStyle='#4f7a3a';ctx.save();ctx.translate(-22,10);ctx.rotate(-.6+Math.sin(b.anim*3)*.2);ctx.beginPath();ctx.ellipse(0,-14,9,15,0,0,7);ctx.fill();ctx.fillStyle='#3a2a20';ctx.fillRect(-1.5,-2,3,14);ctx.restore();
  ctx.restore();
}
function drawYuki(b){
  const cx=b.x+30,y=b.y;
  const g=ctx.createRadialGradient(cx,y+50,10,cx,y+50,90);g.addColorStop(0,'rgba(170,220,255,.35)');g.addColorStop(1,'rgba(170,220,255,0)');
  ctx.fillStyle=g;ctx.fillRect(cx-90,y-40,180,180);
  ctx.fillStyle='#0d0d16';ctx.beginPath();ctx.moveTo(cx-12,y+6);ctx.quadraticCurveTo(cx+30,y+40+Math.sin(t*2)*6,cx+26,y+86);ctx.lineTo(cx+8,y+70);ctx.lineTo(cx+10,y+14);ctx.closePath();ctx.fill();
  const kg=ctx.createLinearGradient(0,y+26,0,y+104);kg.addColorStop(0,'#f2f6ff');kg.addColorStop(1,'rgba(220,235,255,0)');
  ctx.fillStyle=kg;ctx.beginPath();ctx.moveTo(cx-12,y+26);ctx.lineTo(cx+12,y+26);
  ctx.lineTo(cx+24,y+104);ctx.quadraticCurveTo(cx,y+96+Math.sin(t*3)*4,cx-26,y+104);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8fb8e8';ctx.fillRect(cx-12,y+42,24,5);
  ctx.fillStyle='rgba(235,243,255,.9)';ctx.beginPath();ctx.moveTo(cx-10,y+30);ctx.quadraticCurveTo(cx-36,y+44+Math.sin(t*2.4)*6,cx-40,y+64);ctx.lineTo(cx-20,y+56);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f4f6fb';ctx.beginPath();ctx.arc(cx,y+16,10,0,7);ctx.fill();
  ctx.fillStyle='#0d0d16';ctx.beginPath();ctx.arc(cx+2,y+12,11,Math.PI*1.05,Math.PI*2.1);ctx.fill();
  ctx.fillStyle='#4aa8ff';ctx.fillRect(cx-6,y+16,3,2);ctx.fillRect(cx,y+16,3,2);
  ctx.fillStyle='#b23a5a';ctx.fillRect(cx-3,y+21,3,1.5);
}
function drawOni(b){
  ctx.save();ctx.translate(b.x+55,b.y);ctx.lineCap='round';
  const a=Math.sin(b.anim*3)*.2;
  ctx.save();ctx.translate(-30,58);ctx.rotate(-1.1+a+(b.mode==='tele'?-.5:0));
  ctx.fillStyle='#2b2b33';ctx.beginPath();ctx.roundRect(-8,-92,18,100,6);ctx.fill();
  ctx.fillStyle='#8a8a99';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-8,-82+i*16,3,0,7);ctx.arc(10,-76+i*16,3,0,7);ctx.fill();}
  ctx.restore();
  limb(-16,112,-20,150,'#b8322a',16,'#5a1410');limb(16,112,20,150,'#b8322a',16,'#5a1410');
  ctx.fillStyle='#b8322a';ctx.beginPath();ctx.roundRect(-38,46,76,64,18);ctx.fill();
  ctx.strokeStyle='#8a2018';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-16,60);ctx.quadraticCurveTo(0,70,16,60);ctx.moveTo(-14,80);ctx.lineTo(14,80);ctx.stroke();
  ctx.fillStyle='#e5b03a';ctx.fillRect(-38,98,76,22);
  ctx.fillStyle='#1c1c1c';for(let i=0;i<5;i++)ctx.fillRect(-34+i*16,98,5,22);
  limb(-30,56,-34,62,'#b8322a',14,'#5a1410');
  limb(30,56,44,92,'#b8322a',14,'#5a1410');
  ctx.fillStyle='#e8dcc0';
  ctx.beginPath();ctx.moveTo(-18,10);ctx.quadraticCurveTo(-30,-6,-24,-20);ctx.quadraticCurveTo(-18,-4,-10,4);ctx.fill();
  ctx.beginPath();ctx.moveTo(18,10);ctx.quadraticCurveTo(30,-6,24,-20);ctx.quadraticCurveTo(18,-4,10,4);ctx.fill();
  ctx.fillStyle='#1a0e0e';ctx.beginPath();ctx.arc(0,22,28,Math.PI*1.05,Math.PI*1.95);ctx.fill();
  for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-26+i*10,10);ctx.lineTo(-22+i*10,-2+Math.sin(t*4+i)*2);ctx.lineTo(-18+i*10,10);ctx.fill();}
  ctx.fillStyle='#c83a2e';ctx.beginPath();ctx.arc(0,26,22,0,7);ctx.fill();
  ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(-16,20);ctx.lineTo(-4,24);ctx.lineTo(-14,27);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(10,20);ctx.lineTo(-1,24);ctx.lineTo(9,27);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3a0a0a';ctx.fillRect(-12,34,22,6);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-10,34);ctx.lineTo(-7,28);ctx.lineTo(-5,34);ctx.fill();ctx.beginPath();ctx.moveTo(4,34);ctx.lineTo(7,28);ctx.lineTo(9,34);ctx.fill();
  ctx.restore();
}
function drawBoss(b){
  if(b.mode==='tele'){
    const pr=.5+.5*Math.sin(t*30);
    const g=ctx.createRadialGradient(b.x+b.w/2,b.y+b.h/2,10,b.x+b.w/2,b.y+b.h/2,b.h);
    g.addColorStop(0,`rgba(255,60,60,${.25+pr*.25})`);g.addColorStop(1,'rgba(255,60,60,0)');
    ctx.fillStyle=g;ctx.fillRect(b.x-b.h,b.y-b.h/2,b.w+b.h*2,b.h*2);
    text('!',b.x+b.w/2,b.y-18,34,'#ffd23a','center');
  }
  if(b.mode==='dead')ctx.globalAlpha=Math.max(0,1-b.t/1.8);
  if(b.hurtT>0)ctx.filter='brightness(2.6)';
  if(b.key==='shogun'){ctx.save();ctx.translate(b.x+35,b.y);ctx.scale(1.93,1.93);samuraiBody('#8a1e2c','#b02a38',b.anim*2,true);ctx.restore();}
  else if(b.key==='tengu')drawTengu(b);
  else if(b.key==='yuki')drawYuki(b);
  else drawOni(b);
  ctx.filter='none';ctx.globalAlpha=1;
}
function drawBullet(b){
  ctx.save();
  switch(b.kind){
    case 'wave':case 'frost':case 'firewave':case 'gust':case 'sweep':{
      const col={wave:'#d6e2ff',frost:'#bfe9ff',firewave:'#ff8a3a',gust:'#cfe8c0',sweep:'#ffb060'}[b.kind];
      ctx.globalAlpha=.9;ctx.fillStyle=col;
      ctx.beginPath();ctx.moveTo(b.x,b.y+b.h);ctx.quadraticCurveTo(b.x-6,b.y,b.x+b.w*.6,b.y-4+Math.sin(t*30)*2);
      ctx.quadraticCurveTo(b.x+b.w*.3,b.y+b.h*.4,b.x+b.w,b.y+b.h);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.4;ctx.fillRect(b.x+b.w*.6,b.y+b.h-6,b.w*.9,6);
      if(b.kind==='firewave'||b.kind==='sweep'){ctx.fillStyle='#ffe08a';ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(b.x+b.w*.4,b.y+b.h*.6,5,0,7);ctx.fill();}
      break;}
    case 'slash':ctx.strokeStyle='#f4f0ff';ctx.lineWidth=6;ctx.shadowColor='#c6b8ff';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(b.x+34,b.y+28,28,Math.PI*.6,Math.PI*1.4);ctx.stroke();break;
    case 'feather':ctx.translate(b.x+9,b.y+5);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle='#3a2a1c';
      ctx.beginPath();ctx.ellipse(0,0,12,4,0,0,7);ctx.fill();ctx.strokeStyle='#c8a878';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();break;
    case 'shard':ctx.translate(b.x+9,b.y+5);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.fillStyle='#cfeeff';ctx.shadowColor='#7fc8ff';ctx.shadowBlur=10;
      ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(0,-5);ctx.lineTo(-10,0);ctx.lineTo(0,5);ctx.closePath();ctx.fill();break;
    case 'icicle':
      if(!b.landed){ctx.fillStyle='rgba(0,0,30,.35)';ctx.beginPath();ctx.ellipse(b.x+8,GY+2,12,4,0,0,7);ctx.fill();}
      ctx.fillStyle='#d9f1ff';ctx.strokeStyle='#8ac6f0';ctx.lineWidth=1.5;
      ctx.beginPath();if(b.landed){ctx.moveTo(b.x,b.y+b.h);ctx.lineTo(b.x+8,b.y);ctx.lineTo(b.x+16,b.y+b.h);}else{ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+16,b.y);ctx.lineTo(b.x+8,b.y+b.h);}
      ctx.closePath();ctx.fill();ctx.stroke();break;
    case 'fire':{const g=ctx.createRadialGradient(b.x+13,b.y+13,2,b.x+13,b.y+13,22);g.addColorStop(0,'#fff2b0');g.addColorStop(.4,'#ff8a2a');g.addColorStop(1,'rgba(255,60,20,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x+13,b.y+13,22,0,7);ctx.fill();break;}
    case 'arrow':ctx.strokeStyle='#d8c9a8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y+3);ctx.lineTo(b.x+26,b.y+3);ctx.stroke();
      ctx.fillStyle='#cfd2e0';ctx.beginPath();ctx.moveTo(b.x-4,b.y+3);ctx.lineTo(b.x+4,b.y-1);ctx.lineTo(b.x+4,b.y+7);ctx.fill();
      ctx.fillStyle=C.blood;ctx.fillRect(b.x+20,b.y,6,2);ctx.fillRect(b.x+20,b.y+4,6,2);break;
  }
  ctx.restore();
}

/* ---------- HUD ---------- */
function checkLife(){
  if(state!=='play')return;
  while(pts>=nextLife){
    nextLife+=LIFE_EVERY;
    if(lives<MAX_LIVES){lives++;lifePulse=1;say(T('life'));SFX.life();buzz([30,40,30]);
      burst(W-34-(lives-1)*28,32,'#ff4a52',18,220);}
  }
  lifePulse=Math.max(0,lifePulse-1/60*1.5);
}
function heart(x,y,full){
  ctx.fillStyle=full?C.blood:'rgba(255,255,255,.15)';
  ctx.beginPath();ctx.moveTo(x,y+5);ctx.bezierCurveTo(x,y,x-9,y,x-9,y+6);ctx.bezierCurveTo(x-9,y+11,x,y+15,x,y+18);
  ctx.bezierCurveTo(x,y+15,x+9,y+11,x+9,y+6);ctx.bezierCurveTo(x+9,y,x,y,x,y+5);ctx.fill();
}
function text(s,x,y,size,col,align='left'){ctx.font=`${size}px ${FONT}`;ctx.textAlign=align;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillText(s,x+2,y+2);ctx.fillStyle=col;ctx.fillText(s,x,y);}
function band(y,h,a=.6){ctx.fillStyle=`rgba(5,4,12,${a})`;ctx.fillRect(0,y,W,h);ctx.fillStyle=L.accent;ctx.fillRect(0,y,W,2);ctx.fillRect(0,y+h-2,W,2);}

function drawHUD(){
  text(String(Math.floor(pts)).padStart(5,'0'),24,44,30,C.paper);
  text(`${T('scrolls')} ${scrollsN}   ${T('foes')} ${kills}`,24,70,14,'#cfcae6');
  const nH=Math.max(START_LIVES,lives);
  for(let i=0;i<nH;i++){
    if(i===lives-1&&lifePulse>0){const k=1+.6*Math.sin(lifePulse*Math.PI);ctx.save();ctx.translate(W-34-i*28,31);ctx.scale(k,k);heart(0,-9,true);ctx.restore();}
    else heart(W-34-i*28,22,i<lives);
  }
  text(`${T('best')} ${best}`,W-24,66,14,'#cfcae6','right');
  const bx=W/2-150,by=30,bw=300;
  if(boss){
    text(BN(boss.d).toUpperCase(),W/2,by-6,15,C.paper,'center');
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(bx-2,by,bw+4,14);
    ctx.fillStyle=L.accent;ctx.fillRect(bx,by+2,bw*(boss.hp/boss.max),10);
  }else if(phase==='run'||phase==='toBoss'){
    text(`${lvl+1}/4 · ${LN(L)}`,W/2,by-6,14,'#cfcae6','center');
    const p=Math.min(1,levelDist/(L.len*10));
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(bx,by+3,bw,8);
    ctx.fillStyle=L.accent;ctx.fillRect(bx,by+3,bw*p,8);
    ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(bx+bw*p,by+7,6,0,7);ctx.fill();
    ctx.fillStyle=phase==='toBoss'&&Math.floor(t*4)%2?'#ffd23a':C.blood;ctx.beginPath();ctx.moveTo(bx+bw+4,by+7);ctx.lineTo(bx+bw+14,by-3);ctx.lineTo(bx+bw+24,by+7);ctx.lineTo(bx+bw+14,by+17);ctx.closePath();ctx.fill();
  }
  if(cardT>0){
    ctx.globalAlpha=Math.min(1,cardT*2,(2.8-cardT)*4);
    band(170,140);
    text(`${T('loc')} ${lvl+1}`,W/2,210,16,L.accent,'center');
    text(LN(L).toUpperCase(),W/2,256,42,C.paper,'center');
    text(LS(L),W/2,288,16,'#cfcae6','center');
    ctx.globalAlpha=1;
  }else if(msgT>0&&!paused){ctx.globalAlpha=Math.min(1,msgT*2);text(msg,W/2,150,30,C.paper,'center');ctx.globalAlpha=1;}
  if(phase==='clear'){
    band(160,170);
    text(T('clear'),W/2,212,36,'#ffd23a','center');
    text(`${T('bonus')}${clearBonus}`,W/2,250,18,C.paper,'center');
    text(lvl<3?T('next')+LN(LEVELS[lvl+1]):T('last'),W/2,290,18,'#cfcae6','center');
  }
  if(paused)drawPauseMenu();
}
function pauseButtons(){
  const w=300,h=58,x=W/2-w/2;
  return [{id:'resume',x,y:200,w,h,label:T('resume'),sub:TOUCH?'':T('keyP'),main:true},
          {id:'restart',x,y:270,w,h,label:T('restart'),sub:`${T('locN')}${lvl+1}: ${LN(L)}`},
          {id:'menu',x,y:340,w,h,label:T('toMenu'),sub:T('saved')}];
}
function drawPauseMenu(){
  ctx.fillStyle='rgba(7,8,24,.75)';ctx.fillRect(0,0,W,H);
  text(T('pause'),W/2,160,52,C.paper,'center');
  for(const b of pauseButtons()){
    ctx.fillStyle=b.main?'rgba(224,56,63,.9)':'rgba(20,16,40,.92)';ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,9);ctx.fill();
    ctx.strokeStyle=b.main?'#ff8a8f':'#4b3f70';ctx.lineWidth=2;ctx.stroke();
    text(b.label,b.x+b.w/2,b.y+(b.sub?27:37),21,C.paper,'center');
    if(b.sub)text(b.sub,b.x+b.w/2,b.y+48,13,b.main?'#ffe2e2':'#cfcae6','center');
  }
}

const LANGBTN={x:18,y:18,w:92,h:52};
function langButtons(){const w=178,g=15,x0=W/2-(w*3+g*2)/2;return [{id:'ru',label:'РУССКИЙ',sub:'Russian'},{id:'en',label:'ENGLISH',sub:'Английский'},{id:'es',label:'ESPAÑOL',sub:'Spanish'}].map((b,i)=>({...b,x:x0+i*(w+g),y:306,w,h:68}));}
function chooseLang(v){setLang(v);langSel=LANGS.indexOf(v);state='menu';}
function menuBtn(x,y,w,h,label,sub,main){
  ctx.fillStyle=main?'rgba(224,56,63,.85)':'rgba(20,16,40,.85)';ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();
  ctx.strokeStyle=main?'#ff8a8f':'#4b3f70';ctx.lineWidth=2;ctx.stroke();
  text(label,x+w/2,y+30,20,C.paper,'center');text(sub,x+w/2,y+52,13,main?'#ffe2e2':'#cfcae6','center');
}
const ICONS={};
// Top-right icon row, right to left: pause (only while playing), sound, fullscreen.
function iconList(){const l=[];if(state==='play'&&!paused)l.push('pause');l.push('mute');if(showFullBtn())l.push('full');return l;}
function placeIcons(){
  for(const k in ICONS)delete ICONS[k];
  const s=52,g=10,y=state==='play'?80:18;
  iconList().forEach((k,i)=>{ICONS[k]={x:W-18-s-i*(s+g),y,w:s,h:s};});
}
function drawIcons(){placeIcons();
  for(const k of iconList()){
    const r=ICONS[k],pz=k==='pause';
    ctx.fillStyle=pz?'rgba(224,56,63,.8)':'rgba(10,8,22,.6)';ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,10);ctx.fill();
    ctx.strokeStyle='rgba(236,228,212,.35)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=C.paper;ctx.strokeStyle=C.paper;ctx.lineWidth=3;const cx=r.x+r.w/2,cy=r.y+r.h/2;
    ctx.save();ctx.translate(cx,cy);ctx.scale(1.35,1.35);ctx.translate(-cx,-cy);
    if(pz){ctx.fillRect(cx-7,cy-9,5,18);ctx.fillRect(cx+2,cy-9,5,18);}
    else if(k==='full'){const a=isFull(),d=9,e=4;ctx.lineWidth=2.5;ctx.beginPath();
      for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){
        if(!a){ctx.moveTo(cx+sx*d,cy+sy*(d-e));ctx.lineTo(cx+sx*d,cy+sy*d);ctx.lineTo(cx+sx*(d-e),cy+sy*d);}
        else{ctx.moveTo(cx+sx*(d-e),cy+sy*(d-e*2));ctx.lineTo(cx+sx*(d-e),cy+sy*(d-e));ctx.lineTo(cx+sx*(d-e*2),cy+sy*(d-e));}}
      ctx.stroke();}
    else{ctx.beginPath();ctx.moveTo(cx-10,cy-4);ctx.lineTo(cx-5,cy-4);ctx.lineTo(cx+1,cy-9);ctx.lineTo(cx+1,cy+9);ctx.lineTo(cx-5,cy+4);ctx.lineTo(cx-10,cy+4);ctx.closePath();ctx.fill();
      ctx.beginPath();if(muted){ctx.moveTo(cx+4,cy-5);ctx.lineTo(cx+12,cy+5);ctx.moveTo(cx+12,cy-5);ctx.lineTo(cx+4,cy+5);}else{ctx.arc(cx+2,cy,7,-.9,.9);}ctx.stroke();}
    ctx.restore();
  }
}
function drawFullHint(){
  ctx.fillStyle='rgba(7,8,24,.85)';ctx.fillRect(0,0,W,H);
  const w=Math.min(640,W-80),x=W/2-w/2;
  ctx.fillStyle='rgba(20,16,40,.95)';ctx.beginPath();ctx.roundRect(x,110,w,300,14);ctx.fill();ctx.strokeStyle='#4b3f70';ctx.lineWidth=2;ctx.stroke();
  text(T('fsT'),W/2,160,24,C.paper,'center');
  text(T('fs1'),W/2,200,16,'#cfcae6','center');
  text(T('fs2'),W/2,226,16,'#cfcae6','center');
  text(T('fs3'),W/2,270,18,C.paper,'center');
  text(T('fs4'),W/2,302,18,C.paper,'center');
  text(T('fs5'),W/2,334,18,C.paper,'center');
  text(T('fs6'),W/2,384,14,C.gold,'center');
}
function drawTouchPads(){
  ctx.globalAlpha=.22;ctx.fillStyle=C.paper;ctx.strokeStyle=C.paper;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(80,460,46,0,7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(80,440);ctx.lineTo(100,468);ctx.lineTo(60,468);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(W-80,460,46,0,7);ctx.stroke();
  ctx.save();ctx.translate(W-80,460);ctx.rotate(t*2);ctx.beginPath();for(let i=0;i<8;i++){const r=i%2?6:20,a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();
  ctx.globalAlpha=1;
}
function drawAmb(){
  for(const p of amb){
    ctx.save();ctx.translate(p.x,p.y);
    switch(L.amb){
      case 'petal':ctx.rotate(t*2+p.p);ctx.globalAlpha=.7;ctx.fillStyle='#f2a9c0';ctx.beginPath();ctx.ellipse(0,0,4*p.s,2*p.s,0,0,7);ctx.fill();break;
      case 'leaf':ctx.rotate(t*1.5+p.p);ctx.globalAlpha=.75;ctx.fillStyle='#8cc56a';ctx.beginPath();ctx.ellipse(0,0,6*p.s,2*p.s,0,0,7);ctx.fill();break;
      case 'snow':ctx.globalAlpha=.85;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,1.6*p.s,0,7);ctx.fill();break;
      case 'ember':ctx.globalAlpha=.5+.5*Math.sin(t*6+p.p);ctx.fillStyle='#ffa040';ctx.fillRect(-1.5,-1.5,3*p.s,3*p.s);break;
    }
    ctx.restore();
  }
}

function draw(){
  ctx.save();
  if(shake>0)ctx.translate(rand(-6,6)*shake*2,rand(-6,6)*shake*2);
  drawSky();drawFar();drawMid();
  const fog=ctx.createLinearGradient(0,380,0,H);fog.addColorStop(0,`rgba(${L.fog},0)`);fog.addColorStop(1,`rgba(${L.fog},.55)`);
  ctx.fillStyle=fog;ctx.fillRect(0,380,W,H-380);
  for(const r of roofs)drawRoof(r);
  for(const it of items)drawScroll(it);
  for(const e of enemies){if(e.type==='sam')drawSamurai(e);else if(e.type==='fly')drawFlyer(e);else if(e.type==='archer')drawArcher(e);else drawSpike(e);}
  if(boss)drawBoss(boss);
  for(const b of bullets)drawBullet(b);
  for(const s of shots)drawShot(s);
  if(state==='play'||state==='over')drawNinja();
  for(const q of parts){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.col;ctx.fillRect(q.x,q.y,q.s,q.s);}
  ctx.globalAlpha=1;drawAmb();ctx.globalAlpha=1;
  ctx.restore();
  if(flash>0){ctx.fillStyle=`rgba(224,56,63,${flash})`;ctx.fillRect(0,0,W,H);}

  if(state==='play'){drawHUD();if(TOUCH&&!paused)drawTouchPads();}
  if(state==='lang'){
    ctx.fillStyle='rgba(7,8,24,.55)';ctx.fillRect(0,0,W,H);
    text('RED MOON NINJA',W/2,150,64,C.paper,'center');
    text('НИНДЗЯ КРАСНОЙ ЛУНЫ',W/2,192,24,'#ff4a52','center');
    ctx.fillStyle=C.blood;ctx.fillRect(W/2-150,210,300,4);
    text('Выбери язык  ·  Choose your language  ·  Elige tu idioma',W/2,262,18,'#e3def5','center');
    for(const b of langButtons()){
      const sel=LANGS.indexOf(b.id)===langSel;
      ctx.fillStyle=sel?'rgba(224,56,63,.9)':'rgba(20,16,40,.9)';ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,10);ctx.fill();
      ctx.strokeStyle=sel?'#ff8a8f':'#4b3f70';ctx.lineWidth=2;ctx.stroke();
      text(b.label,b.x+b.w/2,b.y+34,22,C.paper,'center');text(b.sub,b.x+b.w/2,b.y+54,12,sel?'#ffe2e2':'#cfcae6','center');
    }
    if(!TOUCH)text('← →   ПРОБЕЛ / SPACE',W/2,420,14,'#cfcae6','center');
  }
  if(state==='menu'){
    ctx.fillStyle='rgba(7,8,24,.45)';ctx.fillRect(0,0,W,H);
    {const b=LANGBTN;ctx.fillStyle='rgba(10,8,22,.6)';ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,10);ctx.fill();
     ctx.strokeStyle='rgba(236,228,212,.35)';ctx.lineWidth=1.5;ctx.stroke();
     text((lang||'ru').toUpperCase(),b.x+b.w/2-8,b.y+34,20,C.paper,'center');
     ctx.fillStyle=C.paper;ctx.beginPath();ctx.moveTo(b.x+b.w-24,b.y+23);ctx.lineTo(b.x+b.w-14,b.y+23);ctx.lineTo(b.x+b.w-19,b.y+30);ctx.closePath();ctx.fill();}
    if(lang==='en'){text(T('t1'),W/2,150,40,'#ff4a52','center');text(T('t2'),W/2,226,96,C.paper,'center');}
    else{text(T('t1'),W/2,170,96,C.paper,'center');text(T('t2'),W/2,214,30,'#ff4a52','center');}
    ctx.fillStyle=C.blood;ctx.fillRect(W/2-150,232,300,4);
    text(T('tag'),W/2,268,17,'#e3def5','center');
    if(saved>0){
      menuBtn(W/2-250,310,230,64,T('newG'),TOUCH?T('tapHere'):T('keyN'),false);
      menuBtn(W/2+20,310,230,64,T('cont'),`${T('locN')}${saved+1} · `+(TOUCH?T('tap'):T('space')),true);
    }else if(Math.floor(t*2)%2===0)text(TOUCH?T('tapStart'):T('spaceStart'),W/2,345,20,C.gold,'center');
    if(best)text(`${T('best')} ${best}`,W/2,420,16,'#cfcae6','center');
  }
  if(state==='over'){
    ctx.fillStyle='rgba(7,8,24,.72)';ctx.fillRect(0,0,W,H);
    text(T('fell'),W/2,180,72,C.blood,'center');
    text(`${T('locN')}${lvl+1}: ${LN(L)}`,W/2,225,20,'#e3def5','center');
    text(`${T('points')} ${Math.floor(pts)}`,W/2,268,30,C.paper,'center');
    text(`${T('best')} ${best}`,W/2,300,16,C.gold,'center');
    if(overT>.7){
      if(TOUCH){menuBtn(W/2-250,350,230,64,T('fromStart'),T('firstLoc'),false);menuBtn(W/2+20,350,230,64,T('again'),`${T('locN')}${lvl+1}`,true);}
      else{if(Math.floor(t*2)%2===0)text(T('spaceCont'),W/2,370,18,C.paper,'center');
        text(T('rRestart'),W/2,402,14,'#cfcae6','center');}
    }
  }
  if(state==='win'){
    ctx.fillStyle='rgba(7,4,8,.7)';ctx.fillRect(0,0,W,H);
    text(T('win'),W/2,170,88,'#ffd23a','center');
    text(T('winTxt'),W/2,218,20,C.paper,'center');
    text(`${T('points')} ${Math.floor(pts)}`,W/2,270,32,C.paper,'center');
    text(`${T('scrollsN')} ${scrollsN} · ${T('foesN')} ${kills}`,W/2,302,18,'#e3def5','center');
    text(Math.floor(pts)>=best?T('newBest'):`${T('best')} ${best}`,W/2,334,18,C.gold,'center');
    if(overT>1&&Math.floor(t*2)%2===0)text(TOUCH?T('tapMenu'):T('spaceMenu'),W/2,400,20,C.paper,'center');
  }
  drawIcons();
  if(fullHint)drawFullHint();
}

/* ---------- input ---------- */
// side: 'left' | 'right' | null (keyboard)
function primary(side){
  if(state==='menu'){if(saved>0&&side!=='right'&&side!=='key')newGame();else if(saved>0)resumeSaved();else newGame();return true;}
  if(state==='over'){if(overT>.7){if(side==='left')newGame();else continueGame();}return true;}
  if(state==='win'){if(overT>1){state='menu';lvl=0;L=LEVELS[0];initAmb();newWorld();}return true;}
  return false;
}
let fullHint=false;
const IOS=/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const fsTarget=()=>APP?document.documentElement:(cv.closest('.frame')||cv);
const canFS=()=>{const d=fsTarget();return !!(d.requestFullscreen||d.webkitRequestFullscreen);};
const isFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
const standalone=()=>{try{return navigator.standalone===true||matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches;}catch(e){return false;}};
const NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
function showFullBtn(){if(NATIVE)return false;return isFull()||(!standalone()&&(canFS()||(IOS&&APP)));}
function enterFull(){
  const d=fsTarget(),req=d.requestFullscreen||d.webkitRequestFullscreen;
  if(!req){if(IOS)fullHint=true;return;}
  try{const p=req.call(d);const lock=()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};
    if(p&&p.then)p.then(lock).catch(()=>{if(IOS)fullHint=true;});else lock();}catch(e){}
}
function toggleFull(){
  if(isFull()){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}}
  else enterFull();
}
function goFull(){if(APP&&TOUCH&&!IOS&&!NATIVE&&!isFull()&&canFS())enterFull();}
function pauseOn(){if(state==='play'&&!paused){paused=true;}}
function toMenu(){state='menu';paused=false;boss=null;bullets=[];lvl=0;L=LEVELS[0];initAmb();phase='run';newWorld();}
addEventListener('keydown',e=>{
  const k=e.code;audioInit();
  if(state==='lang'){
    if(k==='ArrowLeft'||k==='ArrowRight'||k==='KeyA'||k==='KeyD'){langSel=(langSel+(k==='ArrowLeft'||k==='KeyA'?2:1))%3;e.preventDefault();}
    else if(k==='Space'||k==='Enter'){e.preventDefault();chooseLang(LANGS[langSel]);}
    else if(k==='KeyM')setMuted(!muted);
    return;
  }
  if(state==='menu'&&k==='KeyL'){state='lang';return;}
  if(['Space','ArrowUp','KeyW'].includes(k)){e.preventDefault();if(!primary('key')&&!paused&&!e.repeat&&!skipIntro())jumpQ=true;}
  else if(['KeyX','KeyJ','KeyF','Enter'].includes(k)){e.preventDefault();if(!primary('key')&&!paused&&!skipIntro())throwQ=true;}
  else if(k==='KeyP'||k==='Escape'){if(fullHint){fullHint=false;}else if(state==='play')paused=!paused;}
  else if(k==='KeyM')setMuted(!muted);
  else if(k==='KeyN'&&state==='menu')newGame();
  else if(k==='KeyR'&&state==='over'&&overT>.7)newGame();
});
const inR=(x,y,r)=>x>=r.x-6&&x<=r.x+r.w+6&&y>=r.y-6&&y<=r.y+r.h+6;
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();cv.focus({preventScroll:true});audioInit();goFull();
  const r=cv.getBoundingClientRect(),gx=(e.clientX-r.left)/r.width*W,gy=(e.clientY-r.top)/r.height*H;
  if(fullHint){fullHint=false;return;}
  placeIcons();
  if(ICONS.mute&&inR(gx,gy,ICONS.mute)){setMuted(!muted);return;}
  if(ICONS.full&&inR(gx,gy,ICONS.full)){pauseOn();toggleFull();return;}
  if(ICONS.pause&&inR(gx,gy,ICONS.pause)){pauseOn();return;}
  if(paused){
    for(const b of pauseButtons())if(inR(gx,gy,b)){
      if(b.id==='resume')paused=false;
      else if(b.id==='restart')continueGame();
      else toMenu();
    }
    return;
  }
  if(state==='lang'){for(const b of langButtons())if(inR(gx,gy,b))chooseLang(b.id);return;}
  if(state==='menu'&&inR(gx,gy,LANGBTN)){langSel=Math.max(0,LANGS.indexOf(lang));state='lang';return;}
  const side=gx<W/2?'left':'right';
  if(primary(side))return;
  if(skipIntro())return;
  if(side==='left')jumpQ=true;else throwQ=true;
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{if(!isFull())pauseOn();setTimeout(fit,60);}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='play')paused=true;if(AC&&AC.state==='running')AC.suspend();}else if(AC)AC.resume();});

let last=performance.now();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(!paused&&!fullHint)update(dt);
  checkLife();
  music();
  draw();requestAnimationFrame(loop);
}
initAmb();newWorld();
requestAnimationFrame(loop);
})();
