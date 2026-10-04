'use strict';
/* ============================================================
   games-fit.js — nhóm thể dục & nhịp: Đấm Bốc Theo Nhịp, Huấn Luyện Viên, Đấu Toán, Né Bóng, Nhịp Squat, Đầu Vai Gối Chân
   (đều dùng khung xương: cổ tay, lệch người, cúi, nhảy)
   ============================================================ */

/* ============================================================
   ĐẤM BỐC THEO NHỊP — đấm trúng các bia sáng đúng nhịp trống
   ============================================================ */
(function(){
  const BX={bpm:80,t:0,beat:0,targets:[],hits:0,need:10,combo:0,msg:'',msgT:0,side:0};
  const bpm=()=>lerp(74,112,lvlT());
  function spawn(){
    const m=minDim;BX.side^=1;
    const life=60/BX.bpm*2.2;
    BX.targets.push({x:(BX.side?0.72:0.28)*W,y:rand(0.4,0.62)*H,age:0,life,r:m*0.085,dead:false});
  }
  registerGame({
    id:'boxer',name:'Đấm Bốc Theo Nhịp',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:1},music:false,
    intro:'Đấm trúng các bia sáng đúng nhịp trống nhé — đấm thật nhanh về phía màn hình!',go:'Đấm theo nhịp! 🥊',dbg:()=>BX,
    begin(){hearts=heartsMax=3;BX.bpm=bpm();BX.t=0;BX.beat=0;BX.targets=[];BX.hits=0;BX.need=10+level;BX.combo=0;BX.msgT=0},
    hud(){return {score:BX.hits+'/'+BX.need,icon:'🥊',hearts:[hearts,heartsMax]}},
    update(dt){
      const dur=60/BX.bpm;BX.t+=dt;BX.msgT=Math.max(0,BX.msgT-dt);
      while(BX.t>=dur){
        BX.t-=dur;BX.beat++;
        Drum.hit(BX.beat%4===1?'kick':'hat',BX.beat%4===1?0.9:0.6);
        if(BX.beat%2===0)spawn();
      }
      for(let i=BX.targets.length-1;i>=0;i--){
        const t=BX.targets[i];t.age+=dt;
        if(t.age<0.2){continue}
        if(touchedBy(t.x,t.y,t.r,{minSpeed:0.6}).hit){
          const perfect=Math.abs(t.age-t.life*0.7)<0.22;
          BX.hits++;BX.combo++;Drum.hit(perfect?'snare':'tom1');burstAt(t.x,t.y,perfect?'#FFD84D':'#3BC9A9',perfect?22:12);
          floatAt(t.x,t.y-t.r,perfect?'TUYỆT VỜI!':'TỐT!');BX.targets.splice(i,1);
          if(BX.hits>=BX.need){levelUp();return}
          continue;
        }
        if(t.age>=t.life){BX.targets.splice(i,1);BX.combo=0;sBuzz();floatAt(t.x,t.y,'Trượt!',true);loseHeart();if(state!=='play')return}
      }
    },
    tap(){},
    draw(){
      const m=minDim;
      for(const t of BX.targets){
        const k=Math.max(0,1-t.age/(t.life*0.7));              // vòng ngoài thu nhỏ dần về bia
        ctx.beginPath();ctx.arc(t.x,t.y,t.r*(1+k*1.6),0,6.29);ctx.lineWidth=m*0.01;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.stroke();
        ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,6.29);ctx.fillStyle='rgba(255,90,110,.92)';ctx.fill();ctx.lineWidth=m*0.008;ctx.strokeStyle='#fff';ctx.stroke();
        emo('🎯',t.x,t.y,t.r*1.3);
      }
      if(BX.combo>=3)lblText('Combo x'+BX.combo+'!',W/2,m*0.14,m*0.05,'#FFE98A');
      // nhịp: chấm nhấp nháy
      const pulse=1-BX.t/(60/BX.bpm);
      ctx.beginPath();ctx.arc(W/2,H-m*0.07,m*0.03*(1+pulse*0.5),0,6.29);ctx.fillStyle='rgba(255,255,255,'+(0.4+0.5*pulse).toFixed(2)+')';ctx.fill();
      drawPtrs('🥊',m*0.09);
    },
  });
})();

