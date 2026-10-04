'use strict';
/* ============================================================
   games-body.js — trò chơi dùng khung xương: Đèn Xanh Đèn Đỏ, Giữ Bóng Bay
   (dùng các biến/hàm chung của index.html: W,H,ctx,level,hearts,levelUp(),loseHeart()… và Track/Body)
   Cả hai có dự phòng bằng quét chuyển động khi máy không chạy được AI.
   ============================================================ */

/* ============================================================
   ĐÈN XANH ĐÈN ĐỎ
   Xanh: chạy tại chỗ để bạn gấu tiến về đích. Đỏ: đứng im như tượng. Cử động khi đèn đỏ → mất tim.
   ============================================================ */
(function(){
  const LT={phase:'green',t:0,pos:0,goal:8,grace:0,forgive:0,movedFor:0,energy:0,moving:false,calm:true,has:true,
            shake:0,flash:0,say:0,tap:0,sig:null,wasPhase:''};
  const MR_MOVE=[0.045,0.03,0.02],MR_STILL=[0.035,0.022,0.014];   // dự phòng quét chuyển động, theo độ nhạy
  const E_MOVE=0.9,E_STILL=0.65;                                    // AI khung xương: năng lượng/độ dài thân
  function dur(){
    const t=lvlT();
    return {green:[lerp(2.6,1.8,t),lerp(4.2,3.0,t)],warn:lerp(0.9,0.45,t),red:[lerp(1.6,2.4,t),lerp(2.6,4.2,t)],grace:lerp(0.55,0.32,t)};
  }
  function setPhase(p){
    const d=dur();LT.phase=p;LT.say=0;
    if(p==='green'){LT.t=rand(d.green[0],d.green[1]);sCount(true)}
    else if(p==='warn'){LT.t=d.warn;tone(520,0,.16,.16,'square');tone(520,0,.16,.16,'square',.22)}
    else{LT.t=rand(d.red[0],d.red[1]);LT.grace=d.grace;LT.forgive=0;LT.movedFor=0;sBuzz()}
  }
  function violation(){
    LT.shake=0.5;LT.flash=0.6;LT.forgive=1.3;LT.movedFor=0;
    LT.pos=Math.max(0,LT.pos-0.1);
    floatAt(W/2,H*0.5,'😵 Động đậy rồi!',true);
    try{if(navigator.vibrate)navigator.vibrate([20,50,20])}catch(e){}
    sBuzz();
    loseHeart();
  }
  registerGame({
    id:'light',order:20,isNew:true,name:'Đèn Xanh Đèn Đỏ',icon:['🚦','🐻'],accent:'#FF5A6E',cat:['move','react'],
    needs:'pose',soft:true,motion:false,touch:true,
    tag:'Đèn xanh thì chạy tại chỗ, đèn đỏ thì đứng im như tượng!',
    desc:'Bạn gấu đang đứng ở vạch đích. Đèn xanh bé chạy tại chỗ để gấu tiến lên, đèn đỏ phải đứng im như tượng — cử động là mất tim. Đèn đổi càng lúc càng nhanh.',
    skill:'🛑 Kiểm soát cơ thể',dist:'Đứng cách camera khoảng 2 m, để camera thấy cả người',
    how:['Đứng cách camera khoảng 2 m sao cho thấy cả người bé.','Đèn <b>XANH</b>: chạy tại chỗ thật nhanh để tiến về đích.','Đèn <b>ĐỎ</b>: đứng im như pho tượng! Cử động là mất tim, hết 3 tim là thua.'],
    intro:'Đèn XANH thì chạy tại chỗ, đèn ĐỎ thì đứng im như tượng nhé!',go:'Chạy nào! 🏃',
    dbg:()=>LT,
    start(){LT.sig=Body.signals();LT.energy=0},
    begin(){hearts=heartsMax=3;LT.pos=0;LT.goal=6+level*0.35;LT.shake=0;LT.flash=0;LT.tap=0;setPhase('green')},
    hud(){return {hearts:[hearts,heartsMax]}},
    update(dt){
      // 1) đo mức cử động
      let moving,calm,has=true;
      if(useAI&&Track.active==='pose'){
        const b=Track.body('solo');LT.sig.update(b,performance.now());
        LT.energy=LT.sig.energy;has=!!b;moving=has&&LT.energy>E_MOVE;calm=!has||LT.energy<E_STILL;
      }else if(camOn){
        LT.energy=motionRatio;moving=motionRatio>MR_MOVE[sens];calm=motionRatio<MR_STILL[sens];
      }else{ // chơi bằng chạm: bấm liên tục = chạy
        LT.tap=Math.max(0,LT.tap-dt);moving=LT.tap>0;calm=!moving;LT.energy=moving?1.2:0;
      }
      LT.moving=moving;LT.calm=calm;LT.has=has;
      LT.shake=Math.max(0,LT.shake-dt);LT.flash=Math.max(0,LT.flash-dt);LT.say+=dt;
      // 2) luật theo đèn
      LT.t-=dt;
      if(LT.phase==='green'){
        if(moving)LT.pos=Math.min(1,LT.pos+dt/LT.goal);
        if(LT.t<=0)setPhase('warn');
      }else if(LT.phase==='warn'){
        if(moving)LT.pos=Math.min(1,LT.pos+dt/LT.goal*0.6);
        if(LT.t<=0)setPhase('red');
      }else{
        LT.grace-=dt;LT.forgive-=dt;
        if(LT.grace<=0&&LT.forgive<=0){
          if(!calm){LT.movedFor+=dt;if(LT.movedFor>0.25){violation();if(state!=='play')return}}
          else LT.movedFor=0;
        }
        if(LT.t<=0)setPhase('green');
      }
      if(LT.pos>=1){burstAt(W/2,H*0.88,'#2FD27C',24);levelUp()}
    },
    tap(){
      if(LT.phase==='red'&&LT.grace<=0&&LT.forgive<=0){violation();return}
      LT.tap=0.35;sPick();
    },
    draw(){
      const md=minDim,col=LT.phase==='green'?'#2FD27C':LT.phase==='warn'?'#FFC73D':'#FF4D5E';
      ctx.save();
      if(LT.shake>0)ctx.translate(Math.sin(frame*2.3)*md*0.012*LT.shake*2,0);
      // viền theo màu đèn
      ctx.globalAlpha=0.8;ctx.lineWidth=Math.max(8,md*0.022);ctx.strokeStyle=col;
      roundRectPath(ctx.lineWidth/2,ctx.lineWidth/2,W-ctx.lineWidth,H-ctx.lineWidth,md*0.03);ctx.stroke();
      ctx.globalAlpha=1;
      // cột đèn
      const bw=md*0.50,bh=md*0.15,bx=W/2-bw/2,by=Math.max(md*0.115,TOPY());
      roundRectPath(bx,by,bw,bh,bh*0.5);ctx.fillStyle='rgba(30,40,60,.92)';ctx.fill();
      const lamps=[['#FF4D5E','red'],['#FFC73D','warn'],['#2FD27C','green']];
      lamps.forEach((l,i)=>{
        const on=LT.phase===l[1];
        const cx=bx+bw*(0.2+0.3*i),cy=by+bh/2;
        ctx.beginPath();ctx.arc(cx,cy,bh*0.34,0,6.29);
        ctx.fillStyle=on?l[0]:'rgba(255,255,255,.14)';
        if(on){ctx.shadowColor=l[0];ctx.shadowBlur=md*0.04}
        ctx.fill();ctx.shadowBlur=0;
      });
      // chữ hướng dẫn
      const msg=LT.phase==='green'?'CHẠY TẠI CHỖ!':LT.phase==='warn'?'SẮP ĐỎ… CHẬM LẠI!':'ĐỨNG IM NHƯ TƯỢNG!';
      lblText(msg,W/2,by+bh+md*0.095,md*0.07,LT.phase==='red'?'#FFD0D5':'#fff');
      // bạn gấu + lời nói
      const gx=W*0.5-bw*0.5-md*0.12,gy=by+bh*0.5;
      ctx.font=Math.round(md*0.16)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(LT.phase==='red'?'🐻':'🐻',gx,gy);
      if(LT.phase==='red')lblText('TƯỢNG!',gx,gy+md*0.17,md*0.04,'#FFD0D5');
      else lblText(['Một…','Hai…','Ba…'][Math.min(2,(LT.say/0.7)|0)],gx,gy+md*0.17,md*0.04,'#fff');
      // thanh "cử động"
      const mw=Math.min(W*0.5,md*0.7),mh=md*0.03,mx=W/2-mw/2,my=H-md*0.2;
      roundRectPath(mx,my,mw,mh,mh/2);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
      const full=(useAI&&Track.active==='pose'?E_MOVE:MR_MOVE[sens])*2;
      const f=Math.max(0,Math.min(1,LT.energy/full));
      roundRectPath(mx,my,Math.max(mh,mw*f),mh,mh/2);
      ctx.fillStyle=(LT.phase==='red'&&!LT.calm)?'#FF4D5E':'#2FBF9F';ctx.fill();
      const still=(useAI&&Track.active==='pose'?E_STILL:MR_STILL[sens])/full;
      ctx.fillStyle='rgba(20,69,107,.7)';ctx.fillRect(mx+mw*still-1.5,my-4,3,mh+8);
      lblText('Mức cử động',W/2,my-md*0.015,md*0.032,'#fff');
      // đường chạy về đích
      const tx0=W*0.1,tx1=W*0.9,ty=H-md*0.085,th=md*0.035;
      roundRectPath(tx0,ty,tx1-tx0,th,th/2);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();
      roundRectPath(tx0,ty,Math.max(th,(tx1-tx0)*LT.pos),th,th/2);ctx.fillStyle='#2FD27C';ctx.fill();
      ctx.font=Math.round(md*0.07)+'px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';
      ctx.fillText('🏁',tx1,ty+th/2);
      ctx.fillText('🐻',tx0+(tx1-tx0)*LT.pos,ty+th/2-md*0.03);
      ctx.restore();
      if(LT.flash>0){ctx.fillStyle='rgba(255,60,80,'+(LT.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
    },
  });
})();

/* ============================================================
   GIỮ BÓNG BAY
   Bóng bay rơi xuống từ từ — dùng tay, đầu, vai, chân… đẩy bóng lên. Đừng để bóng chạm đất!
   ============================================================ */
(function(){
  const BL={list:[],hits:0,need:8,spawnT:0,toSpawn:0,pend:null,prev:{}};
  const PAL=['#FF6B9A','#FFB13D','#3BC9A9','#5AA9FF','#B983FF'];
  const JOINTS=[0,11,12,13,14,15,16,19,20,25,26,27,28];       // mũi, vai, khuỷu, cổ tay, đầu ngón, gối, cổ chân
  function countFor(){return 1+Math.floor((level-1)/10)}
  function spawn(){
    const r=minDim*0.085;
    BL.list.push({x:W*rand(0.3,0.7),y:-r,vx:rand(-40,40),vy:rand(40,90),r,col:PAL[(Math.random()*PAL.length)|0],cd:0.5,sq:0,ph:rand(0,6.28)});
  }
  function kick(b,dirx,diry,power){
    if(b.cd>0)return false;
    const n=Math.hypot(dirx,diry)||1;let ux=dirx/n,uy=diry/n-0.55;      // lệch lên trên cho dễ giữ
    const m=Math.hypot(ux,uy)||1;ux/=m;uy/=m;
    const sp=minDim*(0.85+power*0.25);
    b.vx=ux*sp*0.8;b.vy=uy*sp;b.cd=0.32;b.sq=0.25;
    BL.hits++;sPop(false);
    floatAt(b.x,b.y-b.r,'+1');
    for(let k=0;k<6;k++){const a=rand(0,6.28);parts.push({x:b.x,y:b.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,t:0,life:.4,c:b.col,s:rand(3,5),conf:false})}
    if(BL.hits>=BL.need){levelUp();return true}
    return true;
  }
  function centroid(b){            // trọng tâm vùng có chuyển động quanh quả bóng (khi không có AI)
    if(!trail)return null;
    const s=AW/W,cx=b.x*s,cy=b.y*s,r=Math.max(2,b.r*s*1.15);
    let sx=0,sy=0,n=0;
    for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(AH-1,Math.ceil(cy+r));y++){
      for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(AW-1,Math.ceil(cx+r));x++){
        if((x-cx)*(x-cx)+(y-cy)*(y-cy)>r*r||trail[y*AW+x]<=0.3)continue;
        sx+=x;sy+=y;n++;
      }
    }
    return n>=4?{x:sx/n/s,y:sy/n/s,n,area:Math.PI*r*r}:null;
  }
  registerGame({
    id:'balloon',order:30,isNew:true,name:'Giữ Bóng Bay',icon:['🎈','🙌'],accent:'#5AA9FF',cat:['react','move'],
    needs:'pose',soft:true,motion:false,touch:true,
    tag:'Đẩy bóng bay lên cao, đừng để bóng chạm đất!',
    desc:'Bóng bay rơi xuống từ từ. Bé dùng tay, đầu, vai hay cả chân để đẩy bóng bay lên. Lên cấp cao có thêm nhiều quả bóng cùng lúc — cả nhà cùng chơi cũng được!',
    skill:'🎯 Phối hợp tay mắt',dist:'Đứng cách camera khoảng 2 m, để camera thấy cả người',
    how:['Đứng cách camera khoảng 2 m sao cho thấy cả người.','Bóng bay rơi xuống — dùng tay, đầu, vai hoặc chân đẩy bóng lên.','Đẩy đủ số lần là qua cấp. Bóng chạm đất sẽ mất 1 tim.'],
    intro:'Dùng tay, đầu hoặc chân đẩy bóng bay lên, đừng để bóng chạm đất nhé!',go:'Giữ bóng nào! 🎈',
    dbg:()=>BL,
    begin(){
      hearts=heartsMax=3;BL.hits=0;BL.need=6+level;BL.list=[];BL.prev={};
      BL.toSpawn=countFor();BL.spawnT=0;
    },
    hud(){return {score:BL.hits+'/'+BL.need,icon:'🎈',hearts:[hearts,heartsMax]}},
    update(dt){
      const lv0=level;
      if(BL.toSpawn>0){BL.spawnT-=dt;if(BL.spawnT<=0){spawn();BL.toSpawn--;BL.spawnT=1.4}}
      // điểm chạm: khớp xương (AI) hoặc vùng chuyển động (dự phòng)
      const now=performance.now(),pts=[];
      if(useAI&&Track.active==='pose'){
        Track.bodies.forEach((body,bi)=>{
          for(const j of JOINTS){
            const q=body.p[j];if(!q||q.v<0.4)continue;
            const key=bi+':'+j,px=q.x*W,py=q.y*H;
            let pv=BL.prev[key];
            if(!pv)pv=BL.prev[key]={x:px,y:py,t:now,body,sp:0};
            else if(pv.body!==body){   // có khung nhận diện mới → tính tốc độ khớp (đơn vị: cạnh ngắn màn hình/giây)
              const dtm=(now-pv.t)/1000;
              pv.sp=dtm>0.001?Math.hypot(px-pv.x,py-pv.y)/dtm/minDim:0;
              pv.x=px;pv.y=py;pv.t=now;pv.body=body;
            }
            pts.push({x:px,y:py,r:minDim*(j===0?0.06:0.04),sp:pv.sp});
          }
        });
      }
      for(let i=BL.list.length-1;i>=0;i--){
        const b=BL.list[i];
        b.cd-=dt;b.sq=Math.max(0,b.sq-dt);
        b.vy+=minDim*0.32*dt;b.vx*=Math.exp(-0.9*dt);b.vy*=Math.exp(-0.28*dt);
        b.x+=b.vx*dt;b.y+=b.vy*dt;
        if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*0.6}
        if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx)*0.6}
        if(b.y<b.r&&b.vy<0){b.y=b.r;b.vy=Math.abs(b.vy)*0.3}
        // va chạm
        if(b.cd<=0){
          if(useAI&&Track.active==='pose'){
            for(const p of pts){
              if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){if(kick(b,b.x-p.x,b.y-p.y,Math.min(1.5,p.sp)))break}
            }
          }else if(camOn){
            const o={x:b.x/W,y:b.y/H,r:b.r/minDim},m=motionAt(o);
            if(m.cnt>=3&&m.density>=SENS_TH[sens]*0.8&&m.density>=motionRatio*1.4){
              const c=centroid(b);if(c)kick(b,b.x-c.x,b.y-c.y,0.5);else kick(b,0,-1,0.4);
            }
          }
        }
        if(state!=='play'||level!==lv0)return;   // vừa qua cấp / hết game giữa chừng
        if(b.y-b.r>H){
          BL.list.splice(i,1);BL.toSpawn++;BL.spawnT=Math.max(BL.spawnT,0.8);
          floatAt(b.x,H*0.9,'💥 Rơi rồi!',true);sBuzz();loseHeart();
          if(state!=='play')return;
        }
      }
    },
    tap(x,y){
      const px=x*W,py=y*H;
      for(const b of BL.list){
        if(Math.hypot(b.x-px,b.y-py)<b.r*1.7){kick(b,b.x-px,b.y-py,0.8);break}
      }
    },
    draw(){
      for(const b of BL.list){
        ctx.save();ctx.translate(b.x,b.y);
        const sq=1+Math.sin(frame*0.08+b.ph)*0.02+b.sq*0.5;
        // dây
        ctx.beginPath();ctx.moveTo(0,b.r*1.0);
        ctx.quadraticCurveTo(Math.sin(frame*0.05+b.ph)*b.r*0.3,b.r*1.6,0,b.r*2.1);
        ctx.lineWidth=Math.max(2,b.r*0.04);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.stroke();
        ctx.scale(1/sq,sq);
        ctx.beginPath();ctx.ellipse(0,0,b.r*0.86,b.r,0,0,6.29);
        ctx.fillStyle=hexA(b.col,0.9);ctx.fill();
        ctx.lineWidth=Math.max(2,b.r*0.06);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.stroke();
        ctx.beginPath();ctx.ellipse(-b.r*0.3,-b.r*0.4,b.r*0.2,b.r*0.3,-0.5,0,6.29);
        ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
        ctx.beginPath();ctx.moveTo(-b.r*0.12,b.r*0.98);ctx.lineTo(b.r*0.12,b.r*0.98);ctx.lineTo(0,b.r*1.14);ctx.closePath();
        ctx.fillStyle=hexA(b.col,0.95);ctx.fill();
        ctx.restore();
      }
    },
  });
})();
