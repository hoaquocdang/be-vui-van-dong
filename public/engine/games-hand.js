'use strict';
/* ============================================================
   games-hand.js — trò chơi dùng nhận diện bàn tay: Đếm Ngón Tay, Kéo Búa Bao
   Dùng các hàm chung của index.html + lblText() trong games-body.js.
   ============================================================ */

/* ============================================================
   ĐẾM NGÓN TAY — nhìn số / hình / phép tính rồi giơ đúng số ngón tay
   ============================================================ */
(function(){
  const FG={q:null,prevAns:0,t:0,limit:12,need:2,done:0,holdN:-2,holdT:0,live:-1,feed:0,msg:'',msgT:0,match:false,wrongT:0};
  const OBJ=['🍎','🍓','🍊','🍌','🍇','🐥','⭐','🎈','🐰','🌼'];
  const maxNum=()=>level<4?3:(level<12?5:10);
  function qTypes(){
    const t=['count'];
    if(level>=5)t.push('numeral');
    if(level>=12)t.push('add');
    if(level>=22)t.push('sub');
    return t;
  }
  function makeQ(){
    for(let tries=0;tries<8;tries++){
      const types=qTypes(),t=types[(Math.random()*types.length)|0],mx=maxNum();
      let ans,text='',objs=null,a=0,b=0;
      const emoji=OBJ[(Math.random()*OBJ.length)|0];
      if(t==='count'){ans=1+((Math.random()*mx)|0);objs=[ans]}
      else if(t==='numeral'){ans=1+((Math.random()*mx)|0);text=String(ans)}
      else if(t==='add'){const tot=2+((Math.random()*(mx-1))|0);a=1+((Math.random()*(tot-1))|0);b=tot-a;ans=tot;text=a+' + '+b;objs=[a,b]}
      else{const tot=2+((Math.random()*(mx-1))|0);b=1+((Math.random()*(tot-1))|0);a=tot;ans=a-b;text=a+' − '+b;objs=[a]}
      if(ans!==FG.prevAns||tries===7)return {t,ans,text,objs,emoji,a,b};
    }
  }
  function nextQ(){
    FG.q=makeQ();FG.prevAns=FG.q.ans;FG.t=FG.limit;FG.holdN=-2;FG.holdT=0;FG.match=false;FG.wrongT=0;
  }
  function success(){
    FG.done++;FG.match=true;FG.feed=0.9;
    burstAt(W/2,H*0.3,'#8B6FEA',20);sPop(true);
    floatAt(W/2,H*0.42,'Giỏi quá! 🎉');
    if(FG.done>=FG.need)setTimeout(()=>{if(state==='play'&&mode==='fingers')levelUp()},650);
  }
  function timeUp(){
    FG.feed=0.9;FG.msg='Hết giờ rồi, thử câu khác nhé!';FG.msgT=1.2;sBuzz();
    loseHeart();
    if(state==='play')setTimeout(()=>{if(state==='play'&&mode==='fingers'&&FG.done<FG.need)nextQ()},700);
  }
  function liveCount(){
    const hs=Track.hands;if(!hs.length)return -1;
    let n=0;for(const h of hs.slice(0,2))n+=h.count;
    return Math.min(10,n);
  }
  function answerTouch(n){
    if(FG.feed>0||!FG.q)return;
    if(n===FG.q.ans)success();
    else{FG.msg='Chưa đúng, đếm lại nhé!';FG.msgT=1.0;sBuzz();loseHeart()}
  }
  function padRects(){
    const n=maxNum(),cols=Math.min(n,5),rows=Math.ceil(n/cols),gap=minDim*0.02;
    const bw=Math.min(minDim*0.13,(W*0.9-gap*(cols-1))/cols),bh=bw;
    const x0=W/2-(cols*bw+(cols-1)*gap)/2,y0=H-minDim*0.06-rows*bh-(rows-1)*gap;
    const out=[];
    for(let i=0;i<n;i++)out.push({n:i+1,x:x0+(i%cols)*(bw+gap),y:y0+Math.floor(i/cols)*(bh+gap),w:bw,h:bh});
    return out;
  }
  registerGame({
    id:'fingers',order:40,isNew:true,name:'Đếm Ngón Tay',icon:['🖐️','🔢'],accent:'#8B6FEA',cat:['learn'],
    needs:'hand',motion:false,touch:true,trackOpts:{numHands:2},skel:{color:()=>FG.match?'#35E08B':null},
    tag:'Giơ đúng số ngón tay theo hình, số hoặc phép cộng trừ!',
    desc:'Màn hình hiện số trái cây, chữ số hoặc phép cộng trừ — bé giơ đúng số ngón tay. Lên cấp cao phải dùng cả hai bàn tay và làm phép tính trong phạm vi 10.',
    skill:'🔢 Đếm số & phép tính',dist:'Đứng gần camera hơn, khoảng 1 m, giơ tay trước ngực',
    how:['Đứng cách camera khoảng 1 m, giơ bàn tay lên trước ngực cho camera thấy rõ.','Nhìn số trái cây, chữ số hoặc phép tính trên màn hình.','Giơ đúng số ngón tay và giữ yên một chút. Số trong góc cho biết máy đang đếm được mấy ngón.'],
    intro:'Nhìn số rồi giơ đúng số ngón tay nhé!',go:'Giơ tay nào! 🖐️',
    dbg:()=>FG,
    begin(){hearts=heartsMax=3;FG.done=0;FG.need=2+Math.floor((level-1)/10);FG.limit=lerp(15,8,lvlT());FG.feed=0;FG.msgT=0;FG.prevAns=0;nextQ()},
    hud(){return {score:FG.done+'/'+FG.need,icon:'🖐️',hearts:[hearts,heartsMax],time:Math.max(0,Math.ceil(FG.t)),low:FG.t<4}},
    update(dt){
      FG.msgT=Math.max(0,FG.msgT-dt);FG.wrongT=Math.max(0,FG.wrongT-dt);
      if(FG.feed>0){FG.feed-=dt;return}
      FG.t-=dt;
      if(FG.t<=0){timeUp();return}
      if(!camOn)return;
      FG.live=liveCount();
      if(FG.live===FG.holdN)FG.holdT+=dt;else{FG.holdN=FG.live;FG.holdT=0}
      FG.match=FG.live===FG.q.ans&&FG.live>=0;
      if(FG.holdN>=0&&FG.holdT>=0.6){
        if(FG.holdN===FG.q.ans){success();return}
        if(FG.wrongT<=0){FG.msg='Máy đếm được '+FG.holdN+' ngón — đếm lại nhé!';FG.msgT=1.6;FG.wrongT=2.4}
      }
    },
    tap(x,y){
      if(camOn)return;
      const px=x*W,py=y*H;
      for(const r of padRects()){if(px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h){answerTouch(r.n);return}}
    },
    draw(){
      const q=FG.q;if(!q)return;
      const md=minDim;
      // bảng câu hỏi
      const pw=Math.min(W*0.86,md*1.1),ph=md*0.34,px=W/2-pw/2,py=md*0.11;
      roundRectPath(px,py,pw,ph,md*0.04);ctx.fillStyle='rgba(255,255,255,.88)';ctx.fill();
      ctx.lineWidth=md*0.008;ctx.strokeStyle=FG.match?'#35E08B':'#8B6FEA';ctx.stroke();
      ctx.textAlign='center';ctx.textBaseline='middle';
      if(q.t==='numeral'){
        ctx.font='800 '+Math.round(ph*0.7)+"px 'Baloo 2',sans-serif";ctx.fillStyle='#5A3FC0';
        ctx.fillText(q.text,W/2,py+ph*0.5);
      }else{
        const rows=[];
        if(q.t==='count')rows.push(q.objs[0]);
        else{rows.push(q.objs[0]);if(q.t==='add')rows.push(q.objs[1])}
        if(q.text){ctx.font='800 '+Math.round(ph*0.3)+"px 'Baloo 2',sans-serif";ctx.fillStyle='#5A3FC0';ctx.fillText(q.text+' = ?',W/2,py+ph*0.2)}
        const n1=q.objs[0],n2=q.t==='add'?q.objs[1]:0,total=n1+n2;
        const sz=Math.min(ph*(q.text?0.3:0.62),(pw*0.9)/(Math.max(total,1)+(n2?1:0))*0.9);
        ctx.font=Math.round(sz)+'px sans-serif';
        const gap=sz*1.05,startX=W/2-((total+(n2?1:0))*gap)/2+gap/2,cy=py+ph*(q.text?0.62:0.5);
        let k=0;
        for(let i=0;i<n1;i++)ctx.fillText(q.emoji,startX+(k++)*gap,cy);
        if(n2){ctx.fillText('+',startX+(k++)*gap,cy);for(let i=0;i<n2;i++)ctx.fillText(q.emoji,startX+(k++)*gap,cy)}
      }
      // thanh thời gian
      const bw=pw,bh=md*0.016,by=py+ph+md*0.012,pct=Math.max(0,FG.t/FG.limit);
      roundRectPath(px,by,bw,bh,bh/2);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();
      roundRectPath(px,by,Math.max(bh,bw*pct),bh,bh/2);ctx.fillStyle=pct<0.3?'#FF4D5E':'#8B6FEA';ctx.fill();
      // số ngón máy đang đếm
      if(camOn){
        const r=md*0.09,cx=md*0.13,cy=H-md*0.2;
        ctx.beginPath();ctx.arc(cx,cy,r,0,6.29);ctx.fillStyle=FG.match?'#35E08B':'rgba(255,255,255,.9)';ctx.fill();
        ctx.lineWidth=md*0.008;ctx.strokeStyle='#8B6FEA';ctx.stroke();
        ctx.font='800 '+Math.round(r*1.2)+"px 'Baloo 2',sans-serif";ctx.fillStyle=FG.match?'#fff':'#5A3FC0';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(FG.live>=0?FG.live:'?',cx,cy+r*0.06);
        lblText('Máy đếm',cx,cy-r-md*0.012,md*0.032,'#fff');
      }else{
        for(const r of padRects()){
          roundRectPath(r.x,r.y,r.w,r.h,r.w*0.2);ctx.fillStyle='rgba(255,255,255,.92)';ctx.fill();
          ctx.lineWidth=3;ctx.strokeStyle='#8B6FEA';ctx.stroke();
          ctx.font='800 '+Math.round(r.h*0.62)+"px 'Baloo 2',sans-serif";ctx.fillStyle='#5A3FC0';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(r.n,r.x+r.w/2,r.y+r.h*0.54);
        }
      }
      if(FG.msgT>0)lblText(FG.msg,W/2,py+ph+md*0.1,md*0.05,'#FFE9A8');
    },
  });
})();

