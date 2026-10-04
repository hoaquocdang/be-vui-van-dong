'use strict';
/* ============ helpers ============ */
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
};
function hexA(h,a){const n=parseInt(h.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}

/* ============ elements ============ */
const video=$('cam'), canvas=$('game'), ctx=canvas.getContext('2d');
const ana=document.createElement('canvas');
const actx=ana.getContext('2d',{willReadFrequently:true});

/* ============ state ============ */
let state='menu';                 // menu | loading | count | play | pause | end
let mode='bubbles';               // bubbles | colors | pose | match
let selectedMode='bubbles';
let W=0,H=0,DPR=1,minDim=0;
let AW=96,AH=54;
let prev=null,trail=null,motionRatio=1;
let camOn=false,stream=null,facing='user',wantCam=true;
let objs=[],parts=[],floats=[];
let score=0;
let remainMs=0,countEnd=0,lastCount=-1,lastTick=-1;
let spawnT=0,lastT=performance.now(),frame=0;
let muted=store.get('bv_mute','0')==='1';
let sens=+store.get('bv_sens','1'); if(!(sens>=0&&sens<=2))sens=1;
const SENS_TH=[0.10,0.055,0.03];

/* ---- cấp độ: mỗi mode tự tăng dần từ cấp 1 lên tối đa 30 khi qua màn ---- */
let level=1;
const MAX_LEVEL=30;
let levelBannerT=0;
function lvlT(){ return (level-1)/(MAX_LEVEL-1); } // 0..1, tiến độ cấp hiện tại
const ZONE_TH=[0.05,0.03,0.018];
const FRUITS=['🍎','🍊','🍋','🍇','🍓','🍉'];
const COLORS=['#FF6B9A','#FFB13D','#3BC9A9','#5AA9FF','#B983FF'];
let wl=null;

/* ============ danh sách trò chơi (phần HIỂN THỊ — tên, mô tả, cách chơi — nằm ở lib/games.ts của Next.js) ============
   Trò mới đăng ký bằng registerGame() trong các file games-*.js với các hook:
   needs 'pose'|'hand'|'face' (+ soft=có dự phòng bằng chuyển động), start(), begin() mỗi cấp, update(dt), draw(),
   hud(), tap(x,y), intro, go, motion:false (không cần quét chuyển động khi đã có AI) */
const GAMES={},GAME_LIST=[];
function registerGame(g){ GAMES[g.id]=g; GAME_LIST.push(g); return g; }
const NEEDS={pose:{chip:'🦴 Khung xương',mb:18},hand:{chip:'✋ Bàn tay',mb:20},face:{chip:'🙂 Khuôn mặt',mb:16}};
const LOST_TXT={pose:'👀 Chưa thấy bé — lùi ra xa để camera thấy cả người nhé!',hand:'✋ Giơ bàn tay lên trước camera nhé!',face:'🙂 Đưa khuôn mặt vào giữa khung hình nhé!'};
let aiPref=store.get('bv_ai','1')==='1';
let skelOn=store.get('bv_skel','1')==='1';
let useAI=false,lostShown=false;

registerGame({id:'race',name:'Chạy Vượt Chướng Ngại',needs:'pose',soft:true,motion:false,touch:true,trackOpts:()=>({numPoses:playerCount===2?2:1})});
registerGame({id:'pose',name:'Bé Tạo Dáng',needs:'pose',soft:true,motion:false,touch:true});
registerGame({id:'bubbles',name:'Đập Bóng Vui',touch:true});
registerGame({id:'colors',name:'Bắt Đúng Màu',touch:true});
registerGame({id:'match',name:'Bé Ghép Đôi',touch:true});

/* ---- hearts (bubbles / colors) ---- */
let hearts=3,heartsMax=3;

/* ---- colors mode ---- */
let targetColor='red',targetT=0;
const COLOR_DEFS=[
  {key:'red',name:'Đỏ',hex:'#FF5A6E',emoji:'🍓'},
  {key:'orange',name:'Cam',hex:'#FFA53D',emoji:'🍊'},
  {key:'yellow',name:'Vàng',hex:'#FFD84D',emoji:'🍌'},
  {key:'green',name:'Xanh lá',hex:'#4CC98A',emoji:'🍏'},
  {key:'purple',name:'Tím',hex:'#B983FF',emoji:'🍇'},
];

/* ---- cấu hình theo cấp độ (thay cho 3 mức Dễ/Vừa/Khó cũ) ---- */
const LEVEL_TIME=22; // giây mỗi cấp cho Đập Bóng & Bắt Đúng Màu
function bubbleTarget(){ return 5+level; }
function bubbleSpeedMul(){ return lerp(0.85,1.6,lvlT()); }
function bubbleSpawnMul(){ return lerp(1.15,0.55,lvlT()); }
function bubbleBadChance(){ return lerp(0.04,0.28,lvlT()); }
function colorTarget(){ return 5+level; }
function colorSpeedMul(){ return lerp(0.85,1.5,lvlT()); }
function colorSwapSec(){ return lerp(11,5,lvlT()); }
function colorPalette(){ return Math.min(5,3+Math.floor((level-1)/10)); }
function poseTimeLimitFor(){ return lerp(4.6,2.3,lvlT()); }
function poseTierFor(){ return level>=8?2:1; }
const MATCH_LIVES=3;
const MATCH_LEVEL_GRIDS=[ // mỗi phần tử áp dụng cho 3 cấp liên tiếp, càng lên sau bảng càng lớn
  {cols:3,rows:2},{cols:4,rows:2},{cols:4,rows:3},{cols:4,rows:4},{cols:5,rows:4},
  {cols:6,rows:4},{cols:6,rows:5},{cols:8,rows:4},{cols:9,rows:4},{cols:8,rows:5},
];
function matchGridFor(){
  const idx=Math.min(MATCH_LEVEL_GRIDS.length-1, Math.floor((level-1)/3));
  return MATCH_LEVEL_GRIDS[idx];
}
const MATCH_ICONS=['🍎','🍊','🍋','🍇','🍓','🍉','🍌','🍍','🥝','🍒','🐶','🐱','🐰','🦋','🐸','🐢','🐧','🐬','🦁','🐝','⚽','🎈','🌈','⭐'];
const MATCH_AREA=[0.04,0.13,0.96,0.96];

/* ---- pose mode ---- */
const ZONES={
  LU:[0.04,0.04,0.42,0.44], RU:[0.58,0.04,0.96,0.44],
  LM:[0.02,0.36,0.36,0.72], RM:[0.64,0.36,0.98,0.72],
  TC:[0.32,0.02,0.68,0.30], BC:[0.20,0.60,0.80,0.98],
};
const POSES=[
  {id:'up_r',zones:['RU'],label:'Giơ tay phải lên cao!'},
  {id:'up_l',zones:['LU'],label:'Giơ tay trái lên cao!'},
  {id:'side_r',zones:['RM'],label:'Dang tay phải sang ngang!'},
  {id:'side_l',zones:['LM'],label:'Dang tay trái sang ngang!'},
  {id:'head',zones:['TC'],label:'Đặt hai tay lên đầu!'},
  {id:'squat',zones:['BC'],label:'Cúi người thật thấp!'},
  {id:'both_up',zones:['LU','RU'],label:'Giơ cả hai tay lên trời!'},
  {id:'both_side',zones:['LM','RM'],label:'Dang hai tay sang ngang!'},
  {id:'cross_1',zones:['LU','RM'],label:'Tay trái lên cao, tay phải sang ngang!'},
  {id:'cross_2',zones:['RU','LM'],label:'Tay phải lên cao, tay trái sang ngang!'},
  // chỉ có khi dùng AI khung xương (cần thấy cả người): tư thế khó dần
  {id:'hips',zones:[],aiOnly:1,minLevel:12,label:'Chống hai tay lên hông!'},
  {id:'one_leg_l',zones:[],aiOnly:1,minLevel:15,label:'Co chân trái lên!'},
  {id:'one_leg_r',zones:[],aiOnly:1,minLevel:15,label:'Co chân phải lên!'},
  {id:'star',zones:[],aiOnly:1,minLevel:18,label:'Nhảy sao: giơ hai tay, dạng hai chân!'},
];
const POSE_ART={
  up_r:{armL:'down',armR:'up'}, up_l:{armL:'up',armR:'down'},
  side_r:{armL:'down',armR:'side'}, side_l:{armL:'side',armR:'down'},
  head:{armL:'head',armR:'head'}, squat:{armL:'down',armR:'down',legs:'squat'},
  both_up:{armL:'up',armR:'up'}, both_side:{armL:'side',armR:'side'},
  cross_1:{armL:'up',armR:'side'}, cross_2:{armL:'side',armR:'up'},
  hips:{armL:'hip',armR:'hip'},
  one_leg_l:{armL:'down',armR:'down',legs:'oneL'}, one_leg_r:{armL:'down',armR:'down',legs:'oneR'},
  star:{armL:'up',armR:'up',legs:'apart'},
};
let poseCur=null;
let poseTAcc=0,poseTimeLimit=4,poseZoneLastActive={},poseResult=null,poseFeedT=0;
let poseSig=null,poseHold=0,poseMatch=null;   // chế độ AI: tín hiệu khung xương, thời gian giữ đúng, kết quả từng tay/chân
const poseAI=()=>useAI&&Track.active==='pose';
const poseLimit=()=>poseTimeLimit+(poseAI()?0.8:0);

/* ---- match mode (kiểu Pikachu: chọn 2 hình giống nhau) ---- */
let matchCols=3,matchRows=2,matchTiles=[],matchSel=[],matchLastKey=null,matchCooldown=0;
let matchWrong=0,matchMatchedCount=0,matchTotalPairs=3,matchWrongT=0,matchOverPending=false;

/* ---- race mode: chạy vượt chướng ngại, 1 hoặc 2 người chơi ---- */
const RACE_ANIMALS=['🐰','🐢','🐆','🐕','🐎','🦘','🐔','🦆'];
const OBSTACLES=[
  {type:'jump',  label:'NHẢY LÊN!',    icon:'⬆️', color:'#2FBF9F'},
  {type:'duck',  label:'CÚI XUỐNG!',   icon:'⬇️', color:'#FF6B9A'},
  {type:'sprint',label:'CHẠY NHANH!',  icon:'💨', color:'#FF8A3D'},
];
let playerCount=+store.get('bv_race_pc','1'); if(!(playerCount===1||playerCount===2))playerCount=1;
let raceP1=null, raceP2=null, raceObstacle=null, raceApproach=1, raceGapT=1, raceWinner=null;
let winsLeft=+store.get('bv_race_left','0')||0, winsRight=+store.get('bv_race_right','0')||0;
function raceApproachTime(){ return lerp(3.6,1.9,lvlT()); }
function raceObstaclesNeeded(){ return 2+Math.floor((level-1)/3); }
function newRunner(animal){ return {animal,alive:true,cleared:0,upperT:9,lowerT:9,fullT:9,effort:0,fallT:0,ai:false}; }
let raceSig={};   // tín hiệu khung xương theo bên (left/right/solo), giữ qua các cấp để khỏi phải hiệu chỉnh lại

/* ---- music ---- */
let musicPref=store.get('bv_music','1')==='1',musicRunning=false,musicNext=0,musicStep=0;
const LEAD_HZ=[523.25,659.25,783.99,659.25,523.25,659.25,392.00,440.00];

/* ============ audio ============ */
let AC=null;
function ac(){
  try{
    if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
    if(AC&&AC.state==='suspended')AC.resume();
  }catch(e){}
  return AC;
}
function tone(f0,f1,dur,vol,type,delay){
  if(muted)return;const a=ac();if(!a)return;
  try{
    const t0=a.currentTime+(delay||0);
    const o=a.createOscillator(),g=a.createGain();
    o.type=type||'sine';
    o.frequency.setValueAtTime(f0,t0);
    if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(vol||0.18,t0+0.015);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g);g.connect(a.destination);
    o.start(t0);o.stop(t0+dur+0.05);
  }catch(e){}
}
const sPop=star=>{ if(star){tone(660,990,.12,.2);tone(990,1320,.14,.16,'sine',.09);} else tone(rand(500,640),rand(880,1040),.11,.18); };
const sTick=()=>tone(880,0,.06,.08,'square');
const sCount=go=>go?tone(880,1320,.25,.2):tone(660,0,.09,.15);
const sFanfare=()=>{tone(523,0,.16,.18,'triangle',0);tone(659,0,.16,.18,'triangle',.14);tone(784,0,.2,.18,'triangle',.28);tone(1047,0,.4,.2,'triangle',.42);};
const sBuzz=()=>tone(300,220,.16,.14,'sine');
const sPick=()=>tone(700,900,.12,.15,'sine');
const sLevelUp=()=>{tone(660,880,.15,.2,'triangle');tone(880,1175,.2,.2,'triangle',.12);};

