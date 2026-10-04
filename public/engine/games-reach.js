'use strict';
/* ============================================================
   games-reach.js — nhóm trò "với tay": Tay Nhanh Như Chớp, Cắt Trái Cây, Đập Chuột, Bong Bóng Chữ Cái,
                    Trống Trên Không, Thủ Môn Nhí
   Chạm bằng con trỏ AI (cổ tay / đầu ngón) qua touchedBy(); không có AI thì dùng quét chuyển động.
   ============================================================ */

/* ============================================================
   TAY NHANH NHƯ CHỚP — nhìn màu được gọi rồi đập đúng chấm tròn màu đó
   ============================================================ */
(function(){
  const FH={targets:[],want:0,lastCol:-1,hits:0,need:6,t:0,limit:3,pause:0,msg:'',msgT:0};
  const COLS=[{n:'ĐỎ',h:'#FF4D5E'},{n:'VÀNG',h:'#FFD84D'},{n:'XANH LÁ',h:'#3BC97A'},{n:'XANH DƯƠNG',h:'#3C9BFF'},{n:'TÍM',h:'#9B6BFF'},{n:'CAM',h:'#FF9F43'}];
  const nCircles=()=>Math.min(6,3+Math.floor(level/8));
  const lifeSec=()=>lerp(3.6,1.8,lvlT());
  function newRound(){
    let w;do{w=(Math.random()*COLS.length)|0}while(w===FH.lastCol);
    FH.lastCol=w;FH.want=w;
    const n=nCircles(),m=minDim;
    const cols=shuffle([w].concat(sample(COLS.map((c,i)=>i).filter(i=>i!==w),n-1)));
    const pos=[];
    for(const ci of cols){
      let x,y,k=0;
      do{x=rand(0.16,0.84)*W;y=rand(0.3,0.8)*H;k++}while(k<40&&pos.some(p=>Math.hypot(p.x-x,p.y-y)<m*0.22));
      pos.push({x,y,ci});
    }
    FH.targets=pos.map(p=>({x:p.x,y:p.y,ci:p.ci,r:m*0.085,age:0,dead:false}));
    FH.limit=FH.t=lifeSec();
    Voice.say('Đập màu '+COLS[w].n.toLowerCase());
  }
  registerGame({
    id:'fast',name:'Tay Nhanh Như Chớp',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:2},
    intro:'Nhìn màu được gọi rồi đập thật nhanh đúng chấm tròn màu đó!',go:'Tay nhanh lên! ⚡',dbg:()=>FH,
    begin(){hearts=heartsMax=3;FH.hits=0;FH.need=6+Math.floor(level/2);FH.pause=0.6;FH.targets=[];FH.msgT=0},
    hud(){return {score:FH.hits+'/'+FH.need,icon:'⚡',hearts:[hearts,heartsMax]}},
    update(dt){
      FH.msgT=Math.max(0,FH.msgT-dt);
      if(FH.pause>0){FH.pause-=dt;if(FH.pause<=0)newRound();return}
      FH.t-=dt;
      for(const t of FH.targets){
        if(t.dead)continue;t.age+=dt;
        if(t.age<0.25)continue;
        if(touchedBy(t.x,t.y,t.r,{minSpeed:0.2}).hit){
          t.dead=true;
          if(t.ci===FH.want){
            FH.hits++;sPop(false);burstAt(t.x,t.y,COLS[t.ci].h,18);floatAt(t.x,t.y-t.r,'+1');
            FH.pause=0.35;FH.targets.forEach(o=>{if(o!==t)o.dead=true});
            if(FH.hits>=FH.need){levelUp();return}
          }else{
            sBuzz();burstAt(t.x,t.y,'#B0B8C4',10);floatAt(t.x,t.y-t.r,'✗',true);loseHeart();if(state!=='play')return;
          }
          break;
        }
      }
      if(FH.pause<=0&&FH.t<=0){FH.msg='Chậm rồi!';FH.msgT=0.8;sBuzz();loseHeart();if(state!=='play')return;FH.pause=0.5;FH.targets.forEach(o=>o.dead=true)}
    },
    tap(x,y){},
    draw(){
      const m=minDim,w=COLS[FH.want];
      for(const t of FH.targets){
        if(t.dead)continue;
        const pulse=1+Math.sin(t.age*8)*0.04,rr=t.r*pulse;
        ctx.beginPath();ctx.arc(t.x,t.y+rr*0.1,rr,0,6.29);ctx.fillStyle='rgba(20,69,107,.25)';ctx.fill();
        ctx.beginPath();ctx.arc(t.x,t.y,rr,0,6.29);ctx.fillStyle=COLS[t.ci].h;ctx.fill();
        ctx.lineWidth=m*0.008;ctx.strokeStyle='#fff';ctx.stroke();
        ctx.beginPath();ctx.ellipse(t.x-rr*0.3,t.y-rr*0.35,rr*0.28,rr*0.16,-0.6,0,6.29);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
      }
      // thanh gọi màu
      const pw=Math.min(W*0.7,m*0.8),ph=m*0.13,px=W/2-pw/2,py=TOPY();
      panel(px,py,pw,ph,m*0.035,'rgba(255,255,255,.92)',w.h,m*0.01);
      ctx.beginPath();ctx.arc(px+ph*0.55,py+ph/2,ph*0.3,0,6.29);ctx.fillStyle=w.h;ctx.fill();
      ctx.fillStyle='#14456B';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='800 '+Math.round(ph*0.46)+"px 'Baloo 2',sans-serif";ctx.fillText('Đập màu '+w.n+'!',W/2+ph*0.25,py+ph*0.54);
      bar(px,py+ph+m*0.012,pw,m*0.014,FH.pause>0?1:FH.t/FH.limit,FH.t/FH.limit<0.3?'#FF4D5E':w.h);
      if(FH.msgT>0)lblText(FH.msg,W/2,H*0.5,m*0.06,'#fff');
      drawPtrs('✋');
    },
  });
})();

