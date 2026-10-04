'use strict';
/* ============================================================
   games-lib.js — bộ công cụ chung cho các trò chơi mới (nạp trước các file games-*.js)
   • vẽ: lblText, emo, bar, panel      • giọng đọc tiếng Việt (nếu máy có): Voice
   • Ptr: "con trỏ" lấy từ cổ tay / đầu ngón tay / chuột     • touchedBy(): chạm vòng tròn bằng AI hoặc chuyển động
   • Sig: tín hiệu nhảy / cúi / chạy / vị trí đứng            • Drum: tiếng trống tổng hợp
   • pick/shuffle/QUIZ: câu hỏi cho các trò học
   ============================================================ */

/* ---------- vẽ ---------- */
function lblText(text,x,y,size,fill,align){
  ctx.font='800 '+Math.round(size)+"px 'Baloo 2',sans-serif";
  ctx.textAlign=align||'center';ctx.textBaseline='alphabetic';
  ctx.lineWidth=Math.max(4,size*0.16);ctx.lineJoin='round';
  ctx.strokeStyle='rgba(20,69,107,.55)';ctx.strokeText(text,x,y);
  ctx.fillStyle=fill||'#fff';ctx.fillText(text,x,y);
}
function floatAt(px,py,text,bad){floats.push({x:px,y:py,t:0,text,bad:!!bad,star:false})}
/** vẽ emoji/chữ căn giữa, size px, xoay rot (rad) */
function emo(ch,x,y,size,rot,alpha){
  ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);if(alpha!=null)ctx.globalAlpha=alpha;
  ctx.font=Math.round(size)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(ch,0,size*0.04);ctx.restore();
}
function bar(x,y,w,h,pct,fill,bg){
  roundRectPath(x,y,w,h,h/2);ctx.fillStyle=bg||'rgba(255,255,255,.55)';ctx.fill();
  if(pct>0){roundRectPath(x,y,Math.max(h,w*Math.min(1,pct)),h,h/2);ctx.fillStyle=fill;ctx.fill()}
}
function panel(x,y,w,h,r,fill,stroke,lw){
  roundRectPath(x,y,w,h,r);ctx.fillStyle=fill||'rgba(255,255,255,.88)';ctx.fill();
  if(stroke){ctx.lineWidth=lw||3;ctx.strokeStyle=stroke;ctx.stroke()}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** mép trên an toàn cho bảng chữ / thanh trạng thái, tránh các nút tròn điểm - cấp - thời gian ở trên cùng (kể cả điện thoại nằm ngang, cao ~380px) */
const TOPY=()=>Math.max(minDim*0.1,H<500?50:66);
const pick=a=>a[(Math.random()*a.length)|0];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function sample(a,n){return shuffle(a).slice(0,n)}

/* ---------- giọng đọc tiếng Việt (chỉ dùng khi máy có giọng vi-VN) ---------- */
const Voice=(()=>{
  let vi=null;
  function find(){try{vi=speechSynthesis.getVoices().find(v=>/^vi/i.test(v.lang))||null}catch(e){}}
  try{if('speechSynthesis' in window){find();if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',find)}}catch(e){}
  return {
    get ok(){return !!vi},
    say(text,o){
      if(muted||!vi)return false;
      try{
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(text);u.voice=vi;u.lang=vi.lang;
        u.rate=(o&&o.rate)||0.85;u.pitch=(o&&o.pitch)||1.15;speechSynthesis.speak(u);return true;
      }catch(e){return false}
    },
    stop(){try{speechSynthesis.cancel()}catch(e){}},
  };
})();

/* ---------- con trỏ: cổ tay + đầu ngón (khung xương), đầu ngón trỏ (bàn tay), chuột/chạm ---------- */
const Ptr=(()=>{
  const mem={};
  let cache=null,cacheFrame=-1;
  const touch={x:0,y:0,t:-1e9,down:false,vx:0,vy:0,sp:0,px:0,py:0,pt:0};
  function track(key,x,y,src,now,extra){
    let m=mem[key];
    if(!m){m=mem[key]={x,y,t:now,src,vx:0,vy:0,sp:0}}
    else if(m.src!==src){
      const dt=(now-m.t)/1000;
      if(dt>0.001&&dt<0.5){
        const vx=(x-m.x)/dt,vy=(y-m.y)/dt;
        m.vx+=(vx-m.vx)*0.6;m.vy+=(vy-m.vy)*0.6;
      }else{m.vx=0;m.vy=0}
      m.sp=Math.hypot(m.vx,m.vy)/minDim;
      m.x=x;m.y=y;m.t=now;m.src=src;
    }
    return Object.assign({key,x,y,vx:m.vx,vy:m.vy,sp:m.sp,r:minDim*0.045},extra);
  }
  function list(){
    if(cacheFrame===frame&&cache)return cache;
    const out=[],now=performance.now();
    if(useAI&&Track.active==='pose'){
      Track.bodies.forEach((b,bi)=>{
        for(const j of [15,16,19,20]){
          const q=b.p[j];if(!q||q.v<0.4)continue;
          if(j>=19&&b.p[j-4].v<0.4)continue;
          out.push(track('p'+bi+'_'+j,q.x*W,q.y*H,b,now,{kind:j<19?'wrist':'tip',bi,j,side:(j===15||j===19)?'L':'R',z:q.z}));
        }
      });
    }else if(useAI&&Track.active==='hand'){
      Track.hands.forEach((h,hi)=>{
        const q=h.tip;
        out.push(track('h'+hi,q.x*W,q.y*H,h,now,{kind:'tip',hi,hand:h,r:minDim*0.04}));
      });
    }
    if(now-touch.t<350||touch.down)out.push({key:'touch',x:touch.x,y:touch.y,vx:touch.vx,vy:touch.vy,sp:touch.sp,r:minDim*0.05,kind:'touch',down:touch.down});
    cache=out;cacheFrame=frame;return out;
  }
  function onMove(e){
    const now=performance.now(),dt=(now-touch.pt)/1000;
    if(dt>0.001&&dt<0.3){touch.vx=(e.clientX-touch.px)/dt;touch.vy=(e.clientY-touch.py)/dt;touch.sp=Math.hypot(touch.vx,touch.vy)/minDim}
    touch.px=touch.x=e.clientX;touch.py=touch.y=e.clientY;touch.pt=touch.t=now;
  }
  canvas.addEventListener('pointerdown',e=>{touch.down=true;touch.sp=0;touch.vx=touch.vy=0;touch.pt=performance.now();touch.px=touch.x=e.clientX;touch.py=touch.y=e.clientY;touch.t=touch.pt});
  canvas.addEventListener('pointermove',e=>{if(touch.down||e.buttons)onMove(e)});
  window.addEventListener('pointerup',()=>{touch.down=false});
  return {list,touch,reset(){for(const k in mem)delete mem[k];cache=null}};
})();

/** trung tâm vùng chuyển động quanh vòng tròn (px) — dùng cho chế độ dự phòng không có AI */
function motionCentroid(cx,cy,r){
  if(!trail)return null;
  const s=AW/W,gx=cx*s,gy=cy*s,gr=Math.max(2,r*s);
  let sx=0,sy=0,n=0;
  for(let y=Math.max(0,Math.floor(gy-gr));y<=Math.min(AH-1,Math.ceil(gy+gr));y++){
    for(let x=Math.max(0,Math.floor(gx-gr));x<=Math.min(AW-1,Math.ceil(gx+gr));x++){
      if((x-gx)*(x-gx)+(y-gy)*(y-gy)>gr*gr||trail[y*AW+x]<=0.3)continue;
      sx+=x;sy+=y;n++;
    }
  }
  return n>=3?{x:sx/n/s,y:sy/n/s,n}:null;
}
/** có con trỏ AI (hoặc chuyển động, khi không có AI) chạm vào vòng tròn (cx,cy,r) không? Trả {hit,fx,fy,sp,p} (fx,fy = hướng đẩy từ tay ra khỏi tâm) */
function touchedBy(cx,cy,r,o){
  o=o||{};
  if(Track.active&&useAI){
    for(const p of Ptr.list()){
      if(o.minSpeed&&p.sp<o.minSpeed)continue;
      if(Math.hypot(p.x-cx,p.y-cy)<r+p.r)return {hit:true,fx:cx-p.x,fy:cy-p.y,sp:p.sp,p};
    }
    return {hit:false};
  }
  if(camOn&&!o.aiOnly){
    const m=motionAt({x:cx/W,y:cy/H,r:r/minDim});
    if(m.cnt>=3&&m.density>=SENS_TH[sens]&&m.density>=motionRatio*1.4){
      const c=motionCentroid(cx,cy,r*1.15);
      return {hit:true,fx:c?cx-c.x:0,fy:c?cy-c.y:-1,sp:0.8,p:null};
    }
  }
  // chuột / chạm màn hình (một cú chạm không cần "vung nhanh"; riêng trò cắt cần vuốt thì truyền swipe:true)
  for(const p of Ptr.list()){
    if(p.kind!=='touch')continue;
    if(o.minSpeed&&o.swipe&&p.sp<o.minSpeed)continue;
    if(Math.hypot(p.x-cx,p.y-cy)<r+p.r)return {hit:true,fx:cx-p.x,fy:cy-p.y,sp:p.sp,p};
  }
  return {hit:false};
}

/* ---------- tín hiệu thân người cho các trò chạy: nhảy / cúi / chạy / vị trí đứng ---------- */
const Sig={
  make(side,o){
    const S={
      side,sig:Body.signals(o),upperT:9,lowerT:9,fullT:9,ok:false,x:0.5,
      jump:false,duck:false,run:false,jumpEdge:false,duckEdge:false,_pj:false,_pd:false,energy:0,jumpAt:-1e9,duckAt:-1e9,x0:null,
      reset(){this.sig.reset();this.upperT=this.lowerT=this.fullT=9;this._pj=this._pd=false;this.x0=null},
      /** vị trí đứng so với chỗ đứng ban đầu (−0,5..0,5): âm = sang trái màn hình; tự hiệu chỉnh quanh chỗ bé đứng */
      lean(dt){
        if(this.x0==null)this.x0=this.x;
        const d=this.x-this.x0;
        if(Math.abs(d)<0.05)this.x0+=d*Math.min(1,dt*0.6);   // đứng giữa lâu thì dời tâm theo
        return d;
      },
      update(dt){
        this.upperT+=dt;this.lowerT+=dt;this.fullT+=dt;
        let j=false,d=false,r=false;
        if(useAI&&Track.active==='pose'){
          const b=Track.body(side||'solo');
          this.sig.update(b,performance.now());
          this.ok=!!b;this.x=b?b.cx:this.x;
          j=this.sig.jump;d=this.sig.duck;r=this.sig.run;this.energy=this.sig.energy;
        }else if(camOn){
          this.ok=true;
          const x0=side==='left'?0:side==='right'?0.5:0,x1=side==='left'?0.5:side==='right'?1:1;
          const dUp=zoneDensity(x0,0.05,x1,0.42),dLow=zoneDensity(x0,0.55,x1,0.95),dAll=zoneDensity(x0,0.05,x1,0.95),TH=ZONE_TH[sens];
          if(dUp>=TH*1.4&&dUp>dLow*1.3)this.upperT=0;
          if(dLow>=TH*1.4&&dLow>dUp*1.3)this.lowerT=0;
          if(dAll>=TH*1.8)this.fullT=0;
          j=this.upperT<0.3;d=this.lowerT<0.3;r=this.fullT<0.5;this.energy=Math.max(dUp,dLow,dAll)*20;
          this.x=0.5;
        }
        this.jumpEdge=j&&!this._pj;this.duckEdge=d&&!this._pd;this._pj=j;this._pd=d;
        this.jump=j;this.duck=d;this.run=r;
        const now=performance.now();
        if(j)this.jumpAt=now;
        if(d)this.duckAt=now;
        return this;
      },
    };
    return S;
  },
};

/* ---------- tiếng trống tổng hợp (Trống Trên Không, Nhịp Squat, Đấm Bốc Theo Nhịp…) ---------- */
const Drum={
  hit(kind,vol){
    if(muted)return;const a=ac();if(!a)return;const t=a.currentTime+0.001,v=vol||1;
    try{
      if(kind==='kick'){
        const o=a.createOscillator(),g=a.createGain();o.type='sine';
        o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.16);
        g.gain.setValueAtTime(0.7*v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
        o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+0.25);
      }else if(kind==='snare'||kind==='crash'||kind==='hat'){
        const len=kind==='crash'?0.7:kind==='snare'?0.18:0.06;
        const buf=a.createBuffer(1,Math.floor(a.sampleRate*len),a.sampleRate),d=buf.getChannelData(0);
        for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,kind==='crash'?1.2:2);
        const src=a.createBufferSource();src.buffer=buf;
        const f=a.createBiquadFilter();f.type=kind==='snare'?'bandpass':'highpass';f.frequency.value=kind==='snare'?1800:kind==='crash'?4500:7500;
        const g=a.createGain();g.gain.setValueAtTime((kind==='snare'?0.5:kind==='crash'?0.35:0.25)*v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
        src.connect(f);f.connect(g);g.connect(a.destination);src.start(t);src.stop(t+len+0.02);
        if(kind==='snare'){tone(210,120,0.1,0.25*v,'triangle')}
      }else{ // tom1, tom2 (cao / thấp)
        const f0=kind==='tom1'?260:170,o=a.createOscillator(),g=a.createGain();o.type='sine';
        o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*0.55,t+0.22);
        g.gain.setValueAtTime(0.55*v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.28);
        o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+0.3);
      }
    }catch(e){}
  },
};

