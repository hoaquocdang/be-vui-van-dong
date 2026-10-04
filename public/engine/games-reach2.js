'use strict';
/* ============================================================
   games-reach2.js — Pha Màu, Phân Loại Rác, Giơ Tay Trả Lời (cả nhà cùng chơi)
   ============================================================ */

/* ============================================================
   PHA MÀU — giữ tay trên hai hũ sơn để trộn ra màu được yêu cầu
   ============================================================ */
(function(){
  const POTS=[{k:'red',n:'Đỏ',h:'#FF4D5E',rgb:[255,77,94]},{k:'yellow',n:'Vàng',h:'#FFD84D',rgb:[255,216,77]},{k:'blue',n:'Xanh dương',h:'#3C9BFF',rgb:[60,155,255]},{k:'white',n:'Trắng',h:'#FFFFFF',rgb:[255,255,255]}];
  const RECIPES=[
    {n:'CAM',h:'#FF9F43',mix:['red','yellow'],lv:1},{n:'XANH LÁ',h:'#3BC97A',mix:['yellow','blue'],lv:1},{n:'TÍM',h:'#9B6BFF',mix:['red','blue'],lv:1},
    {n:'HỒNG',h:'#FF9EC4',mix:['red','white'],lv:6},{n:'XANH NHẠT',h:'#8FD3FF',mix:['blue','white'],lv:6},{n:'VÀNG NHẠT',h:'#FFF0A0',mix:['yellow','white'],lv:12},
  ];
  const CM={target:null,picks:[],dwell:{},t:0,limit:14,done:0,need:3,msg:'',msgT:0,res:null,resT:0,mixHex:'#ffffff',pause:0,last:''};
  const potPos=(i)=>({x:W*(0.17+i*0.22),y:H*0.5});
  const mixHex=(a,b)=>'rgb('+[0,1,2].map(i=>Math.round((a.rgb[i]+b.rgb[i])/2)).join(',')+')';
  function newTarget(){
    const pool=RECIPES.filter(r=>r.lv<=level);
    let r;do{r=pick(pool)}while(r.n===CM.last&&pool.length>1);
    CM.last=r.n;CM.target=r;CM.picks=[];CM.dwell={};CM.t=CM.limit;CM.res=null;CM.mixHex='#ffffff';
    Voice.say('Pha màu '+r.n.toLowerCase());
  }
  function finish(){
    const [a,b]=CM.picks.map(k=>POTS.find(p=>p.k===k));
    const ok=CM.target.mix.every(k=>CM.picks.includes(k))&&CM.picks[0]!==CM.picks[1];
    CM.resT=1.4;CM.mixHex=ok?CM.target.h:mixHex(a,b);
    if(ok){CM.res='ok';CM.done++;CM.msg='Giỏi quá! Đó là màu '+CM.target.n+' 🎉';sPop(true);burstAt(W/2,H*0.78,CM.target.h,24);
      if(CM.done>=CM.need)setTimeout(()=>{if(state==='play'&&mode==='colormix')levelUp()},1000)}
    else{CM.res='bad';CM.msg='Chưa ra màu '+CM.target.n+' — thử lại nhé!';sBuzz();loseHeart()}
    CM.msgT=1.4;CM.pause=1.5;
  }
  registerGame({
    id:'colormix',name:'Pha Màu',needs:'pose',soft:true,motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Giữ tay trên hai hũ sơn để trộn ra màu được yêu cầu nhé!',go:'Pha màu nào! 🎨',dbg:()=>CM,
    begin(){hearts=heartsMax=3;CM.done=0;CM.need=3+Math.floor(level/5);CM.limit=lerp(16,9,lvlT());CM.pause=0.6;CM.target=null;CM.msgT=0},
    hud(){return {score:CM.done+'/'+CM.need,icon:'🎨',hearts:[hearts,heartsMax]}},
    update(dt){
      CM.msgT=Math.max(0,CM.msgT-dt);CM.resT=Math.max(0,CM.resT-dt);
      if(CM.pause>0){CM.pause-=dt;if(CM.pause<=0&&CM.done<CM.need)newTarget();return}
      if(!CM.target)return;
      CM.t-=dt;
      if(CM.t<=0){CM.res='bad';CM.msg='Hết giờ rồi!';CM.msgT=1.2;sBuzz();loseHeart();CM.pause=1.2;return}
      POTS.forEach((p,i)=>{
        const pp=potPos(i),hit=touchedBy(pp.x,pp.y,minDim*0.1).hit;
        CM.dwell[p.k]=hit?(CM.dwell[p.k]||0)+dt:0;
        if(CM.dwell[p.k]>=0.5&&CM.picks.length<2){
          CM.dwell[p.k]=-0.8;   // nghỉ một chút để không chọn đúp
          CM.picks.push(p.k);sPick();burstAt(pp.x,pp.y,p.h,10);
          if(CM.picks.length===2)finish();
        }else if(CM.dwell[p.k]<0&&!hit)CM.dwell[p.k]=0;
      });
    },
    tap(){},
    draw(){
      const m=minDim,t=CM.target;
      // bảng yêu cầu
      if(t){
        const pw=Math.min(W*0.8,m*0.9),ph=m*0.15,px=W/2-pw/2,py=TOPY();
        panel(px,py,pw,ph,m*0.035,'rgba(255,255,255,.92)',t.h,m*0.01);
        ctx.beginPath();ctx.arc(px+ph*0.55,py+ph/2,ph*0.3,0,6.29);ctx.fillStyle=t.h;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#14456B';ctx.stroke();
        ctx.fillStyle='#14456B';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+Math.round(ph*0.42)+"px 'Baloo 2',sans-serif";
        ctx.fillText('Pha màu '+t.n+'!',W/2+ph*0.25,py+ph*0.54);
        bar(px,py+ph+m*0.012,pw,m*0.014,CM.pause>0?1:CM.t/CM.limit,CM.t/CM.limit<0.3?'#FF4D5E':'#8B6FEA');
      }
      // hũ sơn
      POTS.forEach((p,i)=>{
        const pp=potPos(i),r=m*0.1,dw=Math.max(0,CM.dwell[p.k]||0),picked=CM.picks.includes(p.k);
        ctx.beginPath();ctx.ellipse(pp.x,pp.y+r*0.7,r*0.95,r*0.28,0,0,6.29);ctx.fillStyle='rgba(20,69,107,.25)';ctx.fill();
        ctx.beginPath();ctx.arc(pp.x,pp.y,r,0,6.29);ctx.fillStyle=p.h;ctx.fill();
        ctx.lineWidth=picked?m*0.014:m*0.007;ctx.strokeStyle=picked?'#35E08B':'#14456B';ctx.stroke();
        ctx.beginPath();ctx.ellipse(pp.x-r*0.3,pp.y-r*0.38,r*0.3,r*0.17,-0.6,0,6.29);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
        lblText(p.n,pp.x,pp.y+r+m*0.045,m*0.03,'#fff');
        if(dw>0){ctx.beginPath();ctx.arc(pp.x,pp.y,r*1.12,-Math.PI/2,-Math.PI/2+6.283*Math.min(1,dw/0.5));ctx.lineWidth=m*0.014;ctx.strokeStyle='#FFE98A';ctx.lineCap='round';ctx.stroke()}
      });
      // tô trộn
      const bx=W/2,by=H*0.8,br=m*0.15;
      ctx.beginPath();ctx.ellipse(bx,by+br*0.4,br*1.05,br*0.35,0,0,6.29);ctx.fillStyle='rgba(20,69,107,.25)';ctx.fill();
      ctx.beginPath();ctx.ellipse(bx,by,br,br*0.55,0,0,Math.PI);ctx.lineTo(bx-br,by);ctx.closePath();ctx.fillStyle='#E9EEF5';ctx.fill();
      ctx.beginPath();ctx.ellipse(bx,by,br,br*0.4,0,0,6.29);ctx.fillStyle=CM.picks.length===2?CM.mixHex:(CM.picks.length===1?POTS.find(p=>p.k===CM.picks[0]).h:'#ffffff');ctx.fill();
      ctx.lineWidth=m*0.007;ctx.strokeStyle='#14456B';ctx.stroke();
      if(CM.picks.length){lblText(CM.picks.map(k=>POTS.find(p=>p.k===k).n).join(' + '),bx,by+br*0.95,m*0.032,'#fff')}
      if(CM.msgT>0)lblText(CM.msg,W/2,H*0.66,m*0.045,CM.res==='ok'?'#FFE98A':'#fff');
      drawPtrs('✋');
    },
  });
})();