/* ============================================================
   CẮT TRÁI CÂY — vung tay thật nhanh để cắt trái cây bay lên; đừng cắt quả ớt 🌶️
   ============================================================ */
(function(){
  const SL={objs:[],halves:[],slices:0,need:10,spawnT:0,trails:{}};
  const FRUITS=['🍉','🍊','🍎','🍍','🍓','🍇','🥝','🍋'];
  const spawn=()=>{
    const m=minDim,x=rand(0.2,0.8)*W,bad=Math.random()<lerp(0.06,0.2,lvlT());
    SL.objs.push({x,y:H+m*0.1,vx:(W/2-x)*rand(0.15,0.45),vy:-m*rand(1.35,1.85),e:bad?'🌶️':pick(FRUITS),bad,r:m*0.075,rot:rand(0,6.28),vr:rand(-4,4),done:false});
  };
  registerGame({
    id:'slice',name:'Cắt Trái Cây',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:2},
    intro:'Vung tay thật nhanh để cắt trái cây bay lên — đừng cắt quả ớt cay nhé!',go:'Cắt nào! 🔪',dbg:()=>SL,
    begin(){hearts=heartsMax=3;SL.objs=[];SL.halves=[];SL.slices=0;SL.need=8+level;SL.spawnT=0.5},
    hud(){return {score:SL.slices+'/'+SL.need,icon:'🍉',hearts:[hearts,heartsMax]}},
    update(dt){
      const m=minDim;
      SL.spawnT-=dt;
      if(SL.spawnT<=0){const n=Math.random()<lerp(0.15,0.5,lvlT())?2:1;for(let i=0;i<n;i++)spawn();SL.spawnT=lerp(1.2,0.6,lvlT())*rand(0.8,1.2)}
      for(let i=SL.objs.length-1;i>=0;i--){
        const o=SL.objs[i];o.vy+=m*1.9*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.rot+=o.vr*dt;
        if(o.y>H+m*0.2&&o.vy>0){SL.objs.splice(i,1);continue}
        if(o.done||o.y>H)continue;
        if(touchedBy(o.x,o.y,o.r,{minSpeed:0.5,swipe:true}).hit){
          o.done=true;SL.objs.splice(i,1);
          if(o.bad){sBuzz();burstAt(o.x,o.y,'#E14D5B',14);floatAt(o.x,o.y,'🔥',true);loseHeart();if(state!=='play')return}
          else{
            SL.slices++;sPop(true);burstAt(o.x,o.y,'#FFD84D',16);floatAt(o.x,o.y-o.r,'+1');
            SL.halves.push({x:o.x,y:o.y,vx:o.vx-m*0.35,vy:o.vy,e:o.e,rot:o.rot,vr:-3,side:0,t:0},{x:o.x,y:o.y,vx:o.vx+m*0.35,vy:o.vy,e:o.e,rot:o.rot,vr:3,side:1,t:0});
            if(SL.slices>=SL.need){levelUp();return}
          }
        }
      }
      for(let i=SL.halves.length-1;i>=0;i--){const h=SL.halves[i];h.t+=dt;h.vy+=m*1.9*dt;h.x+=h.vx*dt;h.y+=h.vy*dt;h.rot+=h.vr*dt;if(h.y>H+m*0.2||h.t>1.6)SL.halves.splice(i,1)}
    },
    tap(){},
    draw(){
      const m=minDim;
      for(const o of SL.objs){
        if(o.bad){ctx.beginPath();ctx.arc(o.x,o.y,o.r*1.1,0,6.29);ctx.fillStyle='rgba(225,77,91,.25)';ctx.fill()}
        emo(o.e,o.x,o.y,o.r*2.1,o.rot);
      }
      for(const h of SL.halves){
        ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.rot);
        ctx.beginPath();const s=m*0.16;
        if(h.side===0)ctx.rect(-s,-s,s,s*2);else ctx.rect(0,-s,s,s*2);
        ctx.clip();ctx.globalAlpha=Math.max(0,1-h.t/1.6);
        ctx.font=Math.round(m*0.15)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(h.e,0,0);
        ctx.restore();
      }
      // vệt kiếm: nối các điểm gần nhất của từng con trỏ
      if(useAI)for(const p of Ptr.list()){
        const tr=SL.trails[p.key]||(SL.trails[p.key]=[]);
        tr.push({x:p.x,y:p.y,t:performance.now()});
        while(tr.length&&performance.now()-tr[0].t>260)tr.shift();
        if(tr.length>1){ctx.beginPath();ctx.moveTo(tr[0].x,tr[0].y);for(const q of tr)ctx.lineTo(q.x,q.y);ctx.lineWidth=m*0.014;ctx.lineCap='round';ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke()}
      }
      drawPtrs('✋',m*0.06);
    },
  });
})();

