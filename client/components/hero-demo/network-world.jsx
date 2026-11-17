'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// Original procedural scene; the art direction and UV-travelling light technique
// reference Cerebrium's published making-of. No Cerebrium assets or code are used.
const pulseVertex = `varying vec2 vUv; varying vec3 vNormal;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const pulseFragment = `
uniform float uTime; uniform float uOffset; uniform float uSpeed; uniform float uEnergy; uniform vec3 uColor;
varying vec2 vUv; varying vec3 vNormal;
void main(){
 float flow=fract(vUv.x-uTime*uSpeed-uOffset);
 float pulse=exp(-pow(flow*12.0,2.0));
 float front=exp(-pow(flow*65.0,2.0));
 float highlight=0.3+0.7*pow(abs(vNormal.z),1.5);
 vec3 color=mix(uColor,vec3(1.0,0.8,1.0),front*0.8);
 float light=(pulse*1.6+front*2.8)*uEnergy;
 gl_FragColor=vec4(color*light*highlight,clamp(pulse*1.5,0.0,1.0));
}`

function roundedRoute(vertices, radius=0.32){
 const path=new THREE.CurvePath()
 let current=vertices[0]
 for(let i=1;i<vertices.length-1;i++){
   const prev=vertices[i-1],corner=vertices[i],next=vertices[i+1]
   const r=Math.min(radius,corner.distanceTo(prev)*0.4,corner.distanceTo(next)*0.4)
   if(r<0.001)continue
   const before=corner.clone().add(prev.clone().sub(corner).normalize().multiplyScalar(r))
   const after=corner.clone().add(next.clone().sub(corner).normalize().multiplyScalar(r))
   path.add(new THREE.LineCurve3(current,before))
   path.add(new THREE.QuadraticBezierCurve3(before,corner,after))
   current=after
 }
 path.add(new THREE.LineCurve3(current,vertices[vertices.length-1]))
 return path
}

export function NetworkWorld({variant='nexus',paused=false,onTravel}){
 const hostRef=useRef(null)
 const live=useRef({paused,onTravel})
 live.current={paused,onTravel}
 const [failed,setFailed]=useState(false)
 useEffect(()=>{
   const host=hostRef.current
   if(!host)return
   let renderer
   try{renderer=new THREE.WebGLRenderer({alpha:false,antialias:false,powerPreference:'high-performance'})}
   catch{setFailed(true);return}
   const mobile=window.innerWidth<760
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.15:1.5))
   renderer.setClearColor(0x060309)
   renderer.toneMapping=THREE.ACESFilmicToneMapping
   renderer.toneMappingExposure=1.18
   host.appendChild(renderer.domElement)
   const scene=new THREE.Scene()
   scene.fog=new THREE.FogExp2(0x08030d,0.036)
   const camera=new THREE.PerspectiveCamera(43,1,0.1,120)
   const world=new THREE.Group();scene.add(world)
   const resources=[]
   const own=x=>{resources.push(x);return x}
   const environment=new RoomEnvironment()
   const pmrem=new THREE.PMREMGenerator(renderer)
   const env=pmrem.fromScene(environment,0.05)
   scene.environment=env.texture
   environment.dispose();pmrem.dispose()
   const body=own(new THREE.MeshStandardMaterial({color:0x25112f,roughness:0.29,metalness:0.76,envMapIntensity:0.75,emissive:0x210331,emissiveIntensity:0.3}))
   const nodeMaterial=own(new THREE.MeshPhysicalMaterial({color:0x140d20,metalness:0.75,roughness:0.23,clearcoat:1,clearcoatRoughness:0.15,envMapIntensity:1.25}))
   const edgeMaterial=own(new THREE.MeshStandardMaterial({color:0x422052,metalness:0.65,roughness:0.25,emissive:0x350b5e,emissiveIntensity:0.4}))
   const hot=own(new THREE.MeshBasicMaterial({color:new THREE.Color(2.0,0.45,3.6)}))
   const softer=own(new THREE.MeshBasicMaterial({color:new THREE.Color(0.9,0.14,2.0)}))
   const cool=own(new THREE.MeshBasicMaterial({color:new THREE.Color(0.36,0.3,1.2)}))
   const nodeGeometry=own(new RoundedBoxGeometry(0.54,0.34,0.54,3,0.065))
   const centralGeometry=own(new RoundedBoxGeometry(1.65,0.72,1.65,5,0.13))
   const smallBox=own(new THREE.BoxGeometry(1,1,1))
   const sphereGeometry=own(new THREE.IcosahedronGeometry(0.13,2))
   const nodes=[]
   const links=[]
   const pulses=[]
   let seed=57
   const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
   const node=(x,y,z,scale=1)=>{
     nodes.push(new THREE.Vector3(x,y,z))
     const object=new THREE.Group()
     object.position.set(x,y,z)
     const mesh=new THREE.Mesh(nodeGeometry,nodeMaterial)
     mesh.scale.setScalar(scale);object.add(mesh)
     const strip=new THREE.Mesh(smallBox,random()>.76?hot:softer)
     strip.scale.set(0.3*scale,0.012,0.025*scale)
     strip.position.set(0,0.177*scale,0)
     object.add(strip)
     const dot=new THREE.Mesh(sphereGeometry,cool)
     dot.scale.setScalar(0.16*scale)
     dot.position.set(0.17*scale,0.18*scale,0.16*scale)
     object.add(dot)
     world.add(object)
     return nodes.length-1
   }
   const connect=(a,b,options={})=>links.push({a,b,...options})
   let central=new THREE.Vector3(0,0.5,0)

   if(variant==='nexus'){
     // A sprawling, tiered dependency manifold, routed like physical infrastructure.
     for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++){
       const y=((x+z+12)%3)*0.55-0.55
       const i=node(x*1.65,y,z*1.65,0.8+random()*0.3)
       if(x>-4)connect(i-9,i)
       if(z>-4&&random()>.22)connect(i-1,i)
     }
     central.set(0,1.15,0)
     for(let i=0;i<16;i++)connect(40,(i*5)%81,{lift:1.3})
   }else if(variant==='strata'){
     for(let layer=0;layer<5;layer++)for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
       const i=node(x*1.45,(layer-2)*1.3,z*1.45,0.9)
       if(x>-2)connect(i-5,i)
       if(z>-2&&x%2===0)connect(i-1,i)
       if(layer>0&&(Math.abs(x)===2&&Math.abs(z)===2||x===0&&z===0))connect(i-25,i)
     }
     central.set(0,3.0,0)
   }else if(variant==='convergence'){
     const center=node(0,0.3,0,2)
     for(let arm=0;arm<12;arm++){
       const angle=arm/12*Math.PI*2
       let previous=center
       for(let level=1;level<=5;level++){
         const r=level*1.4
         const i=node(Math.cos(angle)*r,(Math.sin(angle*3)*0.8)+(level%2)*0.5,Math.sin(angle)*r,0.8)
         connect(previous,i,{lift:level%2===0?0.7:0})
         if(level>2&&arm%2===0){const child=node(Math.cos(angle)*r+Math.sin(angle)*1.3,1.4,Math.sin(angle)*r+Math.cos(angle)*1.3,0.6);connect(i,child)}
         previous=i
       }
     }
     central.set(0,1.0,0)
   }else if(variant==='synapse'){
     for(let i=0;i<80;i++){
       const angle=i*2.39996,y=1-i/79*2,r=Math.sqrt(1-y*y)
       node(Math.cos(angle)*r*4.1,y*3.1,Math.sin(angle)*r*4.1,0.7+random()*0.5)
     }
     for(let i=0;i<nodes.length;i++){
       const near=nodes.map((p,j)=>({j,d:p.distanceTo(nodes[i])})).filter(p=>p.j>i).sort((a,b)=>a.d-b.d).slice(0,3)
       near.forEach(p=>connect(i,p.j,{organic:true}))
     }
     central.set(0,0,0)
   }else if(variant==='causeway'){
     for(let z=0;z<18;z++)for(let x=0;x<4;x++){
       const i=node((x-1.5)*2,(x%2)*0.65,(z-8.5)*1.5,1)
       if(z>0)connect(i-4,i)
       if(x>0&&z%2===0)connect(i-1,i,{lift:0.4})
     }
     central.set(0,1.4,-1)
   }else{
     for(let level=0;level<8;level++){
       const r=3.0+Math.sin(level*0.8)*0.8
       for(let arm=0;arm<8;arm++){
         const angle=arm/8*Math.PI*2+level*0.15
         const i=node(Math.cos(angle)*r,(level-3.5)*0.85,Math.sin(angle)*r,0.85)
         if(arm>0)connect(i-1,i,{organic:true})
         if(arm===7)connect(i,i-7,{organic:true})
         if(level>0)connect(i-8,i,{organic:true})
       }
     }
     central.set(0,0,0)
   }

   const clock={value:0}
   for(const link of links){
     const start=nodes[link.a],end=nodes[link.b]
     let curve
     if(link.organic){
       const mid=start.clone().lerp(end,0.5)
       mid.add(mid.clone().normalize().multiplyScalar(0.45))
       mid.y+=0.4
       curve=new THREE.CatmullRomCurve3([start,mid,end])
     }else{
       const lift=link.lift||0
       const corners=Math.abs(start.y-end.y)<0.05&&!lift?
         [start,new THREE.Vector3(end.x,start.y,start.z),end]:
         [start,new THREE.Vector3(start.x,Math.max(start.y,end.y)+0.45+lift,start.z),new THREE.Vector3(end.x,Math.max(start.y,end.y)+0.45+lift,start.z),new THREE.Vector3(end.x,Math.max(start.y,end.y)+0.45+lift,end.z),end]
       const clean=corners.filter((p,i)=>!i||p.distanceTo(corners[i-1])>0.001)
       curve=roundedRoute(clean)
     }
     const tube=own(new THREE.TubeGeometry(curve,Math.max(20,Math.min(72,Math.ceil(curve.getLength()*10))),0.043,7,false))
     world.add(new THREE.Mesh(tube,body))
     const material=own(new THREE.ShaderMaterial({vertexShader:pulseVertex,fragmentShader:pulseFragment,uniforms:{uTime:clock,uOffset:{value:random()},uSpeed:{value:(0.10+random()*0.12)/Math.max(1,curve.getLength()*0.15)},uEnergy:{value:0.8+random()*0.8},uColor:{value:new THREE.Color(random()>.65?0xbd43ff:0x8751ff)}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}))
     const signal=new THREE.Mesh(tube,material)
     signal.renderOrder=1
     world.add(signal)
     if(pulses.length<12)pulses.push({curve,phase:random(),speed:0.12+random()*0.10})
   }

   // The central module has mass, layered construction, recessed light and an open core.
   const heart=new THREE.Group();heart.position.copy(central)
   for(let layer=0;layer<3;layer++){
     const slab=new THREE.Mesh(centralGeometry,layer===1?edgeMaterial:nodeMaterial)
     slab.position.y=layer*0.33-0.33;slab.scale.y=0.35
     heart.add(slab)
     const light=new THREE.Mesh(smallBox,layer===1?hot:softer)
     light.scale.set(1.46,0.025,1.46);light.position.y=layer*0.33-0.43
     heart.add(light)
   }
   const top=new THREE.Mesh(own(new RoundedBoxGeometry(1.08,0.16,1.08,4,0.06)),edgeMaterial)
   top.position.y=0.55;heart.add(top)
   const core=new THREE.Mesh(own(new THREE.IcosahedronGeometry(0.24,0)),hot)
   core.position.y=0.87;heart.add(core)
   const frame=new THREE.Mesh(own(new THREE.TorusGeometry(0.49,0.012,6,72)),softer)
   frame.rotation.x=Math.PI/2;frame.position.y=0.85;heart.add(frame)
   const heartLight=new THREE.PointLight(0xb45bff,18,7,2)
   heartLight.position.set(0,1.2,0);heart.add(heartLight)
   world.add(heart)

   const key=new THREE.DirectionalLight(0xa78aff,3.0);key.position.set(3,7,5);scene.add(key)
   const rim=new THREE.DirectionalLight(0xe954bd,2.3);rim.position.set(-5,3,-6);scene.add(rim)
   const fill=new THREE.HemisphereLight(0x9d80ff,0x07030b,1.5);scene.add(fill)
   const movingLight=new THREE.PointLight(0x8f39ff,26,18,2);movingLight.position.set(-3,4,1);scene.add(movingLight)
   const floorMaterial=own(new THREE.MeshStandardMaterial({color:0x08060c,roughness:0.3,metalness:0.7,envMapIntensity:0.35}))
   const floor=new THREE.Mesh(own(new THREE.PlaneGeometry(120,120)),floorMaterial)
   floor.rotation.x=-Math.PI/2;floor.position.y=variant==='strata'||variant==='helix'||variant==='synapse'?-4.1:-1.5;scene.add(floor)
   const grid=new THREE.GridHelper(100,100,0x34203f,0x1c1027)
   grid.position.y=floor.position.y+0.01
   grid.material.transparent=true;grid.material.opacity=0.13;scene.add(grid)
   const dustGeometry=own(new THREE.BufferGeometry())
   const dust=new Float32Array(350*3)
   for(let i=0;i<dust.length;i++)dust[i]=(random()-0.5)*34
   dustGeometry.setAttribute('position',new THREE.BufferAttribute(dust,3))
   const motes=new THREE.Points(dustGeometry,own(new THREE.PointsMaterial({size:0.018,color:0xb994ff,transparent:true,opacity:0.36,depthWrite:false})))
   scene.add(motes)
   const composer=new EffectComposer(renderer)
   composer.addPass(new RenderPass(scene,camera))
   const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),0.85,0.55,0.7)
   composer.addPass(bloom)
   const output=new OutputPass();composer.addPass(output)
   let dirty=true
   const resize=()=>{
     const w=host.clientWidth,h=host.clientHeight
     renderer.setSize(w,h);composer.setSize(w,h)
     camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true
   }
   const observer=new ResizeObserver(resize);observer.observe(host);resize()
   const reduce=window.matchMedia('(prefers-reduced-motion: reduce)')
   let reduced=reduce.matches
   const onMotion=()=>{reduced=reduce.matches;dirty=true}
   reduce.addEventListener('change',onMotion)
   let raf=0,last=0,time=0,px=0,py=0,travel=0,travelGoal=0,held=false,downX=0,dragYaw=0,yawGoal=0,dragMoved=false
   const basePosition=variant==='causeway'?new THREE.Vector3(7,5.5,12):variant==='strata'?new THREE.Vector3(9,6,11):new THREE.Vector3(10.5,8.7,13)
   const viewTarget=new THREE.Vector3(mobile?0:1.4,0.1,0)
   const position=new THREE.Vector3()
   const pointer=e=>{
     const bounds=host.getBoundingClientRect()
     px=(e.clientX-bounds.left)/bounds.width-0.5;py=(e.clientY-bounds.top)/bounds.height-0.5
     if(held){const delta=e.clientX-downX;yawGoal+=delta*0.004;dragMoved ||= Math.abs(delta)>2;downX=e.clientX}
   }
   const down=e=>{if(e.target.closest('button,a'))return;held=true;dragMoved=false;downX=e.clientX;host.style.cursor='grabbing'}
   const up=()=>{held=false;host.style.cursor='grab'}
   const wheel=e=>{
     if(e.target.closest('.lab-controls'))return
     e.preventDefault();travelGoal=THREE.MathUtils.clamp(travelGoal+e.deltaY*0.001,0,1)
     live.current.onTravel?.(travelGoal)
   }
   const click=e=>{if(e.target.closest('button,a')||reduced||dragMoved)return;heartLight.intensity=60}
   window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerup',up)
   host.addEventListener('pointerdown',down);host.addEventListener('wheel',wheel,{passive:false});host.addEventListener('click',click)
   const onTouchStart=e=>{if(e.target.closest('button,a'))return;downX=e.touches[0].clientX;held=true;dragMoved=false}
   const onTouchMove=e=>{if(!held)return;const delta=e.touches[0].clientX-downX;yawGoal+=delta*0.004;dragMoved ||= Math.abs(delta)>2;downX=e.touches[0].clientX}
   host.addEventListener('touchstart',onTouchStart,{passive:true});host.addEventListener('touchmove',onTouchMove,{passive:true});host.addEventListener('touchend',up)
   const travelControl=e=>{travelGoal=e.detail;live.current.onTravel?.(travelGoal)}
   window.addEventListener('archon-travel',travelControl)
   const frameLoop=now=>{
     raf=requestAnimationFrame(frameLoop)
     const dt=last?Math.min((now-last)/1000,0.05):0;last=now
     if(document.hidden)return
     const still=live.current.paused||reduced
     if(still&&!dirty)return
     if(!still){
       time+=dt;clock.value=time
       travel+=(travelGoal-travel)*0.045
       dragYaw+=(yawGoal-dragYaw)*0.05
       world.rotation.y=dragYaw+Math.sin(time*0.07)*0.045
       heart.position.y=central.y+Math.sin(time*0.8)*0.055
       core.rotation.y=time*0.25;core.rotation.z=Math.sin(time*0.4)*0.15
       frame.rotation.z=time*0.1
       heartLight.intensity+=(18-heartLight.intensity)*0.035
       motes.rotation.y=time*0.004
       movingLight.position.x=Math.sin(time*0.2)*5
     }
     // Scroll travels along a dolly, retaining the architectural perspective.
     const distance=1-travel*0.52
     position.copy(basePosition).multiplyScalar(distance)
     position.x+=still?0:px*1.5;position.y+=still?0:-py*1.0
     if(mobile)position.multiplyScalar(1.12)
     camera.position.lerp(position,dirty?1:0.035)
     camera.lookAt(viewTarget)
     composer.render();dirty=false
   }
   raf=requestAnimationFrame(frameLoop)
   const contextLost=e=>{e.preventDefault();setFailed(true)}
   renderer.domElement.addEventListener('webglcontextlost',contextLost)
   return()=>{
     cancelAnimationFrame(raf);observer.disconnect();reduce.removeEventListener('change',onMotion)
     window.removeEventListener('pointermove',pointer);window.removeEventListener('pointerup',up);window.removeEventListener('archon-travel',travelControl)
     host.removeEventListener('pointerdown',down);host.removeEventListener('wheel',wheel);host.removeEventListener('click',click)
     host.removeEventListener('touchstart',onTouchStart);host.removeEventListener('touchmove',onTouchMove);host.removeEventListener('touchend',up)
     renderer.domElement.removeEventListener('webglcontextlost',contextLost)
     resources.forEach(resource=>resource.dispose());env.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove()
   }
 },[variant])
 return <div ref={hostRef} className={`network-world${failed?' effect-fallback':''}`} aria-label="Interactive three-dimensional code network">{failed&&<p className="network-fallback">3D preview needs WebGL. Try enabling hardware acceleration in your browser.</p>}</div>
}