/* ---- nhạc nền tự soạn (không dùng nhạc có bản quyền) ---- */
const BPM=124, STEP=60/BPM/4;
function startMusic(){
  if(!musicPref)return; const a=ac(); if(!a)return;
  musicStep=0; musicNext=a.currentTime+0.05; musicRunning=true;
}
function stopMusic(){ musicRunning=false; }
function kickAt(t){ if(muted)return; const a=ac(); if(!a)return; try{
  const o=a.createOscillator(),g=a.createGain(); o.type='sine';
  o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.14);
  g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
  o.connect(g);g.connect(a.destination); o.start(t);o.stop(t+0.2);
}catch(e){} }
function bassAt(t,f){ if(muted)return; const a=ac(); if(!a)return; try{
  const o=a.createOscillator(),g=a.createGain(); o.type='triangle';
  o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.22,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.26);
  o.connect(g);g.connect(a.destination); o.start(t);o.stop(t+0.3);
}catch(e){} }
function pluckAt(t,f){ if(muted)return; const a=ac(); if(!a)return; try{
  const o=a.createOscillator(),g=a.createGain(); o.type='sine';
  o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.13,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
  o.connect(g);g.connect(a.destination); o.start(t);o.stop(t+0.2);
}catch(e){} }
let noiseBuf=null;
function hatAt(t){ if(muted)return; const a=ac(); if(!a)return; try{
  if(!noiseBuf){ noiseBuf=a.createBuffer(1,Math.floor(a.sampleRate*0.08),a.sampleRate);
    const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length); }
  const src=a.createBufferSource(); src.buffer=noiseBuf;
  const hp=a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7000;
  const g=a.createGain(); g.gain.setValueAtTime(0.10,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
  src.connect(hp);hp.connect(g);g.connect(a.destination); src.start(t);src.stop(t+0.07);
}catch(e){} }
function scheduleMusic(){
  if(!musicRunning||!musicPref)return; const a=ac(); if(!a)return;
  while(musicNext < a.currentTime+0.12){
    const s=musicStep%16;
    if(s===0){ kickAt(musicNext); bassAt(musicNext,130.81); }
    if(s===8){ kickAt(musicNext); bassAt(musicNext,98.00); }
    if(s%2===1) hatAt(musicNext);
    if(s%2===0) pluckAt(musicNext, LEAD_HZ[(s/2)|0]);
    musicNext+=STEP; musicStep++;
  }
}

/* ============ wake lock ============ */
async function lockWake(){try{if(navigator.wakeLock)wl=await navigator.wakeLock.request('screen')}catch(e){}}
function freeWake(){try{if(wl){wl.release();wl=null}}catch(e){}}

/* ============ camera ============ */
async function initCamera(){
  stopCamera();
  const c={audio:false,video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}}};
  stream=await navigator.mediaDevices.getUserMedia(c);
  video.srcObject=stream;
  await video.play();
  camOn=true;prev=null;
}
function stopCamera(){
  if(stream){try{stream.getTracks().forEach(t=>t.stop())}catch(e){}stream=null}
  video.srcObject=null;camOn=false;
}

/* ============ sizing ============ */
function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  const d=Math.min(2,window.devicePixelRatio||1);
  if(w===W&&h===H&&d===DPR)return;
  W=w;H=h;DPR=d;minDim=Math.min(W,H);
  canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
  AW=96;AH=Math.max(8,Math.round(AW*H/W));
  ana.width=AW;ana.height=AH;
  prev=null;
}
window.addEventListener('resize',resize);

function coverRect(vw,vh,cw,ch){
  const vr=vw/vh,cr=cw/ch;let sw,sh;
  if(vr>cr){sh=vh;sw=vh*cr}else{sw=vw;sh=vw/cr}
  return {sx:(vw-sw)/2,sy:(vh-sh)/2,sw,sh};
}
function drawCam(c2,cw,ch){
  const vw=video.videoWidth,vh=video.videoHeight;
  if(!vw||!vh)return false;
  const r=coverRect(vw,vh,cw,ch);
  c2.save();c2.translate(cw,0);c2.scale(-1,1);
  c2.drawImage(video,r.sx,r.sy,r.sw,r.sh,0,0,cw,ch);
  c2.restore();
  return true;
}