/* ============================================================
   PHÂN LOẠI RÁC — cầm rác lên rồi thả vào đúng thùng
   ============================================================ */
(function(){
  const ITEMS={
    organic:['🍌','🍎','🥕','🍞','🥚','🍂'],
    recycle:['🧴','🥫','📰','📦','🍼','🫙'],
    other:['🧻','🍬','🧦','🪥','🥡','🩹'],
  };
  const BINS=[{k:'organic',n:'Rác hữu cơ',e:'🥬',c:'#3BC97A'},{k:'recycle',n:'Tái chế',e:'♻️',c:'#3C9BFF'},{k:'other',n:'Rác khác',e:'🗑️',c:'#8E9AAF'}];
  const TS={item:null,done:0,need:6,msg:'',msgT:0,flash:0,lastE:'',pointerKey:null,lost:0};
  const binRect=i=>{const m=minDim,bw=Math.min(W*0.26,m*0.4),bh=m*0.26;return {x:W*(0.2+0.3*i)-bw/2,y:H*0.84-bh/2,w:bw,h:bh}};
  function newItem(){
    const kinds=level<8?['organic','recycle']:['organic','recycle','other'];
    const k=pick(kinds);let e;do{e=pick(ITEMS[k])}while(e===TS.lastE);TS.lastE=e;
    TS.item={e,k,x:W/2,y:H*0.34,hx:W/2,hy:H*0.34,held:false,age:0,back:0};TS.pointerKey=null;TS.lost=0;
  }
  registerGame({
    id:'trash',name:'Phân Loại Rác',needs:'pose',soft:false,motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Giơ tay cầm rác lên rồi thả vào đúng thùng: hữu cơ, tái chế hay rác khác!',go:'Phân loại nào! ♻️',dbg:()=>TS,
    begin(){hearts=heartsMax=3;TS.done=0;TS.need=6+Math.floor(level/2);TS.msgT=0;TS.flash=0;newItem()},
    hud(){return {score:TS.done+'/'+TS.need,icon:'♻️',hearts:[hearts,heartsMax]}},
    update(dt){
      const it=TS.item;if(!it)return;
      TS.msgT=Math.max(0,TS.msgT-dt);TS.flash=Math.max(0,TS.flash-dt);it.age+=dt;
      const ptrs=Ptr.list();
      if(!it.held){
        if(it.back>0){it.back-=dt;it.x+=(it.hx-it.x)*Math.min(1,dt*8);it.y+=(it.hy-it.y)*Math.min(1,dt*8)}
        else{
          it.y=it.hy+Math.sin(it.age*3)*minDim*0.01;
          for(const p of ptrs){if(Math.hypot(p.x-it.x,p.y-it.y)<minDim*0.11+p.r){it.held=true;TS.pointerKey=p.key;sPick();break}}
        }
      }else{
        const p=ptrs.find(q=>q.key===TS.pointerKey);
        if(p){TS.lost=0;it.x+=(p.x-it.x)*Math.min(1,dt*18);it.y+=(p.y-it.y)*Math.min(1,dt*18)}
        else{TS.lost+=dt;if(TS.lost>0.8){it.held=false;it.back=0.4}}
        // thả khi vào miệng thùng
        for(let i=0;i<3;i++){
          const r=binRect(i);
          if(it.x>r.x&&it.x<r.x+r.w&&it.y>r.y-r.h*0.2&&it.y<r.y+r.h){
            it.held=false;
            if(BINS[i].k===it.k){TS.done++;sPop(true);burstAt(it.x,it.y,BINS[i].c,18);floatAt(it.x,it.y-minDim*0.1,'+1');TS.msg='Đúng thùng rồi! 🎉';TS.msgT=0.9;
              if(TS.done>=TS.need){TS.item=null;setTimeout(()=>{if(state==='play'&&mode==='trash')levelUp()},700);return}
              newItem();}
            else{sBuzz();TS.flash=0.4;TS.msg='Chưa đúng thùng — '+BINS[i].n+' không chứa món này';TS.msgT=1.4;it.back=0.5;loseHeart();if(state!=='play')return}
            break;
          }
        }
      }
    },
    tap(){},
    draw(){
      const m=minDim;
      BINS.forEach((b,i)=>{
        const r=binRect(i);
        panel(r.x,r.y,r.w,r.h,m*0.04,hexA(b.c,0.9),'#fff',m*0.008);
        emo(b.e,r.x+r.w/2,r.y+r.h*0.38,r.h*0.45);
        lblText(b.n,r.x+r.w/2,r.y+r.h*0.88,m*0.034,'#fff');
      });
      const it=TS.item;
      if(it){
        if(!it.held){ctx.beginPath();ctx.arc(it.x,it.y,m*0.1,0,6.29);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill()}
        emo(it.e,it.x,it.y,m*(it.held?0.16:0.14),it.held?Math.sin(frame*0.2)*0.1:0);
        if(!it.held&&TS.done===0&&level===1)lblText('✋ Chạm vào món đồ để cầm lên',W/2,H*0.5,m*0.04,'#fff');
      }
      if(TS.msgT>0)lblText(TS.msg,W/2,H*0.6,m*0.04,'#FFE98A');
      if(TS.flash>0){ctx.fillStyle='rgba(255,70,90,'+(TS.flash*0.3).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
      drawPtrs('✋');
    },
  });
})();

/* ============================================================
   GIƠ TAY TRẢ LỜI — tối đa 3 bé cùng đứng trước camera, giơ tay vào cột đáp án đúng
   ============================================================ */
(function(){
  const BR={q:null,state:'wait',t:0,limit:9,done:0,need:4,sel:[],hold:[],lock:[],score:[0,0,0],msg:'',msgT:0,lastTopic:'',res:null,touchPick:null,np:0};
  const COL=['#2FBF9F','#FF6B9A','#FFB13D'];
  const topics=()=>{const t=['count','color','animal'];if(level>=5)t.push('shape','math');if(level>=12)t.push('space','letter');return t};
  function ask(){
    let tp;do{tp=pick(topics())}while(tp===BR.lastTopic&&topics().length>1);
    BR.lastTopic=tp;BR.q=QUIZ.make(tp,3,level);BR.t=BR.limit;BR.sel=[-1,-1,-1];BR.hold=[0,0,0];BR.lock=[-1,-1,-1];BR.state='ask';BR.res=null;BR.touchPick=null;
    Voice.say(BR.q.say);
  }
  const colX=i=>W*(0.17+i*0.33);
  function colOf(x){return x<0.34?0:x<0.67?1:2}
  function resolve(){
    const q=BR.q;let anyRight=false;const players=Math.max(1,BR.np);
    for(let p=0;p<Math.min(3,players);p++){
      if(BR.lock[p]===q.correct){BR.score[p]++;anyRight=true;floatAt(colX(q.correct),H*0.3,'Bé '+(p+1)+' +1')}
    }
    if(!camOn&&BR.touchPick===q.correct)anyRight=true;
    BR.state='result';BR.t=1.6;BR.res=anyRight?'ok':'bad';
    if(anyRight){BR.done++;sPop(true);BR.msg='Đúng rồi! 🎉';burstAt(colX(q.correct),H*0.35,'#FFD84D',22);
      if(BR.done>=BR.need)setTimeout(()=>{if(state==='play'&&mode==='brain')levelUp()},1100)}
    else{BR.msg='Chưa ai đúng — đáp án là “'+q.options[q.correct].text+'”';sBuzz();loseHeart()}
    BR.msgT=1.6;
  }
  registerGame({
    id:'brain',name:'Giơ Tay Trả Lời',needs:'pose',soft:false,motion:false,touch:true,trackOpts:{numPoses:3},
    intro:'Đọc câu hỏi rồi giơ tay vào cột có đáp án đúng, giữ yên một chút nhé!',go:'Giơ tay trả lời nào! ✋',dbg:()=>BR,
    start(){BR.score=[0,0,0];BR.lastTopic=''},
    begin(){hearts=heartsMax=3;BR.done=0;BR.need=4+Math.floor(level/4);BR.limit=lerp(10,6,lvlT());BR.state='wait';BR.t=0.8;BR.q=null;BR.msgT=0},
    hud(){return {score:BR.done+'/'+BR.need,icon:'✋',hearts:[hearts,heartsMax]}},
    update(dt){
      BR.msgT=Math.max(0,BR.msgT-dt);
      if(BR.state==='wait'){BR.t-=dt;if(BR.t<=0)ask();return}
      if(BR.state==='result'){BR.t-=dt;if(BR.t<=0&&BR.done<BR.need&&state==='play'){BR.state='wait';BR.t=0.4}return}
      BR.t-=dt;
      const bodies=Track.bodies;BR.np=bodies.length;
      let locked=0;
      bodies.slice(0,3).forEach((b,i)=>{
        if(BR.lock[i]>=0){locked++;return}
        // cổ tay nào giơ cao hơn vai thì tính là đang chọn cột đó
        let best=null;
        for(const j of [15,16]){const w=b.p[j],s=b.p[j-4];if(w.v>0.4&&w.y<s.y-0.1*b.torso){if(!best||w.y<best.y)best=w}}
        const sel=best?colOf(best.x):-1;
        if(sel===BR.sel[i]&&sel>=0)BR.hold[i]+=dt;else{BR.sel[i]=sel;BR.hold[i]=0}
        if(BR.hold[i]>=0.9){BR.lock[i]=sel;sPick()}
      });
      if(bodies.length&&bodies.slice(0,3).every((_,i)=>BR.lock[i]>=0)){resolve();return}
      if(!bodies.length&&camOn){/* chưa thấy ai: dừng đồng hồ */BR.t+=dt}
      if(BR.t<=0)resolve();
    },
    tap(x,y){if(BR.state==='ask'&&!camOn){BR.touchPick=colOf(x);BR.lock[0]=BR.touchPick;resolve()}},
    draw(){
      const m=minDim,q=BR.q;if(!q)return;
      const pw=Math.min(W*0.82,m*1.0),ph=m*0.2,px=W/2-pw/2,py=TOPY();
      panel(px,py,pw,ph,m*0.035,'rgba(255,255,255,.93)','#8B6FEA',m*0.008);
      ctx.fillStyle='#14456B';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+Math.round(ph*0.3)+"px 'Baloo 2',sans-serif";
      ctx.fillText(q.prompt,W/2,py+ph*0.26);
      if(q.swatch){ctx.beginPath();ctx.arc(W/2,py+ph*0.68,ph*0.19,0,6.29);ctx.fillStyle=q.swatch;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#14456B';ctx.stroke()}
      else if(q.art){ctx.font=Math.round(ph*0.4*(q.artSize||1))+'px sans-serif';ctx.fillStyle='#000';ctx.fillText(q.art,W/2,py+ph*0.68)}
      // ba cột đáp án
      for(let i=0;i<3;i++){
        const cw=Math.min(W*0.3,m*0.42),ch=m*0.2,cx=colX(i),cy=H*0.5;
        let fill='rgba(255,255,255,.92)',stroke='#8B6FEA';
        if(BR.state==='result'){if(i===q.correct){fill='rgba(190,255,210,.97)';stroke='#35E08B'}}
        const who=[0,1,2].filter(p=>BR.sel[p]===i||BR.lock[p]===i);
        panel(cx-cw/2,cy-ch/2,cw,ch,m*0.035,fill,who.length?COL[who[0]]:stroke,m*0.01);
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(ch*0.4)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(q.options[i].text,cx,cy);
        // chấm màu báo bé nào đang chọn / đã khoá
        who.forEach((p,k)=>{ctx.beginPath();ctx.arc(cx-cw/2+ch*0.2+k*ch*0.22,cy-ch/2-ch*0.12,ch*0.09,0,6.29);ctx.fillStyle=COL[p];ctx.fill();
          if(BR.lock[p]===i){ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke()}});
      }
      // đồng hồ + tên bé
      bar(px,py+ph+m*0.012,pw,m*0.014,BR.state==='ask'?BR.t/BR.limit:0,BR.t/BR.limit<0.3?'#FF4D5E':'#8B6FEA');
      Track.bodies.slice(0,3).forEach((b,i)=>{
        const hx=b.p[0].x*W,hy=b.p[0].y*H-m*0.1;
        lblText('Bé '+(i+1)+(BR.score[i]?' · '+BR.score[i]+'⭐':''),hx,hy,m*0.032,COL[i]);
        if(BR.state==='ask'&&BR.hold[i]>0&&BR.lock[i]<0){bar(hx-m*0.06,hy+m*0.012,m*0.12,m*0.012,BR.hold[i]/0.9,COL[i])}
      });
      if(BR.msgT>0)lblText(BR.msg,W/2,H*0.74,m*0.045,BR.res==='ok'?'#FFE98A':'#fff');
      if(BR.state==='ask'&&camOn&&!Track.bodies.length)lblText('Đứng vào khung hình rồi giơ tay chọn nhé!',W/2,H*0.8,m*0.036,'#fff');
    },
  });
})();