/* ---------- câu hỏi cho các trò học (tiếng Việt, hợp lứa tuổi 4–6) ---------- */
const QUIZ=(()=>{
  const ANIMALS=[['🐶','Chó'],['🐱','Mèo'],['🐔','Gà'],['🦆','Vịt'],['🐮','Bò'],['🐷','Heo'],['🐘','Voi'],['🐯','Hổ'],['🦁','Sư tử'],['🐵','Khỉ'],['🐰','Thỏ'],['🐟','Cá'],['🐸','Ếch'],['🐢','Rùa'],['🦒','Hươu cao cổ'],['🐼','Gấu trúc']];
  const COLORS=[['#FF4D5E','Đỏ'],['#FFB13D','Cam'],['#FFD84D','Vàng'],['#3BC97A','Xanh lá'],['#3C9BFF','Xanh dương'],['#9B6BFF','Tím'],['#FF7EB6','Hồng']];
  const SHAPES=[['🔴','Hình tròn'],['🟦','Hình vuông'],['🔺','Tam giác'],['⭐','Ngôi sao'],['❤️','Trái tim']];
  const SPACE=[['🌍','Trái Đất'],['🌙','Mặt Trăng'],['☀️','Mặt Trời'],['🪐','Sao Thổ'],['🚀','Tên lửa'],['⭐','Ngôi sao']];
  const FRUITS=['🍎','🍊','🍋','🍇','🍓','🍉','🍌','🍍'];
  const num=n=>({text:String(n)});
  function opts(correct,pool,n,fmt){
    const wrong=sample(pool.filter(x=>JSON.stringify(x)!==JSON.stringify(correct)),n-1);
    const all=shuffle([correct].concat(wrong));
    return {options:all.map(fmt),correct:all.findIndex(x=>JSON.stringify(x)===JSON.stringify(correct))};
  }
  /** topic: count|math|color|animal|shape|space|letter ; n = số đáp án (2–3) ; lv = cấp 1..30 */
  function make(topic,n,lv){
    n=n||2;lv=lv||1;
    if(topic==='count'){
      const mx=lv<8?4:lv<16?7:10,c=1+((Math.random()*mx)|0),f=pick(FRUITS);
      const pool=[];for(let i=1;i<=Math.max(mx,4)+2;i++)pool.push(i);
      const o=opts(c,pool,n,x=>num(x));
      return {prompt:'Có mấy quả?',art:f.repeat(c),artSize:0.9,...o,say:'Có mấy quả?'};
    }
    if(topic==='math'){
      const mx=lv<8?4:lv<16?6:lv<24?9:12,sub=lv>=10&&Math.random()<0.4;
      let a,b,ans,text;
      if(sub){a=2+((Math.random()*(mx-1))|0);b=1+((Math.random()*(a-1))|0);ans=a-b;text=a+' − '+b+' = ?'}
      else{a=1+((Math.random()*(mx-1))|0);b=1+((Math.random()*(mx-a))|0)||1;ans=a+b;text=a+' + '+b+' = ?'}
      const pool=[];for(let i=Math.max(0,ans-3);i<=ans+3;i++)if(i>=0)pool.push(i);
      const o=opts(ans,pool,n,x=>num(x));
      return {prompt:text,art:'',...o,say:text.replace('+','cộng').replace('−','trừ').replace('= ?','bằng mấy?')};
    }
    if(topic==='color'){
      const c=pick(COLORS);
      const o=opts(c,COLORS,n,x=>({text:x[1]}));
      return {prompt:'Đây là màu gì?',swatch:c[0],...o,say:'Đây là màu gì?'};
    }
    if(topic==='animal'){
      const c=pick(ANIMALS);
      const o=opts(c,ANIMALS,n,x=>({text:x[1]}));
      return {prompt:'Con gì đây?',art:c[0],artSize:1.4,...o,say:'Con gì đây?'};
    }
    if(topic==='shape'){
      const c=pick(SHAPES);
      const o=opts(c,SHAPES,n,x=>({text:x[1]}));
      return {prompt:'Hình gì đây?',art:c[0],artSize:1.4,...o,say:'Hình gì đây?'};
    }
    if(topic==='space'){
      const c=pick(SPACE);
      const o=opts(c,SPACE,n,x=>({text:x[1]}));
      return {prompt:'Đây là gì?',art:c[0],artSize:1.4,...o,say:'Đây là gì?'};
    }
    // letter: tìm chữ cái được gọi tên
    const L='ABCDEGHIKLMNOPQRSTUVXY'.split(''),c=pick(L);
    const o=opts(c,L,n,x=>({text:x}));
    return {prompt:'Chữ nào là '+c+'?',art:'',...o,say:'Chữ '+c};
  }
  const TOPICS=['count','math','color','animal','shape','space','letter'];
  return {make,TOPICS,ANIMALS,COLORS,SHAPES,FRUITS};
})();

/** vẽ con trỏ AI (cổ tay / đầu ngón tay) bằng một emoji, để bé thấy máy đang "thấy tay" ở đâu */
function drawPtrs(ch,size){
  if(!useAI)return;
  for(const p of Ptr.list()){
    if(p.kind==='touch'&&!p.down)continue;
    emo(ch||'✋',p.x,p.y,size||minDim*0.07,0,0.92);
  }
}