/* ============================================================
   HUẤN LUYỆN VIÊN — làm theo lời gọi: đấm trái / phải, né trái / phải, cúi xuống
   ============================================================ */
(function(){
  const MOVES={
    jabL:{t:'ĐẤM TAY TRÁI!',e:'🥊',dir:'⬅️'},jabR:{t:'ĐẤM TAY PHẢI!',e:'🥊',dir:'➡️'},
    weaveL:{t:'NÉ SANG TRÁI!',e:'↩️',dir:'⬅️'},weaveR:{t:'NÉ SANG PHẢI!',e:'↪️',dir:'➡️'},duck:{t:'CÚI XUỐNG!',e:'⬇️',dir:''},
  };
  const CO={sg:null,move:null,id:'',t:0,limit:2.6,done:0,need:8,state:'wait',msg:'',msgT:0,armAt:{L:-1e9,R:-1e9},leanAt:{L:-1e9,R:-1e9}};
  const pool=()=>{const p=['jabL','jabR'];if(level>=7)p.push('weaveL','weaveR');if(level>=15)p.push('duck');return p};
  function call(){
    let id;do{id=pick(pool())}while(id===CO.id&&pool().length>1);
    CO.id=id;CO.move=MOVES[id];CO.t=CO.limit;CO.state='call';
    Voice.say(CO.move.t.toLowerCase());tone(520,780,.12,.14,'triangle');
  }
  registerGame({
    id:'coach',name:'Huấn Luyện Viên',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},music:false,
    intro:'Nghe huấn luyện viên gọi rồi làm theo: đấm tay trái, đấm tay phải, né, cúi!',go:'Làm theo huấn luyện viên! 🥋',dbg:()=>CO,
    start(){CO.sg=Sig.make('solo')},
    begin(){hearts=heartsMax=3;CO.done=0;CO.need=8+level;CO.limit=lerp(3.0,1.5,lvlT());CO.state='wait';CO.t=0.8;CO.id='';CO.msgT=0;if(CO.sg)CO.sg.x0=null},
    hud(){return {score:CO.done+'/'+CO.need,icon:'🥋',hearts:[hearts,heartsMax]}},
    update(dt){
      const now=performance.now(),sg=CO.sg.update(dt);
      CO.msgT=Math.max(0,CO.msgT-dt);
      for(const p of Ptr.list()){if(p.kind==='wrist'&&p.sp>0.85)CO.armAt[p.side]=now}
      const d=sg.lean(dt);
      if(d<-0.07)CO.leanAt.L=now;if(d>0.07)CO.leanAt.R=now;
      if(CO.state==='wait'){CO.t-=dt;if(CO.t<=0)call();return}
      if(CO.state==='result'){CO.t-=dt;if(CO.t<=0&&CO.done<CO.need&&state==='play'){CO.state='wait';CO.t=0.35}return}
      CO.t-=dt;
      const id=CO.id;
      const ok=id==='jabL'?now-CO.armAt.L<350:id==='jabR'?now-CO.armAt.R<350:id==='weaveL'?now-CO.leanAt.L<400:id==='weaveR'?now-CO.leanAt.R<400:now-sg.duckAt<400;
      if(ok&&CO.t<CO.limit-0.15){
        CO.done++;CO.state='result';CO.t=0.5;CO.msg='Tốt lắm! 💪';CO.msgT=0.6;sPop(true);Drum.hit('snare');
        if(CO.done>=CO.need)setTimeout(()=>{if(state==='play'&&mode==='coach')levelUp()},500);
      }else if(CO.t<=0){CO.state='result';CO.t=0.6;CO.msg='Chậm rồi!';CO.msgT=0.8;sBuzz();loseHeart()}
    },
    draw(){
      const m=minDim,mv=CO.move;
      emo('🥋',W*0.12,H*0.2,m*0.14);
      if(mv&&CO.state!=='wait'){
        lblText(mv.t,W/2,H*0.22,m*0.075,'#fff');
        emo(mv.e,W/2,H*0.36,m*0.13);if(mv.dir)emo(mv.dir,W/2+(CO.id.endsWith('L')?-1:1)*m*0.16,H*0.36,m*0.1);
        if(CO.state==='call')bar(W/2-m*0.25,H*0.46,m*0.5,m*0.018,Math.max(0,CO.t/CO.limit),CO.t/CO.limit<0.3?'#FF4D5E':'#FF8A3D');
      }
      if(CO.msgT>0)lblText(CO.msg,W/2,H*0.6,m*0.06,'#FFE98A');
      if(CO.state==='wait'&&CO.done===0)lblText('Sẵn sàng…',W/2,H*0.3,m*0.07,'#fff');
    },
  });
})();

