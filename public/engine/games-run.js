'use strict';
/* ============================================================
   games-run.js — nhóm trò chạy: Khủng Long Chạy, Thỏ Chạy Vườn, Chạy Bãi Biển
   Điều khiển bằng Sig (khung xương: nhảy / cúi / chạy tại chỗ; dự phòng quét chuyển động theo vùng trên-dưới)
   ============================================================ */

/* ---------- cảnh nền dùng chung ---------- */
function groundBand(gy,th,scroll){
  const md=minDim;
  ctx.fillStyle=th.ground;ctx.fillRect(0,gy,W,H-gy);
  ctx.fillStyle=th.top;ctx.fillRect(0,gy,W,md*0.014);
  ctx.fillStyle=th.mark;
  const step=md*0.18,off=((scroll%step)+step)%step;
  for(let x=-off;x<W;x+=step){ctx.fillRect(x,gy+md*0.05,md*0.06,md*0.008);ctx.fillRect(x+md*0.09,gy+md*0.1,md*0.04,md*0.008)}
}
function drift(list,speed,scroll,y,size){   // các vật trang trí trôi chậm (mây, cây…)
  const span=W+size*3;
  list.forEach((e,i)=>{
    const x=((i*span/list.length-scroll*speed)%span+span)%span-size;
    emo(e,x,y+((i*37)%5)*size*0.12,size,0,0.9);
  });
}

/* ============================================================
   KHỦNG LONG CHẠY & THỎ CHẠY VƯỜN — chạy ngang: NHẢY qua vật dưới đất, CÚI dưới vật bay
   ============================================================ */
