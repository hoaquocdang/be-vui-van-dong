'use strict';
/* ============================================================
   games-hand2.js — Vòng Quay Thần Kỳ (đếm ngón tay trả lời phép tính), Vẽ Trên Không (vẽ bằng ngón trỏ)
   ============================================================ */

/* ============================================================
   VÒNG QUAY THẦN KỲ — quay ra phép tính rồi giơ số ngón tay là đáp án
   ============================================================ */
(function(){
  const SEG={'+':{e:'➕',c:'#3C9BFF',n:'CỘNG'},'−':{e:'➖',c:'#FF6B9A',n:'TRỪ'},'×':{e:'✖️',c:'#FF8A3D',n:'NHÂN'},'⭐':{e:'⭐',c:'#FFC93D',n:'THƯỞNG'}};
  const WL={state:'wait',t:0,ang:0,from:0,to:0,spinT:0,segs:[],k:0,q:null,limit:12,done:0,need:4,holdN:-2,holdT:0,live:-1,msg:'',msgT:0};
  const segsFor=()=>level<12?['+','−','⭐','+','−','⭐']:['+','−','×','⭐','+','−','×','⭐'];
  const live=()=>{const hs=Track.hands;if(!hs.length)return -1;let n=0;for(const h of hs.slice(0,2))n+=h.count;return Math.min(10,n)};
  function makeQ(op){
    const mx=level<10?5:10;
    let a,b,ans,text;
    if(op==='+'){a=1+((Math.random()*(mx-1))|0);b=1+((Math.random()*(mx-a))|0)||1;ans=a+b;text=a+' + '+b+' = ?'}
    else if(op==='−'){a=2+((Math.random()*(mx-1))|0);b=1+((Math.random()*(a-1))|0);ans=a-b;text=a+' − '+b+' = ?'}
    else if(op==='×'){a=2;b=1+((Math.random()*5)|0);ans=a*b;text=a+' × '+b+' = ?'}
    else{ans=1+((Math.random()*10)|0);text='Giơ '+ans+' ngón tay!'}
    return {op,ans,text};
  }
  function spin(){
    WL.segs=segsFor();WL.k=(Math.random()*WL.segs.length)|0;
    const two=Math.PI*2,slice=two/WL.segs.length,base=WL.ang%two;
    const delta=(((-(WL.k+0.5)*slice-base)%two)+two)%two;   // góc cần xoay thêm để tâm ô k nằm đúng mũi tên (ở đỉnh)
    WL.from=base;WL.to=base+two*(3+((Math.random()*2)|0))+delta;
    WL.spinT=0;WL.state='spin';sCount(false);
  }
  registerGame({
    id:'wheel',name:'Vòng Quay Thần Kỳ',needs:'hand',motion:false,touch:true,trackOpts:{numHands:2},
    intro:'Vòng quay chọn phép tính cho bé! Tính ra đáp án rồi giơ đúng số ngón tay nhé!',go:'Quay nào! 🎡',dbg:()=>WL,
    begin(){hearts=heartsMax=3;WL.done=0;WL.need=4+Math.floor(level/6);WL.limit=lerp(15,8,lvlT());WL.state='wait';WL.t=0.8;WL.msgT=0;WL.q=null},
    hud(){return {score:WL.done+'/'+WL.need,icon:'🎡',hearts:[hearts,heartsMax],time:WL.state==='ask'?Math.max(0,Math.ceil(WL.t)):undefined,low:WL.t<4}},
    update(dt){
      WL.msgT=Math.max(0,WL.msgT-dt);
      if(WL.state==='wait'){WL.t-=dt;if(WL.t<=0)spin();return}
      if(WL.state==='spin'){
        WL.spinT+=dt;const k=Math.min(1,WL.spinT/2.4),e=1-Math.pow(1-k,3);
        WL.ang=WL.from+(WL.to-WL.from)*e;
        if(Math.floor(e*30)%2===0&&frame%5===0)tone(900,0,.02,.05,'square');
        if(k>=1){WL.q=makeQ(WL.segs[WL.k]);WL.state='ask';WL.t=WL.limit;WL.holdN=-2;WL.holdT=0;Voice.say(WL.q.text.replace('+','cộng').replace('−','trừ').replace('×','nhân').replace('= ?','bằng mấy'))}
        return;
      }
      if(WL.state==='result'){WL.t-=dt;if(WL.t<=0&&WL.done<WL.need&&state==='play'){WL.state='wait';WL.t=0.3}return}
      WL.t-=dt;
      if(camOn){
        WL.live=live();
        if(WL.live===WL.holdN)WL.holdT+=dt;else{WL.holdN=WL.live;WL.holdT=0}
        if(WL.holdN>=0&&WL.holdT>=0.7){
          if(WL.holdN===WL.q.ans){WL.done++;WL.state='result';WL.t=1.3;WL.msg='Đúng rồi! +5 điểm 🎉';WL.msgT=1.3;sPop(true);burstAt(W/2,H*0.3,'#FFD84D',24);
            if(WL.done>=WL.need)setTimeout(()=>{if(state==='play'&&mode==='wheel')levelUp()},1100);return}
          else if(WL.holdT>=1.6){WL.msg='Máy đếm được '+WL.holdN+' ngón — đếm lại nhé!';WL.msgT=1.2;WL.holdT=0.8}
        }
      }
      if(WL.t<=0){WL.state='result';WL.t=1.2;WL.msg='Hết giờ! Đáp án là '+WL.q.ans;WL.msgT=1.2;sBuzz();loseHeart()}
    },
    tap(x,y){
      if(camOn||WL.state!=='ask')return;
      // chế độ chạm: bàn phím số 0..10 ở dưới
      const m=minDim,bw=Math.min(m*0.11,W*0.075),gap=6,x0=W/2-(11*(bw+gap)-gap)/2,y0=H-bw-m*0.05;
      const px=x*W,py=y*H;
      for(let i=0;i<=10;i++){const bx=x0+i*(bw+gap);if(px>=bx&&px<=bx+bw&&py>=y0&&py<=y0+bw){
        if(i===WL.q.ans){WL.done++;WL.state='result';WL.t=1.0;WL.msg='Đúng rồi! 🎉';WL.msgT=1;sPop(true);if(WL.done>=WL.need)setTimeout(()=>{if(state==='play'&&mode==='wheel')levelUp()},900)}
        else{WL.msg='Chưa đúng!';WL.msgT=0.8;sBuzz();loseHeart()}
        return}}
    },
    draw(){
      const m=minDim,cx=W/2,cy=H*0.34,R=Math.min(m*0.26,W*0.26);
      const segs=WL.segs.length?WL.segs:segsFor(),n=segs.length,slice=Math.PI*2/n;
      // bánh xe
      ctx.save();ctx.translate(cx,cy);ctx.rotate(WL.ang);
      segs.forEach((s,i)=>{
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,i*slice-Math.PI/2,(i+1)*slice-Math.PI/2);ctx.closePath();
        ctx.fillStyle=SEG[s].c;ctx.fill();ctx.lineWidth=m*0.006;ctx.strokeStyle='#fff';ctx.stroke();
        ctx.save();ctx.rotate(i*slice+slice/2);ctx.font=Math.round(R*0.3)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(SEG[s].e,0,-R*0.68);ctx.restore();
      });
      ctx.beginPath();ctx.arc(0,0,R*0.12,0,6.29);ctx.fillStyle='#fff';ctx.fill();
      ctx.restore();
      ctx.beginPath();ctx.arc(cx,cy,R*1.03,0,6.29);ctx.lineWidth=m*0.012;ctx.strokeStyle='#14456B';ctx.stroke();
      // mũi tên chỉ
      ctx.beginPath();ctx.moveTo(cx-m*0.03,cy-R-m*0.045);ctx.lineTo(cx+m*0.03,cy-R-m*0.045);ctx.lineTo(cx,cy-R+m*0.02);ctx.closePath();ctx.fillStyle='#FF3B4E';ctx.fill();ctx.lineWidth=m*0.004;ctx.strokeStyle='#fff';ctx.stroke();
      // câu hỏi
      const q=WL.q;
      if(q&&WL.state!=='spin'){
        panel(cx-m*0.32,cy+R+m*0.04,m*0.64,m*0.12,m*0.035,'rgba(255,255,255,.94)',SEG[q.op].c,m*0.01);
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(m*0.075)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(q.text,cx,cy+R+m*0.1);
      }else if(WL.state==='spin')lblText('Vòng quay đang quay…',cx,cy+R+m*0.1,m*0.05,'#fff');
      // số ngón máy đang đếm
      if(camOn&&WL.state==='ask'){
        const r=m*0.08,bx=m*0.13,by=H-m*0.2,match=q&&WL.live===q.ans;
        ctx.beginPath();ctx.arc(bx,by,r,0,6.29);ctx.fillStyle=match?'#35E08B':'rgba(255,255,255,.92)';ctx.fill();ctx.lineWidth=m*0.008;ctx.strokeStyle='#8B6FEA';ctx.stroke();
        ctx.fillStyle=match?'#fff':'#5A3FC0';ctx.font='800 '+Math.round(r*1.2)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(WL.live>=0?WL.live:'?',bx,by+r*0.05);
        lblText('Máy đếm',bx,by-r-m*0.012,m*0.03,'#fff');
      }
      if(!camOn&&WL.state==='ask'){
        const bw=Math.min(m*0.11,W*0.075),gap=6,x0=W/2-(11*(bw+gap)-gap)/2,y0=H-bw-m*0.05;
        for(let i=0;i<=10;i++){const bx=x0+i*(bw+gap);panel(bx,y0,bw,bw,bw*0.2,'rgba(255,255,255,.93)','#8B6FEA',3);
          ctx.fillStyle='#5A3FC0';ctx.font='800 '+Math.round(bw*0.55)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i,bx+bw/2,y0+bw*0.54)}
      }
      if(q&&WL.state==='ask')bar(cx-m*0.25,cy+R+m*0.17,m*0.5,m*0.016,WL.t/WL.limit,WL.t/WL.limit<0.3?'#FF4D5E':'#8B6FEA');
      if(WL.msgT>0)lblText(WL.msg,cx,H*0.78,m*0.045,'#FFE98A');
    },
  });
})();

