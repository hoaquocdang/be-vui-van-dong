'use strict';
/* ============================================================
   games-fit2.js — Đồng Hồ Người, Chim Vỗ Tay, Nhảy Chữ
   ============================================================ */

/* ============================================================
   ĐỒNG HỒ NGƯỜI — hai cánh tay là kim giờ và kim phút
   ============================================================ */
(function(){
  const CK={sg:null,h:3,m:0,state:'wait',t:0,limit:12,hold:0,done:0,need:5,msg:'',msgT:0,tol:35,err:null};
  const ang=(sh,wr)=>{const dx=(wr.x-sh.x)*Track.ar,dy=wr.y-sh.y;const a=Math.atan2(dx,-dy)*180/Math.PI;return a<0?a+360:a};
  const diff=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d};
  const viet=(h,m)=>m===0?h+' giờ':m===30?h+' giờ rưỡi':h+' giờ '+m+' phút';
  const handAngles=()=>({hour:((CK.h%12)*30+CK.m*0.5)%360,min:(CK.m*6)%360});
  function ask(){
    const nh=1+((Math.random()*12)|0);
    let m=0;if(level>=21)m=pick([0,15,30,45]);else if(level>=11)m=pick([0,30]);
    CK.h=nh;CK.m=m;CK.state='ask';CK.t=CK.limit;CK.hold=0;CK.err=null;
    Voice.say('Mấy giờ rồi? '+viet(CK.h,CK.m));
  }
  function readArms(b){
    const P=b.p,T=b.torso,out=[];
    for(const [s,w] of [[11,15],[12,16]]){
      if(P[w].v<0.4||P[s].v<0.4||Track.dist(P[s],P[w])<0.55*T)return null;   // tay chưa duỗi ra
      out.push(ang(P[s],P[w]));
    }
    return out;
  }
  registerGame({
    id:'clock',name:'Đồng Hồ Người',needs:'pose',motion:false,touch:false,trackOpts:{numPoses:1},
    intro:'Hai cánh tay của bé là kim đồng hồ! Dang tay làm kim giờ và kim phút cho đúng giờ nhé!',go:'Làm đồng hồ nào! 🕒',dbg:()=>CK,
    begin(){hearts=heartsMax=3;CK.done=0;CK.need=5+Math.floor(level/5);CK.limit=lerp(14,8,lvlT());CK.tol=lerp(38,26,lvlT());CK.state='wait';CK.t=0.9;CK.msgT=0},
    hud(){return {score:CK.done+'/'+CK.need,icon:'🕒',hearts:[hearts,heartsMax]}},
    update(dt){
      CK.msgT=Math.max(0,CK.msgT-dt);
      if(CK.state==='wait'){CK.t-=dt;if(CK.t<=0)ask();return}
      if(CK.state==='result'){CK.t-=dt;if(CK.t<=0&&CK.done<CK.need&&state==='play'){CK.state='wait';CK.t=0.4}return}
      CK.t-=dt;
      const b=Track.body('solo'),want=handAngles();
      let ok=false;
      if(b){
        const a=readArms(b);
        if(a){
          const e1=Math.max(diff(a[0],want.hour),diff(a[1],want.min)),e2=Math.max(diff(a[0],want.min),diff(a[1],want.hour));
          CK.err=Math.min(e1,e2);ok=CK.err<=CK.tol;
        }else CK.err=null;
      }
      if(ok)CK.hold+=dt;else CK.hold=Math.max(0,CK.hold-dt*2);
      if(CK.hold>=0.8){
        CK.done++;CK.state='result';CK.t=1.3;CK.msg='Đúng '+viet(CK.h,CK.m)+' rồi! 🎉';CK.msgT=1.3;sPop(true);burstAt(W/2,H*0.25,'#FFD84D',24);
        if(CK.done>=CK.need)setTimeout(()=>{if(state==='play'&&mode==='clock')levelUp()},1100);
      }else if(CK.t<=0){CK.state='result';CK.t=1.2;CK.msg='Hết giờ rồi! 😅';CK.msgT=1.2;sBuzz();loseHeart()}
    },
    draw(){
      const m=minDim,R=m*0.15,cx=W/2,cy=Math.max(H*0.26,TOPY()+R*1.1+4),want=handAngles();
      // mặt đồng hồ
      ctx.beginPath();ctx.arc(cx,cy,R*1.08,0,6.29);ctx.fillStyle='rgba(20,69,107,.25)';ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fillStyle='rgba(255,255,255,.96)';ctx.fill();ctx.lineWidth=m*0.012;ctx.strokeStyle='#14456B';ctx.stroke();
      for(let i=0;i<12;i++){const a=i*Math.PI/6,r1=R*(i%3===0?0.8:0.88);ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*r1,cy-Math.cos(a)*r1);ctx.lineTo(cx+Math.sin(a)*R*0.95,cy-Math.cos(a)*R*0.95);ctx.lineWidth=i%3===0?m*0.008:m*0.004;ctx.strokeStyle='#14456B';ctx.stroke()}
      ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(R*0.3)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';
      [[12,0],[3,90],[6,180],[9,270]].forEach(([n,a])=>{const r=R*0.66,rr=a*Math.PI/180;ctx.fillText(n,cx+Math.sin(rr)*r,cy-Math.cos(rr)*r)});
      const hand=(deg,len,w,col)=>{const r=deg*Math.PI/180;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(r)*R*len,cy-Math.cos(r)*R*len);ctx.lineWidth=w;ctx.lineCap='round';ctx.strokeStyle=col;ctx.stroke()};
      hand(want.hour,0.5,m*0.014,'#FF8A3D');hand(want.min,0.78,m*0.009,'#3C9BFF');
      ctx.beginPath();ctx.arc(cx,cy,m*0.008,0,6.29);ctx.fillStyle='#14456B';ctx.fill();
      if(CK.state!=='wait'){
        lblText('Mấy giờ? '+viet(CK.h,CK.m),cx,cy+R+m*0.075,m*0.055,'#fff');
        lblText('Hai tay làm kim: tay cam = kim giờ, tay xanh = kim phút (đổi tay cũng được)',cx,cy+R+m*0.125,m*0.026,'#fff');
        bar(cx-m*0.25,cy+R+m*0.145,m*0.5,m*0.016,CK.state==='ask'?CK.t/CK.limit:0,CK.t/CK.limit<0.3?'#FF4D5E':'#8B6FEA');
        if(CK.hold>0)bar(cx-m*0.15,cy+R+m*0.17,m*0.3,m*0.012,CK.hold/0.8,'#35E08B');
      }
      if(CK.msgT>0)lblText(CK.msg,cx,H*0.72,m*0.05,'#FFE98A');
    },
  });
})();