/* ============ motion analysis ============ */
function analyze(){
  if(!camOn||video.readyState<2){motionRatio=1;return}
  if(!drawCam(actx,AW,AH)){motionRatio=1;return}
  let d;
  try{d=actx.getImageData(0,0,AW,AH).data}catch(e){motionRatio=1;return}
  const n=AW*AH;
  if(!prev||prev.length!==n){
    prev=new Uint8Array(n);trail=new Float32Array(n);
    for(let i=0;i<n;i++){const j=i*4;prev[i]=(d[j]*3+d[j+1]*4+d[j+2])>>3}
    motionRatio=1;return;
  }
  let cnt=0;
  for(let i=0;i<n;i++){
    const j=i*4,g=(d[j]*3+d[j+1]*4+d[j+2])>>3;
    const mv=Math.abs(g-prev[i])>16;
    prev[i]=g;
    let t=mv?1:trail[i]*0.65;   // vệt chuyển động ~3 frame để cú vụt nhanh vẫn dính
    if(t<0.08)t=0;
    trail[i]=t;
    if(t>0.3)cnt++;
  }
  motionRatio=cnt/n;
}
function motionAt(o){
  if(!trail)return {cnt:0,density:0};
  const s=AW/W;
  const cx=o.x*AW,cy=o.y*AH,r=Math.max(2,o.r*minDim*s*1.2);
  const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(AW-1,Math.ceil(cx+r));
  const y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(AH-1,Math.ceil(cy+r));
  let cnt=0,area=0;const r2=r*r;
  for(let y=y0;y<=y1;y++){
    const dy=y-cy,row=y*AW;
    for(let x=x0;x<=x1;x++){
      const dx=x-cx;
      if(dx*dx+dy*dy<=r2){area++;if(trail[row+x]>0.3)cnt++}
    }
  }
  return {cnt,density:area?cnt/area:0};
}
function zoneDensity(x0,y0,x1,y1){
  if(!trail)return 0;
  const gx0=Math.max(0,Math.floor(x0*AW)),gx1=Math.min(AW-1,Math.ceil(x1*AW));
  const gy0=Math.max(0,Math.floor(y0*AH)),gy1=Math.min(AH-1,Math.ceil(y1*AH));
  let cnt=0,area=0;
  for(let y=gy0;y<=gy1;y++){
    const row=y*AW;
    for(let x=gx0;x<=gx1;x++){area++;if(trail[row+x]>0.3)cnt++}
  }
  return area?cnt/area:0;
}
function zoneActive(key){
  const z=ZONES[key],d=zoneDensity(z[0],z[1],z[2],z[3]);
  return d>=ZONE_TH[sens] && d>=motionRatio*1.3;
}
function zoneActiveRect(r){
  const d=zoneDensity(r[0],r[1],r[2],r[3]);
  return d>=ZONE_TH[sens] && d>=motionRatio*1.3;
}

/* ============ falling objects: bubbles + colors ============ */
function spawnFalling(){
  if(objs.length>=6)return;
  const x=rand(0.14,0.86);
  for(const o of objs){
    if(Math.abs(o.x-x)*W<(o.r+0.09)*minDim*1.1&&o.y>0.72)return;
  }
  let isBad=false,isStar=false,colorKey=null,emoji,color;
  if(mode==='bubbles'){
    const bc=bubbleBadChance();
    isBad = !objs.some(o=>o.bad) && Math.random()<bc;
    isStar = !isBad && Math.random()<0.12 && !objs.some(o=>o.star);
    if(isBad){emoji='🐛';color='#8A6D45';}
    else if(isStar){emoji='⭐';color='#FFD84D';}
    else{emoji=FRUITS[Math.random()*FRUITS.length|0];color=COLORS[Math.random()*COLORS.length|0];}
  }else{ // colors
    isStar = Math.random()<0.10 && !objs.some(o=>o.star);
    if(isStar){emoji='⭐';color='#FFD84D';}
    else{
      const n=colorPalette();
      const def=COLOR_DEFS[Math.random()*n|0];
      colorKey=def.key;emoji=def.emoji;color=def.hex;
    }
  }
  const r=isStar?0.075:0.09;
  const speedMul = mode==='bubbles'?bubbleSpeedMul():colorSpeedMul();
  const prog=1-remainMs/(LEVEL_TIME*1000);
  objs.push({
    x,baseX:x,y:1.08+r,r,star:isStar,bad:isBad,colorKey,
    vy:(isStar?0.17:0.105+prog*0.05+rand(0,0.03))*speedMul,
    sway:rand(0.02,0.035),swf:rand(1.2,2.2),ph:rand(0,6.28),
    emoji,color,age:0,wob:rand(0,6.28)
  });
}
function scoreAdd(n,o){
  score+=n;
  const px=o.x*W,py=o.y*H,R=o.r*minDim;
  floats.push({x:px,y:py-R*0.4,t:0,text:'+'+n,star:o.star});
  const N=o.star?16:10;
  for(let k=0;k<N;k++){
    const a=rand(0,6.28),sp=rand(60,240);
    parts.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,t:0,life:rand(0.4,0.7),c:o.star?'#FFD84D':o.color,s:rand(3,7),conf:false});
  }
  sPop(o.star);
  try{if(navigator.vibrate)navigator.vibrate(20)}catch(e){}
  const target = mode==='bubbles'?bubbleTarget():colorTarget();
  if(score>=target)levelUp();
}
function hitBad(o){
  loseHeart();
  const px=o.x*W,py=o.y*H;
  floats.push({x:px,y:py-20,t:0,bad:true,text:'😅'});
  for(let k=0;k<8;k++){const a=rand(0,6.28),sp=rand(40,140);
    parts.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:.5,c:'#8A6D45',s:rand(3,6),conf:false});}
  sBuzz();
  try{if(navigator.vibrate)navigator.vibrate([15,40,15])}catch(e){}
}
function hitWrongColor(o){
  loseHeart();
  const px=o.x*W,py=o.y*H;
  floats.push({x:px,y:py-20,t:0,bad:true,text:'✗'});
  for(let k=0;k<8;k++){const a=rand(0,6.28),sp=rand(40,140);
    parts.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:.5,c:'#B0B8C4',s:rand(3,6),conf:false});}
  sBuzz();
}
function resolveHit(o){
  if(o.bad){hitBad(o);return;}
  if(o.star){scoreAdd(5,o);return;}
  if(mode==='colors'){
    if(o.colorKey===targetColor)scoreAdd(1,o); else hitWrongColor(o);
  }else scoreAdd(1,o);
}
function loseHeart(){
  hearts=Math.max(0,hearts-1);
  if(hearts<=0)endGame();
}
function renderHearts(cur,max){
  let h=''; for(let i=0;i<max;i++)h+= i<cur?'❤️':'🤍';
  $('heartsPill').innerHTML=h;
}
function pickTargetColor(exclude){
  const n=colorPalette();
  const pool=COLOR_DEFS.slice(0,n).map(c=>c.key).filter(k=>k!==exclude);
  return pool[Math.random()*pool.length|0];
}
function renderTarget(){
  const def=COLOR_DEFS.find(c=>c.key===targetColor);
  $('targetEmoji').textContent=def.emoji; $('targetName').textContent=def.name;
  const p=$('targetPill'); p.style.setProperty('--tcol',def.hex);
  p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
}
function updateFalling(dt){
  spawnT-=dt;
  if(spawnT<=0){
    spawnFalling();
    const prog=1-remainMs/(LEVEL_TIME*1000);
    const baseInt = mode==='colors'?lerp(0.85,0.5,prog):lerp(0.95,0.5,prog);
    spawnT = baseInt*(mode==='bubbles'?bubbleSpawnMul():1) + rand(0,0.2);
  }
  for(let i=objs.length-1;i>=0;i--){
    const o=objs[i];
    o.age+=dt;o.y-=o.vy*dt;
    o.x=o.baseX+Math.sin(o.age*o.swf+o.ph)*o.sway;
    if(o.y<-0.15){objs.splice(i,1);continue}
    if(camOn&&o.age>0.3){
      const m=motionAt(o);
      if(m.cnt>=3&&m.density>=SENS_TH[sens]&&m.density>=motionRatio*1.4){
        resolveHit(o);objs.splice(i,1);
      }
    }
  }
  if(mode==='colors'){
    targetT+=dt;
    if(targetT>=colorSwapSec()){targetColor=pickTargetColor(targetColor);targetT=0;renderTarget();tone(700,900,.18,.16,'sine');}
  }
}