/* ============================================================
   ĐẬP CHUỘT — chuột chui lên thì đập, thỏ chui lên thì đừng đập
   ============================================================ */
(function(){
  const WH={holes:[],hits:0,need:8,spawnT:0};
  const holePos=()=>{
    const m=minDim,out=[],cols=3,rows=3,gx=m*0.3,gy=m*0.21,x0=W/2-gx,y0=H*0.34;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out.push({x:x0+c*gx,y:y0+r*gy+(c===1?-m*0.015:0)});
    return out;
  };
  registerGame({
    id:'whack',name:'Đập Chuột',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:2},
    intro:'Chuột chui lên thì đập thật nhanh, nhưng đừng đập bạn thỏ nhé!',go:'Đập chuột nào! 🔨',dbg:()=>WH,
    begin(){
      hearts=heartsMax=3;WH.hits=0;WH.need=8+Math.floor(level*0.7);WH.spawnT=0.4;
      WH.holes=holePos().map(p=>({x:p.x,y:p.y,up:0,life:1,kind:'mouse',hit:0,wait:0}));
    },
    hud(){return {score:WH.hits+'/'+WH.need,icon:'🐭',hearts:[hearts,heartsMax]}},
    update(dt){
      const m=minDim,r=m*0.1;
      WH.spawnT-=dt;
      const active=WH.holes.filter(h=>h.up>0).length,maxAct=1+Math.floor(lvlT()*2.4);
      if(WH.spawnT<=0&&active<maxAct){
        const free=WH.holes.filter(h=>h.up<=0&&h.hit<=0);
        if(free.length){
          const h=pick(free);h.kind=Math.random()<lerp(0.12,0.3,lvlT())?'bunny':'mouse';h.life=lerp(1.7,0.95,lvlT());h.up=h.life;h.hit=0;
        }
        WH.spawnT=lerp(0.9,0.45,lvlT())*rand(0.8,1.2);
      }
      for(const h of WH.holes){
        if(h.hit>0)h.hit-=dt;
        if(h.up<=0)continue;
        h.up-=dt;
        if(h.up>0&&h.up<h.life-0.2&&touchedBy(h.x,h.y-m*0.05,r,{minSpeed:0.3}).hit){
          h.up=0;h.hit=0.45;
          if(h.kind==='mouse'){WH.hits++;sPop(false);burstAt(h.x,h.y,'#FFD84D',14);floatAt(h.x,h.y-m*0.12,'+1');if(WH.hits>=WH.need){levelUp();return}}
          else{sBuzz();floatAt(h.x,h.y-m*0.12,'😢',true);loseHeart();if(state!=='play')return}
        }
      }
    },
    tap(){},
    draw(){
      const m=minDim;
      for(const h of WH.holes){
        // hố đất
        ctx.fillStyle='rgba(70,40,15,.55)';ctx.beginPath();ctx.ellipse(h.x,h.y+m*0.045,m*0.105,m*0.04,0,0,6.29);ctx.fill();
        if(h.up>0||h.hit>0){
          const phase=h.hit>0?0.2:Math.min(1,Math.min((h.life-h.up)/0.18,h.up/0.2));
          ctx.save();
          ctx.beginPath();ctx.rect(h.x-m*0.14,h.y-m*0.2,m*0.28,m*0.2+m*0.045);ctx.clip();
          emo(h.hit>0?'💫':h.kind==='mouse'?'🐭':'🐰',h.x,h.y+m*0.045-phase*m*0.1,m*0.17);
          ctx.restore();
        }
        ctx.fillStyle='rgba(120,75,30,.9)';ctx.beginPath();ctx.ellipse(h.x,h.y+m*0.05,m*0.11,m*0.032,0,0,3.15);ctx.fill();
      }
      drawPtrs('🔨',m*0.07);
    },
  });
})();

