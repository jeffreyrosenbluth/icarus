(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))h(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&h(l)}).observe(document,{childList:!0,subtree:!0});function s(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function h(r){if(r.ep)return;r.ep=!0;const a=s(r);fetch(r.href,a)}})();class o{constructor(t,s){this.x=t,this.y=s}mag(){return Math.sqrt(this.x*this.x+this.y*this.y)}sub(t){return new o(this.x-t.x,this.y-t.y)}add(t){return new o(this.x+t.x,this.y+t.y)}mul(t){return new o(t*this.x,t*this.y)}normalize(){let t=this.mag();return new o(this.x/t,this.y/t)}withMag(t){const s=this.normalize();return new o(s.x*t,s.y*t)}dot(t){return this.x*t.x+this.y*t.y}distance(t){return this.sub(t).mag()}unzero(){const t=this.mag();Math.abs(this.x)<.05&&(this.x=.1*t*Math.sign(this.x),this.y=.9*t*Math.sign(this.y)),Math.abs(this.y)<.05&&(this.x=.9*t*Math.sign(this.x),this.y=.1*t*Math.sign(this.y))}}const c=document.querySelector("canvas"),i=c==null?void 0:c.getContext("2d"),u=35;var d=(n=>(n[n.ALIVE=0]="ALIVE",n[n.DEAD=1]="DEAD",n))(d||{}),m=(n=>(n[n.PAUSED=0]="PAUSED",n[n.STARTED=1]="STARTED",n[n.OVER=2]="OVER",n))(m||{});class L{constructor(t=0,s=0,h=0,r=1,a=[],l=[],f=[],A=0,P=0){this.width=t,this.height=s,this.status=h,this.scale=r,this.players=a,this.balls=l,this.stars=f,this.frame=A,this.runnerUp=P;for(let b=0;b<70;b++){const D=Math.random()*this.width,I=Math.random()*this.height,R=Math.random()*3,S=Math.random();this.stars.push({x:D,y:I,r:R,alpha:S})}}center(){return new o(this.width/2,this.height/2)}reset(){this.resize(),this.balls.forEach(t=>{t.reset(this)}),this.status=0}resize(){const t=.75*window.innerWidth,s=.6*window.innerHeight;this.width=t,this.height=s,this.scale=Math.max(e.width,e.height)/1e3}setStars(t){for(let s=0;s<t;s++){const h=Math.random()*this.width,r=Math.random()*this.height,a=Math.random()*3,l=Math.random();this.stars.push({x:h,y:r,r:a,alpha:l})}}gameOver(){this.balls.reduce((s,h)=>h.state===0?s+1:s,0)===1&&(this.status=2)}winners(){return this.balls.filter(t=>t.state===0)}}let e=new L(.75*window.innerWidth,.6*window.innerHeight);const w=.4,p=.95;function O(n){let t=0,s=0;for(;Math.abs(t)<=.1;)t=Math.random()-.5;for(;Math.abs(s)<=.1;)s=Math.random()-.5;let h=new o(t,s).withMag(n);return h.unzero(),h}function T(n,t,s){let h=new o(n/2,t/2);const r=new o(n/2,t/2);for(;h.sub(r).mag()<2*s;)h=new o(Math.random()*n,Math.random()*t);return h}class z{constructor(t=0,s=0,h=0,r=1){this.r=t,this.g=s,this.b=h,this.a=r}color(){return`rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`}setAlpha(t){this.a=t}random(){this.r=Math.floor(Math.random()*200+55),this.g=Math.floor(Math.random()*200+55),this.b=Math.floor(Math.random()*200+55)}}class k{constructor(t,s=0,h=new o(0,0),r=new o(0,0),a=new z,l="",f=d.ALIVE){this.radius=t,this.id=s,this.pos=h,this.vel=r,this.color=a,this.name=l,this.state=f,a.random(),this.color=a}reset(t){this.state=d.ALIVE,this.pos=T(t.width,t.height,u*t.scale),this.vel=O(7*t.scale),this.radius=u*t.scale,this.color.setAlpha(1)}collide(t){if(t==this||this.state!==d.ALIVE||t.state!==d.ALIVE)return;if(t.pos.sub(this.pos).mag()-(this.radius+t.radius)<0){const r=this.vel.sub(t.vel),a=this.pos.sub(t.pos),l=a.dot(a),f=r.dot(a);this.vel=this.vel.sub(a.mul(f/l)),this.vel.mag()<3&&(this.vel=this.vel.withMag(3)),this.vel.unzero(),t.vel=t.vel.add(a.mul(f/l)),t.vel.mag()<3&&(t.vel=t.vel.withMag(3)),t.vel.unzero()}}move(){this.state===d.DEAD&&(this.vel=this.vel.mul(-.95)),this.pos=this.pos.add(this.vel),this.pos.x<this.radius&&(this.pos.x=this.radius,this.vel.x=-this.vel.x),this.pos.x>e.width-this.radius&&(this.pos.x=e.width-this.radius,this.vel.x=-this.vel.x),this.pos.y<this.radius&&(this.pos.y=this.radius,this.vel.y=-this.vel.y),this.pos.y>e.height-this.radius&&(this.pos.y=e.height-this.radius,this.vel.y=-this.vel.y)}gone(){e.center().sub(this.pos).mag()-this.radius*2-5<0&&e.status!==m.OVER&&(this.state=d.DEAD,e.runnerUp=this.id)}render(t){if(!i||!c)return;let s=20/u*this.radius*t*e.scale;i.strokeStyle=this.color.color(),i.lineWidth=5*t*e.scale,this.state===d.DEAD&&(this.radius=this.radius<3?0:this.radius*p,this.radius<3?s=0:s*=p,this.color.setAlpha(p*this.radius/u)),i.beginPath(),i.arc(this.pos.x,this.pos.y,this.radius*t,w,Math.PI-w),i.stroke(),i.beginPath(),i.arc(this.pos.x,this.pos.y,this.radius*t,Math.PI+w,-w),i.stroke(),i.font=`bold ${s}px sans-serif`,i.textAlign="center",i.fillStyle=this.color.color(),i.textBaseline="middle",i.fillText(this.name,this.pos.x,this.pos.y)}}const y=document.getElementById("players");y==null||y.addEventListener("input",function(n){const t=n.target,s=t.value.split(",");e.players=s.map(h=>h.trim()),e.balls=[],e.players.forEach((h,r)=>{let a=new k(u*e.scale);a.name=h,a.id=r,e.balls.push(a)}),e.reset(),localStorage&&localStorage.setItem("players",t.value)});const v=document.getElementById("playButton");v==null||v.addEventListener("click",function(t){window.cancelAnimationFrame(e.frame),e.reset(),e.status=m.STARTED,g()});function F(n,t,s,h,r){if(!i)return;i.save(),i.beginPath(),i.translate(n,t),i.moveTo(0,0-s);for(let l=0;l<h;l++)i.rotate(Math.PI/h),i.lineTo(0,0-s*r),i.rotate(Math.PI/h),i.lineTo(0,0-s);i.closePath(),i.fillStyle="rgba(255, 215, 0, 0.7)",i.fill(),i.restore();let a=s/1.4;for(let l=0;l<5;l++)i.fillStyle="rgba(255, 65, 0, 0.31)",i.beginPath(),i.arc(n,t,a*e.scale,0,2*Math.PI),i.closePath(),i.fill(),a/=1.8}function M(){if(i)for(const n of e.stars)i.fillStyle=`rgba(255, 255, 255, ${.5*n.alpha})`,i.beginPath(),i.arc(n.x,n.y,n.r*e.scale,0,2*Math.PI),i.fill()}function $(){if(!i||!c)return;e.reset(),x(),window.addEventListener("resize",x);const n=localStorage.getItem("players"),t=document.getElementById("players");n&&t&&(t.value=n,e.frame=window.requestAnimationFrame(g)),t==null||t.dispatchEvent(new Event("input"))}function g(){if(!i)return;i.fillStyle="black",i.strokeStyle="black",i.fillRect(0,0,e.width,e.height),i.strokeRect(0,0,e.width,e.height),M();let n=u;if(e.status===m.STARTED&&F(e.center().x,e.center().y,1.4*n*e.scale,16,.65),e.status!==m.PAUSED){for(let t=0;t<e.balls.length;t++){e.balls[t].gone();for(let s=0;s<t;s++)e.balls[t].collide(e.balls[s])}for(let t=0;t<e.balls.length;t++)e.balls[t].move(),e.balls[t].render(1);if(e.gameOver(),e.status===m.OVER){let t=e.winners()[0];if(t.vel=new o(e.width/2,e.height/2).sub(t.pos),t.vel=t.vel.withMag(3),e.balls[e.runnerUp].radius<3&&t.pos.distance(e.center())<3){window.cancelAnimationFrame(e.frame),E();return}}e.frame=window.requestAnimationFrame(g)}}function E(){if(!i)return;i.fillStyle="black",i.strokeStyle="black",i.fillRect(0,0,e.width,e.height),i.strokeRect(0,0,e.width,e.height),M();const n=e.width/2,t=e.height/2,s=e.winners()[0],h=20/u*s.radius*e.scale,r=`${s.name}`;if(i.font=`bold ${h}px sans-serif`,s.color.setAlpha(1),i.fillStyle=s.color.color(),i.textAlign="center",i.textBaseline="middle",i.fillText(r,n,t),s.radius+=.5,s.radius>100){s.reset(e),window.cancelAnimationFrame(e.frame);return}e.frame=window.requestAnimationFrame(E)}function x(){if(!c||!i)return;const n=.75*window.innerWidth,t=.6*window.innerHeight;c.width=Math.floor(n*window.devicePixelRatio),c.height=Math.floor(t*window.devicePixelRatio),c.style.width=n+"px",c.style.height=t+"px",i.scale(window.devicePixelRatio,window.devicePixelRatio),e.width=n,e.height=t,e.scale=Math.max(e.width,e.height)/1e3,g()}$();