/* ============ pose mode ============ */
function nextPose(){
  const tier = poseTierFor();
  const ai = poseAI();
  const pool = POSES.filter(p=>p.aiOnly?(ai&&level>=p.minLevel):p.zones.length<=tier);
  let next;
  do{next=pool[Math.random()*pool.length|0];}while(poseCur&&next.id===poseCur.id&&pool.length>1);
  poseCur=next; poseTAcc=0; poseTimeLimit=poseTimeLimitFor(); poseZoneLastActive={}; poseResult=null;
  poseHold=0; poseMatch=null;
}
function updatePose(dt){
  if(!poseCur)return;
  if(poseResult){
    poseFeedT+=dt;
    if(poseAI()){if(!poseSig)poseSig=Body.signals();poseSig.update(Track.body('solo'),performance.now())}
    if(poseFeedT>0.9){
      if(poseResult==='hit')levelUp(); else endGame();
    }
    return;
  }
  poseTAcc+=dt;
  if(poseAI()){
    const b=Track.body('solo');
    if(!poseSig)poseSig=Body.signals();
    poseSig.update(b,performance.now());
    poseMatch=b?Body.matchPose(b,POSE_ART[poseCur.id],poseSig,level>=16):null;
    if(poseMatch&&poseMatch.ok)poseHold+=dt; else poseHold=Math.max(0,poseHold-dt*2);
    if(poseHold>=0.4){
      poseResult='hit'; poseFeedT=0;
      burstAt(W/2,H*0.37,'#2FBF9F',18); sPop(false);
    }else if(poseTAcc>=poseLimit()){
      poseResult='miss'; poseFeedT=0; sBuzz();
    }
    return;
  }
  if(camOn){
    for(const z of poseCur.zones){if(zoneActive(z))poseZoneLastActive[z]=poseTAcc;}
  }
  const allRecent = poseCur.zones.every(z=>(poseTAcc-(poseZoneLastActive[z]??-99))<0.7);
  if(allRecent){
    poseResult='hit'; poseFeedT=0;
    burstAt(W/2,H*0.32,'#2FBF9F',18); sPop(false);
  }else if(poseTAcc>=poseTimeLimit){
    poseResult='miss'; poseFeedT=0; sBuzz();
  }
}
function roundRectPath(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function drawZoneHint(key,active){
  const z=ZONES[key];
  const rx=z[0]*W,ry=z[1]*H,rw=(z[2]-z[0])*W,rh=(z[3]-z[1])*H;
  const r=Math.min(rw,rh)*0.18;
  ctx.save();
  ctx.globalAlpha = active?0.55:0.22;
  ctx.fillStyle = active?'#B6FFF0':'#FFFFFF';
  roundRectPath(rx,ry,rw,rh,r); ctx.fill();
  ctx.lineWidth=3; ctx.strokeStyle = active?'#2FBF9F':'rgba(255,255,255,.8)';
  roundRectPath(rx,ry,rw,rh,r); ctx.stroke();
  ctx.restore();
}
function drawFigure(cx,cy,s,armL,armR,legs,color){
  ctx.save(); ctx.translate(cx,cy);
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=s*0.16;
  const headR=s*0.22, neckY=-s*0.55, hipY=s*0.05;
  ctx.beginPath(); ctx.moveTo(0,neckY+headR*0.6); ctx.lineTo(0,hipY); ctx.stroke();
  ctx.beginPath();
  if(legs==='squat'){
    ctx.moveTo(0,hipY); ctx.lineTo(-s*0.28,hipY+s*0.22);
    ctx.moveTo(0,hipY); ctx.lineTo(s*0.28,hipY+s*0.22);
  }else if(legs==='apart'){
    ctx.moveTo(0,hipY); ctx.lineTo(-s*0.40,hipY+s*0.40);
    ctx.moveTo(0,hipY); ctx.lineTo(s*0.40,hipY+s*0.40);
  }else if(legs==='oneL'||legs==='oneR'){
    const k=legs==='oneL'?-1:1;
    ctx.moveTo(0,hipY); ctx.lineTo(k*s*0.30,hipY+s*0.18); ctx.lineTo(k*s*0.14,hipY+s*0.38);
    ctx.moveTo(0,hipY); ctx.lineTo(-k*s*0.16,hipY+s*0.42);
  }else{
    ctx.moveTo(0,hipY); ctx.lineTo(-s*0.16,hipY+s*0.42);
    ctx.moveTo(0,hipY); ctx.lineTo(s*0.16,hipY+s*0.42);
  }
  ctx.stroke();
  const shoulderY=neckY+headR*0.8;
  function arm(side,type){
    const dir=side==='L'?-1:1;
    ctx.beginPath(); ctx.moveTo(0,shoulderY);
    if(type==='up')ctx.lineTo(dir*s*0.34,shoulderY-s*0.48);
    else if(type==='side')ctx.lineTo(dir*s*0.5,shoulderY+s*0.02);
    else if(type==='head')ctx.lineTo(dir*s*0.22,shoulderY-s*0.28);
    else if(type==='hip'){ctx.lineTo(dir*s*0.34,shoulderY+s*0.24);ctx.lineTo(dir*s*0.12,hipY);}
    else ctx.lineTo(dir*s*0.12,shoulderY+s*0.38);
    ctx.stroke();
  }
  arm('L',armL); arm('R',armR);
  ctx.beginPath(); ctx.arc(0,neckY,headR,0,6.29); ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(-headR*0.32,-headR*0.15,headR*0.22,headR*0.15,-0.4,0,6.29); ctx.fill();
  ctx.restore();
}
function drawPoseScene(){
  if(!poseCur)return;
  if(!poseAI())for(const z of poseCur.zones){
    const active=(poseTAcc-(poseZoneLastActive[z]??-99))<0.7;
    drawZoneHint(z,active);
  }
  const cx=W*0.5,cy=H*0.37,s=Math.min(W,H)*0.21;
  const P=POSE_ART[poseCur.id];
  drawFigure(cx,cy,s,P.armL,P.armR,P.legs||'stand', poseResult==='hit'?'#2FBF9F':(poseResult==='miss'?'#FF8A3D':'#12806A'));
  ctx.font="800 "+Math.round(Math.min(W,H)*0.045)+"px 'Baloo 2',sans-serif";
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.lineWidth=6; ctx.strokeStyle='rgba(20,69,107,.5)'; ctx.fillStyle='#fff';
  ctx.strokeText(poseCur.label,W/2,cy-s*1.0); ctx.fillText(poseCur.label,W/2,cy-s*1.0);
  if(poseResult){
    ctx.fillStyle = poseResult==='hit'?'#2FBF9F':'#FF8A3D';
    ctx.fillText(poseResult==='hit'?'Đúng rồi! 🎉':'Cố lên bé nhé! 💪', W/2, cy+s*1.3);
  }else{
    const pct=Math.max(0,1-poseTAcc/poseLimit());
    const bw=Math.min(W*0.6,360),bx=W/2-bw/2,by=cy+s*0.9;
    roundRectPath(bx,by,bw,14,7); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fill();
    roundRectPath(bx,by,bw*pct,14,7); ctx.fillStyle='#2FBF9F'; ctx.fill();
  }
}
function burstAt(px,py,color,n){
  for(let k=0;k<(n||14);k++){const a=rand(0,6.28),sp=rand(60,220);
    parts.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,t:0,life:rand(.4,.7),c:color,s:rand(3,6),conf:false});}
}

