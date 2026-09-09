(()=>{
    const q=s=>document.querySelector(s), video=q('#video'), start=q('#startBtn'), count=q('#count'), flash=q('#flash'), status=q('#statusText'), dot=q('#statusDot'), hint=q('#cameraHint'), notice=q('#notice');
    const strip=q('#strip'), finalPrint=q('#finalPrint'), result=q('#result'), eventName=q('#eventName'), mirror=q('#mirrorBtn'), three=q('#threeBtn');
    let stream=null, photos=[], tint='navy', mirrored=true, target=3, finalBlob=null;
    const colors={navy:'#10233c',berry:'#932f50',sun:'#bf7010',mint:'#126b69'};
    function setStatus(ok, text){status.textContent=text;dot.classList.toggle('ok',ok)}
    function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
    function say(text){notice.textContent=text;notice.classList.add('show')}
    async function connect(){
      try{notice.classList.remove('show'); start.disabled=true; start.textContent='Conectando…';
        if(stream)stream.getTracks().forEach(t=>t.stop());
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:1920},height:{ideal:1080}},audio:false});
        video.srcObject=stream; await video.play(); setStatus(true,'Cámara lista');hint.textContent=`Toca “Iniciar sesión”: tomaremos ${target} fotos con cuenta regresiva.`;start.textContent='Iniciar sesión';start.disabled=false;start.onclick=runSession;
      }catch(e){start.disabled=false;start.textContent='Reintentar cámara';say('No pude abrir la cámara. Permite el acceso cuando el navegador lo pregunte. Esta prueba funciona desde una página segura (HTTPS).')}
    }
    async function countdown(n){for(let i=n;i>0;i--){count.textContent=i;count.classList.add('show');await sleep(900)}count.textContent='¡Ya!';await sleep(350);count.classList.remove('show')}
    function snap(){const c=document.createElement('canvas');c.width=1280;c.height=960;const x=c.getContext('2d');if(mirrored){x.translate(c.width,0);x.scale(-1,1)}x.drawImage(video,0,0,c.width,c.height);flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');return c.toDataURL('image/jpeg',.92)}
    function drawThumbs(){strip.innerHTML='';photos.forEach(p=>{const i=new Image();i.src=p;i.className='thumb';strip.append(i)})}
    async function runSession(){if(!stream)return connect();photos=[];result.classList.remove('show');finalBlob=null;drawThumbs();start.disabled=true;start.textContent='Sesión en curso…';hint.textContent='Mantén la pose hasta que terminemos.';for(let i=0;i<target;i++){await countdown(3);photos.push(snap());drawThumbs();q('#s1').classList.add('done');if(i<target-1)await sleep(550)}await compose();q('#s2').classList.add('done');start.textContent='Repetir sesión';start.disabled=false;hint.textContent='Tu diseño está armado. Puedes descargarlo o mandarlo a imprimir.'}
    async function compose(){const c=document.createElement('canvas');c.width=1200;c.height=1800;const x=c.getContext('2d'),bg=colors[tint];
      x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle='#ffffff';x.fillRect(72,72,1056,1656);x.fillStyle=bg;x.fillRect(72,72,1056,190);
      x.fillStyle='#fff';x.font='700 54px system-ui';x.textAlign='center';let name=eventName.value.trim()||'Mi gran momento'; x.fillText(name.slice(0,34),600,145);x.font='400 24px system-ui';x.fillText('FOTO CABINA · ' + new Date().toLocaleDateString('es-CL'),600,205);
      const margin=112,gap=28,w=976,h=photos.length===3?410:615; for(let i=0;i<photos.length;i++){const im=await load(photos[i]);const y=300+i*(h+gap);cover(x,im,margin,y,w,h);x.strokeStyle=bg;x.lineWidth=10;x.strokeRect(margin,y,w,h)}
      x.fillStyle=bg;x.font='700 27px system-ui';x.textAlign='center';x.fillText('SONRÍE · GUARDA · COMPARTE',600,1660);x.font='400 22px system-ui';x.fillText('Hecho con FotoCabina MVP',600,1705);
      finalBlob=await new Promise(r=>c.toBlob(r,'image/png'));finalPrint.src=URL.createObjectURL(finalBlob);result.classList.add('show');q('#s3').classList.add('done');
    }
    function load(src){return new Promise((r,j)=>{let im=new Image();im.onload=()=>r(im);im.onerror=j;im.src=src})}
    function cover(x,im,dx,dy,dw,dh){const s=Math.max(dw/im.width,dh/im.height),sw=dw/s,sh=dh/s,sx=(im.width-sw)/2,sy=(im.height-sh)/2;x.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh)}
    document.querySelectorAll('.swatch').forEach(b=>b.onclick=()=>{document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));b.classList.add('active');tint=b.dataset.color;if(photos.length)compose()});
    mirror.onclick=()=>{mirrored=!mirrored;mirror.classList.toggle('active',mirrored);mirror.textContent=mirrored?'Espejo activado':'Espejo desactivado';video.classList.toggle('unmirrored',!mirrored)};
    three.onclick=()=>{target=target===3?2:3;three.textContent=target===3?'3 fotografías':'2 fotografías';if(stream)hint.textContent=`Toca “Iniciar sesión”: tomaremos ${target} fotos con cuenta regresiva.`};
    eventName.oninput=()=>{if(photos.length)compose()};
    q('#downloadBtn').onclick=()=>{if(!finalBlob)return;const a=document.createElement('a');a.href=URL.createObjectURL(finalBlob);a.download='fotocabina-4x6.png';a.click()};
    q('#printBtn').onclick=()=>{if(!finalBlob)return;const w=window.open('','_blank');w.document.write(`<title>FotoCabina 4x6</title><style>@page{size:4in 6in;margin:0}html,body{margin:0;width:4in;height:6in}img{width:4in;height:6in;display:block}</style><img src="${finalPrint.src}" onload="print();setTimeout(close,400)">`);w.document.close()};
    q('#newBtn').onclick=()=>{photos=[];drawThumbs();result.classList.remove('show');['#s1','#s2','#s3'].forEach(s=>q(s).classList.remove('done'));hint.textContent='Listo para una nueva sesión.'};
    start.onclick=connect;
  })();
