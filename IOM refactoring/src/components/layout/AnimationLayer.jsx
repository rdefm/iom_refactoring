import React, { useEffect, useRef } from 'react';

function MeditationCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const DURATION  = 4000;
  const SCALE     = 6;
  const SIZE      = 32;

  const BODY_PIXELS = [
    [14,3],[15,3],[16,3],[17,3],[13,4],[14,4],[15,4],[16,4],[17,4],[18,4],
    [13,5],[14,5],[15,5],[16,5],[17,5],[18,5],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],
    [14,7],[15,7],[16,7],[17,7],[15,8],[16,8],
    [11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],[19,9],[20,9],
    [12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],[19,10],
    [12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],
    [12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],[19,12],
    [10,10],[10,11],[10,12],[10,13],[21,10],[21,11],[21,12],[21,13],
    [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],[18,14],[19,14],[20,14],[21,14],[22,14],[23,14],
    [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[16,15],[17,15],[18,15],[19,15],[20,15],[21,15],[22,15],[23,15],[24,15],
    [7,16],[8,16],[9,16],[22,16],[23,16],[24,16],
    [6,17],[7,17],[8,17],[23,17],[24,17],[25,17],
  ];
  const PARTICLE_COLS = ["#fde68a","#b0b5c0","#86efac","#93c5fd","#f0abfc"];
  const cx=16, cy=12;

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    ctx.imageSmoothingEnabled=false;
    const start=performance.now();
    const particles=PARTICLE_COLS.map((col,i)=>({angle:(i/5)*Math.PI*2,speed:0.55+(i%3)*0.15,rx:7+(i%2),ry:3+(i%2),col,trail:[]}));

    function draw(now){
      const elapsed=now-start;
      const pulse=0.5+0.5*Math.sin(elapsed*0.003);
      ctx.fillStyle="#0a0e1a"; ctx.fillRect(0,0,SIZE,SIZE);
      // ground glow
      for(let px=7;px<=25;px++) for(let py=16;py<=19;py++){
        const dx=(px-16)/9, dy=(py-18)/2, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<1){ ctx.fillStyle=`rgba(147,197,253,${(1-dist)*0.18*(0.7+0.3*pulse)})`; ctx.fillRect(px,py,1,1); }
      }
      // particles
      particles.forEach(p=>{
        p.angle+=p.speed*0.04;
        const ox=cx+Math.cos(p.angle)*p.rx, oy=cy+Math.sin(p.angle)*p.ry;
        const px2=Math.round(ox), py2=Math.round(oy);
        p.trail.push({x:px2,y:py2}); if(p.trail.length>6) p.trail.shift();
        p.trail.forEach((pt,ti)=>{ const a=((ti+1)/p.trail.length)*0.7; ctx.fillStyle=p.col+Math.round(a*255).toString(16).padStart(2,"0"); ctx.fillRect(pt.x,pt.y,1,1); });
        ctx.fillStyle=p.col; ctx.fillRect(px2,py2,1,1);
      });
      // silhouette
      BODY_PIXELS.forEach(([x,y])=>{ ctx.fillStyle="#1a2244"; ctx.fillRect(x,y,1,1); });
      // aura
      const aa=0.06+0.04*pulse;
      for(let r=6;r>=4;r--) for(let px=-r;px<=r;px++) for(let py=-r;py<=r;py++){
        const d=Math.sqrt(px*px+py*py);
        if(d>=r-0.5&&d<r+0.5){ ctx.fillStyle=`rgba(147,197,253,${aa*(7-r)})`; ctx.fillRect(cx+px,cy+py,1,1); }
      }
      if(elapsed<DURATION) rafRef.current=requestAnimationFrame(draw);
    }
    rafRef.current=requestAnimationFrame(draw);
    return()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  },[]);

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{width:SIZE*SCALE,height:SIZE*SCALE,imageRendering:"pixelated",display:"block",margin:"0 auto"}}/>;
}

export function AnimationLayer({ anim, onComplete }) {
  const barRef=useRef(null);
  useEffect(()=>{
    if(barRef.current){ requestAnimationFrame(()=>{ if(barRef.current) barRef.current.style.width="100%"; }); }
    const timer=setTimeout(onComplete, anim.duration||4000);
    return()=>clearTimeout(timer);
  },[]);

  return(
    <div className="anim-overlay" onClick={onComplete}>
      {anim.type==="meditation"&&<MeditationCanvas/>}
      <div className="anim-label">{anim.label||"…"}</div>
      <div className="anim-bar-track">
        <div className="anim-bar-fill" ref={barRef} style={{transitionDuration:`${anim.duration||4000}ms`}}/>
      </div>
      <div style={{fontSize:".7rem",color:"rgba(147,197,253,.45)"}}>Tap to skip</div>
    </div>
  );
}