/* ============ match mode (kiểu Pikachu: chọn 2 hình giống nhau) ============ */
function matchZoneRect(idx,cols,rows){
  const [ax0,ay0,ax1,ay1]=MATCH_AREA, gap=0.012;
  const cw=(ax1-ax0-gap*(cols-1))/cols, ch=(ay1-ay0-gap*(rows-1))/rows;
  const col=idx%cols, row=(idx/cols)|0;
  const x0=ax0+col*(cw+gap), y0=ay0+row*(ch+gap);
  return [x0,y0,x0+cw,y0+ch];
}
function genMatchGrid(){
  const cfg=matchGridFor();
  matchCols=cfg.cols; matchRows=cfg.rows;
  matchTotalPairs=(matchCols*matchRows)/2;
  const pool=MATCH_ICONS.slice();
  const chosen=[];
  while(chosen.length<matchTotalPairs)chosen.push(pool.splice(Math.random()*pool.length|0,1)[0]);
  const deck=chosen.concat(chosen);
  for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]];}
  matchTiles=deck.map(icon=>({icon,matched:false}));
  matchSel=[]; matchWrong=0; matchMatchedCount=0; matchLastKey=null; matchCooldown=0; matchWrongT=0; matchOverPending=false;
}
function matchPick(i){
  if(matchSel.length===0){
    matchSel=[i]; matchLastKey=i; matchCooldown=0.4; sPick();
  }else if(matchSel[0]===i){
    matchSel=[]; matchLastKey=i; matchCooldown=0.4;
  }else{
    const a=matchTiles[matchSel[0]], b=matchTiles[i];
    if(a.icon===b.icon){
      a.matched=true; b.matched=true; matchMatchedCount++;
      const ra=matchZoneRect(matchSel[0],matchCols,matchRows), rb=matchZoneRect(i,matchCols,matchRows);
      burstAt((ra[0]+ra[2])/2*W,(ra[1]+ra[3])/2*H,'#FFD84D',14);
      burstAt((rb[0]+rb[2])/2*W,(rb[1]+rb[3])/2*H,'#FFD84D',14);
      sPop(false);
      matchSel=[]; matchLastKey=i; matchCooldown=0.4;
      if(matchMatchedCount>=matchTotalPairs)levelUp();
    }else{
      matchWrong++; matchSel=[matchSel[0],i]; matchLastKey=i; matchWrongT=0.55; sBuzz();
      hearts=Math.max(0,hearts-1);
      if(hearts<=0)matchOverPending=true;
    }
  }
}
function updateMatch(dt){
  if(matchWrongT>0){
    matchWrongT-=dt;
    if(matchWrongT<=0){
      matchSel=[];
      if(matchOverPending){matchOverPending=false;endGame();}
    }
    return;
  }
  if(!camOn)return; // chế độ chạm dùng pointerdown, không cần quét zone ở đây
  if(matchCooldown>0){matchCooldown-=dt;return;}
  if(matchLastKey!==null){
    // bé vẫn còn tay ở ô vừa chọn thì chờ rời đi hẳn, tránh vệt chuyển động sót lại bị tính nhầm
    if(zoneActiveRect(matchZoneRect(matchLastKey,matchCols,matchRows)))return;
    matchLastKey=null;
  }
  for(let i=0;i<matchTiles.length;i++){
    if(matchTiles[i].matched)continue;
    if(zoneActiveRect(matchZoneRect(i,matchCols,matchRows))){matchPick(i);break;}
  }
}
function drawMatchScene(){
  // bảng nền viền xanh lá kiểu bàn ghép hình cổ điển, ôm quanh cả lưới ô
  const [ax0,ay0,ax1,ay1]=MATCH_AREA;
  ctx.save();
  roundRectPath(ax0*W-10,ay0*H-10,(ax1-ax0)*W+20,(ay1-ay0)*H+20,16);
  ctx.fillStyle='#3E7D4C'; ctx.fill();
  ctx.restore();
  for(let i=0;i<matchTiles.length;i++){
    const t=matchTiles[i];
    if(t.matched)continue;
    const r=matchZoneRect(i,matchCols,matchRows);
    const cx=(r[0]+r[2])/2*W, cy=(r[1]+r[3])/2*H;
    const w=(r[2]-r[0])*W, h=(r[3]-r[1])*H, size=Math.min(w,h);
    const selected=matchSel.includes(i);
    const wrong=matchWrongT>0&&selected;
    ctx.save();
    if(wrong)ctx.translate(Math.sin(frame*3)*4,0);
    roundRectPath(cx-w/2,cy-h/2,w,h,size*0.10);
    ctx.fillStyle = wrong?'#E1707A':selected?'#B9A7EE':'#F3E3BE';
    ctx.fill();
    ctx.lineWidth=selected?4:2;
    ctx.strokeStyle= wrong?'#B23A46':selected?'#5A3FC0':'rgba(62,125,76,.55)';
    ctx.stroke();
    ctx.font=(size*0.56)+'px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(t.icon, cx, cy+size*0.03);
    ctx.restore();
  }
}

/* ============ race mode: chạy vượt chướng ngại ============ */
function beginRace(){
  const pool=RACE_ANIMALS.slice();
  raceP1=newRunner(pool.splice(Math.random()*pool.length|0,1)[0]);
  raceP2=playerCount===2?newRunner(pool.splice(Math.random()*pool.length|0,1)[0]):null;
  raceObstacle=null; raceApproach=1; raceGapT=1; raceWinner=null;
}
function laneZone(side){ return side==='left'?[0,0.5]:[0.5,1]; }
function updateRunnerSignals(p,side,dt){
  if(!p||!p.alive)return;
  p.upperT+=dt; p.lowerT+=dt; p.fullT+=dt;
  if(useAI&&Track.active==='pose'){
    // AI khung xương: nhảy = cả người bật lên, cúi = vai/hông hạ thấp, chạy nhanh = tay chân cử động mạnh
    const key=playerCount===2?side:'solo';
    const S=raceSig[key]||(raceSig[key]=Body.signals());
    const b=Track.body(key);
    S.update(b,performance.now());
    p.ai=!!b;
    if(b){
      if(S.jump)p.upperT=0;
      if(S.duck)p.lowerT=0;
      if(S.run)p.fullT=0;
      p.effort=Math.min(1,S.energy/2.5);
    }else p.effort*=0.9;
    return;
  }
  if(!camOn)return;
  const [x0,x1]=laneZone(side);
  const dUp=zoneDensity(x0,0.05,x1,0.42);
  const dLow=zoneDensity(x0,0.55,x1,0.95);
  const dAll=zoneDensity(x0,0.05,x1,0.95);
  const TH=ZONE_TH[sens];
  p.effort=Math.max(dUp,dLow,dAll);
  if(dUp>=TH*1.4 && dUp>dLow*1.3) p.upperT=0;
  if(dLow>=TH*1.4 && dLow>dUp*1.3) p.lowerT=0;
  if(dAll>=TH*1.8) p.fullT=0;
}
function judgeRunner(p){
  if(!p||!p.alive)return;
  const t=raceObstacle.type;
  const ok=(t==='jump'&&p.upperT<0.7)||(t==='duck'&&p.lowerT<0.7)||(t==='sprint'&&p.fullT<0.7);
  if(ok){ p.cleared++; sPop(false); }
  else{ p.alive=false; p.fallT=0; sBuzz(); try{if(navigator.vibrate)navigator.vibrate([20,60,20])}catch(e){} }
}
function checkRaceEnd(){
  if(playerCount===1){
    if(!raceP1.alive){ endGame(); }
    else if(raceP1.cleared>=raceObstaclesNeeded()){ levelUp(); }
  }else{
    if(!raceP1.alive||!raceP2.alive){
      if(raceP1.alive&&!raceP2.alive)raceWinner='left';
      else if(raceP2.alive&&!raceP1.alive)raceWinner='right';
      else raceWinner='tie';
      if(raceWinner==='left'){winsLeft++;store.set('bv_race_left',String(winsLeft));}
      else if(raceWinner==='right'){winsRight++;store.set('bv_race_right',String(winsRight));}
      endGame();
    }
  }
}
function updateRace(dt){
  if(raceWinner)return;
  if(!raceObstacle){
    raceGapT-=dt;
    if(raceGapT<=0){ raceObstacle=OBSTACLES[Math.random()*OBSTACLES.length|0]; raceApproach=1; }
  }else{
    raceApproach-=dt/raceApproachTime();
    if(raceApproach<=0){
      judgeRunner(raceP1); if(playerCount===2)judgeRunner(raceP2);
      raceObstacle=null; raceGapT=1.1;
      checkRaceEnd();
      if(raceWinner||state!=='play')return;
    }
  }
  updateRunnerSignals(raceP1,'left',dt);
  if(playerCount===2)updateRunnerSignals(raceP2,'right',dt);
  if(!raceP1.alive)raceP1.fallT+=dt;
  if(raceP2&&!raceP2.alive)raceP2.fallT+=dt;
}
function drawRunner(cx,cy,size,p){
  ctx.save();ctx.translate(cx,cy);
  if(!p.alive){
    ctx.rotate(Math.min(0.5,p.fallT*2)*-1);
    ctx.globalAlpha=Math.max(0.35,1-p.fallT*0.6);
  }else{
    const bob=Math.sin(frame*0.3*(0.5+p.effort*4))*size*0.08*Math.min(1,p.effort*4+0.2);
    ctx.translate(0,bob);
  }
  ctx.font=(size)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(p.animal,0,0);
  ctx.restore();
}
function drawLane(y0,y1,p,label){
  const x0=W*0.06,x1=W*0.94,cy=(y0+y1)/2,laneH=y1-y0;
  ctx.save();
  roundRectPath(x0,y0,x1-x0,laneH,16);
  ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fill();
  ctx.font="700 "+Math.round(laneH*0.2)+"px 'Baloo 2',sans-serif";
  ctx.textAlign='left'; ctx.fillStyle='rgba(20,69,107,.6)';
  ctx.fillText(label,x0+4,y0-8);
  const runnerX=x0+laneH*0.55;
  if(raceObstacle && p.alive){
    const ox=runnerX+(x1-40-runnerX)*raceApproach;
    const osize=laneH*0.5;
    roundRectPath(ox-osize*0.55,cy-osize*0.5,osize*1.1,osize,14);
    ctx.fillStyle=hexA(raceObstacle.color,0.9); ctx.fill();
    ctx.font=(osize*0.55)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(raceObstacle.icon,ox,cy-osize*0.05);
    if(raceApproach>0.55){
      ctx.font="800 "+Math.round(laneH*0.16)+"px 'Baloo 2',sans-serif";
      ctx.fillStyle=raceObstacle.color;
      ctx.fillText(raceObstacle.label,ox,cy-osize*0.75);
    }
  }
  drawRunner(runnerX,cy,laneH*0.62,p);
  if(useAI&&p.alive&&!p.ai&&state==='play'&&levelBannerT<=0){
    ctx.font="800 "+Math.round(laneH*0.15)+"px 'Baloo 2',sans-serif";
    ctx.fillStyle='#E14D5B'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
    ctx.fillText('👀 Chưa thấy bé',x1-8,y0-8);
  }
  if(!p.alive){
    ctx.font="800 "+Math.round(laneH*0.22)+"px 'Baloo 2',sans-serif";
    ctx.fillStyle='#E14D5B'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Vấp ngã rồi! 😵',(x0+x1)/2,y1+laneH*0.32);
  }
  ctx.restore();
}
function drawRaceScene(){
  if(!raceP1)return;
  if(playerCount===1){
    drawLane(H*0.28,H*0.72,raceP1,'Bé — đã qua '+raceP1.cleared+'/'+raceObstaclesNeeded());
  }else{
    drawLane(H*0.14,H*0.46,raceP1,'Bên TRÁI');
    drawLane(H*0.54,H*0.86,raceP2,'Bên PHẢI');
  }
}

