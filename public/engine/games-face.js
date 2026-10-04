'use strict';
/* ============================================================
   games-face.js — trò chơi dùng nhận diện khuôn mặt: Ăn Trái Cây, Gương Biến Hình, Làm Mặt Hề, Cá Con Bắt Chữ
   Cần đứng gần camera (khoảng 1 m) để mặt đủ lớn.
   ============================================================ */
const face0=()=>{const f=Track.faces;return f.length?f[0]:null};

/* ============================================================
   ĂN TRÁI CÂY — há miệng ăn trái cây rơi xuống; ngậm miệng né ớt và sâu
   ============================================================ */
(function(){
  const CH={objs:[],eaten:0,need:8,spawnT:0,flash:0,mouthOpen:false,chew:0};
  const FRUITS=['🍎','🍊','🍌','🍓','🍇','🍉','🍍','🥝'];
  const BADS=['🌶️','🐛'];
  const mouthPos=()=>{const f=face0();return f?{x:f.mouth.x*W,y:f.mouth.y*H,r:Math.max(minDim*0.1,f.w*H*0.65),open:f.open}:null};
  function spawn(){
    const bad=Math.random()<lerp(0.1,0.28,lvlT());
    CH.objs.push({x:rand(0.15,0.85)*W,y:-minDim*0.1,vy:minDim*lerp(0.3,0.6,lvlT())*rand(0.9,1.15),e:bad?pick(BADS):pick(FRUITS),bad,r:minDim*0.06,rot:rand(-1,1),eaten:0});
  }
  registerGame({
    id:'chomp',name:'Ăn Trái Cây',needs:'face',motion:false,touch:true,trackOpts:{numFaces:1},
    intro:'Há miệng thật to để ăn trái cây rơi xuống. Ngậm miệng lại để né ớt cay và sâu nhé!',go:'Ăm ăm! 😋',dbg:()=>CH,
    begin(){hearts=heartsMax=3;CH.objs=[];CH.eaten=0;CH.need=8+level;CH.spawnT=0.6;CH.flash=0},
    hud(){return {score:CH.eaten+'/'+CH.need,icon:'😋',hearts:[hearts,heartsMax]}},
    update(dt){
      CH.flash=Math.max(0,CH.flash-dt);CH.chew=Math.max(0,CH.chew-dt);
      CH.spawnT-=dt;
      if(CH.spawnT<=0){spawn();CH.spawnT=lerp(1.25,0.62,lvlT())*rand(0.85,1.2)}
      const mp=mouthPos();CH.mouthOpen=!!mp&&mp.open>0.32;
      for(let i=CH.objs.length-1;i>=0;i--){
        const o=CH.objs[i];
        if(o.eaten>0){o.eaten-=dt;if(o.eaten<=0)CH.objs.splice(i,1);continue}
        o.y+=o.vy*dt;
        if(o.y>H+minDim*0.15){CH.objs.splice(i,1);continue}
        if(mp&&CH.mouthOpen&&Math.hypot(o.x-mp.x,o.y-mp.y)<mp.r){
          o.eaten=0.25;CH.chew=0.3;
          if(o.bad){sBuzz();CH.flash=0.4;floatAt(mp.x,mp.y-minDim*0.1,'Cay quá! 🥵',true);loseHeart();if(state!=='play')return}
          else{CH.eaten++;sPop(false);burstAt(o.x,o.y,'#FFD84D',12);floatAt(mp.x,mp.y-minDim*0.1,'Ngon! 😋');if(CH.eaten>=CH.need){levelUp();return}}
        }
      }
    },
    tap(x,y){
      if(camOn)return;
      const px=x*W,py=y*H;
      for(let i=CH.objs.length-1;i>=0;i--){const o=CH.objs[i];if(o.eaten<=0&&Math.hypot(o.x-px,o.y-py)<o.r*2){
        o.eaten=0.25;
        if(o.bad){sBuzz();loseHeart()}else{CH.eaten++;sPop(false);if(CH.eaten>=CH.need)levelUp()}
        break}}
    },
    draw(){
      const m=minDim,mp=mouthPos();
      for(const o of CH.objs){
        const k=o.eaten>0?o.eaten/0.25:1;
        if(o.bad){ctx.beginPath();ctx.arc(o.x,o.y,o.r*1.25,0,6.29);ctx.fillStyle='rgba(225,77,91,.25)';ctx.fill()}
        emo(o.e,o.x,o.y,o.r*2.2*k,o.rot*frame*0.02,k);
      }
      if(mp){
        ctx.beginPath();ctx.arc(mp.x,mp.y,mp.r,0,6.29);ctx.lineWidth=m*0.008;
        ctx.strokeStyle=CH.mouthOpen?'rgba(60,220,120,.95)':'rgba(255,255,255,.7)';ctx.setLineDash(CH.mouthOpen?[]:[m*0.02,m*0.015]);ctx.stroke();ctx.setLineDash([]);
        if(!CH.mouthOpen&&CH.eaten===0&&level===1)lblText('😮 Há miệng thật to khi trái cây tới!',W/2,H*0.14,m*0.04,'#fff');
      }
      if(CH.flash>0){ctx.fillStyle='rgba(255,70,90,'+(CH.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
    },
  });
})();

/* ============================================================
   GƯƠNG BIẾN HÌNH — hoá trang bằng tai thú, mũ, kính… theo khuôn mặt (không có cấp độ)
   ============================================================ */
(function(){
  const COST=[{k:'dog',e:'🐶',n:'Chó con'},{k:'cat',e:'🐱',n:'Mèo'},{k:'bunny',e:'🐰',n:'Thỏ'},{k:'king',e:'👑',n:'Vua'},{k:'cool',e:'🕶️',n:'Ngầu'},{k:'lion',e:'🦁',n:'Sư tử'},{k:'clown',e:'🤡',n:'Chú hề'}];
  const MR={cur:0,openT:0,swapCd:0};
  const btnRect=i=>{const m=minDim,gap=6,margin=Math.min(90,W*0.1),w=Math.min((W-2*margin-gap*(COST.length-1))/COST.length,m*0.14),x0=W/2-(COST.length*(w+gap)-gap)/2;return {x:x0+i*(w+gap),y:H-w-m*0.03,w,h:w}};
  function withFace(f,fn){
    const cx=f.cx*W,cy=f.cy*H;ctx.save();ctx.translate(cx,cy);ctx.rotate(f.roll);fn(f.w*H,f.h*H);ctx.restore();
  }
  /** toạ độ của một điểm trên mặt trong hệ trục đã xoay theo đầu (để vẽ mũi, miệng đúng chỗ khi bé nghiêng đầu) */
  function loc(f,pt){
    const dx=(pt.x-f.cx)*W,dy=(pt.y-f.cy)*H,c=Math.cos(f.roll),s=Math.sin(f.roll);
    return {x:dx*c+dy*s,y:-dx*s+dy*c};
  }
  const DRAW={
    dog(fw,fh){
      ctx.fillStyle='#8A5A2B';
      [-1,1].forEach(s=>{ctx.save();ctx.translate(s*fw*0.46,-fh*0.42);ctx.rotate(s*0.5);ctx.beginPath();ctx.ellipse(0,0,fw*0.17,fw*0.3,0,0,6.29);ctx.fill();ctx.lineWidth=fw*0.02;ctx.strokeStyle='#5E3A18';ctx.stroke();ctx.restore()});
    },
    cat(fw,fh){
      ctx.fillStyle='#FFB27A';
      [-1,1].forEach(s=>{ctx.beginPath();ctx.moveTo(s*fw*0.18,-fh*0.45);ctx.lineTo(s*fw*0.52,-fh*0.78);ctx.lineTo(s*fw*0.5,-fh*0.28);ctx.closePath();ctx.fill();ctx.lineWidth=fw*0.02;ctx.strokeStyle='#C77A3E';ctx.stroke()});
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=fw*0.018;ctx.lineCap='round';
      [-1,1].forEach(s=>[0,1,2].forEach(i=>{ctx.beginPath();ctx.moveTo(s*fw*0.32,fh*(0.12+i*0.05));ctx.lineTo(s*fw*0.78,fh*(0.05+i*0.11));ctx.stroke()}));
    },
    bunny(fw,fh){
      ctx.fillStyle='#fff';ctx.strokeStyle='#FFB1C8';ctx.lineWidth=fw*0.03;
      [-1,1].forEach(s=>{ctx.save();ctx.translate(s*fw*0.22,-fh*0.95);ctx.rotate(s*0.15);ctx.beginPath();ctx.ellipse(0,0,fw*0.13,fw*0.5,0,0,6.29);ctx.fill();ctx.stroke();ctx.fillStyle='#FFC6D6';ctx.beginPath();ctx.ellipse(0,fw*0.04,fw*0.065,fw*0.36,0,0,6.29);ctx.fill();ctx.fillStyle='#fff';ctx.restore()});
    },
    king(fw,fh){ctx.font=Math.round(fw*0.85)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('👑',0,-fh*0.62)},
    cool(fw,fh){ctx.font=Math.round(fw*0.95)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🕶️',0,-fh*0.1)},
    lion(fw,fh){
      ctx.fillStyle='rgba(255,150,40,.92)';
      for(let i=0;i<14;i++){const a=i/14*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*fw*0.62,Math.sin(a)*fh*0.62,fw*0.2,0,6.29);ctx.fill()}
      ctx.fillStyle='rgba(120,60,10,.85)';
      [-1,1].forEach(s=>{ctx.beginPath();ctx.arc(s*fw*0.42,-fh*0.5,fw*0.12,0,6.29);ctx.fill()});
    },
    clown(fw,fh){
      const cols=['#FF4D5E','#FFD84D','#3C9BFF','#3BC97A','#9B6BFF'];
      cols.forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc((i-2)*fw*0.24,-fh*0.58-Math.abs(i-2)*-fh*0.04,fw*0.17,0,6.29);ctx.fill()});
    },
  };
  registerGame({
    id:'mirror',name:'Gương Biến Hình',needs:'face',motion:false,touch:true,trackOpts:{numFaces:2},levels:false,
    intro:'Đưa mặt vào giữa khung hình, chọn trang phục ở dưới rồi tha hồ biến hình nhé!',go:'Biến hình nào! 🪄',dbg:()=>MR,
    begin(){MR.openT=0;MR.swapCd=0},
    hud(){return {level:false}},
    update(dt){
      MR.swapCd=Math.max(0,MR.swapCd-dt);
      const f=face0();
      if(f&&f.open>0.6){MR.openT+=dt;if(MR.openT>1.2&&MR.swapCd<=0){MR.cur=(MR.cur+1)%COST.length;MR.swapCd=1.5;MR.openT=0;sPick()}}else MR.openT=0;
    },
    tap(x,y){
      const px=x*W,py=y*H;
      COST.forEach((c,i)=>{const r=btnRect(i);if(px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h){MR.cur=i;sPick()}});
    },
    draw(){
      const m=minDim,c=COST[MR.cur];
      for(const f of Track.faces){
        withFace(f,(fw,fh)=>{
          DRAW[c.k](fw,fh);
          // mũi / lưỡi / răng tuỳ trang phục
          ctx.save();ctx.rotate(0);
          const nl=loc(f,f.nose),nx=nl.x,ny=nl.y;
          if(c.k==='dog'||c.k==='cat'||c.k==='lion'){ctx.fillStyle=c.k==='cat'?'#FF8FA8':'#222';ctx.beginPath();ctx.ellipse(nx,ny,fw*0.07,fw*0.055,0,0,6.29);ctx.fill()}
          if(c.k==='clown'){ctx.fillStyle='#FF3B4E';ctx.beginPath();ctx.arc(nx,ny,fw*0.11,0,6.29);ctx.fill();ctx.lineWidth=fw*0.012;ctx.strokeStyle='#fff';ctx.stroke()}
          const ml=loc(f,f.mouth),mx=ml.x,my=ml.y;
          if(c.k==='dog'&&f.open>0.3){ctx.fillStyle='#FF7E9A';ctx.beginPath();ctx.ellipse(mx,my+fw*0.08,fw*0.07,fw*0.11*Math.min(1,f.open*2),0,0,6.29);ctx.fill()}
          if(c.k==='bunny'&&f.open>0.25){ctx.fillStyle='#fff';ctx.strokeStyle='#999';ctx.lineWidth=2;ctx.fillRect(mx-fw*0.05,my-fw*0.05,fw*0.1,fw*0.1);ctx.strokeRect(mx-fw*0.05,my-fw*0.05,fw*0.1,fw*0.1)}
          ctx.restore();
        });
        if(f.smile>0.6&&frame%6===0)burstAt(f.cx*W+rand(-1,1)*f.w*H*0.6,f.cy*H-f.h*H*0.5,'#FFD84D',2);
      }
      // khay trang phục
      COST.forEach((k,i)=>{
        const r=btnRect(i),on=i===MR.cur;
        panel(r.x,r.y,r.w,r.h,r.w*0.22,on?'rgba(255,240,170,.97)':'rgba(255,255,255,.88)',on?'#FF8A3D':'rgba(20,69,107,.25)',on?m*0.01:m*0.004);
        emo(k.e,r.x+r.w/2,r.y+r.h*0.46,r.w*0.55);
        ctx.fillStyle='#14456B';ctx.font='700 '+Math.round(r.w*0.17)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(k.n,r.x+r.w/2,r.y+r.h*0.86);
      });
      lblText('😮 Há miệng to 1 giây để đổi trang phục',W/2,m*0.12,m*0.032,'#fff');
    },
  });
})();