/* ============================================================
   BONG BÓNG CHỮ CÁI — chạm vào bong bóng chứa đúng chữ để ghép thành từ
   ============================================================ */
(function(){
  const WORDS=[
    ['BA','👨'],['MẸ','👩'],['BÉ','👶'],['CÁ','🐟'],['GÀ','🐔'],['BÒ','🐮'],['XE','🚗'],['VỊT','🦆'],['HEO','🐷'],['CHÓ','🐶'],['MÈO','🐱'],['THỎ','🐰'],
    ['HOA','🌸'],['NHÀ','🏠'],['TÁO','🍎'],['CAM','🍊'],['SAO','⭐'],['MƯA','🌧️'],['CÂY','🌳'],['VOI','🐘'],['KHỈ','🐵'],['ẾCH','🐸'],['RÙA','🐢'],
    ['BÓNG','⚽'],['SÁCH','📖'],['TRĂNG','🌙'],['NẮNG','☀️'],['CHUỐI','🍌'],
  ].map(w=>[w[0].normalize('NFC'),w[1]]);
  const LB={word:null,emoji:'',idx:0,bubbles:[],done:0,need:3,flash:0,wordT:0,spawnT:0,pool:[]};
  const ALPHA='ABCĐEGHIKLMNOPQRSTUVXY'.split('');
  const maxLen=()=>level<9?3:level<19?4:5;
  function newWord(){
    const cands=WORDS.filter(w=>[...w[0]].length<=maxLen()&&(level<9||[...w[0]].length>=3||Math.random()<0.3));
    let w;do{w=pick(cands.length?cands:WORDS)}while(LB.word&&w[0]===LB.word&&cands.length>1);
    LB.word=w[0];LB.emoji=w[1];LB.idx=0;LB.letters=[...w[0]];LB.bubbles=[];LB.wordT=0;
    Voice.say(w[0].toLowerCase());
  }
  function spawn(letter){
    const m=minDim;
    LB.bubbles.push({x:rand(0.12,0.88)*W,y:H+m*0.12,vy:-m*rand(0.1,0.18)*lerp(1,1.6,lvlT()),r:m*0.085,L:letter,col:pick(['#FF6B9A','#FFB13D','#3BC9A9','#5AA9FF','#B983FF']),ph:rand(0,6.28),shake:0});
  }
  registerGame({
    id:'letters',name:'Bong Bóng Chữ Cái',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:2},
    intro:'Chạm vào bong bóng có đúng chữ cái để ghép thành từ nhé!',go:'Chạm bong bóng nào! 🔤',dbg:()=>LB,
    begin(){hearts=heartsMax=3;LB.done=0;LB.need=3+Math.floor(level/6);LB.spawnT=0;LB.word=null;newWord()},
    hud(){return {score:LB.done+'/'+LB.need,icon:'🔤',hearts:[hearts,heartsMax]}},
    update(dt){
      const m=minDim;
      LB.flash=Math.max(0,LB.flash-dt);
      LB.spawnT-=dt;
      const want=LB.letters[LB.idx];
      if(want===undefined){   // vừa ghép xong từ, đang chờ sang từ mới
        for(const b of LB.bubbles)b.y+=b.vy*dt;
        return;
      }
      if(LB.spawnT<=0){
        const hasWant=LB.bubbles.some(b=>b.L===want);
        const total=Math.min(9,5+Math.floor(lvlT()*4));
        if(LB.bubbles.length<total){spawn(hasWant||Math.random()<0.55?pick(Math.random()<0.5?LB.letters.concat(ALPHA):ALPHA):want)}
        LB.spawnT=lerp(0.8,0.5,lvlT());
      }
      if(!LB.bubbles.some(b=>b.L===want)&&LB.bubbles.length<12)spawn(want);
      const touched=[];
      for(let i=LB.bubbles.length-1;i>=0;i--){
        const b=LB.bubbles[i];b.y+=b.vy*dt;b.x+=Math.sin(performance.now()/700+b.ph)*m*0.03*dt;b.shake=Math.max(0,b.shake-dt);
        if(b.y<-m*0.15){LB.bubbles.splice(i,1);continue}
        const tb=touchedBy(b.x,b.y,b.r*0.85);
        if(tb.hit)touched.push({b,sp:tb.sp});
      }
      if(touched.length){
        // chạm nhiều bong bóng cùng lúc → ưu tiên quả đúng chữ; chữ sai chỉ tính khi tay vung nhanh (tay rũ không bị phạt)
        const good=touched.find(t=>t.b.L===want),t=good||touched.find(t=>t.sp>=0.3);
        if(t){
          const b=t.b;LB.bubbles.splice(LB.bubbles.indexOf(b),1);
          if(b.L===want){
            LB.idx++;sPop(false);burstAt(b.x,b.y,b.col,14);floatAt(b.x,b.y,b.L);
            if(LB.idx>=LB.letters.length){
              LB.done++;LB.flash=0.9;sFanfare();Voice.say(LB.word.toLowerCase());
              if(LB.done>=LB.need){setTimeout(()=>{if(state==='play'&&mode==='letters')levelUp()},700);LB.idx=LB.letters.length}
              else setTimeout(()=>{if(state==='play'&&mode==='letters')newWord()},900);
            }
          }else{sBuzz();burstAt(b.x,b.y,'#B0B8C4',8);floatAt(b.x,b.y,'✗',true);loseHeart();if(state!=='play')return}
        }
      }
    },
    tap(){},
    draw(){
      const m=minDim;
      for(const b of LB.bubbles){
        ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.29);ctx.fillStyle=hexA(b.col,0.8);ctx.fill();
        ctx.lineWidth=m*0.007;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.stroke();
        ctx.beginPath();ctx.ellipse(b.x-b.r*0.35,b.y-b.r*0.42,b.r*0.26,b.r*0.16,-0.6,0,6.29);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fill();
        ctx.fillStyle='#fff';ctx.font='800 '+Math.round(b.r*1.15)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.lineWidth=m*0.006;ctx.strokeStyle='rgba(20,69,107,.55)';ctx.strokeText(b.L,b.x,b.y+b.r*0.05);ctx.fillText(b.L,b.x,b.y+b.r*0.05);
      }
      // bảng từ cần ghép
      const n=LB.letters?LB.letters.length:0;
      if(n){
        const cw=m*0.085,pw=Math.max(m*0.5,n*cw+m*0.28),ph=m*0.14,px=W/2-pw/2,py=TOPY();
        panel(px,py,pw,ph,m*0.035,LB.flash>0?'rgba(200,255,220,.96)':'rgba(255,255,255,.92)',LB.flash>0?'#35E08B':'#8B6FEA',m*0.008);
        emo(LB.emoji,px+m*0.1,py+ph/2,m*0.09);
        LB.letters.forEach((c,i)=>{
          const x=px+m*0.2+i*cw+cw/2;
          ctx.fillStyle=i<LB.idx?'#14456B':'rgba(20,69,107,.25)';
          ctx.font='800 '+Math.round(ph*0.5)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(i<LB.idx?c:'_',x,py+ph*0.55);
        });
      }
      drawPtrs('👆',m*0.06);
    },
  });
})();