function puff(o){
  const px=o.x*W,py=o.y*H;
  for(let k=0;k<6;k++){
    const a=rand(0,6.28),sp=rand(30,110);
    parts.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,t:0,life:.45,c:'#FFFFFF',s:rand(2,5),conf:false});
  }
}
function confetti(){
  const cs=['#FFD84D','#FF6B9A','#5AA9FF','#3BC9A9','#FF8A3D'];
  for(let k=0;k<90;k++){
    parts.push({x:rand(0,W),y:rand(-H*0.25,0),vx:rand(-40,40),vy:rand(80,240),t:0,life:rand(1.3,2.4),c:cs[k%5],s:rand(4,8),conf:true});
  }
}

function stepFx(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];p.t+=dt;
    if(p.t>p.life){parts.splice(i,1);continue}
    p.vy+=(p.conf?60:340)*dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i];f.t+=dt;f.y-=44*dt;
    if(f.t>0.9)floats.splice(i,1);
  }
}

/* ============ rendering ============ */
const blobs=[];
for(let i=0;i<6;i++)blobs.push({x:Math.random(),y:Math.random(),r:rand(0.12,0.3),v:rand(0.01,0.03)});
function drawFallbackBg(t){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#7FD8F7');g.addColorStop(1,'#EAFBFF');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.35)';
  for(const b of blobs){
    const y=((b.y-t*b.v)%1.4+1.4)%1.4-0.2;
    ctx.beginPath();ctx.arc(b.x*W,y*H,b.r*minDim,0,6.29);ctx.fill();
  }
}
function drawSparkles(){
  if(!trail)return;
  const n=AW*AH;let drawn=0;
  ctx.fillStyle='rgba(255,250,180,.65)';
  for(let i=frame%4;i<n&&drawn<70;i+=4){
    if(trail[i]<0.3)continue;
    const x=(i%AW+0.5)/AW*W,y=((i/AW|0)+0.5)/AH*H;
    ctx.beginPath();ctx.arc(x+rand(-3,3),y+rand(-3,3),rand(2.5,5),0,6.29);ctx.fill();
    drawn++;
  }
}
function drawObjs(){
  for(const o of objs){
    const x=o.x*W,y=o.y*H,R=o.r*minDim;
    ctx.save();ctx.translate(x,y);
    if(o.star){
      ctx.rotate(Math.sin(o.age*3)*0.15);
      ctx.shadowColor='rgba(255,216,77,.95)';ctx.shadowBlur=26;
      ctx.font=(R*1.9)+'px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#FFD84D';
      ctx.fillText('⭐',0,0);
    }else{
      const wob=1+Math.sin(o.age*6+o.wob)*0.03;
      ctx.scale(wob,1/wob);
      ctx.beginPath();ctx.arc(0,0,R,0,6.29);
      ctx.fillStyle=hexA(o.color,0.8);ctx.fill();
      ctx.lineWidth=Math.max(2,R*0.08);
      ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke();
      ctx.beginPath();ctx.ellipse(-R*0.35,-R*0.4,R*0.28,R*0.18,-0.6,0,6.29);
      ctx.fillStyle='rgba(255,255,255,.75)';ctx.fill();
      ctx.font=(R*1.05)+'px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(o.emoji,0,R*0.04);
    }
    ctx.restore();
  }
}
function drawParts(){
  for(const p of parts){
    const a=1-p.t/p.life;
    ctx.globalAlpha=Math.max(0,a);
    ctx.fillStyle=p.c;
    if(p.conf){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.t*5+p.s);
      ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);
      ctx.restore();
    }else{
      ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.29);ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}