/* ============================================================
   ĐẤU TOÁN — đấm đáp án đúng để hạ trùm; nhảy / cúi để né đòn
   ============================================================ */
(function(){
  const BOSSES=['👹','🐲','🤖','👾','🦖'];
  const MB={sg:null,boss:'👹',hp:4,maxHp:4,q:null,state:'wait',t:0,limit:9,atk:null,atkT:0,msg:'',msgT:0,shake:0,hitFx:0,jumped:-1e9,ducked:-1e9};
  function makeQ(){
    const mx=level<8?5:level<16?10:level<24?15:20;
    let a,b,ans,text;
    const sub=level>=8&&Math.random()<0.4;
    if(sub){a=2+((Math.random()*(mx-1))|0);b=1+((Math.random()*(a-1))|0);ans=a-b;text=a+' − '+b+' = ?'}
    else{a=1+((Math.random()*(mx-1))|0);b=1+((Math.random()*Math.max(1,mx-a))|0);ans=a+b;text=a+' + '+b+' = ?'}
    const set=new Set([ans]);while(set.size<3){const w=Math.max(0,ans+((Math.random()*7)|0)-3);if(w!==ans)set.add(w)}
    const opts=shuffle([...set]);return {text,ans,opts,correct:opts.indexOf(ans)};
  }
  const optPos=i=>({x:W*(0.2+i*0.3),y:H*0.55});
  function ask(){MB.q=makeQ();MB.state='ask';MB.t=MB.limit;Voice.say(MB.q.text.replace('+','cộng').replace('−','trừ').replace('= ?','bằng mấy'))}
  function startAttack(){
    MB.atk=Math.random()<0.5?'high':'low';MB.atkT=1.25;MB.state='attack';
    floatAt(W/2,H*0.35,MB.atk==='high'?'⚠️ CÚI!':'⚠️ NHẢY!',true);sTick();
  }
  function resolveAttack(){
    const now=performance.now();
    const ok=MB.atk==='high'?now-MB.ducked<700:now-MB.jumped<700;
    if(ok){MB.msg='Né được rồi! 😎';sPop(false)}else{MB.msg='Trúng đòn! 😵';MB.shake=0.5;sBuzz();loseHeart()}
    MB.msgT=1.0;MB.state='wait';MB.t=0.7;MB.atk=null;
  }
  registerGame({
    id:'brawl',name:'Đấu Toán',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},
    intro:'Đấm vào đáp án đúng để hạ trùm! Trùm đánh thì cúi hoặc nhảy để né nhé!',go:'Đấu toán nào! 🥊',dbg:()=>MB,
    start(){MB.sg=Sig.make('solo')},
    begin(){hearts=heartsMax=3;MB.boss=BOSSES[(level-1)%BOSSES.length];MB.maxHp=MB.hp=4+Math.floor(level/5);MB.limit=lerp(11,6,lvlT());MB.state='wait';MB.t=0.8;MB.q=null;MB.msgT=0;MB.shake=0;MB.hitFx=0},
    hud(){return {score:(MB.maxHp-MB.hp)+'/'+MB.maxHp,icon:'⚔️',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=MB.sg.update(dt),now=performance.now();
      if(sg.jumpEdge||sg.jump)MB.jumped=now;
      if(sg.duck)MB.ducked=now;
      MB.msgT=Math.max(0,MB.msgT-dt);MB.shake=Math.max(0,MB.shake-dt);MB.hitFx=Math.max(0,MB.hitFx-dt);
      if(MB.state==='wait'){MB.t-=dt;if(MB.t<=0){if(MB.hp<MB.maxHp&&Math.random()<lerp(0.35,0.7,lvlT())&&MB.q)startAttack();else ask()}return}
      if(MB.state==='attack'){MB.atkT-=dt;if(MB.atkT<=0)resolveAttack();return}
      if(MB.state==='ask'){
        MB.t-=dt;
        for(let i=0;i<3;i++){
          const p=optPos(i);
          if(touchedBy(p.x,p.y,minDim*0.1,{minSpeed:0.7}).hit){
            if(i===MB.q.correct){
              MB.hp--;MB.hitFx=0.4;MB.msg='Trúng boss! 💥';MB.msgT=0.8;Drum.hit('snare');sPop(true);burstAt(W/2,H*0.25,'#FFD84D',24);
              MB.state='wait';MB.t=0.8;
              if(MB.hp<=0){setTimeout(()=>{if(state==='play'&&mode==='brawl')levelUp()},700);MB.state='dead'}
            }else{MB.msg='Sai rồi! Trùm đánh lại!';MB.msgT=1.0;sBuzz();MB.shake=0.4;loseHeart();if(state!=='play')return;MB.state='wait';MB.t=0.8;MB.q=MB.q}
            return;
          }
        }
        if(MB.t<=0){MB.msg='Hết giờ!';MB.msgT=0.9;sBuzz();loseHeart();if(state!=='play')return;MB.state='wait';MB.t=0.8}
      }
    },
    draw(){
      const m=minDim,q=MB.q;
      // trùm
      const bx=W/2+Math.sin(frame*0.05)*m*0.03+(MB.shake>0?Math.sin(frame*2)*m*0.01:0),by=Math.max(H*0.2,TOPY()+m*0.11);
      ctx.save();ctx.translate(bx,by);if(MB.hitFx>0)ctx.scale(1.12,0.9);emo(MB.boss,0,0,m*0.2);ctx.restore();
      bar(W/2-m*0.25,by+m*0.13,m*0.5,m*0.025,MB.hp/MB.maxHp,'#FF4D5E');
      if(MB.state==='attack'){
        lblText(MB.atk==='high'?'⚠️ ĐÒN TRÊN — CÚI XUỐNG!':'⚠️ ĐÒN DƯỚI — NHẢY LÊN!',W/2,H*0.42,m*0.05,'#FF8A8A');
        const k=1-MB.atkT/1.25;ctx.fillStyle='rgba(255,70,90,'+(0.12+k*0.25).toFixed(2)+')';
        if(MB.atk==='high')ctx.fillRect(0,0,W,H*0.5);else ctx.fillRect(0,H*0.6,W,H*0.4);
      }
      if(q&&MB.state==='ask'){
        panel(W/2-m*0.3,H*0.34,m*0.6,m*0.1,m*0.03,'rgba(255,255,255,.93)','#8B6FEA',m*0.008);
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(m*0.06)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q.text,W/2,H*0.34+m*0.055);
        q.opts.forEach((o,i)=>{
          const p=optPos(i);
          ctx.beginPath();ctx.arc(p.x,p.y,m*0.1,0,6.29);ctx.fillStyle='rgba(255,255,255,.93)';ctx.fill();ctx.lineWidth=m*0.01;ctx.strokeStyle='#FF8A3D';ctx.stroke();
          ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(m*0.09)+"px 'Baloo 2',sans-serif";ctx.fillText(o,p.x,p.y+m*0.005);
        });
        bar(W/2-m*0.25,H*0.34+m*0.115,m*0.5,m*0.014,MB.t/MB.limit,MB.t/MB.limit<0.3?'#FF4D5E':'#8B6FEA');
      }
      if(MB.msgT>0)lblText(MB.msg,W/2,H*0.75,m*0.05,'#FFE98A');
      drawPtrs('🥊',m*0.09);
    },
  });
})();

