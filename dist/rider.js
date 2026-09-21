import * as THREE from './vendor/three.module.js';

// A smooth, articulated rider in a regular longboard stance.
export function createRider(){
 const root=new THREE.Group(),board=new THREE.Group(),human=new THREE.Group();root.add(board,human);
 const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.87});
 const cloth=material('#c49654'),fold=material('#a77940'),pants=material('#334d47'),skin=material('#c99878'),hair=material('#302923'),sole=material('#d9d6c8'),shoe=material('#775f4a'),grip=material('#303532'),wood=material('#ad8552'),metal=material('#8d9291'),wheel=material('#b67c4f');
 function add(g,m,p,pos=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 function ellipsoid(pos,scale,m,p=human){const o=add(new THREE.SphereGeometry(1,20,14),m,p,pos);o.scale.set(...scale);return o;}
 function segment(a,b,r1,r2,m,p=human){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const o=add(new THREE.CylinderGeometry(r2,r1,va.distanceTo(vb),16),m,p);o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());return o;}
 const shape=new THREE.Shape();shape.moveTo(-.29,-.73);shape.quadraticCurveTo(-.3,-1.05,0,-1.09);shape.quadraticCurveTo(.3,-1.05,.29,-.73);shape.lineTo(.29,.73);shape.quadraticCurveTo(.3,1.05,0,1.09);shape.quadraticCurveTo(-.3,1.05,-.29,.73);shape.closePath();
 const deck=add(new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}),wood,board,[0,.23,0]);deck.rotation.x=-Math.PI/2;
 const tape=add(new THREE.ShapeGeometry(shape,18),grip,board,[0,.325,0]);tape.rotation.x=-Math.PI/2;tape.scale.setScalar(.94);
 for(const z of [-.72,.72]){segment([-.36,.18,z],[.36,.18,z],.045,.045,metal,board);for(const x of [-.37,.37]){const w=add(new THREE.CylinderGeometry(.145,.145,.14,20),wheel,board,[x,.145,z]);w.rotation.z=Math.PI/2;const hub=add(new THREE.CylinderGeometry(.052,.052,.145,14),metal,board,[x,.145,z]);hub.rotation.z=Math.PI/2;}}
 // Face points down the road while the chest and hips face across it.
 human.rotation.y=-Math.PI*.40;
 const hips=[0,1.19,.03],leftKnee=[-.35,.85,.14],rightKnee=[.38,.87,.16],leftFoot=[-.58,.42,.015],rightFoot=[.57,.42,.02];
 ellipsoid(hips,[.28,.2,.19],pants);
 for(const [knee,foot,side] of [[leftKnee,leftFoot,-1],[rightKnee,rightFoot,1]]){const hip=[side*.17,1.19,.03];segment(hip,knee,.145,.12,pants);ellipsoid(knee,[.125,.13,.13],pants);segment(knee,foot,.115,.085,pants);ellipsoid([foot[0],.44,foot[2]],[.09,.075,.095],pants);const shoes=new THREE.Group();shoes.position.set(foot[0],.39,foot[2]+.07);shoes.rotation.y=side*.1;human.add(shoes);ellipsoid([0,-.005,0],[.115,.065,.23],sole,shoes);ellipsoid([0,.045,-.012],[.108,.09,.21],shoe,shoes);for(let j=0;j<4;j++)segment([-.055,.11,.015+j*.023],[.055,.11,.015+j*.023],.007,.007,sole,shoes);}
 const upper=new THREE.Group();upper.position.set(0,1.16,.01);upper.rotation.z=-.06;upper.rotation.x=.09;human.add(upper);
 const profile=[[.20,0],[.25,.06],[.26,.18],[.25,.35],[.29,.53],[.27,.62],[.15,.69]].map(([x,y])=>new THREE.Vector2(x,y));const torso=add(new THREE.LatheGeometry(profile,24),cloth,upper);torso.scale.z=.78;
 ellipsoid([0,.025,0],[.235,.052,.185],fold,upper);
 ellipsoid([0,.55,-.135],[.215,.155,.115],fold,upper);ellipsoid([0,.58,-.15],[.19,.115,.10],cloth,upper);
 // Raised hood seam, front pocket, cuffs and a loose hem give the clothes thickness.
 ellipsoid([0,.22,.18],[.15,.09,.035],fold,upper);ellipsoid([0,.24,.19],[.15,.078,.023],cloth,upper);
 for(const x of [-.065,.065])segment([x,.60,.17],[x,.41,.207],.009,.009,sole,upper);
 const armGroups=[];
 for(const side of [-1,1]){const arm=new THREE.Group();upper.add(arm);const shoulder=[side*.25,.55,0],elbow=[side*.43,.26,.07],wrist=[side*.46,.10,.24];ellipsoid(shoulder,[.125,.15,.13],cloth,arm);segment(shoulder,elbow,.12,.10,cloth,arm);ellipsoid(elbow,[.102,.108,.105],cloth,arm);segment(elbow,wrist,.098,.071,cloth,arm);ellipsoid(wrist,[.074,.048,.074],fold,arm);ellipsoid([side*.46,.035,.265],[.059,.083,.046],skin,arm);armGroups.push(arm);}
 segment([0,.62,0],[0,.80,0],.075,.08,skin,upper);
 const head=new THREE.Group();head.position.set(0,.88,.015);head.rotation.y=Math.PI*1.40;upper.add(head);
 ellipsoid([0,0,0],[.145,.192,.15],skin,head);ellipsoid([0,-.105,.03],[.104,.082,.112],skin,head);
 ellipsoid([0,-.015,.151],[.026,.035,.036],skin,head);for(const side of [-1,1]){ellipsoid([side*.146,-.005,0],[.027,.049,.035],skin,head);ellipsoid([side*.055,.022,.136],[.023,.013,.013],hair,head);}
 ellipsoid([0,.095,-.017],[.157,.139,.153],hair,head);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ellipsoid([Math.cos(a)*.13,.10+Math.sin(i*2.6)*.035,Math.sin(a)*.12],[.048,.065,.05],hair,head);}
 // Small cross-body bag, echoing the relaxed commuter silhouette in the reference.
 ellipsoid([.08,.27,-.205],[.15,.20,.075],material('#544441'),upper);
 segment([-.19,.61,-.16],[.18,.09,-.20],.024,.024,hair,upper);
 return {root,animate(time,steer,braking,moving){root.rotation.z=-steer*.16;human.rotation.z=-steer*.09;upper.rotation.x=THREE.MathUtils.lerp(upper.rotation.x,braking?.30:.09,.12);upper.position.y=1.16+(moving?Math.sin(time*8)*.008:0);armGroups[0].rotation.z=steer*.17;armGroups[1].rotation.z=steer*.17;board.rotation.y=braking?steer*.22:0;}};
}