/* ============================================================
   VẼ TRÊN KHÔNG — chỉ một ngón trỏ để vẽ; chạm bảng màu để đổi màu (không có cấp độ)
   ============================================================ */
(function(){
  const COLS=['#FF4D5E','#FF9F43','#FFD84D','#3BC97A','#3C9BFF','#9B6BFF','#FFFFFF','rainbow'];
  const DW={strokes:[],cur:{},col:0,dwell:{},hue:0,pts:0,pos:{}};
  const palRect=i=>{const m=minDim,s=Math.min(m*0.095,(H-m*0.4)/(COLS.length+1)),x=m*0.03,y0=H*0.2;return {x,y:y0+i*(s+m*0.012),w:s,h:s,}};
  const clearRect=()=>{const r=palRect(COLS.length);return r};
  const colorOf=(c,hue)=>c==='rainbow'?'hsl('+(hue%360)+',90%,60%)':c;
  const pointing=h=>h.f[1]&&!h.f[2]&&!h.f[3]&&!h.f[4];
  function addPt(key,x,y){
    let st=DW.cur[key];
    if(!st){st=DW.cur[key]={col:COLS[DW.col],pts:[],hue:DW.hue};DW.strokes.push(st)}
    const last=st.pts[st.pts.length-1];
    if(!last||Math.hypot(last.x-x,last.y-y)>minDim*0.004){st.pts.push({x,y,h:(DW.hue+=2)});DW.pts++}
  }
  registerGame({
    id:'draw',name:'Vẽ Trên Không',needs:'hand',motion:false,touch:true,trackOpts:{numHands:2},levels:false,skel:false,music:false,
    intro:'Chỉ một ngón trỏ lên để vẽ. Chạm vào bảng màu bên trái để đổi màu. Xòe tay hoặc nắm tay để dừng vẽ!',go:'Vẽ nào! 🎨',dbg:()=>DW,
    begin(){DW.strokes=[];DW.cur={};DW.dwell={};DW.pts=0;DW.pos={}},
    hud(){return {level:false}},
    update(dt){
      const m=minDim;
      const tips=[];
      Track.hands.slice(0,2).forEach((h,i)=>{
        const key='h'+i,raw={x:h.tip.x*W,y:h.tip.y*H},old=DW.pos[key]||raw;
        const p={x:old.x+(raw.x-old.x)*0.55,y:old.y+(raw.y-old.y)*0.55};DW.pos[key]=p;
        tips.push({key,p,draw:pointing(h)});
      });
      if(!camOn&&Ptr.touch.down)tips.push({key:'touch',p:{x:Ptr.touch.x,y:Ptr.touch.y},draw:true});
      // bảng màu: giữ ngón trên ô màu 0,5 giây để chọn
      let onPal=new Set();
      for(const t of tips){
        for(let i=0;i<=COLS.length;i++){
          const r=palRect(i);
          if(t.p.x>=r.x-m*0.02&&t.p.x<=r.x+r.w+m*0.02&&t.p.y>=r.y-m*0.01&&t.p.y<=r.y+r.h+m*0.01){
            onPal.add(t.key);const k='p'+i;DW.dwell[k]=(DW.dwell[k]||0)+dt;
            if(DW.dwell[k]>=0.5){DW.dwell[k]=-99;if(i===COLS.length){DW.strokes=[];DW.cur={};DW.pts=0;sBuzz()}else{DW.col=i;sPick()}}
            if(!camOn&&i<=COLS.length&&Ptr.touch.down){DW.dwell[k]=Math.max(DW.dwell[k],0.5)}
          }
        }
      }
      for(const k in DW.dwell){const i=+k.slice(1),r=palRect(i);if(!tips.some(t=>t.p.x>=r.x-m*0.02&&t.p.x<=r.x+r.w+m*0.02&&t.p.y>=r.y-m*0.01&&t.p.y<=r.y+r.h+m*0.01))DW.dwell[k]=0}
      for(const t of tips){
        if(t.draw&&!onPal.has(t.key))addPt(t.key,t.p.x,t.p.y);else delete DW.cur[t.key];
      }
      for(const key of Object.keys(DW.cur)){if(!tips.some(t=>t.key===key))delete DW.cur[key]}
      if(DW.pts>24000){DW.strokes.shift();DW.pts=DW.strokes.reduce((s,k)=>s+k.pts.length,0)}
      DW.tips=tips;
    },
    tap(){},
    draw(){
      const m=minDim;
      ctx.fillStyle='rgba(8,24,48,.25)';ctx.fillRect(0,0,W,H);
      ctx.lineCap='round';ctx.lineJoin='round';
      for(const s of DW.strokes){
        if(s.pts.length<2){continue}
        if(s.col==='rainbow'){
          for(let i=1;i<s.pts.length;i++){ctx.beginPath();ctx.moveTo(s.pts[i-1].x,s.pts[i-1].y);ctx.lineTo(s.pts[i].x,s.pts[i].y);ctx.strokeStyle='hsl('+(s.pts[i].h%360)+',90%,60%)';ctx.lineWidth=m*0.024;ctx.stroke()}
        }else{
          ctx.beginPath();ctx.moveTo(s.pts[0].x,s.pts[0].y);for(const p of s.pts)ctx.lineTo(p.x,p.y);
          ctx.strokeStyle=s.col;ctx.lineWidth=m*0.024;ctx.stroke();
        }
      }
      // bảng màu
      for(let i=0;i<=COLS.length;i++){
        const r=palRect(i),on=i===DW.col&&i<COLS.length,dw=Math.max(0,DW.dwell['p'+i]||0);
        ctx.beginPath();ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w/2,0,6.29);
        if(i===COLS.length){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();emo('🧽',r.x+r.w/2,r.y+r.h/2,r.w*0.62)}
        else{ctx.fillStyle=COLS[i]==='rainbow'?'#fff':COLS[i];ctx.fill();if(COLS[i]==='rainbow'){if(ctx.createConicGradient){const g=ctx.createConicGradient(0,r.x+r.w/2,r.y+r.h/2);['#f33','#fa3','#ee3','#3c6','#39f','#96f','#f33'].forEach((c,k)=>g.addColorStop(k/6,c));ctx.fillStyle=g;ctx.fill()}}}
        ctx.lineWidth=on?m*0.012:m*0.004;ctx.strokeStyle=on?'#fff':'rgba(255,255,255,.7)';ctx.stroke();
        if(dw>0){ctx.beginPath();ctx.arc(r.x+r.w/2,r.y+r.h/2,r.w*0.62,-Math.PI/2,-Math.PI/2+6.283*Math.min(1,dw/0.5));ctx.lineWidth=m*0.01;ctx.strokeStyle='#FFE98A';ctx.stroke()}
      }
      // con trỏ ngón tay
      for(const t of DW.tips||[]){
        ctx.beginPath();ctx.arc(t.p.x,t.p.y,m*0.022,0,6.29);ctx.fillStyle=t.draw?colorOf(COLS[DW.col],DW.hue):'rgba(255,255,255,.35)';ctx.fill();ctx.lineWidth=m*0.006;ctx.strokeStyle='#fff';ctx.stroke();
      }
      if(!DW.strokes.length)lblText('☝️ Chỉ một ngón trỏ để vẽ',W/2,H*0.14,m*0.045,'#fff');
    },
  });
})();