/* ============================================================
   NÉ BÓNG — bóng bay thẳng vào người: bước sang bên hoặc cúi / nhảy để né
   ============================================================ */
(function(){
  const DG={sg:null,proj:[],spawnT:0,done:0,need:8,flash:0,px:0.5};
  const f=z=>z*z;
  const travel=()=>lerp(2.3,1.2,lvlT());
  function spawn(){
    const high=Math.random()<0.35;
    DG.proj.push({z:0.02,tx:clamp(DG.px,0.15,0.85)*W,high,e:pick(['⚽','🏐','🍅','🥧','🏀']),done:false,res:''});
  }
  registerGame({
    id:'dodge',name:'Né Bóng',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},
    intro:'Bóng bay thẳng vào người! Bước sang bên để né, bóng bay cao thì cúi xuống!',go:'Né bóng nào! ⚽',dbg:()=>DG,
    start(){DG.sg=Sig.make('solo')},
    begin(){hearts=heartsMax=3;DG.proj=[];DG.done=0;DG.need=8+level;DG.spawnT=1.0;DG.flash=0},
    hud(){return {score:DG.done+'/'+DG.need,icon:'🛡️',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=DG.sg.update(dt);
      if(sg.ok)DG.px+=(sg.x-DG.px)*Math.min(1,dt*8);
      DG.flash=Math.max(0,DG.flash-dt);DG.spawnT-=dt;
      if(DG.spawnT<=0){spawn();DG.spawnT=lerp(1.7,0.85,lvlT())*rand(0.85,1.2)}
      for(let i=DG.proj.length-1;i>=0;i--){
        const p=DG.proj[i];
        if(p.done){p.out=(p.out||0)+dt;if(p.out>0.7)DG.proj.splice(i,1);continue}
        p.z+=dt/travel();
        if(p.z>=0.95){
          p.done=true;
          const near=Math.abs(sg.x*W-p.tx)<W*0.11,now=performance.now();
          const vert=p.high?(now-sg.duckAt<600):(now-sg.jumpAt<600);
          if(near&&!vert){p.res='hit';DG.flash=0.45;sBuzz();floatAt(p.tx,H*0.6,'Trúng rồi! 😵',true);loseHeart();if(state!=='play')return}
          else{p.res='ok';DG.done++;sPop(false);floatAt(p.tx,H*0.6,'Né được! 😎');if(DG.done>=DG.need){levelUp();return}}
        }
      }
    },
    draw(){
      const m=minDim;
      for(const p of DG.proj){
        const fz=f(Math.min(p.z,1)),x=lerp(W/2,p.tx,fz),y=lerp(H*0.34,p.high?H*0.34:H*0.82,fz),s=m*(0.04+0.2*fz);
        // vòng báo điểm rơi trên sàn
        if(!p.done){ctx.beginPath();ctx.ellipse(p.tx,H*0.86,m*(0.04+0.12*fz),m*(0.015+0.04*fz),0,0,6.29);ctx.strokeStyle=p.high?'rgba(255,200,80,.9)':'rgba(255,90,100,.9)';ctx.lineWidth=m*0.006;ctx.stroke()}
        emo(p.e,x,p.done?y-(p.out||0)*m*0.3:y,s*2,p.z*10,p.done?Math.max(0,1-(p.out||0)/0.7):1);
      }
      if(DG.flash>0){ctx.fillStyle='rgba(255,70,90,'+(DG.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      if(DG.done===0&&level===1)lblText('⬅️ Bước sang bên để né ➡️   ⬇️ cúi nếu bóng bay cao',W/2,H*0.14,m*0.036,'#fff');
    },
  });
})();

/* ============================================================
   NHỊP SQUAT — đứng lên / ngồi xuống đúng nhịp khi chấm tròn rơi tới vạch
   ============================================================ */
(function(){
  const SQ={sg:null,bpm:80,t:0,beat:0,dots:[],done:0,need:12,state:'U',lastTarget:'U',combo:0,flash:0,msg:'',msgT:0};
  const bpm=()=>lerp(70,108,lvlT());
  const lead=2;                                   // chấm xuất hiện trước 2 nhịp
  registerGame({
    id:'squat',name:'Nhịp Squat',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},music:false,
    intro:'Chấm tròn rơi xuống vạch: chấm xanh = đứng thẳng, chấm cam = ngồi xổm. Đúng nhịp nhé!',go:'Lên xuống theo nhịp! 🦵',dbg:()=>SQ,
    start(){SQ.sg=Sig.make('solo',{recenter:false})},
    begin(){hearts=heartsMax=3;SQ.bpm=bpm();SQ.t=0;SQ.beat=0;SQ.dots=[];SQ.done=0;SQ.need=12+level;SQ.combo=0;SQ.lastTarget='U';SQ.msgT=0},
    hud(){return {score:SQ.done+'/'+SQ.need,icon:'🦵',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=SQ.sg.update(dt),dur=60/SQ.bpm;
      // trạng thái của bé: ngồi xổm khi vai / hông hạ thấp rõ rệt
      const d=sg.sig.duckAmt;
      if(d>0.3)SQ.state='D';else if(d<0.14)SQ.state='U';
      SQ.flash=Math.max(0,SQ.flash-dt);SQ.msgT=Math.max(0,SQ.msgT-dt);
      SQ.t+=dt;
      while(SQ.t>=dur){
        SQ.t-=dur;SQ.beat++;
        Drum.hit(SQ.beat%4===1?'kick':'hat',0.7);
        const every=level<8?2:1;
        if(SQ.beat%every===0){
          const sw=Math.random()<lerp(0.7,0.9,lvlT());const tgt=sw?(SQ.lastTarget==='U'?'D':'U'):SQ.lastTarget;
          SQ.lastTarget=tgt;SQ.dots.push({target:tgt,hitBeat:SQ.beat+lead,done:false});
        }
      }
      const nowB=SQ.beat+SQ.t/dur;
      for(let i=SQ.dots.length-1;i>=0;i--){
        const dd=SQ.dots[i];
        if(!dd.done&&nowB>=dd.hitBeat){
          dd.done=true;dd.at=nowB;
          if(SQ.state===dd.target){SQ.done++;SQ.combo++;dd.res='ok';sPop(false);tone(dd.target==='U'?660:440,0,.1,.18,'triangle');
            if(SQ.done>=SQ.need){levelUp();return}}
          else{dd.res='bad';SQ.combo=0;SQ.flash=0.4;SQ.msg='Chưa đúng nhịp!';SQ.msgT=0.6;sBuzz();loseHeart();if(state!=='play')return}
        }
        if(dd.done&&nowB-dd.at>0.8)SQ.dots.splice(i,1);
      }
    },
    draw(){
      const m=minDim,dur=60/SQ.bpm,nowB=SQ.beat+SQ.t/dur;
      const lineY=H*0.78,topY=H*0.16,cx=W*0.82;
      // đường rơi + vạch
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(cx-m*0.08,topY,m*0.16,lineY-topY);
      ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(cx-m*0.12,lineY-m*0.006,m*0.24,m*0.012);
      for(const d of SQ.dots){
        const k=clamp(1-(d.hitBeat-nowB)/lead,0,1.3),y=lerp(topY,lineY,Math.min(k,1))+(k>1?(k-1)*m*0.3:0);
        const col=d.target==='U'?'#3BC9A9':'#FF8A3D';
        ctx.globalAlpha=d.done?Math.max(0,1-(nowB-d.at)/0.8):1;
        ctx.beginPath();ctx.arc(cx,y,m*0.045,0,6.29);ctx.fillStyle=d.res==='bad'?'#E14D5B':col;ctx.fill();ctx.lineWidth=m*0.006;ctx.strokeStyle='#fff';ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='800 '+Math.round(m*0.045)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(d.target==='U'?'⬆':'⬇',cx,y+2);
        ctx.globalAlpha=1;
      }
      // trạng thái hiện tại của bé
      lblText(SQ.state==='D'?'⬇ ĐANG NGỒI':'⬆ ĐANG ĐỨNG',cx,lineY+m*0.08,m*0.035,SQ.state==='D'?'#FFB27A':'#8FF0D8');
      if(SQ.combo>=3)lblText('Combo x'+SQ.combo,W*0.5,H*0.14,m*0.05,'#FFE98A');
      if(SQ.msgT>0)lblText(SQ.msg,W*0.5,H*0.3,m*0.05,'#fff');
      if(SQ.flash>0){ctx.fillStyle='rgba(255,70,90,'+(SQ.flash*0.3).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
    },
  });
})();

/* ============================================================
   ĐẦU VAI GỐI CHÂN — chạm hai tay vào đúng bộ phận cơ thể được gọi
   ============================================================ */
(function(){
  const PARTS=[{k:'head',n:'ĐẦU',e:'🙂'},{k:'shoulders',n:'VAI',e:'🤷'},{k:'knees',n:'GỐI',e:'🦵'},{k:'toes',n:'CHÂN',e:'🦶'}];
  const HS={part:null,t:0,limit:3,done:0,need:8,hold:0,seq:0,state:'wait',msg:'',msgT:0};
  function targets(b,k){
    const P=b.p;
    if(k==='head')return [P[0]];
    if(k==='shoulders')return [P[11],P[12]];
    if(k==='knees')return [P[25],P[26]];
    return [P[27],P[28],P[31],P[32]];
  }
  function touching(b,k){
    const T=b.torso,thr=k==='toes'?0.8*T:0.55*T,pts=targets(b,k);
    return [15,16].every(j=>{
      const w=b.p[j];if(w.v<0.4)return false;
      if(k==='toes'&&w.y<b.hip.y+0.6*T)return false;
      return pts.some(q=>q&&q.v>0.3&&Track.dist(w,q)<thr);
    });
  }
  function nextPart(){
    HS.part=level<10?PARTS[HS.seq++%4]:pick(PARTS);
    HS.t=HS.limit;HS.hold=0;HS.state='call';Voice.say(HS.part.n.toLowerCase());tone(500+PARTS.indexOf(HS.part)*110,0,.15,.16,'triangle');
  }
  registerGame({
    id:'hsk',name:'Đầu Vai Gối Chân',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},
    intro:'Nghe gọi “Đầu, vai, gối, chân” rồi đưa hai tay chạm đúng chỗ nhé!',go:'Đầu, vai, gối, chân! 🎵',dbg:()=>HS,
    begin(){hearts=heartsMax=3;HS.done=0;HS.need=8+level;HS.limit=lerp(3.6,1.7,lvlT());HS.state='wait';HS.t=0.8;HS.seq=0;HS.msgT=0},
    hud(){return {score:HS.done+'/'+HS.need,icon:'🎵',hearts:[hearts,heartsMax]}},
    update(dt){
      HS.msgT=Math.max(0,HS.msgT-dt);
      if(HS.state==='wait'){HS.t-=dt;if(HS.t<=0)nextPart();return}
      if(HS.state==='result'){HS.t-=dt;if(HS.t<=0&&HS.done<HS.need&&state==='play'){HS.state='wait';HS.t=0.3}return}
      HS.t-=dt;
      const b=Track.body('solo');
      if(b&&touching(b,HS.part.k))HS.hold+=dt;else HS.hold=Math.max(0,HS.hold-dt*2);
      if(HS.hold>=0.3){HS.done++;HS.state='result';HS.t=0.5;HS.msg='Đúng rồi! 🎉';HS.msgT=0.6;sPop(true);burstAt(W/2,H*0.3,'#FFD84D',18);
        if(HS.done>=HS.need)setTimeout(()=>{if(state==='play'&&mode==='hsk')levelUp()},500)}
      else if(HS.t<=0){HS.state='result';HS.t=0.7;HS.msg='Chậm rồi! 😅';HS.msgT=0.8;sBuzz();loseHeart()}
    },
    draw(){
      const m=minDim,p=HS.part;
      if(p&&HS.state!=='wait'){
        lblText('Chạm vào '+p.n+'!',W/2,H*0.2,m*0.085,'#fff');
        emo(p.e,W/2,H*0.33,m*0.14);
        bar(W/2-m*0.25,H*0.42,m*0.5,m*0.018,Math.max(0,HS.t/HS.limit),HS.t/HS.limit<0.3?'#FF4D5E':'#8B6FEA');
        if(HS.hold>0)bar(W/2-m*0.15,H*0.46,m*0.3,m*0.014,HS.hold/0.3,'#35E08B');
      }
      if(HS.msgT>0)lblText(HS.msg,W/2,H*0.58,m*0.06,'#FFE98A');
      if(HS.state==='wait'&&HS.done===0)lblText('Sẵn sàng…',W/2,H*0.3,m*0.07,'#fff');
    },
  });
})();