/* ============================================================
   CHIM VỖ TAY — vỗ tay để chú chim bay lên, luồn qua khe hở giữa các cột
   ============================================================ */
(function(){
  const CP={y:0.5,vy:0,pipes:[],passed:0,need:5,scroll:0,inv:0,sinceSpawn:0,flapAt:-1e9,apartAt:-1e9,clapAt:-1e9,flash:0,started:false};
  const speed=()=>W*lerp(0.26,0.46,lvlT());
  const gapH=()=>lerp(0.40,0.29,lvlT());
  function flap(){CP.vy=-0.52;CP.flapAt=performance.now();tone(560,820,.1,.14,'sine')}
  function resetBird(){CP.y=0.5;CP.vy=0;CP.inv=1.4}
  registerGame({
    id:'clap',name:'Chim Vỗ Tay',needs:'pose',motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Vỗ hai tay vào nhau để chú chim vỗ cánh bay lên, luồn qua khe giữa các cột nhé!',go:'Vỗ tay nào! 👏',dbg:()=>CP,
    begin(){hearts=heartsMax=3;CP.pipes=[];CP.passed=0;CP.need=5+Math.floor(level/3);CP.sinceSpawn=W*0.4;CP.flash=0;resetBird();CP.started=false},
    hud(){return {score:CP.passed+'/'+CP.need,icon:'🐦',hearts:[hearts,heartsMax]}},
    update(dt){
      const now=performance.now();
      // nhận biết vỗ tay: hai cổ tay tách xa rồi chụm lại sát nhau
      const b=Track.body('solo');
      if(b){
        const d=Track.dist(b.p[15],b.p[16])/b.torso;
        if(d>0.95)CP.apartAt=now;
        if(d<0.5&&now-CP.apartAt<700&&now-CP.clapAt>260&&b.p[15].v>0.4&&b.p[16].v>0.4){CP.clapAt=now;CP.apartAt=-1e9;flap();CP.started=true}
      }
      if(!CP.started){return}
      CP.vy=Math.min(0.75,CP.vy+1.25*dt);CP.y+=CP.vy*dt;CP.inv=Math.max(0,CP.inv-dt);CP.flash=Math.max(0,CP.flash-dt);
      CP.scroll+=speed()*dt;CP.sinceSpawn+=speed()*dt;
      if(CP.sinceSpawn>=W*0.62){CP.sinceSpawn=0;CP.pipes.push({x:W+minDim*0.1,gy:rand(0.3,0.7),passed:false})}
      const bx=W*0.25,br=minDim*0.04;
      for(let i=CP.pipes.length-1;i>=0;i--){
        const p=CP.pipes[i];p.x-=speed()*dt;
        if(p.x<-minDim*0.2){CP.pipes.splice(i,1);continue}
        const pw=minDim*0.1;
        if(!p.passed&&p.x+pw/2<bx-br){p.passed=true;CP.passed++;sPop(false);floatAt(bx,CP.y*H-minDim*0.08,'+1');if(CP.passed>=CP.need){levelUp();return}}
        if(CP.inv<=0&&bx+br>p.x-pw/2&&bx-br<p.x+pw/2){
          const top=(p.gy-gapH()/2)*H,bot=(p.gy+gapH()/2)*H,by=CP.y*H;
          if(by-br<top||by+br>bot){CP.flash=0.4;sBuzz();loseHeart();if(state!=='play')return;resetBird()}
        }
      }
      if(CP.y>0.97||CP.y<0.02){if(CP.inv<=0){CP.flash=0.4;sBuzz();loseHeart();if(state!=='play')return}resetBird()}
    },
    tap(){CP.started=true;flap()},
    draw(){
      const m=minDim,bx=W*0.25;
      for(const p of CP.pipes){
        const pw=m*0.1,top=(p.gy-gapH()/2)*H,bot=(p.gy+gapH()/2)*H;
        ctx.fillStyle='rgba(70,180,90,.95)';ctx.fillRect(p.x-pw/2,0,pw,top);ctx.fillRect(p.x-pw/2,bot,pw,H-bot);
        ctx.fillStyle='rgba(40,140,60,.95)';ctx.fillRect(p.x-pw*0.62,top-m*0.03,pw*1.24,m*0.03);ctx.fillRect(p.x-pw*0.62,bot,pw*1.24,m*0.03);
      }
      ctx.save();
      if(CP.inv>0&&((CP.inv*10)|0)%2===0)ctx.globalAlpha=0.4;
      emo('🐦',bx,CP.y*H,m*0.11,clamp(CP.vy*0.6,-0.6,0.9));
      ctx.restore();
      if(!CP.started)lblText('👏 Vỗ hai tay vào nhau để chim bay lên!',W/2,H*0.4,m*0.05,'#fff');
      if(CP.flash>0){ctx.fillStyle='rgba(255,70,90,'+(CP.flash*0.35).toFixed(3)+')';ctx.fillRect(0,0,W,H)}
    },
  });
})();