/* ============================================================
   TRỐNG TRÊN KHÔNG — gõ vào các trống bằng hai tay; làm theo trống đang sáng để qua cấp
   ============================================================ */
(function(){
  const DR={pads:[],lit:-1,hits:0,need:8,t:0,last:{},combo:0};
  const PADS=[
    {id:'hat',n:'Chũm chọe',x:0.17,y:0.46,c:'#FFB13D',k:'hat'},
    {id:'snare',n:'Trống con',x:0.34,y:0.66,c:'#FF6B9A',k:'snare'},
    {id:'tom1',n:'Trống cao',x:0.5,y:0.44,c:'#3BC9A9',k:'tom1'},
    {id:'tom2',n:'Trống trầm',x:0.66,y:0.66,c:'#5AA9FF',k:'tom2'},
    {id:'crash',n:'Cymbal',x:0.83,y:0.46,c:'#B983FF',k:'crash'},
  ];
  const padR=()=>minDim*0.1;
  function nextLit(){let n;do{n=(Math.random()*PADS.length)|0}while(n===DR.lit);DR.lit=n;DR.t=0}
  registerGame({
    id:'drums',name:'Trống Trên Không',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:2},music:false,
    intro:'Gõ vào các trống bằng hai tay. Gõ trống đang sáng để ghi điểm!',go:'Gõ trống nào! 🥁',dbg:()=>DR,
    begin(){hearts=heartsMax=3;DR.hits=0;DR.need=8+level;DR.combo=0;DR.last={};nextLit()},
    hud(){return {score:DR.hits+'/'+DR.need,icon:'🥁'}},
    update(dt){
      DR.t+=dt;
      const m=minDim;
      PADS.forEach((p,i)=>{
        const cx=p.x*W,cy=p.y*H,hit=touchedBy(cx,cy,padR()*0.9).hit;
        const was=DR.last[p.id];DR.last[p.id]=hit;
        p.glow=Math.max(0,(p.glow||0)-dt*3);
        if(hit&&!was){
          Drum.hit(p.k);p.glow=1;burstAt(cx,cy,p.c,10);
          if(i===DR.lit){
            DR.hits++;DR.combo++;floatAt(cx,cy-padR(),DR.t<1?'+1 ⚡':'+1');sPop(false);
            if(DR.hits>=DR.need){levelUp();return}
            nextLit();
          }else DR.combo=0;
        }
      });
    },
    tap(){},
    draw(){
      const m=minDim,r=padR();
      PADS.forEach((p,i)=>{
        const cx=p.x*W,cy=p.y*H,lit=i===DR.lit,sc=1+(p.glow||0)*0.12+(lit?Math.sin(frame*0.2)*0.03:0);
        ctx.beginPath();ctx.arc(cx,cy+r*0.12,r*sc,0,6.29);ctx.fillStyle='rgba(20,69,107,.3)';ctx.fill();
        ctx.beginPath();ctx.arc(cx,cy,r*sc,0,6.29);ctx.fillStyle=hexA(p.c,lit||p.glow>0?0.98:0.72);ctx.fill();
        ctx.lineWidth=lit?m*0.014:m*0.007;ctx.strokeStyle=lit?'#fff':'rgba(255,255,255,.7)';ctx.stroke();
        ctx.beginPath();ctx.arc(cx,cy,r*0.45*sc,0,6.29);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=m*0.006;ctx.stroke();
        lblText(p.n,cx,cy+r+m*0.04,m*0.03,'#fff');
      });
      if(DR.combo>=3)lblText('Combo x'+DR.combo+'!',W/2,m*0.12,m*0.05,'#FFE98A');
      drawPtrs('🥢',m*0.07);
    },
  });
})();

