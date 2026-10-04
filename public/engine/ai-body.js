'use strict';
/* ============================================================
   ai-body.js — đọc khung xương (Track) thành "tín hiệu động tác" cho trò chơi
   • Body.signals(): nhảy / cúi / chạy tại chỗ, tính theo tỉ lệ độ dài thân nên không phụ thuộc xa gần
   • Body.matchPose(): kiểm tra tư thế (tay lên, dang tay, đứng một chân…) và báo từng tay/chân đúng hay chưa
   Quy ước: bên PHẢI của người chơi = khớp 12/14/16/24/26/28, hiện ở x lớn hơn trên màn hình (đã lật gương).
   ============================================================ */
const Body=(()=>{
  const RUN_JOINTS=[13,14,15,16,25,26,27,28];
  const JUMP_UP=0.17,JUMP_FAST=0.10,DUCK_DOWN=0.22,RUN_ENERGY=1.0;

  function signals(){
    const S={
      baseS:0,baseH:0,baseT:0,n:0,farT:0,lastB:null,lastT:0,lastSY:0,vs:0,
      jump:false,duck:false,run:false,jumpAmt:0,duckAmt:0,jumpAt:-1e9,duckAt:-1e9,
      energy:0,ok:false,en:Track.energy(RUN_JOINTS),
      reset(){this.n=0;this.farT=0;this.lastB=null;this.vs=0;this.en.reset();this.jump=this.duck=this.run=false;this.energy=0},
      update(b,now){
        if(!b){this.ok=false;this.jump=this.duck=this.run=false;this.energy=this.en.update(null,now);return this}
        this.ok=true;
        if(b===this.lastB)return this;                 // chưa có khung hình nhận diện mới
        const dt=this.lastB?Math.min(0.25,Math.max(0.005,(now-this.lastT)/1000)):0.033;
        const sy=b.sh.y,hy=b.hip.y;
        if(this.n===0){this.baseS=sy;this.baseH=hy;this.baseT=b.torso;this.lastSY=sy;this.vs=0}
        const T=this.baseT;
        const v=(sy-this.lastSY)/dt/T;                  // vận tốc dọc của vai (thân/giây, âm = đi lên)
        this.vs+=(v-this.vs)*0.5;this.lastSY=sy;
        const up=Math.max(this.baseS-sy,this.baseH-hy)/T;     // + = cao hơn lúc đứng
        const down=Math.max(sy-this.baseS,hy-this.baseH)/T;   // + = thấp hơn lúc đứng
        this.jumpAmt=up;this.duckAmt=down;
        // đường nền chỉ "học" khi bé gần tư thế đứng và đang yên; lệch xa mà yên >2,5 giây → coi là chỗ đứng mới
        const calm=Math.abs(this.vs)<0.35,near=up<0.12&&down<0.12;
        if(this.n<12){const a=0.3;this.baseS+=(sy-this.baseS)*a;this.baseH+=(hy-this.baseH)*a;this.baseT+=(b.torso-this.baseT)*a;this.n++}
        else if(calm&&near){const a=0.05;this.baseS+=(sy-this.baseS)*a;this.baseH+=(hy-this.baseH)*a;this.baseT+=(b.torso-this.baseT)*a;this.farT=0}
        else if(calm){this.farT+=dt;if(this.farT>2.5){this.n=0;this.farT=0}}
        else this.farT=0;
        this.jump=up>JUMP_UP||(up>JUMP_FAST&&this.vs<-0.9);
        this.duck=down>DUCK_DOWN;
        if(this.jump)this.jumpAt=now;
        if(this.duck)this.duckAt=now;
        this.energy=this.en.update(b,now);
        this.run=this.energy>RUN_ENERGY;
        this.lastB=b;this.lastT=now;
        return this;
      }
    };
    return S;
  }

  /* ---------- kiểm tra tư thế ---------- */
  function limbs(b){
    const P=b.p,T=b.torso,ar=Track.ar,nose=P[0];
    const side=(sh,el,wr,hp,kn,an)=>({sh:P[sh],el:P[el],wr:P[wr],hp:P[hp],kn:P[kn],an:P[an]});
    const L=side(11,13,15,23,25,27),R=side(12,14,16,24,26,28);
    const ok=s=>s.wr.v>0.4&&s.sh.v>0.4;
    const arm={
      up:s=>ok(s)&&s.wr.y<nose.y-0.1*T,
      side:s=>ok(s)&&Math.abs(s.wr.y-s.sh.y)<0.5*T&&Math.abs(s.wr.x-s.sh.x)*ar>0.7*T,
      head:s=>ok(s)&&s.wr.y<s.sh.y+0.05*T&&Track.dist(s.wr,nose)<0.95*T,
      hip:s=>ok(s)&&Track.dist(s.wr,s.hp)<0.55*T,
      down:s=>ok(s)&&s.wr.y>s.sh.y+0.55*T,
    };
    return {L,R,arm,T,ar,nose};
  }
  function legsState(b,S){
    const {L,R,T,ar}=limbs(b);
    const vis=b.legsVis>0.35;
    const kneeGap=((L.kn.y-L.hp.y)+(R.kn.y-R.hp.y))/2/T;       // đứng thẳng ≈0,9; ngồi xổm → nhỏ lại
    const squat=(vis&&kneeGap<0.62)||(S&&S.duckAmt>0.4);
    const apart=vis&&Math.abs(L.an.x-R.an.x)*ar>1.05*T;
    const oneL=vis&&(R.an.y-L.an.y)>0.4*T;                       // chân trái nhấc cao hơn chân phải
    const oneR=vis&&(L.an.y-R.an.y)>0.4*T;
    return {squat,apart,oneL,oneR,vis};
  }
  /** art = {armL,armR,legs} như POSE_ART; lenient=true thì tay "down" không bắt buộc */
  function matchPose(b,art,S,strict){
    const c=limbs(b),lg=legsState(b,S);
    const chk=(want,s)=>{
      if(!want)return null;
      if(want==='down'&&!strict)return null;
      return c.arm[want]?c.arm[want](s):null;
    };
    const armL=chk(art.armL,c.L),armR=chk(art.armR,c.R);
    let legs=null;
    const w=art.legs;
    if(w==='squat')legs=lg.squat;
    else if(w==='apart')legs=lg.apart;
    else if(w==='oneL')legs=lg.oneL;
    else if(w==='oneR')legs=lg.oneR;
    const parts=[armL,armR,legs].filter(v=>v!==null);
    const bad=parts.some(v=>v===false);
    return {armL,armR,legs,ok:parts.length>0&&!bad};
  }
  // chỉ số đoạn nối trong Track (POSE_LINES): tay trái [1,2,14], tay phải [3,4,15], chân trái [8,9,12], chân phải [10,11,13]
  const LIMB_OF_LINE={1:'armL',2:'armL',14:'armL',3:'armR',4:'armR',15:'armR',8:'legs',9:'legs',10:'legs',11:'legs',12:'legs',13:'legs'};

  return {signals,matchPose,limbs,LIMB_OF_LINE,legsState,
    RUN_ENERGY,JUMP_UP,DUCK_DOWN};
})();

/* tô màu khung xương theo từng tay/chân đúng-sai trong trò Bé Tạo Dáng */
if(typeof GAMES!=='undefined'&&GAMES.pose){
  GAMES.pose.skel={line:(b,k)=>{
    if(typeof poseCur==='undefined'||!poseCur||!poseMatch||poseResult==='miss')return null;
    const limb=Body.LIMB_OF_LINE[k];if(!limb)return null;
    const v=poseMatch[limb];
    return v===true?'#35E08B':(v===false?'#FF9F43':null);
  }};
}
