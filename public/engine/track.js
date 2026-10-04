'use strict';
/* ============================================================
   track.js — nhận diện cơ thể / bàn tay / khuôn mặt ngay trên máy
   (MediaPipe Tasks Vision; thư viện và model nằm sẵn trong vendor/ và models/
    nên không gọi mạng ngoài, hình camera không rời khỏi thiết bị)

   • Nạp lười: chỉ tải khi trò chơi cần, có tiến độ để hiện thanh chờ.
   • Toạ độ trả ra là TOẠ ĐỘ MÀN HÌNH 0..1 theo canvas, đã lật gương như hình camera hiển thị
     → bên PHẢI của người chơi (khớp 12/14/16…) nằm ở x lớn hơn.
   • Máy không chạy nổi (không có WebAssembly, hết bộ nhớ…) → use() trả false,
     trò chơi tự quay về cách phát hiện chuyển động cũ.
   ============================================================ */
const Track=(()=>{
  const BUNDLE='/vendor/mediapipe/vision_bundle.mjs';
  const WASM_DIR='/vendor/mediapipe/wasm';
  const MODELS={
    pose:{url:'/models/pose_landmarker_lite.task',bytes:5777746},
    hand:{url:'/models/hand_landmarker.task',bytes:7819105},
    face:{url:'/models/face_landmarker.task',bytes:3758596},
  };
  const WASM_BYTES=11756954;
  const abs=p=>new URL(p,location.origin).href;   // thư viện nằm ở /vendor, model ở /models (gốc của trang web)

  let mp=null,fileset=null,wasmWarm=false;
  const lm={pose:null,hand:null,face:null};
  const status={pose:'idle',hand:'idle',face:'idle'};
  const delegate={pose:'',hand:'',face:''};
  const loading={};
  const opt={numPoses:2,numHands:2,numFaces:1};
  let active=null,err='',injected=false,progCb=null;
  let CW=1,CH=1,AR=1,VW=0,VH=0;
  let lastVT=-1,lastRun=0,lastTs=0,gap=30,avgMs=0,runs=0,fpsT=0,fpsN=0,fps=0,fails=0,tData=-1e9;
  const seen={pose:-1e9,hand:-1e9,face:-1e9};
  let bodies=[],hands=[],faces=[];

  const supported=()=>typeof WebAssembly==='object'&&typeof WebAssembly.instantiate==='function'&&typeof fetch==='function';
  const hasSimd=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))}catch(e){return false}};
  const dist=(a,b)=>Math.hypot((a.x-b.x)*AR,a.y-b.y);
  const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  function prog(f,msg){ if(progCb)try{progCb(Math.max(0,Math.min(1,f)),msg||'')}catch(e){} }

  /* ---------- tải file có tiến độ ---------- */
  async function fetchBytes(url,onBytes,keep){
    const res=await fetch(url,{cache:'force-cache'});
    if(!res.ok)throw new Error('HTTP '+res.status+' '+url);
    if(!res.body||!res.body.getReader){
      const ab=await res.arrayBuffer(); onBytes(ab.byteLength); return keep?ab:null;
    }
    const rd=res.body.getReader(),chunks=[];let got=0;
    for(;;){
      const {done,value}=await rd.read(); if(done)break;
      got+=value.length; onBytes(value.length); if(keep)chunks.push(value);
    }
    if(!keep)return null;
    const out=new Uint8Array(got);let o=0;
    for(const c of chunks){out.set(c,o);o+=c.length}
    return out.buffer;
  }

  async function create(kind,ab){
    const Cls={pose:mp.PoseLandmarker,hand:mp.HandLandmarker,face:mp.FaceLandmarker}[kind];
    const extra={
      pose:{numPoses:opt.numPoses,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5},
      hand:{numHands:opt.numHands,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5},
      face:{numFaces:opt.numFaces,outputFaceBlendshapes:true,minFaceDetectionConfidence:.5,minFacePresenceConfidence:.5,minTrackingConfidence:.5},
    }[kind];
    let last;
    for(const del of (delegate[kind]==='CPU'?['CPU']:['GPU','CPU'])){
      try{
        const o=await Cls.createFromOptions(fileset,{
          baseOptions:{modelAssetBuffer:new Uint8Array(ab.slice(0)),delegate:del},
          runningMode:'VIDEO',...extra});
        delegate[kind]=del; return o;
      }catch(e){last=e;console.warn('[Track] '+kind+' '+del+' lỗi',e)}
    }
    throw last;
  }
  const buffers={};
  async function load(kind){
    status[kind]='loading';
    try{
      let done=0;
      const need=(wasmWarm?0:WASM_BYTES)+MODELS[kind].bytes;
      const add=n=>{done+=n;prog(0.04+0.9*Math.min(1,done/need),'Đang tải bộ nhận diện…')};
      prog(0.02,'Đang nạp thư viện…');
      if(!mp)mp=await import(abs(BUNDLE));
      if(!fileset){
        const name='vision_wasm'+(hasSimd()?'':'_nosimd')+'_internal';
        if(!wasmWarm){await fetchBytes(abs(WASM_DIR+'/'+name+'.wasm'),add,false);wasmWarm=true}
        fileset=await mp.FilesetResolver.forVisionTasks(abs(WASM_DIR));
      }
      if(!buffers[kind])buffers[kind]=await fetchBytes(abs(MODELS[kind].url),add,true);
      prog(0.96,'Đang khởi động…');
      lm[kind]=await create(kind,buffers[kind]);
      status[kind]='ready';prog(1,'Xong');
      return true;
    }catch(e){
      status[kind]='failed';err=String(e&&e.message||e);console.warn('[Track] không nạp được '+kind,e);
      return false;
    }
  }

  /* ---------- API nạp / chọn bộ nhận diện ---------- */
  async function use(kind,onProgress,o){
    if(o)Object.assign(opt,o);
    progCb=onProgress||null;
    if(!supported()){status[kind]='failed';err='Trình duyệt không hỗ trợ WebAssembly';return false}
    if(status[kind]==='failed'&&o&&o.retry){status[kind]='idle';delegate[kind]=''}
    if(status[kind]==='failed')return false;
    if(status[kind]!=='ready'){
      if(!loading[kind])loading[kind]=load(kind).finally(()=>{delete loading[kind]});
      const ok=await loading[kind];
      if(!ok)return false;
    }else if(o&&(o.numPoses||o.numHands||o.numFaces)){
      try{ // đổi số người/tay/mặt tối đa mà không phải nạp lại model
        if(kind==='pose'&&o.numPoses)await lm.pose.setOptions({numPoses:o.numPoses});
        if(kind==='hand'&&o.numHands)await lm.hand.setOptions({numHands:o.numHands});
        if(kind==='face'&&o.numFaces)await lm.face.setOptions({numFaces:o.numFaces});
      }catch(e){}
    }
    active=kind;bodies=[];hands=[];faces=[];lastVT=-1;fails=0;runs=0;avgMs=0;gap=30;
    return true;
  }
  function stop(){active=null;bodies=[];hands=[];faces=[]}
  function preload(kind){ // tải ngầm (khi bé đang đọc hướng dẫn) để vào game không phải chờ
    if(!supported()||status[kind]!=='idle'||loading[kind])return;
    try{if(navigator.connection&&navigator.connection.saveData)return}catch(e){}
    loading[kind]=load(kind).finally(()=>{delete loading[kind]});
  }

  /* ---------- dựng dữ liệu cho trò chơi ---------- */
  function mapper(){
    const vr=VW/VH,cr=CW/CH;let sw,sh;
    if(vr>cr){sh=VH;sw=VH*cr}else{sw=VW;sh=VW/cr}
    const sx=(VW-sw)/2,sy=(VH-sh)/2;
    return (x,y)=>({x:1-(x*VW-sx)/sw,y:(y*VH-sy)/sh});
  }
  function mkBody(raw,map){
    if(!raw||raw.length<29)return null;
    const p=new Array(33);
    for(let i=0;i<33;i++){const q=raw[i],m=map(q.x,q.y);m.v=q.visibility==null?1:q.visibility;m.z=q.z||0;p[i]=m}
    const sh=mid(p[11],p[12]),hip=mid(p[23],p[24]);
    const torso=dist(sh,hip);
    if(!(torso>0.012))return null;
    return {p,sh,hip,torso,head:p[0],cx:(sh.x+hip.x)/2,cy:(sh.y+hip.y)/2,
      vis:(p[11].v+p[12].v+p[23].v+p[24].v)/4,
      legsVis:(p[25].v+p[26].v+p[27].v+p[28].v)/4,t:performance.now()};
  }
  const FEXT=1.28; // đầu ngón xa cổ tay hơn 1,28 lần khớp gốc ngón = đang duỗi (đo thực tế: ngón co ≤0,86, ngón duỗi ≥1,56)
  function mkHand(raw,map,label){
    if(!raw||raw.length<21)return null;
    const p=raw.map(q=>map(q.x,q.y));
    const palm={x:(p[0].x+p[5].x+p[9].x+p[13].x+p[17].x)/5,y:(p[0].y+p[5].y+p[9].y+p[13].y+p[17].y)/5};
    const size=dist(p[0],p[9]);
    if(!(size>0.004))return null;
    const ext=(tip,mcp)=>dist(p[0],p[tip])>dist(p[0],p[mcp])*FEXT;
    const palmW=dist(p[5],p[17])||size;
    const thumb=dist(p[4],p[5])>palmW*0.72&&dist(p[4],p[17])>dist(p[3],p[17]);
    const f=[thumb,ext(8,5),ext(12,9),ext(16,13),ext(20,17)];
    return {p,palm,size,f,count:f.filter(Boolean).length,tip:p[8],label,t:performance.now()};
  }
  function mkFace(raw,bs,map){
    if(!raw||raw.length<400)return null;
    const g=i=>map(raw[i].x,raw[i].y);
    const nose=g(1),fore=g(10),chin=g(152),cL=g(454),cR=g(234),eL=g(263),eR=g(33),mu=g(13),md=g(14),mL=g(291),mR=g(61);
    const w=dist(cL,cR),h=dist(fore,chin);
    if(!(w>0.008))return null;
    const bl={};
    if(bs&&bs.categories)for(const c of bs.categories)bl[c.categoryName]=c.score;
    return {nose,fore,chin,cL,cR,eL,eR,mouth:mid(mu,md),mL,mR,w,h,
      cx:(cL.x+cR.x)/2,cy:(fore.y+chin.y)/2,
      roll:Math.atan2(eR.y-eL.y,(eR.x-eL.x)*AR),
      open:bl.jawOpen||0,smile:((bl.mouthSmileLeft||0)+(bl.mouthSmileRight||0))/2,
      blinkL:bl.eyeBlinkLeft||0,blinkR:bl.eyeBlinkRight||0,pucker:bl.mouthPucker||0,bl,t:performance.now()};
  }

  /* ---------- chạy nhận diện mỗi khi có khung hình mới ---------- */
  function process(r,kind,now){
    const map=mapper();
    if(kind==='pose'){
      const out=[];
      for(const raw of (r.landmarks||[])){const b=mkBody(raw,map);if(b)out.push(b)}
      out.sort((a,b)=>a.cx-b.cx);
      bodies=out;if(out.length)seen.pose=now;
    }else if(kind==='hand'){
      const out=[];
      (r.landmarks||[]).forEach((raw,i)=>{
        const cat=(r.handedness||r.handednesses||[])[i];
        const h=mkHand(raw,map,cat&&cat[0]?cat[0].categoryName:'');if(h)out.push(h);
      });
      out.sort((a,b)=>a.palm.x-b.palm.x);
      hands=out;if(out.length)seen.hand=now;
    }else{
      const out=[];
      (r.faceLandmarks||[]).forEach((raw,i)=>{const f=mkFace(raw,(r.faceBlendshapes||[])[i],map);if(f)out.push(f)});
      out.sort((a,b)=>a.cx-b.cx);
      faces=out;if(out.length)seen.face=now;
    }
    tData=now;
  }
  function run(src,now,vw,vh){
    const L=lm[active];if(!L)return;
    VW=vw;VH=vh;
    let ts=Math.round(now);if(ts<=lastTs)ts=lastTs+1;lastTs=ts;
    const t0=performance.now();
    try{
      const r=L.detectForVideo(src,ts);
      process(r,active,now);fails=0;
    }catch(e){
      fails++;
      if(fails===3&&delegate[active]==='GPU'){ // GPU báo lỗi giữa chừng → thử lại bằng CPU
        const k=active;delegate[k]='CPU';
        try{L.close()}catch(_){}
        lm[k]=null;status[k]='loading';
        create(k,buffers[k]).then(o=>{lm[k]=o;status[k]='ready';fails=0}).catch(()=>{status[k]='failed'});
      }else if(fails>=8){status[active]='failed';err=String(e&&e.message||e)}
    }
    const ms=performance.now()-t0;
    if(++runs>2)avgMs=avgMs?avgMs*0.9+ms*0.1:ms; // bỏ 2 lần đầu: khởi tạo GPU có thể mất vài giây
    gap=Math.max(28,Math.min(110,avgMs));  // tối đa ~1/2 thời gian CPU dành cho nhận diện
    fpsN++;if(now-fpsT>1000){fps=fpsN*1000/(now-fpsT);fpsN=0;fpsT=now}
  }
  function update(video,now,W,H){
    if(!active||injected)return;
    if(!lm[active])return;
    CW=W||CW;CH=H||CH;AR=CW/CH;
    if(video.readyState<2||!video.videoWidth)return;
    if(now-lastRun<gap)return;
    if(video.currentTime===lastVT)return;
    lastVT=video.currentTime;lastRun=now;
    run(video,now,video.videoWidth,video.videoHeight);
  }

  /* ---------- truy vấn ---------- */
  const fresh=()=>performance.now()-tData<600;
  function body(side){
    if(!fresh()||!bodies.length)return null;
    if(side==='solo'){
      let best=null,bs=-1;
      for(const b of bodies){const s=b.torso*(1.2-Math.abs(b.cx-0.5));if(s>bs){bs=s;best=b}}
      return best;
    }
    let best=null;
    for(const b of bodies){
      if(side==='left'?b.cx>=0.5:b.cx<0.5)continue;
      if(!best||b.torso>best.torso)best=b;
    }
    return best;
  }
  const getHands=()=>fresh()?hands:[];
  const getFaces=()=>fresh()?faces:[];

  /* ---------- đo "năng lượng" vận động của 1 người: tốc độ trung bình các khớp chia cho độ dài thân ---------- */
  function energy(idx){
    let prev=null,pt=0,e=0;
    return {
      get value(){return e},
      reset(){prev=null;e=0},
      update(b,now){
        if(!b){e*=0.92;prev=null;return e}
        if(b===prev)return e;
        if(prev&&now>pt){
          const dt=(now-pt)/1000;
          let s=0,n=0;
          for(const i of idx){
            const a=b.p[i],q=prev.p[i];
            if(!a||!q||a.v<0.3||q.v<0.3)continue;
            s+=Math.hypot((a.x-q.x)*AR,a.y-q.y)/dt;n++;
          }
          if(n&&dt<0.5){e+=(s/n/b.torso-e)*(1-Math.exp(-dt/0.25))}
        }
        prev=b;pt=now;return e;
      }
    };
  }

  /* ---------- vẽ khung xương lên hình camera ---------- */
  const POSE_LINES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,31],[28,32],[15,19],[16,20]];
  const HAND_LINES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  const PAL=['#2FBF9F','#FF6B9A','#FFB13D','#8B6FEA'];
  function drawBodies(ctx,W,H,o){
    const lw=Math.max(5,Math.min(W,H)*0.013);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    bodies.forEach((b,bi)=>{
      const col=(o&&o.color&&o.color(b,bi))||PAL[bodies.length>1?bi%2:0];
      const seg=(a,c,k)=>{
        if(a.v<0.35||c.v<0.35)return;
        const cc=(o&&o.line&&o.line(b,k))||col;
        ctx.beginPath();ctx.moveTo(a.x*W,a.y*H);ctx.lineTo(c.x*W,c.y*H);
        ctx.lineWidth=lw*1.9;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.stroke();
        ctx.lineWidth=lw;ctx.strokeStyle=cc;ctx.stroke();
      };
      POSE_LINES.forEach((l,k)=>seg(b.p[l[0]],b.p[l[1]],k));
      // đầu
      const e1=b.p[7],e2=b.p[8],n=b.p[0];
      const hr=Math.max(lw*2.2,(e1.v>0.3&&e2.v>0.3?Math.hypot((e1.x-e2.x)*W,(e1.y-e2.y)*H)*0.78:b.torso*H*0.45));
      ctx.beginPath();ctx.arc(n.x*W,n.y*H,hr,0,6.29);
      ctx.lineWidth=lw*1.9;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.stroke();
      ctx.lineWidth=lw;ctx.strokeStyle=col;ctx.stroke();
      // khớp
      for(const i of [11,12,13,14,15,16,23,24,25,26,27,28]){
        const q=b.p[i];if(q.v<0.35)continue;
        ctx.beginPath();ctx.arc(q.x*W,q.y*H,lw*0.95,0,6.29);
        ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=lw*0.45;ctx.strokeStyle=(o&&o.joint&&o.joint(b,i))||col;ctx.stroke();
      }
    });
    ctx.restore();
  }
  function drawHands(ctx,W,H,o){
    const lw=Math.max(4,Math.min(W,H)*0.008);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    hands.forEach((h,hi)=>{
      const col=(o&&o.color&&o.color(h,hi))||PAL[hi%2];
      for(const l of HAND_LINES){
        const a=h.p[l[0]],c=h.p[l[1]];
        ctx.beginPath();ctx.moveTo(a.x*W,a.y*H);ctx.lineTo(c.x*W,c.y*H);
        ctx.lineWidth=lw*1.8;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.stroke();
        ctx.lineWidth=lw;ctx.strokeStyle=col;ctx.stroke();
      }
      for(let i=0;i<21;i++){
        const q=h.p[i];
        ctx.beginPath();ctx.arc(q.x*W,q.y*H,lw*(i%4===0&&i>0?1.5:1.05),0,6.29);
        ctx.fillStyle=i%4===0&&i>0?col:'#fff';ctx.fill();
      }
    });
    ctx.restore();
  }
  function draw(ctx,W,H,o){
    if(!active||!fresh())return;
    if(active==='pose')drawBodies(ctx,W,H,o);
    else if(active==='hand')drawHands(ctx,W,H,o);
  }

  /* ---------- hỗ trợ kiểm thử: nạp dữ liệu giả hoặc chạy thử trên 1 ảnh ---------- */
  function inject(d){
    if(!d){injected=false;bodies=[];hands=[];faces=[];return}
    injected=true;tData=performance.now()+3.6e6; // luôn "mới"
    if(d.bodies)bodies=d.bodies;if(d.hands)hands=d.hands;if(d.faces)faces=d.faces;
  }
  function detectOn(src,w,h,W,H){ // chạy đúng đường xử lý thật trên 1 ảnh/canvas tĩnh
    CW=W||CW;CH=H||CH;AR=CW/CH;
    run(src,performance.now()+lastTs%7,w,h);
  }

  return {
    supported,use,preload,stop,update,body,energy,draw,inject,detectOn,dist,mid,
    get active(){return active},
    get ar(){return AR},
    get bodies(){return fresh()?bodies:[]},
    get hands(){return getHands()},
    get faces(){return getFaces()},
    get status(){return status},
    get delegate(){return delegate},
    get error(){return err},
    get fps(){return fps},
    get ms(){return avgMs},
    get seen(){return seen},
    ready:k=>status[k]==='ready',
    /** có người trong khung trong ~0,8 giây gần đây? */
    seenRecently:(k,now)=>(now||performance.now())-seen[k]<800,
  };
})();