/* ============================================================
   THỦ MÔN NHÍ — bóng sút tới khung thành, vươn tay ra chặn lại
   ============================================================ */
(function(){
  const GK={balls:[],saves:0,need:5,spawnT:0,gloves:[],conceded:0,flash:0};
  const f=z=>z*z;
  const ballPos=b=>({x:lerp(W/2,b.tx,f(b.z)),y:lerp(H*0.36,b.ty,f(b.z)),s:minDim*(0.04+0.17*f(b.z))});
  const travel=()=>lerp(2.3,1.15,lvlT());
  function shoot(){
    const m=minDim;
    GK.balls.push({z:0.02,tx:rand(0.18,0.82)*W,ty:rand(0.5,0.84)*H,done:false,out:0,dx:0,dy:0});
  }
  registerGame({
    id:'keeper',name:'Thủ Môn Nhí',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Bóng sút tới khung thành! Vươn hai tay ra chặn bóng lại nhé!',go:'Bắt bóng nào! 🧤',dbg:()=>GK,
    begin(){hearts=heartsMax=3;GK.balls=[];GK.saves=0;GK.need=5+Math.floor(level/2);GK.spawnT=0.8;GK.flash=0},
    hud(){return {score:GK.saves+'/'+GK.need,icon:'🧤',hearts:[hearts,heartsMax]}},
    update(dt){
      GK.flash=Math.max(0,GK.flash-dt);
      GK.spawnT-=dt;
      if(GK.spawnT<=0){shoot();GK.spawnT=lerp(1.8,0.95,lvlT())*rand(0.85,1.2)}
      for(let i=GK.balls.length-1;i>=0;i--){
        const b=GK.balls[i];
        if(b.done){b.out+=dt;b.dxp=(b.dxp||0)+b.dx*dt;b.dyp=(b.dyp||0)+b.dy*dt;if(b.out>0.8)GK.balls.splice(i,1);continue}
        b.z+=dt/travel();
        const p=ballPos(b);
        if(b.z>=0.68&&touchedBy(p.x,p.y,p.s*0.7).hit){
          b.done=true;b.out=0;b.dx=(p.x-W/2)*2+rand(-200,200);b.dy=-minDim*0.8;GK.saves++;sPop(true);floatAt(p.x,p.y-p.s,'Bắt được! 🧤');
          if(GK.saves>=GK.need){levelUp();return}
        }else if(b.z>=1.0){
          b.done=true;b.out=0;b.dx=0;b.dy=0;b.missed=true;sBuzz();GK.flash=0.4;floatAt(p.x,p.y-p.s,'⚽ Vào lưới!',true);loseHeart();if(state!=='play')return;
        }
      }
    },
    tap(){},
    draw(){
      const m=minDim;
      // khung thành
      const gl=W*0.1,gr=W*0.9,gt=H*0.3,gb=H*0.9;
      ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=m*0.014;ctx.lineJoin='round';
      ctx.strokeRect(gl,gt,gr-gl,gb-gt);
      ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;
      for(let x=gl;x<=gr;x+=(gr-gl)/14){ctx.beginPath();ctx.moveTo(x,gt);ctx.lineTo(x,gb);ctx.stroke()}
      for(let y=gt;y<=gb;y+=(gb-gt)/9){ctx.beginPath();ctx.moveTo(gl,y);ctx.lineTo(gr,y);ctx.stroke()}
      for(const b of GK.balls){
        const p=ballPos(b);
        if(b.done&&!b.missed){emo('⚽',p.x+(b.dxp||0),p.y+(b.dyp||0),p.s*2,b.out*8,Math.max(0,1-b.out/0.8))}
        else if(b.done)emo('⚽',p.x,p.y,p.s*2,0,Math.max(0,1-b.out/0.8));
        else emo('⚽',p.x,p.y,p.s*2,b.z*14);
      }
      if(GK.flash>0){ctx.fillStyle='rgba(255,70,90,'+(GK.flash*0.3).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      drawPtrs('🧤',m*0.09);
    },
  });
})();