function sideRunner(cfg){
  const R={y:0,vy:0,ducking:false,inv:0,obs:[],items:[],since:0,spacing:0,passed:0,need:5,scroll:0,sg:null,runMul:1,
           lastKind:'',streak:0,carrots:0,flash:0};
  const geom=()=>{const m=minDim;return {s:m*0.2,x:W*0.2,gy:H*0.8,hw:m*0.04,hh:m*0.17,hd:m*0.09}};
  const speed=()=>minDim*lerp(0.5,1.0,lvlT())*(cfg.runPower?R.runMul:1);
  const gapSec=()=>lerp(1.9,0.95,lvlT());
  function spawn(){
    const m=minDim,t=lvlT();
    let air=Math.random()<lerp(0.25,0.5,t);
    if(R.lastKind==='air'&&R.streak>=2)air=false;
    if(R.lastKind==='ground'&&R.streak>=3)air=true;
    if(air){
      const e=pick(cfg.air);
      R.obs.push({kind:'air',x:W+m*0.2,w:m*0.09,h:m*0.11,y0:m*0.10,emoji:e,passed:false});
    }else{
      const e=pick(cfg.ground),h=m*rand(0.07,0.12);
      R.obs.push({kind:'ground',x:W+m*0.2,w:m*rand(0.07,0.09),h,y0:0,emoji:e,passed:false});
    }
    R.streak=R.lastKind===(air?'air':'ground')?R.streak+1:1;R.lastKind=air?'air':'ground';
    if(cfg.items&&Math.random()<0.7){      // củ cà rốt lơ lửng trên đường nhảy
      for(let i=0;i<3;i++)R.items.push({x:W+m*(0.55+i*0.12),y:m*(0.17+0.06*Math.sin(i*1.6+1)),got:false});
    }
    R.spacing=speed()*gapSec()*rand(0.9,1.25)+m*0.25;
  }
  function jump(){const m=minDim;R.vy=m*1.35;sTick();tone(520,780,.12,.12,'sine')}
  registerGame({
    id:cfg.id,name:cfg.name,needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:1},
    intro:cfg.intro,go:cfg.go,dbg:()=>R,
    start(){R.sg=Sig.make('solo')},
    begin(){
      hearts=heartsMax=3;R.obs=[];R.items=[];R.passed=0;R.need=5+Math.floor(level/2);R.y=0;R.vy=0;R.inv=0;
      R.since=0;R.spacing=minDim*1.2;R.lastKind='';R.streak=0;R.carrots=0;R.flash=0;
    },
    hud(){return {score:R.passed+'/'+R.need,icon:cfg.hudIcon,hearts:[hearts,heartsMax]}},
    update(dt){
      const m=minDim,g=geom(),sg=R.sg.update(dt);
      const touchDown=Ptr.touch.down&&performance.now()-Ptr.touch.t<5000&&!camOn;
      const duckWanted=sg.duck||(touchDown&&Ptr.touch.y>H*0.62);
      R.ducking=duckWanted&&R.y<=0.5;
      if(sg.jumpEdge&&R.y<=0.5&&!R.ducking)jump();
      // chạy tại chỗ → thế giới trôi nhanh (chỉ với trò "chạy thật")
      if(cfg.runPower){const target=clamp(0.45+0.55*clamp(sg.energy/1.2,0,1),0.45,1);R.runMul+=(target-R.runMul)*Math.min(1,dt*4)}
      // vật lý nhảy
      if(R.y>0||R.vy>0){R.vy-=m*3.0*dt;R.y+=R.vy*dt;if(R.y<=0){R.y=0;R.vy=0}}
      R.inv=Math.max(0,R.inv-dt);R.flash=Math.max(0,R.flash-dt);
      const v=speed();R.scroll+=v*dt;R.since+=v*dt;
      if(R.since>=R.spacing){R.since=0;spawn()}
      const hx0=g.x-g.hw,hx1=g.x+g.hw,hy0=R.y,hy1=R.y+(R.ducking?g.hd:g.hh);
      for(let i=R.obs.length-1;i>=0;i--){
        const o=R.obs[i];o.x-=v*dt;
        if(o.x<-m*0.4){R.obs.splice(i,1);continue}
        if(!o.passed&&o.x+o.w/2<hx0){o.passed=true;R.passed++;floatAt(g.x,g.gy-m*0.3,'+1')}
        if(R.inv<=0&&!o.hit&&o.x-o.w/2<hx1&&o.x+o.w/2>hx0&&o.y0<hy1&&o.y0+o.h>hy0){
          o.hit=true;R.inv=1.3;R.flash=0.4;sBuzz();floatAt(g.x,g.gy-m*0.35,'😵',true);
          try{if(navigator.vibrate)navigator.vibrate([20,40,20])}catch(e){}
          loseHeart();if(state!=='play')return;
        }
      }
      for(let i=R.items.length-1;i>=0;i--){
        const it=R.items[i];it.x-=v*dt;
        if(it.x<-m*0.3){R.items.splice(i,1);continue}
        if(!it.got&&Math.abs(it.x-g.x)<m*0.09&&it.y>=hy0-m*0.06&&it.y<=hy1+m*0.06){
          it.got=true;R.carrots++;sPop(false);floatAt(it.x,g.gy-it.y-m*0.1,'🥕');
          if(R.carrots%5===0&&hearts<heartsMax){hearts++;floatAt(g.x,g.gy-m*0.4,'+❤️')}
        }
      }
      if(R.passed>=R.need){levelUp()}
    },
    tap(x,y){const g=geom();if(y<0.62&&R.y<=0.5){jump()}},
    draw(){
      const m=minDim,g=geom(),th=cfg.theme;
      ctx.fillStyle=th.tint;ctx.fillRect(0,0,W,H);
      drift(th.deco,0.15,R.scroll,H*0.14,m*0.13);
      groundBand(g.gy,th,R.scroll);
      for(const it of R.items){if(!it.got)emo('🥕',it.x,g.gy-it.y,m*0.07)}
      for(const o of R.obs)emo(o.emoji,o.x,g.gy-o.y0-o.h/2,o.h*(o.kind==='air'?1.5:1.35));
      // bóng + nhân vật
      const hh=R.ducking?g.hd:g.hh;
      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.beginPath();ctx.ellipse(g.x,g.gy+m*0.012,g.hw*2.2*(1-clamp(R.y/(m*0.4),0,0.6)),m*0.012,0,0,6.29);ctx.fill();
      ctx.save();
      const blink=R.inv>0&&((R.inv*12)|0)%2===0;
      if(blink)ctx.globalAlpha=0.35;
      ctx.translate(g.x,g.gy-R.y);
      if(R.ducking)ctx.scale(1.15,0.55);
      if(cfg.flip)ctx.scale(-1,1);
      ctx.font=Math.round(g.s)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
      ctx.fillText(cfg.hero,0,-g.s*0.1);
      ctx.restore();
      if(cfg.items&&R.carrots>0)lblText('🥕 '+R.carrots,W-m*0.12,m*0.2,m*0.045,'#fff','right');
      if(R.flash>0){ctx.fillStyle='rgba(255,70,90,'+(R.flash*0.4).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      // gợi ý điều khiển khi bắt đầu
      if(R.passed===0&&level===1&&R.scroll<m*3){
        lblText('⬆️ NHẢY qua vật dưới đất',W/2,H*0.5,m*0.05,'#fff');
        lblText('⬇️ CÚI dưới vật bay',W/2,H*0.5+m*0.07,m*0.05,'#fff');
      }
    },
  });
}