function drawFloats(){
  for(const f of floats){
    const a=1-f.t/0.9;
    ctx.globalAlpha=Math.max(0,a);
    ctx.font="800 "+Math.round(minDim*(f.star?0.075:0.055))+"px 'Baloo 2',sans-serif";
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=6;ctx.strokeStyle='rgba(255,255,255,.9)';
    ctx.strokeText(f.text,f.x,f.y);
    ctx.fillStyle=f.bad?'#E14D5B':(f.star?'#E8A400':'#FF6B2C');
    ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;
}
function render(t){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  let hasCam=false;
  if(camOn&&video.readyState>=2)hasCam=drawCam(ctx,W,H);
  if(!hasCam)drawFallbackBg(t/1000);
  else{ctx.fillStyle='rgba(8,24,48,.16)';ctx.fillRect(0,0,W,H)}
  const G=GAMES[mode];
  if(camOn&&(state==='play'||state==='count')&&!(useAI&&Track.active))drawSparkles();
  if(useAI&&skelOn&&Track.active&&(state==='play'||state==='count'||state==='pause')&&!(G&&G.skel===false))
    Track.draw(ctx,W,H,G&&G.skel);
  if(state==='play'||state==='pause'){
    if(mode==='bubbles'||mode==='colors')drawObjs();
    else if(mode==='pose')drawPoseScene();
    else if(mode==='match')drawMatchScene();
    else if(mode==='race')drawRaceScene();
    else if(G&&G.draw)G.draw();
  }
  drawParts();drawFloats();
  frame++;
}

/* ============ screens & flow ============ */
const SCREENS=['err','pauseS','endS','loading'];
function hideAll(){
  for(const s of SCREENS)$(s).hidden=true;
  $('big').hidden=true;$('hud').hidden=true;
}
function introText(){
  const G=GAMES[mode]; if(G&&G.intro)return typeof G.intro==='function'?G.intro():G.intro;
  if(mode==='bubbles')return 'Vẫy tay đập vỡ trái cây, né chú sâu nghịch ngợm nhé!';
  if(mode==='colors')return 'Nhìn màu ở trên rồi chỉ đập đúng quả cùng màu thôi nhé!';
  if(mode==='pose')return 'Nhìn hình rồi giơ tay, cúi người bắt chước y hệt nào!';
  if(mode==='match')return 'Nhìn kỹ rồi đưa tay hoặc chạm vào 2 hình giống nhau nhé!';
  return playerCount===2
    ? 'Mỗi bé đứng một bên camera. Gặp chữ NHẢY thì nhảy lên, CÚI thì cúi xuống, CHẠY NHANH thì vận động thật mạnh — sai là thua!'
    : 'Gặp chữ NHẢY thì nhảy lên, CÚI thì cúi xuống, CHẠY NHANH thì vận động thật mạnh nhé — sai động tác là thua đó!';
}
function goText(){
  const G=GAMES[mode]; if(G&&G.go)return typeof G.go==='function'?G.go():G.go;
  if(mode==='bubbles')return 'Vẫy tay đập bóng nào! 👋';
  if(mode==='colors')return 'Đập đúng màu nào! 🎨';
  if(mode==='pose')return 'Tạo dáng thật đẹp nào! 🤸';
  if(mode==='match')return 'Tìm cặp giống nhau nào! 🔍';
  return 'Sẵn sàng... Chạy đi nào! 🏃';
}
function applyHud(o){
  $('levelPill').hidden=o.level===false;
  $('scorePill').hidden=o.score==null;
  if(o.score!=null){$('scoreIcon').textContent=o.icon||'⭐';$('score').textContent=o.score}
  $('heartsPill').hidden=!o.hearts;
  if(o.hearts)renderHearts(o.hearts[0],o.hearts[1]);
  $('timePill').hidden=o.time==null;
  if(o.time!=null){$('timeIcon').textContent=o.timeIcon||'⏱';$('time').textContent=o.time;$('timePill').classList.toggle('low',!!o.low)}
  $('targetPill').hidden=true;
}
function updateHudChrome(){
  $('levelNum').textContent=level;
  const G=GAMES[mode];
  if(G&&G.hud){applyHud(G.hud());return}
  if(mode==='race'){
    $('scorePill').hidden=true; $('heartsPill').hidden=true; $('targetPill').hidden=true; $('timePill').hidden=true;
    $('levelPill').hidden = playerCount===2;
    return;
  }
  $('levelPill').hidden=false;
  $('scorePill').hidden = mode==='pose';
  $('scoreIcon').textContent = mode==='bubbles'?'⭐':mode==='colors'?'🎨':'🔍';
  if(mode==='bubbles'||mode==='colors'){
    $('score').textContent=score+'/'+(mode==='bubbles'?bubbleTarget():colorTarget());
    $('timeIcon').textContent='⏱'; $('time').textContent=Math.ceil(remainMs/1000);
    $('timePill').hidden=false;
    $('heartsPill').hidden=false; renderHearts(hearts,heartsMax);
    $('targetPill').hidden = mode!=='colors';
  }else if(mode==='pose'){
    $('timePill').hidden=true;
    $('heartsPill').hidden=true; $('targetPill').hidden=true;
  }else{ // match
    $('score').textContent=matchMatchedCount+'/'+matchTotalPairs;
    $('timePill').hidden=true;
    $('heartsPill').hidden=false; renderHearts(hearts,heartsMax);
    $('targetPill').hidden=true;
  }
}
function errText(e){
  const n=e&&e.name||'';
  if(n==='NotAllowedError'||n==='SecurityError')
    return 'Trình duyệt chưa được cấp quyền camera. Bấm "Thử lại camera" rồi chọn Cho phép — hoặc vào cài đặt trang web của trình duyệt để bật quyền Camera.';
  if(n==='NotFoundError'||n==='OverconstrainedError')
    return 'Không tìm thấy camera trên thiết bị này. Bé vẫn chơi được bằng cách chạm màn hình nhé!';
  return 'Có lỗi khi mở camera ('+(n||'không rõ')+'). Thử tải lại trang, hoặc chơi bằng chạm màn hình.';
}

function setLoading(msg,frac,fine){
  $('loadMsg').innerHTML=msg;
  $('loadBarWrap').hidden=frac==null; if(frac!=null)$('loadBar').style.width=Math.round(frac*100)+'%';
  $('loadFine').hidden=!fine; if(fine)$('loadFine').textContent=fine;
}
let toastTimer=0;
function toast(msg,ms){
  const el=$('toast'); el.textContent=msg; el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>{el.hidden=true},ms||4200);
}
async function startGame(withCam){
  wantCam=withCam; mode=selectedMode;
  const G=GAMES[mode]||{};
  hideAll();$('loading').hidden=!withCam;
  Track.stop(); useAI=false; lostShown=false; $('lostHint').hidden=true;
  objs=[];parts=[];floats=[];
  poseCur=null;poseResult=null;
  matchTiles=[];
  level=1;
  if(withCam){
    const wantAI=!!G.needs&&(!G.soft||aiPref)&&Track.supported();
    setLoading('Đang mở camera…<br>Hãy chọn <b>Cho phép</b> nếu trình duyệt hỏi nhé!',wantAI?0.02:null,
      wantAI&&!Track.ready(G.needs)?'Lần đầu game tải bộ nhận diện (khoảng '+NEEDS[G.needs].mb+' MB), những lần sau mở nhanh hơn nhiều.':'');
    const aiP=wantAI?Track.use(G.needs,f=>setLoading('Đang nạp bộ nhận diện… '+Math.round(f*100)+'%',f,'Chỉ tải một lần, lần sau mở rất nhanh.'),
      Object.assign({numPoses:1,numHands:2,numFaces:1,retry:Track.status[G.needs]==='failed'},typeof G.trackOpts==='function'?G.trackOpts():G.trackOpts)).catch(()=>false):Promise.resolve(false);
    try{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw {name:'NotFoundError'};
      await initCamera();
    }catch(e){
      stopCamera();Track.stop();hideAll();
      $('errMsg').textContent=errText(e);
      $('btnErrTouch').hidden=!G.touch;
      $('err').hidden=false;state='menu';
      return;
    }
    if(wantAI){
      useAI=await aiP;
      if(!useAI){
        if(!G.soft){
          stopCamera();hideAll();
          $('errMsg').textContent='Máy hoặc trình duyệt này chưa chạy được bộ nhận diện của trò "'+G.name+'" (cần Chrome, Safari hoặc Edge bản mới, và đủ bộ nhớ). Thử tải lại trang, đổi trình duyệt, hoặc chọn một trò khác nhé!';
          $('btnErrTouch').hidden=!G.touch;
          $('err').hidden=false;state='menu';return;
        }
        toast('Máy chưa chạy được AI nhận diện — chuyển sang chế độ camera cơ bản nhé!');
      }
    }
  }else stopCamera();
  if(G.start)G.start();
  ac();lockWake();
  hideAll();
  $('hud').hidden=false;
  $('btnFlip').hidden=!withCam;
  $('btnSkel').hidden=!(useAI&&(Track.active==='pose'||Track.active==='hand'));
  updateHudChrome();
  $('bigSub').textContent=introText();
  $('big').hidden=false;lastCount=-1;
  countEnd=performance.now()+3200;
  state='count';
}
function beginLevel(){
  if(mode==='bubbles'||mode==='colors'){
    score=0; hearts=heartsMax=3; objs=[]; spawnT=0.25; remainMs=LEVEL_TIME*1000; lastTick=-1;
    if(mode==='colors'){ targetColor=pickTargetColor(null); targetT=0; renderTarget(); }
  }else if(mode==='pose'){
    nextPose();
  }else if(mode==='match'){
    genMatchGrid(); hearts=heartsMax=MATCH_LIVES;
  }else if(mode==='race'){
    beginRace();
  }else if(GAMES[mode]&&GAMES[mode].begin){
    GAMES[mode].begin();
  }
  updateHudChrome();
}
function showBanner(text,seconds){
  $('bigNum').textContent=text; $('bigSub').textContent='';
  const b=$('big'); b.classList.add('small'); b.hidden=false;
  levelBannerT=seconds;
}
function beginPlay(){
  state='play'; level=1; lastTick=-1;
  raceSig={}; poseSig=null; poseHold=0; poseMatch=null;
  beginLevel();
  showBanner(goText(),1.2);
  sCount(true);
  if(!(GAMES[mode]&&GAMES[mode].music===false))startMusic();
}
function levelUp(){
  if(level>=MAX_LEVEL){ winGame(); return; }
  level++;
  beginLevel();
  showBanner('🎉 Qua cấp '+level+'!',1.0);
  sLevelUp();
}
function winGame(){ endGame(true); }
function endGame(won){
  if(state==='end')return;
  state='end';
  stopMusic();
  if(mode==='race'&&playerCount===2){
    sFanfare();confetti();
    const label = raceWinner==='tie'?'Hoà rồi!':raceWinner==='left'?'Bên TRÁI thắng!':'Bên PHẢI thắng!';
    setTimeout(()=>{
      if(state!=='end')return;
      $('endScore').textContent=label;
      $('endBest').textContent='🏆 Tỉ số chung: Trái '+winsLeft+' – '+winsRight+' Phải';
      $('endTitle').textContent='Về đích rồi! 🏁';
      $('hud').hidden=true; $('endS').hidden=false;
    },800);
    return;
  }
  if(mode==='bubbles'||mode==='colors'){for(const o of objs)puff(o);objs=[];}
  const bestKey='bv_best_'+mode;
  const bestVal=+store.get(bestKey,'0')||0;
  const finalLevel = won?MAX_LEVEL:level;
  const isNewBest = finalLevel>bestVal;
  if(isNewBest)store.set(bestKey,String(finalLevel));
  const title = won?'Bé đã chinh phục hết 30 cấp! 🏆':(finalLevel>=20?'Siêu đỉnh luôn! 🌟':finalLevel>=10?'Giỏi lắm bé ơi! 👏':'Cố lên bé nhé! 💪');
  const scoreTxt = won?'Hoàn thành 30 cấp! 🎉':'Đạt cấp '+finalLevel;
  const bestTxt = '🏆 Kỷ lục: cấp '+Math.max(finalLevel,bestVal);
  sFanfare();confetti();
  setTimeout(()=>{
    if(state!=='end')return;
    $('endScore').textContent=scoreTxt;
    $('endBest').textContent=bestTxt;
    $('endTitle').textContent=title;
    $('hud').hidden=true;
    $('endS').hidden=false;
  },800);
}
function pauseGame(){
  if(state!=='play')return;
  state='pause';stopMusic();
  $('pauseS').hidden=false;
}
function resumeGame(){
  if(state!=='pause')return;
  $('pauseS').hidden=true;
  lastT=performance.now();
  state='play';lockWake();startMusic();
}
function goMenu(){
  state='menu';stopCamera();Track.stop();useAI=false;freeWake();stopMusic();
  $('lostHint').hidden=true;lostShown=false;
  hideAll();
  leaveStage();
}
/** đóng sân khấu chơi game, trả người dùng về trang web (Next.js) */
function leaveStage(){
  $('stage').hidden=true;document.body.classList.remove('playing');
  try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
  if(window.BVApp&&window.BVApp.onExit)window.BVApp.onExit();
}
function updateLostHint(now){
  const need=state==='play'&&useAI&&!!Track.active&&levelBannerT<=0&&!Track.seenRecently(Track.active,now);
  if(need!==lostShown){
    lostShown=need;const el=$('lostHint');el.hidden=!need;
    if(need)el.textContent=LOST_TXT[Track.active]||'';
  }
}