/* ============================================================
   LÀM MẶT HỀ — làm đúng biểu cảm của biểu tượng; ảnh chụp lại được giữ trong khung
   ============================================================ */
(function(){
  const FACES=[
    {k:'smile',e:'😄',n:'Cười thật tươi!',ok:f=>f.smile>0.55,lv:1},
    {k:'open',e:'😮',n:'Há miệng thật to!',ok:f=>f.open>0.55,lv:1},
    {k:'wink',e:'😉',n:'Nháy một mắt!',ok:f=>Math.abs(f.blinkL-f.blinkR)>0.45&&Math.max(f.blinkL,f.blinkR)>0.55,lv:3},
    {k:'tongue',e:'😛',n:'Lè lưỡi ra!',ok:f=>(f.bl.tongueOut||0)>0.3,lv:5},
    {k:'kiss',e:'😗',n:'Chu môi lên!',ok:f=>f.pucker>0.5,lv:7},
    {k:'angry',e:'😠',n:'Nhăn mặt giận dữ!',ok:f=>((f.bl.browDownLeft||0)+(f.bl.browDownRight||0))/2>0.5,lv:10},
    {k:'wow',e:'😲',n:'Ngạc nhiên quá!',ok:f=>(f.bl.browInnerUp||0)>0.45&&f.open>0.3,lv:13},
    {k:'puff',e:'😤',n:'Phồng má lên!',ok:f=>(f.bl.cheekPuff||0)>0.4,lv:16},
  ];
  const FM={target:null,t:0,limit:6,hold:0,done:0,need:5,state:'wait',msg:'',msgT:0,photos:[],last:''};
  function ask(){
    const pool=FACES.filter(x=>x.lv<=level);let x;do{x=pick(pool)}while(x.k===FM.last&&pool.length>1);
    FM.last=x.k;FM.target=x;FM.t=FM.limit;FM.hold=0;FM.state='ask';Voice.say(x.n.replace('!',''));
  }
  function snap(){
    try{const c=document.createElement('canvas');c.width=160;c.height=90;drawCam(c.getContext('2d'),160,90);FM.photos.push(c);if(FM.photos.length>6)FM.photos.shift()}catch(e){}
  }
  registerGame({
    id:'facematch',name:'Làm Mặt Hề',needs:'face',motion:false,touch:false,trackOpts:{numFaces:1},
    intro:'Làm đúng biểu cảm của hình emoji nhé — cười, há miệng, nháy mắt, lè lưỡi…',go:'Làm mặt hề nào! 🤪',dbg:()=>FM,
    start(){FM.photos=[];FM.last=''},
    begin(){hearts=heartsMax=3;FM.done=0;FM.need=5+Math.floor(level/3);FM.limit=lerp(7,3.6,lvlT());FM.state='wait';FM.t=0.8;FM.msgT=0},
    hud(){return {score:FM.done+'/'+FM.need,icon:'🤪',hearts:[hearts,heartsMax]}},
    update(dt){
      FM.msgT=Math.max(0,FM.msgT-dt);
      if(FM.state==='wait'){FM.t-=dt;if(FM.t<=0)ask();return}
      if(FM.state==='result'){FM.t-=dt;if(FM.t<=0&&FM.done<FM.need&&state==='play'){FM.state='wait';FM.t=0.4}return}
      FM.t-=dt;
      const f=face0();
      if(f&&FM.target.ok(f))FM.hold+=dt;else FM.hold=Math.max(0,FM.hold-dt*2);
      if(FM.hold>=0.5){FM.done++;FM.state='result';FM.t=1.4;FM.msg='Giống quá! 📸';FM.msgT=1.2;sPop(true);snap();burstAt(W/2,H*0.3,'#FFD84D',22);
        if(FM.done>=FM.need)setTimeout(()=>{if(state==='play'&&mode==='facematch')levelUp()},1100)}
      else if(FM.t<=0){FM.state='result';FM.t=1.0;FM.msg='Chưa giống rồi! 😅';FM.msgT=1.0;sBuzz();loseHeart()}
    },
    draw(){
      const m=minDim,t=FM.target;
      const y0=TOPY();
      if(t&&FM.state!=='wait'){
        panel(W/2-m*0.3,y0,m*0.6,m*0.2,m*0.04,'rgba(255,255,255,.93)','#FF8A3D',m*0.008);
        emo(t.e,W/2-m*0.14,y0+m*0.1,m*0.13);
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(m*0.04)+"px 'Baloo 2',sans-serif";ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(t.n,W/2-m*0.05,y0+m*0.08);
        bar(W/2-m*0.05,y0+m*0.125,m*0.33,m*0.016,FM.state==='ask'?FM.t/FM.limit:0,FM.t/FM.limit<0.3?'#FF4D5E':'#8B6FEA');
        if(FM.hold>0)bar(W/2-m*0.05,y0+m*0.155,m*0.33,m*0.012,FM.hold/0.5,'#35E08B');
      }
      if(FM.msgT>0)lblText(FM.msg,W/2,H*0.5,m*0.055,'#FFE98A');
      // dải ảnh kỷ niệm
      FM.photos.forEach((c,i)=>{
        const w=m*0.17,h=w*0.5625,x=m*0.03+i*(w+m*0.012),y=H-h-m*0.04;
        ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate((i%2?1:-1)*0.05);
        ctx.fillStyle='#fff';ctx.fillRect(-w/2-4,-h/2-4,w+8,h+14);ctx.drawImage(c,-w/2,-h/2,w,h);ctx.restore();
      });
    },
  });
})();