sideRunner({
  id:'dino',name:'Khủng Long Chạy',hero:'🦖',flip:true,hudIcon:'🌵',
  ground:['🌵','🪨','🌵'],air:['🦅','🦇'],
  theme:{tint:'rgba(255,214,120,.22)',ground:'#E6C07A',top:'#C49648',mark:'rgba(120,80,20,.35)',deco:['☁️','☁️','☀️','☁️']},
  intro:'Nhảy qua xương rồng, cúi xuống khi chim bay tới nhé!',go:'Chạy nào, khủng long! 🦖',
});
sideRunner({
  id:'temple',name:'Thỏ Chạy Vườn',hero:'🐰',runPower:true,items:true,hudIcon:'🥕',
  ground:['🪵','🪨','🪴'],air:['🐝','🦋'],
  theme:{tint:'rgba(120,220,140,.20)',ground:'#7BC96A',top:'#4FA043',mark:'rgba(20,90,30,.30)',deco:['🌳','☁️','🌲','🌳','☁️']},
  intro:'Chạy tại chỗ để thỏ chạy nhanh, nhảy qua khúc gỗ, cúi dưới ong bay, nhặt cà rốt!',go:'Chạy nào, bé thỏ! 🐰',
});

/* ============================================================
   CHẠY BÃI BIỂN — chạy tại chỗ để tiến, tới cổng thì dừng lại tạo dáng đúng
   ============================================================ */