/* ============ main loop ============ */
function loop(t){
  requestAnimationFrame(loop);
  const now=performance.now();
  const dt=Math.min(0.05,(now-lastT)/1000);
  lastT=now;
  resize();
  if(musicRunning)scheduleMusic();
  if(state==='menu'||state==='loading')return;
  const G=GAMES[mode];
  if(state==='count'||state==='play'){
    if(!(Track.active&&G&&G.motion===false))analyze();   // trò đã có AI thì khỏi quét chuyển động cho nhẹ máy
    if(Track.active)Track.update(video,now,W,H);
  }
  if(state==='count'){
    const rem=countEnd-now;
    if(rem<=0){$('big').hidden=true;beginPlay()}
    else{
      const n=Math.ceil(rem/1000);
      if(n!==lastCount){lastCount=n;$('bigNum').textContent=n;sCount(false)}
    }
  }
  if(state==='play'){
    if(levelBannerT>0){
      levelBannerT=Math.max(0,levelBannerT-dt);
      if(levelBannerT<=0){ const b=$('big'); b.hidden=true; b.classList.remove('small'); }
    }else{
      if(mode==='bubbles'||mode==='colors'){
        remainMs=Math.max(0,remainMs-dt*1000);
        updateFalling(dt);
        const s=Math.ceil(remainMs/1000);
        if(s!==lastTick){
          lastTick=s;
          $('timePill').classList.toggle('low',s<=10);
          if(s<=5&&s>0)sTick();
        }
        if(remainMs<=0)endGame();
      }else if(mode==='pose')updatePose(dt);
      else if(mode==='match')updateMatch(dt);
      else if(mode==='race')updateRace(dt);
      else if(G&&G.update)G.update(dt);
    }
    updateHudChrome();
    updateLostHint(now);
  }
  if(state!=='pause')stepFx(dt);
  render(t||now);
}

/* ============ input ============ */
canvas.addEventListener('pointerdown',e=>{
  e.preventDefault();ac();
  if(state==='pause'){resumeGame();return}
  if(state!=='play')return;
  const G=GAMES[mode];
  if(G&&G.tap){G.tap(e.clientX/W,e.clientY/H,e);return}
  if(mode==='bubbles'||mode==='colors'){
    let bi=-1,bd=Infinity;
    for(let i=0;i<objs.length;i++){
      const o=objs[i];
      const dx=e.clientX-o.x*W,dy=e.clientY-o.y*H,d=dx*dx+dy*dy;
      const rr=o.r*minDim*1.6;
      if(d<rr*rr&&d<bd){bd=d;bi=i}
    }
    if(bi>=0){resolveHit(objs[bi]);objs.splice(bi,1)}
  }else if(mode==='pose'&&!camOn&&poseCur&&!poseResult){
    const x=e.clientX/W,y=e.clientY/H;
    for(const z of poseCur.zones){
      const r=ZONES[z];
      if(x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3])poseZoneLastActive[z]=poseTAcc;
    }
  }else if(mode==='match'&&!camOn&&matchWrongT<=0){
    const x=e.clientX/W,y=e.clientY/H;
    for(let i=0;i<matchTiles.length;i++){
      if(matchTiles[i].matched)continue;
      const r=matchZoneRect(i,matchCols,matchRows);
      if(x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]){matchPick(i);break}
    }
  }else if(mode==='race'&&!camOn){
    const x=e.clientX/W,y=e.clientY/H;
    const p = (playerCount===1||x<0.5) ? raceP1 : raceP2;
    if(p&&p.alive){
      if(y<0.4)p.upperT=0; else if(y>0.6)p.lowerT=0; else p.fullT=0;
    }
  }
});

$('btnRetry').addEventListener('click',()=>startGame(true));
$('btnErrTouch').addEventListener('click',()=>startGame(false));
$('btnAgain').addEventListener('click',()=>startGame(wantCam));
$('btnHome').addEventListener('click',goMenu);
$('btnExit').addEventListener('click',goMenu);
$('btnResume').addEventListener('click',resumeGame);

function updMute(){$('btnMute').textContent=muted?'🔇':'🔊'}
$('btnMute').addEventListener('click',()=>{muted=!muted;store.set('bv_mute',muted?'1':'0');updMute()});

function updMusicBtn(){$('btnMusic').classList.toggle('off',!musicPref)}
$('btnMusic').addEventListener('click',()=>{
  musicPref=!musicPref;store.set('bv_music',musicPref?'1':'0');updMusicBtn();
  if(musicPref&&(state==='play'||state==='count'))startMusic();else stopMusic();
});

$('btnFlip').addEventListener('click',async()=>{
  facing=facing==='user'?'environment':'user';
  if(camOn){try{await initCamera()}catch(e){facing=facing==='user'?'environment':'user'}}
});
const fsOK=document.fullscreenEnabled||document.webkitFullscreenEnabled;
if(!fsOK)$('btnFull').hidden=true;
$('btnFull').addEventListener('click',()=>{
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else{
      const el=document.documentElement;
      (el.requestFullscreen||el.webkitRequestFullscreen).call(el);
    }
  }catch(e){}
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(state==='play')pauseGame()}
  else if(state==='play'||state==='count')lockWake();
});

/* ============ phím tắt & nút khung xương ============ */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state==='play')pauseGame();
});
$('btnSkel').addEventListener('click',()=>{skelOn=!skelOn;store.set('bv_skel',skelOn?'1':'0');$('btnSkel').classList.toggle('off',!skelOn)});

/* ============ cầu nối với trang web Next.js ============ */
window.BVApp={
  ready:true,onExit:null,
  configure(o){
    o=o||{};
    if(o.players===1||o.players===2){playerCount=o.players;store.set('bv_race_pc',String(playerCount))}
    if(typeof o.ai==='boolean'){aiPref=o.ai;store.set('bv_ai',aiPref?'1':'0')}
    if(o.sens===0||o.sens===1||o.sens===2){sens=o.sens;store.set('bv_sens',String(sens))}
  },
  /** mở sân khấu và bắt đầu chơi trò id (o.touch=true → chơi bằng chạm, không cần camera) */
  play(id,o){
    if(!GAMES[id])return false;
    this.configure(o);
    selectedMode=id;
    $('stage').hidden=false;document.body.classList.add('playing');
    startGame(!(o&&o.touch));
    return true;
  },
  preload(id){const g=GAMES[id];if(g&&g.needs&&(!g.soft||aiPref))Track.preload(g.needs)},
  exit(){goMenu()},
  get state(){return state},
};

/* debug hook (đọc trạng thái khi kiểm thử) */
window.BV={
  get state(){return state},set state(v){state=v},
  get mode(){return mode},set mode(v){mode=v;selectedMode=v},
  get score(){return score},
  get level(){return level},set level(v){level=v},
  get W(){return W},get H(){return H},
  get objs(){return objs.map(o=>({x:o.x,y:o.y,r:o.r,star:o.star,bad:o.bad,colorKey:o.colorKey}))},
  get motionRatio(){return motionRatio},
  get hearts(){return hearts},
  get pose(){return {cur:poseCur,result:poseResult,acc:poseTAcc,limit:poseTimeLimit,z:poseZoneLastActive}},
  get match(){return {tiles:matchTiles,sel:matchSel,wrong:matchWrong,matched:matchMatchedCount,total:matchTotalPairs,cols:matchCols,rows:matchRows,lastKey:matchLastKey,cooldown:matchCooldown,wrongT:matchWrongT}},
  zoneActive(k){return zoneActive(k)},
  zoneDensity(k){const z=ZONES[k];return zoneDensity(z[0],z[1],z[2],z[3])},
  matchZoneActive(i){return zoneActiveRect(matchZoneRect(i,matchCols,matchRows))},
  get race(){return {p1:raceP1&&{...raceP1},p2:raceP2&&{...raceP2},obstacle:raceObstacle,approach:raceApproach,winner:raceWinner,playerCount,winsLeft,winsRight}},
  Track,GAMES,get G(){return GAMES[mode]},get useAI(){return useAI}
};

/* ============ boot ============ */
resize();updMute();updMusicBtn();
$('btnSkel').classList.toggle('off',!skelOn);
requestAnimationFrame(loop);