/* ============================================================
   CÁ CON BẮT CHỮ — há miệng để cá bơi lên, ngậm miệng để cá chìm xuống; bắt chữ được gọi
   ============================================================ */
(function(){
  const FL={fy:0.5,objs:[],target:'A',caught:0,need:6,spawnT:0,flash:0,msg:'',msgT:0,tyTouch:null,callT:0};
  const LET='ABCDEGHIKLMNOPQRSTUVXY'.split('');
  const pool=()=>level<8?LET.slice(0,8):level<16?LET.slice(0,14):LET;
  function newTarget(){let c;do{c=pick(pool())}while(c===FL.target&&pool().length>1);FL.target=c;FL.callT=0;Voice.say('Bắt chữ '+c)}
  function spawn(want){
    const L=want?FL.target:pick(pool());
    FL.objs.push({x:W+minDim*0.1,y:rand(0.2,0.85)*H,vx:-W*lerp(0.2,0.38,lvlT())*rand(0.9,1.15),L,r:minDim*0.07,bob:rand(0,6.28)});
  }
  registerGame({
    id:'fishletters',name:'Cá Con Bắt Chữ',needs:'face',motion:false,touch:true,trackOpts:{numFaces:1},
    intro:'Há miệng để cá bơi lên, ngậm miệng để cá chìm xuống. Bắt đúng chữ cái được gọi nhé!',go:'Bơi nào! 🐟',dbg:()=>FL,
    begin(){hearts=heartsMax=3;FL.objs=[];FL.caught=0;FL.need=6+Math.floor(level/2);FL.spawnT=0.4;FL.flash=0;FL.fy=0.5;newTarget()},
    hud(){return {score:FL.caught+'/'+FL.need,icon:'🐟',hearts:[hearts,heartsMax]}},
    update(dt){
      FL.flash=Math.max(0,FL.flash-dt);FL.msgT=Math.max(0,FL.msgT-dt);FL.callT+=dt;
      const f=face0();
      let ty=FL.fy;
      if(f)ty=lerp(0.85,0.15,clamp((f.open-0.08)/0.45,0,1));
      else if(FL.tyTouch!==null)ty=FL.tyTouch;
      FL.fy+=(ty-FL.fy)*Math.min(1,dt*6);
      FL.spawnT-=dt;
      if(FL.spawnT<=0){spawn(!FL.objs.some(o=>o.L===FL.target)||Math.random()<0.4);FL.spawnT=lerp(1.2,0.7,lvlT())*rand(0.85,1.2)}
      const fx=W*0.2,fyp=FL.fy*H,fr=minDim*0.07;
      for(let i=FL.objs.length-1;i>=0;i--){
        const o=FL.objs[i];o.x+=o.vx*dt;
        if(o.x<-minDim*0.15){FL.objs.splice(i,1);continue}
        if(Math.hypot(o.x-fx,o.y-fyp)<o.r+fr){
          FL.objs.splice(i,1);
          if(o.L===FL.target){FL.caught++;sPop(true);burstAt(o.x,o.y,'#5AA9FF',16);floatAt(o.x,o.y-o.r,'+1');
            if(FL.caught>=FL.need){levelUp();return}newTarget()}
          else{tone(220,160,.18,.14,'sine');burstAt(o.x,o.y,'#B0B8C4',8);floatAt(o.x,o.y-o.r,'Ồ!',true)}   // bắt nhầm chữ: chỉ tiếc, không mất tim (điều khiển bằng miệng khó chính xác)
        }else if(!o.passed&&o.x<fx-fr*1.5){
          o.passed=true;
          if(o.L===FL.target){sBuzz();FL.flash=0.35;floatAt(fx,FL.fy*H-fr*2,'Trượt mất chữ '+o.L+'!',true);loseHeart();if(state!=='play')return}
        }
      }
    },
    tap(x,y){FL.tyTouch=y},
    draw(){
      const m=minDim;
      ctx.fillStyle='rgba(60,150,230,.28)';ctx.fillRect(0,0,W,H);
      for(const o of FL.objs){
        const y=o.y+Math.sin(frame*0.07+o.bob)*m*0.01;
        ctx.beginPath();ctx.arc(o.x,y,o.r,0,6.29);ctx.fillStyle=o.L===FL.target?'rgba(255,240,150,.95)':'rgba(255,255,255,.88)';ctx.fill();ctx.lineWidth=m*0.006;ctx.strokeStyle='#3C9BFF';ctx.stroke();
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(o.r*1.2)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.L,o.x,y+o.r*0.05);
      }
      emo('🐟',W*0.2,FL.fy*H,m*0.14,Math.sin(frame*0.2)*0.08);
      lblText('Bắt chữ '+FL.target,W/2,m*0.14,m*0.075,'#fff');
      if(FL.flash>0){ctx.fillStyle='rgba(255,70,90,'+(FL.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      const f=face0();
      if(f)lblText(f.open>0.3?'😮 Cá bơi lên':'😶 Cá chìm xuống',W-m*0.22,H-m*0.05,m*0.03,'#fff');
    },
  });
})();