/* ============================================================
   KÉO BÚA BAO — "Oẳn tù tì" với máy
   ============================================================ */
(function(){
  const RP={phase:'wait',t:0,beat:0,cpu:null,kid:null,votes:{},rule:'win',res:'',noHand:0,msg:'',touchSign:null,live:null};
  const SIGN={rock:'✊',paper:'🖐️',scissors:'✌️'};
  const NAME={rock:'Búa',paper:'Bao',scissors:'Kéo'};
  const BEATS=['Oẳn…','Tù…','Tì!'];
  const beatT=()=>lerp(0.75,0.5,lvlT());
  const beats=()=>{}; // giữ chỗ cho dễ đọc
  function ruleFor(){return level%5===0?'tie':'win'}
  function classify(h){
    if(!h)return null;
    const f=h.f,i=f[1],m=f[2],r=f[3],p=f[4],n=(i?1:0)+(m?1:0)+(r?1:0)+(p?1:0);
    if(n===0)return 'rock';
    if(i&&m&&!r&&!p)return 'scissors';
    if(n>=3)return 'paper';
    return null;
  }
  function beats3(a,b){ // a có thắng b không
    return (a==='rock'&&b==='scissors')||(a==='scissors'&&b==='paper')||(a==='paper'&&b==='rock');
  }
  function bestHand(){
    const hs=Track.hands;if(!hs.length)return null;
    return hs.reduce((a,b)=>b.size>a.size?b:a);
  }
  function newRound(){
    RP.phase='wait';RP.t=0.9;RP.beat=0;RP.cpu=null;RP.kid=null;RP.votes={};RP.res='';RP.msg='';RP.touchSign=null;
  }
  function vote(s){if(s)RP.votes[s]=(RP.votes[s]||0)+1}
  function reveal(){
    let kid=null,best=0;
    for(const k in RP.votes)if(RP.votes[k]>best){best=RP.votes[k];kid=k}
    if(!camOn)kid=RP.touchSign;
    RP.kid=kid;RP.cpu=['rock','paper','scissors'][(Math.random()*3)|0];
    RP.phase='reveal';RP.t=1.5;
    if(!kid){RP.noHand++;RP.res='none';RP.msg='Chưa thấy tay bé — thử lại nhé!';sBuzz();return}
    RP.noHand=0;
    const win=beats3(kid,RP.cpu),tie=kid===RP.cpu;
    if(RP.rule==='win'){
      if(win){RP.res='ok';RP.msg='Bé thắng rồi! 🎉';burstAt(W/2,H*0.4,'#FFD84D',24);sPop(true);setTimeout(()=>{if(state==='play'&&mode==='rps')levelUp()},900)}
      else if(tie){RP.res='tie';RP.msg='Hoà rồi, chơi lại nào!'}
      else{RP.res='lose';RP.msg='Máy thắng rồi! 😅';sBuzz();loseHeart()}
    }else{
      if(tie){RP.res='ok';RP.msg='Ra giống máy — đúng rồi! 🎉';burstAt(W/2,H*0.4,'#FFD84D',24);sPop(true);setTimeout(()=>{if(state==='play'&&mode==='rps')levelUp()},900)}
      else{RP.res='lose';RP.msg='Phải ra GIỐNG máy cơ! 😅';sBuzz();loseHeart()}
    }
  }
  registerGame({
    id:'rps',order:50,isNew:true,name:'Kéo Búa Bao',icon:['✌️','✊','🖐️'],accent:'#FF8A3D',cat:['learn','react'],
    needs:'hand',motion:false,touch:true,trackOpts:{numHands:1},
    tag:'Chơi oẳn tù tì với máy — ra Kéo, Búa hoặc Bao!',
    desc:'Cùng đếm "Oẳn… Tù… Tì!" rồi ra Kéo, Búa hoặc Bao để thắng máy. Cứ 5 cấp lại có luật mới: phải ra GIỐNG máy!',
    skill:'✌️ Nhận biết & phản xạ',dist:'Đứng gần camera hơn, khoảng 1 m, giơ tay trước ngực',
    how:['Đứng cách camera khoảng 1 m, giơ một bàn tay trước ngực.','Cùng đếm <b>Oẳn… Tù… Tì!</b> rồi ra <b>Búa</b> (nắm tay), <b>Kéo</b> (2 ngón) hoặc <b>Bao</b> (xòe tay).','Thắng máy là qua cấp. Thua máy mất 1 tim; hoà thì chơi lại.'],
    intro:'Ra Búa, Kéo hoặc Bao để thắng máy nhé!',go:'Oẳn tù tì nào! ✌️',
    start(){RP.noHand=0},
    begin(){hearts=heartsMax=3;RP.rule=ruleFor();newRound();if(RP.rule==='tie')floatAt(W/2,H*0.55,'Cấp này: ra GIỐNG máy!')},
    hud(){return {hearts:[hearts,heartsMax]}},
    update(dt){
      RP.t-=dt;
      const g=camOn?classify(bestHand()):null;RP.live=g;
      if(RP.phase==='wait'){if(RP.t<=0){RP.phase='beat';RP.beat=0;RP.t=beatT();sTick()}}
      else if(RP.phase==='beat'){
        if(RP.beat===2&&camOn)vote(g);                 // nhịp "Tì!" bắt đầu lấy mẫu cử chỉ
        if(RP.t<=0){
          RP.beat++;
          if(RP.beat>=3){RP.phase='shoot';RP.t=0.45}
          else{RP.t=beatT();sTick()}
        }
      }else if(RP.phase==='shoot'){
        if(camOn)vote(g);
        if(RP.t<=0)reveal();
      }else if(RP.phase==='reveal'){
        if(RP.t<=0&&state==='play'&&RP.res!=='ok')newRound();
      }
    },
    tap(x,y){
      if(camOn)return;
      const px=x*W,py=y*H,md=minDim,bw=md*0.2,gap=md*0.04,y0=H-md*0.3;
      ['rock','scissors','paper'].forEach((s,i)=>{
        const x0=W/2-(3*bw+2*gap)/2+i*(bw+gap);
        if(px>=x0&&px<=x0+bw&&py>=y0&&py<=y0+bw){RP.touchSign=s;sPick()}
      });
    },
    draw(){
      const md=minDim,cy=H*0.42,off=Math.min(W*0.27,md*0.5);
      // vẽ khung hai bên
      const box=(cx,label,sym,tint)=>{
        const bw=md*0.4,bh=md*0.44;
        roundRectPath(cx-bw/2,cy-bh/2,bw,bh,md*0.04);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fill();
        ctx.lineWidth=md*0.008;ctx.strokeStyle=tint;ctx.stroke();
        ctx.font=Math.round(bw*0.58)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(sym,cx,cy-bh*0.04);
        lblText(label,cx,cy-bh/2-md*0.015,md*0.04,'#fff');
      };
      const shake=RP.phase==='beat'||RP.phase==='wait'?Math.sin(frame*0.5)*md*0.01:0;
      const kidSym=RP.phase==='reveal'||RP.phase==='shoot'
        ?(RP.kid?SIGN[RP.kid]:(RP.live?SIGN[RP.live]:'❔'))
        :(RP.live?SIGN[RP.live]:'✊');
      ctx.save();ctx.translate(0,shake);
      box(W/2-off,'Bé',kidSym,'#FF8A3D');
      const cpuSym=RP.phase==='reveal'&&RP.cpu?SIGN[RP.cpu]:(RP.phase==='shoot'?'❔':'✊');
      box(W/2+off,'Máy',cpuSym,'#8B6FEA');
      ctx.restore();
      // chữ giữa
      let big='';
      if(RP.phase==='wait')big=RP.rule==='tie'?'Ra GIỐNG máy!':'Sẵn sàng…';
      else if(RP.phase==='beat')big=BEATS[Math.min(2,RP.beat)];
      else if(RP.phase==='shoot')big='RA!';
      else if(RP.phase==='reveal')big=RP.msg;
      lblText(big,W/2,cy+md*0.34,md*0.075,RP.res==='ok'?'#FFE98A':'#fff');
      if(RP.phase==='reveal'&&RP.kid&&RP.cpu)lblText(NAME[RP.kid]+' – '+NAME[RP.cpu],W/2,cy+md*0.42,md*0.04,'#fff');
      if(RP.rule==='tie')lblText('Luật cấp này: ra GIỐNG máy',W/2,md*0.115,md*0.036,'#FFE98A');
      if(!camOn){ // nút chạm
        const bw=md*0.2,gap=md*0.04,y0=H-md*0.3;
        ['rock','scissors','paper'].forEach((s,i)=>{
          const x0=W/2-(3*bw+2*gap)/2+i*(bw+gap);
          roundRectPath(x0,y0,bw,bw,bw*0.2);ctx.fillStyle=RP.touchSign===s?'#FFE98A':'rgba(255,255,255,.92)';ctx.fill();
          ctx.lineWidth=3;ctx.strokeStyle='#FF8A3D';ctx.stroke();
          ctx.font=Math.round(bw*0.6)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(SIGN[s],x0+bw/2,y0+bw*0.54);
        });
      }
    },
    dbg:()=>RP,
  });
})();