(function(){
  const SH={sg:null,sig:null,passed:0,need:4,scroll:0,gate:null,toGate:0,timer:0,hold:0,match:null,msg:'',msgT:0,v:0,ok:0,fail:0};
  const poolFor=()=>{
    const p=['both_up','head','both_side','squat'];
    if(level>=8)p.push('up_r','up_l');
    if(level>=12)p.push('hips');
    if(level>=18)p.push('star');
    if(level>=22)p.push('one_leg_l','one_leg_r');
    return p;
  };
  const limitSec=()=>lerp(4.4,2.4,lvlT());
  function newGate(){
    const id=pick(poolFor()),def=POSES.find(q=>q.id===id);
    SH.gate={id,label:def.label,x:W*1.15,art:POSE_ART[id],state:'come',res:null};
  }
  function lose(){
    SH.gate.state='done';SH.gate.res='bad';SH.msg='Chưa đúng — cố lên nhé!';SH.msgT=1.2;
    sBuzz();loseHeart();SH.toGate=minDim*rand(1.3,1.9);
  }
  function win(){
    SH.gate.state='done';SH.gate.res='good';SH.passed++;SH.msg='Đúng rồi! 🎉';SH.msgT=1.0;
    burstAt(W*0.3,H*0.5,'#35E08B',20);sPop(true);SH.toGate=minDim*rand(1.3,1.9);
    if(SH.passed>=SH.need)setTimeout(()=>{if(state==='play'&&mode==='shore')levelUp()},700);
  }
  const game=registerGame({
    id:'shore',name:'Chạy Bãi Biển',needs:'pose',motion:false,trackOpts:{numPoses:1},
    intro:'Chạy tại chỗ để tiến lên, tới cổng thì dừng lại tạo dáng đúng nhé!',go:'Chạy dọc bờ biển nào! 🏖️',
    dbg:()=>SH,
    skel:{line:(b,k)=>{
      if(!SH.gate||SH.gate.state!=='pose'||!SH.match)return null;
      const limb=Body.LIMB_OF_LINE[k];if(!limb)return null;
      const v=SH.match[limb];return v===true?'#35E08B':(v===false?'#FF9F43':null);
    }},
    start(){SH.sg=Sig.make('solo');SH.sig=Body.signals()},
    begin(){hearts=heartsMax=3;SH.passed=0;SH.need=4+Math.floor(level/4);SH.gate=null;SH.toGate=minDim*1.0;SH.hold=0;SH.match=null;SH.msgT=0},
    hud(){return {score:SH.passed+'/'+SH.need,icon:'🏁',hearts:[hearts,heartsMax]}},
    update(dt){
      const m=minDim,sg=SH.sg.update(dt);
      SH.msgT=Math.max(0,SH.msgT-dt);
      const gate=SH.gate;
      const posing=gate&&gate.state==='pose';
      // tốc độ trôi: chạy tại chỗ càng mạnh càng nhanh; lúc tạo dáng thì dừng hẳn
      const target=posing?0:m*0.8*clamp((sg.energy-0.25)/0.9,0,1);
      SH.v+=(target-SH.v)*Math.min(1,dt*6);
      SH.scroll+=SH.v*dt;
      if(!gate){SH.toGate-=SH.v*dt;if(SH.toGate<=0)newGate();return}
      if(gate.state==='come'){
        gate.x-=SH.v*dt;
        if(gate.x<=W*0.42){gate.state='pose';gate.x=W*0.42;SH.timer=limitSec();SH.hold=0;sCount(true)}
      }else if(gate.state==='pose'){
        SH.timer-=dt;
        const b=Track.body('solo');SH.sig.update(b,performance.now());
        SH.match=b?Body.matchPose(b,gate.art,SH.sig,level>=16):null;
        if(SH.match&&SH.match.ok)SH.hold+=dt;else SH.hold=Math.max(0,SH.hold-dt*2);
        if(SH.hold>=0.4)win();
        else if(SH.timer<=0)lose();
      }else if(gate.state==='done'){
        gate.x-=m*1.4*dt;if(gate.x<-m*0.4)SH.gate=null;
      }
    },
    draw(){
      const m=minDim,gy=H*0.8,th={ground:'#F2D9A0',top:'#D9B878',mark:'rgba(150,110,40,.30)'};
      ctx.fillStyle='rgba(120,200,255,.20)';ctx.fillRect(0,0,W,H);
      // biển
      ctx.fillStyle='rgba(60,150,230,.35)';ctx.fillRect(0,H*0.5,W,gy-H*0.5);
      ctx.fillStyle='rgba(255,255,255,.35)';
      for(let i=0;i<4;i++){const y=H*0.52+i*m*0.04;ctx.fillRect(0,y+Math.sin(frame*0.05+i)*3,W,m*0.006)}
      drift(['☁️','☀️','☁️'],0.1,SH.scroll,H*0.12,m*0.13);
      drift(['🌴','⛱️','🌴','🐚','🌴'],0.5,SH.scroll,H*0.62,m*0.14);
      groundBand(gy,th,SH.scroll);
      // nhân vật chạy
      const hx=W*0.2,bob=Math.sin(frame*0.3)*m*0.012*Math.min(1,SH.v/(m*0.4));
      emo(SH.gate&&SH.gate.state==='pose'?'🧍':'🏃',hx,gy-m*0.09+bob,m*0.2);
      // cổng tạo dáng
      const g=SH.gate;
      if(g){
        const gx=g.x,top=gy-m*0.62,bw=m*0.5,bh=m*0.34;
        ctx.fillStyle='#8A5A2B';ctx.fillRect(gx-bw/2-m*0.015,top,m*0.03,gy-top);ctx.fillRect(gx+bw/2-m*0.015,top,m*0.03,gy-top);
        panel(gx-bw/2,top-m*0.02,bw,bh,m*0.03,g.res==='good'?'rgba(200,255,220,.95)':g.res==='bad'?'rgba(255,215,215,.95)':'rgba(255,255,255,.93)',g.res==='good'?'#35E08B':'#FF8A3D',m*0.008);
        drawFigure(gx,top+bh*0.55,bh*0.52,g.art.armL,g.art.armR,g.art.legs||'stand',g.res==='good'?'#2FBF9F':'#14456B');
      }
      if(g&&g.state==='pose'){
        lblText(g.label,W/2,H*0.2,m*0.05,'#fff');
        bar(W/2-m*0.25,H*0.2+m*0.03,m*0.5,m*0.018,Math.max(0,SH.timer/limitSec()),'#FF8A3D');
      }else if(!g&&SH.v<m*0.1&&SH.passed===0&&level===1){
        lblText('🏃 Chạy tại chỗ để tiến lên!',W/2,H*0.3,m*0.055,'#fff');
      }
      if(SH.msgT>0)lblText(SH.msg,W/2,H*0.36,m*0.06,'#FFE98A');
    },
  });
})();
