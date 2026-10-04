'use strict';
/* ============================================================
   games-run2.js — Thỏ Đố Vui (nhảy / cúi để chọn đáp án), Lướt Sóng (nghiêng người chọn làn),
                   Đám Đông Chạy (bước sang trái / phải chọn cổng tốt hơn)
   ============================================================ */

/* ============================================================
   THỎ ĐỐ VUI — câu hỏi trên cổng, NHẢY chọn đáp án trên, CÚI chọn đáp án dưới
   ============================================================ */
(function(){
  const QZ={sg:null,q:null,gx:0,v:0,state:'wait',t:0,passed:0,need:4,msg:'',msgT:0,chosen:-1,res:'',scroll:0,lastTopic:'',touch:null,hop:0,live:-1};
  const topics=()=>{
    const t=['count','color','animal'];
    if(level>=6)t.push('shape','math');
    if(level>=13)t.push('space','letter');
    return t;
  };
  const travelSec=()=>lerp(5.2,3.4,lvlT());
  function ask(){
    let tp;do{tp=pick(topics())}while(tp===QZ.lastTopic&&topics().length>1);
    QZ.lastTopic=tp;QZ.q=QUIZ.make(tp,2,level);
    QZ.gx=W*1.1;QZ.v=(QZ.gx-W*0.26)/travelSec();QZ.state='come';QZ.chosen=-1;QZ.res='';QZ.touch=null;QZ.live=-1;
    Voice.say(QZ.q.say);
  }
  function judge(){
    const now=performance.now(),sig=QZ.sg;
    let pick1=-1;
    if(camOn){
      const j=now-sig.jumpAt<800,d=now-sig.duckAt<800;
      if(j&&(!d||sig.jumpAt>=sig.duckAt))pick1=0;else if(d)pick1=1;
    }else if(QZ.touch!==null)pick1=QZ.touch;
    QZ.chosen=pick1;QZ.state='result';QZ.t=1.5;
    if(pick1===QZ.q.correct){
      QZ.res='ok';QZ.passed++;QZ.hop=0.6;QZ.msg='Giỏi quá! 🎉';sPop(true);burstAt(W*0.26,H*0.6,'#FFD84D',22);
      if(QZ.passed>=QZ.need)setTimeout(()=>{if(state==='play'&&mode==='quiz')levelUp()},900);
    }else{
      QZ.res='bad';QZ.msg=pick1<0?'Chưa chọn — đáp án là “'+QZ.q.options[QZ.q.correct].text+'”':'Chưa đúng — đáp án là “'+QZ.q.options[QZ.q.correct].text+'”';
      sBuzz();loseHeart();
    }
    QZ.msgT=1.4;
  }
  registerGame({
    id:'quiz',name:'Thỏ Đố Vui',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Đọc câu hỏi: NHẢY lên để chọn đáp án trên, CÚI xuống để chọn đáp án dưới!',go:'Chạy và trả lời nào! 🐰',
    dbg:()=>QZ,
    start(){QZ.sg=Sig.make('solo');QZ.lastTopic=''},
    begin(){hearts=heartsMax=3;QZ.passed=0;QZ.need=4+Math.floor(level/4);QZ.state='wait';QZ.t=1.0;QZ.q=null;QZ.hop=0;QZ.msgT=0},
    hud(){return {score:QZ.passed+'/'+QZ.need,icon:'🧠',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=QZ.sg.update(dt),now=performance.now();
      QZ.scroll+=minDim*0.45*dt;QZ.hop=Math.max(0,QZ.hop-dt);QZ.msgT=Math.max(0,QZ.msgT-dt);
      QZ.live=now-sg.jumpAt<450&&sg.jumpAt>=sg.duckAt?0:(now-sg.duckAt<450?1:-1);
      if(QZ.state==='wait'){QZ.t-=dt;if(QZ.t<=0)ask()}
      else if(QZ.state==='come'){QZ.gx-=QZ.v*dt;if(QZ.gx<=W*0.26+minDim*0.02)judge()}
      else if(QZ.state==='result'){QZ.t-=dt;QZ.gx-=minDim*0.9*dt;if(QZ.t<=0&&state==='play'&&QZ.res!=='ok'){QZ.state='wait';QZ.t=0.3}else if(QZ.t<=0&&QZ.passed<QZ.need){QZ.state='wait';QZ.t=0.3}}
    },
    tap(x,y){if(QZ.state==='come')QZ.touch=y<0.55?0:1},
    draw(){
      const m=minDim,gy=H*0.8,hx=W*0.26,q=QZ.q;
      ctx.fillStyle='rgba(255,230,160,.18)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#8FD07A';ctx.fillRect(0,gy,W,H-gy);
      ctx.fillStyle='#5DB04C';ctx.fillRect(0,gy,W,m*0.014);
      drift(['☁️','🌳','☁️','🌷'],0.2,QZ.scroll,H*0.16,m*0.12);
      // nhân vật
      const hopY=QZ.hop>0?Math.sin((1-QZ.hop/0.6)*Math.PI)*m*0.18:0;
      const live=QZ.live;
      ctx.save();ctx.translate(hx,gy-hopY);
      if(live===1&&QZ.state==='come')ctx.scale(1.15,0.6);
      ctx.font=Math.round(m*0.2)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
      if(live===0&&QZ.state==='come')ctx.translate(0,-m*0.12);
      ctx.fillText('🐰',0,-m*0.02);ctx.restore();
      if(!q)return;
      // bảng câu hỏi (cố định phía trên)
      const pw=Math.min(W*0.8,m*0.9),ph=m*0.18,px=W/2-pw/2,py=TOPY();
      panel(px,py,pw,ph,m*0.035,'rgba(255,255,255,.92)','#8B6FEA',m*0.007);
      ctx.fillStyle='#14456B';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='800 '+Math.round(ph*0.3)+"px 'Baloo 2',sans-serif";
      ctx.fillText(q.prompt,W/2,py+ph*0.26);
      if(q.swatch){ctx.beginPath();ctx.arc(W/2,py+ph*0.68,ph*0.19,0,6.29);ctx.fillStyle=q.swatch;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#14456B';ctx.stroke()}
      else if(q.art){ctx.font=Math.round(ph*0.4*(q.artSize||1))+'px sans-serif';ctx.fillStyle='#000';ctx.fillText(q.art,W/2,py+ph*0.68)}
      // cổng đáp án
      const gx=QZ.gx,bw=m*0.34,bh=m*0.17;
      ctx.fillStyle='#8A5A2B';ctx.fillRect(gx-bw/2-m*0.012,gy-m*0.58,m*0.024,m*0.58);ctx.fillRect(gx+bw/2-m*0.012,gy-m*0.58,m*0.024,m*0.58);
      [0,1].forEach(i=>{
        const cy=i===0?gy-m*0.43:gy-m*0.17;
        const sel=QZ.chosen===i,live2=QZ.state==='come'&&QZ.live===i;
        let fill='rgba(255,255,255,.95)',stroke=i===0?'#3C9BFF':'#FF8A3D';
        if(QZ.state==='result'){
          if(i===q.correct){fill='rgba(190,255,210,.97)';stroke='#35E08B'}
          else if(sel){fill='rgba(255,205,205,.97)';stroke='#E14D5B'}
        }else if(live2){fill='rgba(255,246,190,.98)'}
        panel(gx-bw/2,cy-bh/2,bw,bh,m*0.03,fill,stroke,m*0.008);
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(bh*0.42)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(q.options[i].text,gx,cy+bh*0.04);
        ctx.font=Math.round(bh*0.28)+'px sans-serif';ctx.fillText(i===0?'⬆️':'⬇️',gx-bw/2+bh*0.28,cy-bh*0.28);
      });
      if(QZ.msgT>0)lblText(QZ.msg,W/2,H*0.5,m*0.05,QZ.res==='ok'?'#FFE98A':'#fff');
    },
  });
})();

/* ============================================================
   LƯỚT SÓNG — nghiêng người / bước sang trái-phải để chọn làn, nhặt sao, né đá
   ============================================================ */
(function(){
  const SF={sg:null,lane:1,vis:1,obs:[],stars:0,need:6,spawnT:0,inv:0,flash:0,scroll:0,lastRockLane:-1};
  const f=z=>z*z;                                   // phép chiếu phối cảnh: càng gần càng lớn
  const laneX=(lane,z)=>W/2+(lane-1)*W*0.30*(0.2+0.8*f(z));
  const zY=z=>H*0.42+(H*0.84-H*0.42)*f(z);
  const zS=z=>0.18+0.82*f(z);
  const speed=()=>lerp(0.34,0.62,lvlT());
  function spawn(){
    const lane=(Math.random()*3)|0;
    const rock=Math.random()<lerp(0.5,0.65,lvlT());
    SF.obs.push({lane,z:0.02,kind:rock?'rock':'star',done:false});
    if(rock&&Math.random()<0.4){      // đôi khi chặn hai làn, chừa đúng một làn trống
      const l2=(lane+1+((Math.random()*2)|0))%3;SF.obs.push({lane:l2,z:0.02,kind:'rock',done:false});
    }
  }
  registerGame({
    id:'surf',name:'Lướt Sóng',needs:'pose',motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Nghiêng người hoặc bước sang trái, phải để lướt trên sóng: nhặt sao ⭐, né đá nhé!',go:'Lướt sóng nào! 🏄',
    dbg:()=>SF,
    start(){SF.sg=Sig.make('solo')},
    begin(){hearts=heartsMax=3;SF.obs=[];SF.stars=0;SF.need=5+Math.floor(level/3);SF.spawnT=0.8;SF.inv=0;SF.flash=0;SF.lane=1;SF.vis=1;if(SF.sg)SF.sg.x0=null},
    hud(){return {score:SF.stars+'/'+SF.need,icon:'⭐',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=SF.sg.update(dt);
      if(camOn&&useAI){
        const d=sg.lean(dt);
        if(SF.lane===1){if(d<-0.08)SF.lane=0;else if(d>0.08)SF.lane=2}
        else if(SF.lane===0){if(d>-0.04)SF.lane=1}
        else if(d<0.04)SF.lane=1;
      }
      SF.vis+=(SF.lane-SF.vis)*Math.min(1,dt*10);
      SF.scroll+=dt;SF.inv=Math.max(0,SF.inv-dt);SF.flash=Math.max(0,SF.flash-dt);
      SF.spawnT-=dt;if(SF.spawnT<=0){spawn();SF.spawnT=lerp(1.15,0.62,lvlT())*rand(0.85,1.2)}
      for(let i=SF.obs.length-1;i>=0;i--){
        const o=SF.obs[i];o.z+=speed()*dt;
        if(o.z>1.1){SF.obs.splice(i,1);continue}
        if(!o.done&&o.z>=0.82&&o.z<=0.96&&o.lane===SF.lane){
          o.done=true;
          if(o.kind==='star'){SF.stars++;sPop(true);floatAt(laneX(o.lane,o.z),zY(o.z)-minDim*0.1,'+1⭐');
            if(SF.stars>=SF.need){levelUp();return}}
          else if(SF.inv<=0){SF.inv=1.3;SF.flash=0.4;sBuzz();floatAt(laneX(o.lane,o.z),zY(o.z)-minDim*0.1,'💦',true);loseHeart();if(state!=='play')return}
        }
      }
    },
    tap(x,y){SF.lane=x<0.34?0:x>0.66?2:1},
    draw(){
      const m=minDim,hz=H*0.42;
      // biển
      const g=ctx.createLinearGradient(0,hz,0,H);g.addColorStop(0,'rgba(90,200,255,.45)');g.addColorStop(1,'rgba(20,110,210,.55)');
      ctx.fillStyle=g;ctx.fillRect(0,hz,W,H-hz);
      ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(0,0,W,hz);
      emo('☀️',W*0.82,hz*0.45,m*0.12);emo('🌴',W*0.1,hz-m*0.04,m*0.13);emo('🌴',W*0.92,hz-m*0.04,m*0.1);
      // đường làn
      ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=3;
      [0.5,1.5].forEach(l=>{ctx.beginPath();ctx.moveTo(W/2+(l-1)*W*0.30*0.2,hz);ctx.lineTo(W/2+(l-1)*W*0.30,H*0.84);ctx.stroke()});
      // sóng bọt
      ctx.fillStyle='rgba(255,255,255,.35)';
      for(let i=0;i<7;i++){const z=((SF.scroll*0.5+i/7)%1),y=zY(z),w=W*(0.15+0.7*f(z));ctx.fillRect(W/2-w/2,y,w,Math.max(2,m*0.01*zS(z)))}
      // vật thể (xa → gần)
      const list=SF.obs.slice().sort((a,b)=>a.z-b.z);
      for(const o of list){
        const sz=m*0.2*zS(o.z);
        emo(o.kind==='star'?'⭐':'🪨',laneX(o.lane,o.z),zY(o.z)-sz*0.3,sz);
      }
      // người lướt sóng
      const hx=laneX(SF.vis,0.9),hy=zY(0.9),tilt=(SF.lane-SF.vis)*0.35;
      ctx.save();
      if(SF.inv>0&&((SF.inv*12)|0)%2===0)ctx.globalAlpha=0.4;
      emo('🏄',hx,hy-m*0.06,m*0.2,tilt);
      ctx.restore();
      if(SF.flash>0){ctx.fillStyle='rgba(255,70,90,'+(SF.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      // chỉ báo 3 làn
      [0,1,2].forEach(l=>{ctx.beginPath();ctx.arc(W/2+(l-1)*m*0.07,H-m*0.06,m*0.018,0,6.29);ctx.fillStyle=l===SF.lane?'#fff':'rgba(255,255,255,.4)';ctx.fill()});
      if(SF.stars===0&&level===1&&SF.scroll<5)lblText('⬅️ Bước / nghiêng sang trái – phải để đổi làn ➡️',W/2,H*0.3,m*0.045,'#fff');
    },
  });
})();

/* ============================================================
   ĐÁM ĐÔNG CHẠY — bước sang trái / phải để chọn cổng cho đám đông đông hơn
   ============================================================ */
(function(){
  const CR={sg:null,crowd:1,side:1,vis:1,gate:null,passed:0,need:5,state:'wait',t:0,msg:'',msgT:0,flash:0,scroll:0,good:null};
  const apply=(c,g)=>g.op==='+'?c+g.n:g.op==='−'?Math.max(1,c-g.n):c*g.n;
  const label=g=>(g.op==='×'?'×':g.op)+g.n;
  function makeGate(){
    const c=CR.crowd;
    for(let tries=0;tries<30;tries++){
      let a,b;
      if(level<7){
        a={op:'+',n:1+((Math.random()*9)|0)};b={op:'+',n:1+((Math.random()*9)|0)};
      }else if(level<15){
        a={op:'+',n:3+((Math.random()*10)|0)};b={op:'×',n:2+((Math.random()*2)|0)};
        if(Math.random()<0.5)[a,b]=[b,a];
      }else{
        const r=Math.random();
        if(r<0.35){a={op:'+',n:3+((Math.random()*12)|0)};b={op:'−',n:2+((Math.random()*6)|0)}}
        else if(r<0.7){a={op:'×',n:2};b={op:'×',n:3}}
        else{a={op:'+',n:5+((Math.random()*20)|0)};b={op:'×',n:2+((Math.random()*2)|0)}}
        if(Math.random()<0.5)[a,b]=[b,a];
      }
      const ra=apply(c,a),rb=apply(c,b);
      if(ra!==rb)return {opts:[a,b],res:[ra,rb],z:0.02,done:false};
    }
    return {opts:[{op:'+',n:2},{op:'+',n:1}],res:[c+2,c+1],z:0.02,done:false};
  }
  const speed=()=>lerp(0.26,0.5,lvlT());
  registerGame({
    id:'crowd',name:'Đám Đông Chạy',needs:'pose',motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Bước sang trái hoặc phải để chọn cổng giúp đám đông đông hơn nhé!',go:'Chạy chọn cổng nào! 🏃',
    dbg:()=>CR,
    start(){CR.sg=Sig.make('solo')},
    begin(){hearts=heartsMax=3;CR.crowd=1+Math.floor(level/2);CR.passed=0;CR.need=5+Math.floor(level/5);CR.gate=null;CR.state='wait';CR.t=0.9;CR.msgT=0;CR.flash=0;if(CR.sg)CR.sg.x0=null},
    hud(){return {score:CR.passed+'/'+CR.need,icon:'👥',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=CR.sg.update(dt);
      if(camOn&&useAI&&sg.ok){if(sg.x<0.46)CR.side=0;else if(sg.x>0.54)CR.side=1}   // đứng nửa trái / nửa phải màn hình = chọn cổng đó
      CR.vis+=(CR.side-CR.vis)*Math.min(1,dt*9);
      CR.scroll+=dt;CR.msgT=Math.max(0,CR.msgT-dt);CR.flash=Math.max(0,CR.flash-dt);
      if(CR.state==='wait'){CR.t-=dt;if(CR.t<=0){CR.gate=makeGate();CR.state='come'}}
      else if(CR.state==='come'){
        const g=CR.gate;g.z+=speed()*dt;
        if(g.z>=0.9&&!g.done){
          g.done=true;const pick1=CR.side,other=1-pick1,good=g.res[pick1]>g.res[other];
          CR.crowd=g.res[pick1];CR.good=good;
          if(good){CR.passed++;sPop(true);CR.msg='Chọn đúng! 🎉';burstAt(W*(0.3+0.4*CR.vis),H*0.72,'#FFD84D',20)}
          else{CR.msg='Cổng kia đông hơn! 😅';sBuzz();CR.flash=0.4;loseHeart()}
          CR.msgT=1.2;CR.state='result';CR.t=1.0;
          if(good&&CR.passed>=CR.need){setTimeout(()=>{if(state==='play'&&mode==='crowd')levelUp()},800)}
        }
      }else if(CR.state==='result'){
        CR.gate.z+=speed()*1.5*dt;CR.t-=dt;
        if(CR.t<=0&&CR.passed<CR.need){CR.state='wait';CR.t=0.2}
      }
    },
    tap(x){CR.side=x<0.5?0:1},
    draw(){
      const m=minDim,hz=H*0.3;
      ctx.fillStyle='rgba(120,160,255,.16)';ctx.fillRect(0,0,W,H);
      // con đường phối cảnh
      ctx.fillStyle='rgba(60,70,100,.55)';
      ctx.beginPath();ctx.moveTo(W*0.4,hz);ctx.lineTo(W*0.6,hz);ctx.lineTo(W*0.98,H);ctx.lineTo(W*0.02,H);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=4;ctx.setLineDash([m*0.05,m*0.04]);ctx.lineDashOffset=-(CR.scroll*m*0.3);
      ctx.beginPath();ctx.moveTo(W/2,hz);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
      // cổng
      const g=CR.gate;
      if(g){
        const f2=g.z*g.z,y=hz+(H*0.86-hz)*f2,sc=0.2+0.8*f2;
        g.opts.forEach((o,i)=>{
          const cx=W/2+(i===0?-1:1)*W*0.24*(0.25+0.75*f2),bw=W*0.4*sc*0.95,bh=m*0.22*sc*1.2;
          const col=o.op==='×'?'#FF8A3D':o.op==='−'?'#E14D5B':'#3C9BFF';
          let fill=hexA(col,0.92);
          if(CR.state==='result'&&g.done){const best=g.res[0]>g.res[1]?0:1;if(i===best)fill='rgba(60,210,120,.95)'}
          panel(cx-bw/2,y-bh,bw,bh,m*0.03*sc,fill,'#fff',Math.max(2,m*0.006*sc));
          ctx.fillStyle='#fff';ctx.font='800 '+Math.round(bh*0.62)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(label(o),cx,y-bh*0.48);
        });
      }
      // đám đông
      const cx=W/2+(CR.vis-0.5)*W*0.48,cy=H*0.84;
      const show=Math.min(40,CR.crowd);
      for(let i=0;i<show;i++){
        const a=i*2.399963,r=Math.sqrt(i)*m*0.026;
        emo('🧒',cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.55-m*0.03,m*0.07+Math.max(0,3-i)*m*0.01);
      }
      const tx=cx,ty=cy-Math.min(m*0.2,Math.sqrt(show)*m*0.05)-m*0.09;
      lblText('👥 '+CR.crowd,tx,ty,m*0.07,'#fff');
      if(CR.msgT>0)lblText(CR.msg,W/2,H*0.5,m*0.055,CR.good?'#FFE98A':'#fff');
      if(CR.flash>0){ctx.fillStyle='rgba(255,70,90,'+(CR.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      if(CR.passed===0&&level===1&&CR.scroll<6)lblText('⬅️ Bước sang trái / phải để chọn cổng lớn hơn ➡️',W/2,H*0.14,m*0.042,'#fff');
    },
  });
})();