/* ============================================================
   NHẢY CHỮ — nghe / đọc từ rồi bước tới đúng viên đá có từ đó
   ============================================================ */
(function(){
  const WORDS=[
    ['BA','👨'],['MẸ','👩'],['BÉ','👶'],['CÁ','🐟'],['GÀ','🐔'],['BÒ','🐮'],['XE','🚗'],['VỊT','🦆'],['HEO','🐷'],['CHÓ','🐶'],['MÈO','🐱'],['THỎ','🐰'],
    ['HOA','🌸'],['NHÀ','🏠'],['TÁO','🍎'],['CAM','🍊'],['SAO','⭐'],['MƯA','🌧️'],['CÂY','🌳'],['VOI','🐘'],['KHỈ','🐵'],['ẾCH','🐸'],['RÙA','🐢'],['NẮNG','☀️'],
  ].map(w=>[w[0].normalize('NFC'),w[1]]);
  const WD={sg:null,q:null,state:'wait',t:0,limit:9,done:0,need:5,hold:0,sel:-1,lock:-1,msg:'',msgT:0,last:''};
  const stoneX=i=>W*(0.2+i*0.3);
  const colOf=x=>x<0.37?0:x>0.63?2:1;
  const nOpts=()=>level<6?2:3;
  function ask(){
    let w;do{w=pick(WORDS)}while(w[0]===WD.last);WD.last=w[0];
    const n=nOpts(),others=sample(WORDS.filter(x=>x[0]!==w[0]),n-1);
    const opts=shuffle([w].concat(others));
    WD.q={word:w[0],emoji:w[1],opts:opts.map(o=>o[0]),correct:opts.findIndex(o=>o[0]===w[0])};
    WD.t=WD.limit;WD.hold=0;WD.sel=-1;WD.lock=-1;WD.state='ask';
    Voice.say(w[0].toLowerCase());
  }
  registerGame({
    id:'words',name:'Nhảy Chữ',needs:'pose',motion:false,touch:true,trackOpts:{numPoses:1},
    intro:'Nhìn hình rồi bước tới viên đá có đúng từ nhé! Đứng yên một chút để chốt đáp án.',go:'Nhảy chữ nào! 🪨',dbg:()=>WD,
    start(){WD.sg=Sig.make('solo');WD.last=''},
    begin(){hearts=heartsMax=3;WD.done=0;WD.need=5+Math.floor(level/4);WD.limit=lerp(10,6,lvlT());WD.state='wait';WD.t=0.8;WD.q=null;WD.msgT=0},
    hud(){return {score:WD.done+'/'+WD.need,icon:'🔤',hearts:[hearts,heartsMax]}},
    update(dt){
      const sg=WD.sg.update(dt);WD.msgT=Math.max(0,WD.msgT-dt);
      if(WD.state==='wait'){WD.t-=dt;if(WD.t<=0)ask();return}
      if(WD.state==='result'){WD.t-=dt;if(WD.t<=0&&WD.done<WD.need&&state==='play'){WD.state='wait';WD.t=0.4}return}
      WD.t-=dt;
      if(camOn&&sg.ok){
        const col=WD.q.opts.length===2?(sg.x<0.5?0:1):colOf(sg.x);
        if(col===WD.sel)WD.hold+=dt;else{WD.sel=col;WD.hold=0}
        if(WD.hold>=0.8)WD.lock=col;
      }
      if(WD.lock>=0||WD.t<=0){
        const ok=WD.lock===WD.q.correct;
        WD.state='result';WD.t=1.5;WD.msgT=1.5;
        if(ok){WD.done++;WD.msg='Đúng rồi! '+WD.q.word+' 🎉';sPop(true);burstAt(stoneX(WD.q.correct),H*0.75,'#FFD84D',22);
          if(WD.done>=WD.need)setTimeout(()=>{if(state==='play'&&mode==='words')levelUp()},1100)}
        else{WD.msg=WD.lock<0?'Hết giờ! Từ đúng là “'+WD.q.word+'”':'Chưa đúng! Từ đúng là “'+WD.q.word+'”';sBuzz();loseHeart()}
      }
    },
    tap(x,y){
      if(WD.state!=='ask'||camOn)return;
      const n=WD.q.opts.length,col=n===2?(x<0.5?0:1):colOf(x);WD.lock=col;
    },
    draw(){
      const m=minDim,q=WD.q;if(!q)return;
      // hình gợi ý
      const pw=m*0.5,ph=m*0.22,px=W/2-pw/2,py=TOPY();
      panel(px,py,pw,ph,m*0.035,'rgba(255,255,255,.93)','#8B6FEA',m*0.008);
      emo(q.emoji,W/2,py+ph*0.5,m*0.14);
      lblText('Từ nào đây?',W/2,py+ph+m*0.05,m*0.04,'#fff');
      bar(px,py+ph+m*0.07,pw,m*0.014,WD.state==='ask'?WD.t/WD.limit:0,WD.t/WD.limit<0.3?'#FF4D5E':'#8B6FEA');
      // các viên đá
      const n=q.opts.length,xs=n===2?[W*0.3,W*0.7]:[stoneX(0),stoneX(1),stoneX(2)];
      q.opts.forEach((w,i)=>{
        const x=xs[i],y=H*0.8,rx=m*0.17,ry=m*0.09,sel=WD.sel===i&&WD.state==='ask',res=WD.state==='result'&&i===q.correct;
        ctx.beginPath();ctx.ellipse(x,y+ry*0.25,rx,ry,0,0,6.29);ctx.fillStyle='rgba(20,69,107,.25)';ctx.fill();
        ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,6.29);ctx.fillStyle=res?'#7EE2A0':sel?'#FFE3A0':'#C9D3E0';ctx.fill();ctx.lineWidth=m*0.008;ctx.strokeStyle=sel?'#FF8A3D':'#8794A8';ctx.stroke();
        ctx.fillStyle='#14456B';ctx.font='800 '+Math.round(ry*0.95)+"px 'Baloo 2',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(w,x,y);
        if(sel&&WD.hold>0)bar(x-rx*0.6,y+ry*1.15,rx*1.2,m*0.014,WD.hold/0.8,'#35E08B');
      });
      if(WD.msgT>0)lblText(WD.msg,W/2,H*0.55,m*0.045,'#FFE98A');
    },
  });
})();
