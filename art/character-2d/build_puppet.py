"""Build and render an editable Blender cutout puppet from a 4x3 RGBA parts atlas."""
import bpy, math, os, sys
from mathutils import Vector

ROOT=os.path.dirname(os.path.abspath(__file__))
ATLAS=os.path.join(ROOT,'parts-v1.png')
OUT=os.path.abspath(os.path.join(ROOT,'../../dist/assets/rider-2d'))
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1;scene.cycles.use_denoising=False
scene.render.resolution_x=384;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True;scene.render.fps=24
scene.view_settings.view_transform='Standard'
scene.render.image_settings.color_depth='8'
img=bpy.data.images.load(ATLAS);img.pack()
w,h=img.size
pixels=list(img.pixels)

def cell_bounds(index):
    col=index%4;row=index//4
    x0=int(col*w/4);x1=int((col+1)*w/4)
    y0=int((2-row)*h/3);y1=int((3-row)*h/3)
    xs=[];ys=[]
    for y in range(y0+3,y1-3,2):
        for x in range(x0+3,x1-3,2):
            if pixels[(y*w+x)*4+3]>.15:xs.append(x);ys.append(y)
    if not xs:raise RuntimeError('Empty atlas cell '+str(index))
    return (max(x0,min(xs)-3)/w,max(y0,min(ys)-3)/h,min(x1,max(xs)+4)/w,min(y1,max(ys)+4)/h)

material=bpy.data.materials.new('Painted illustration / transparent');material.use_nodes=True
nodes=material.node_tree.nodes;nodes.clear()
tex=nodes.new('ShaderNodeTexImage');tex.image=img;tex.interpolation='Linear'
emission=nodes.new('ShaderNodeEmission');transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');out=nodes.new('ShaderNodeOutputMaterial')
links=material.node_tree.links;links.new(tex.outputs['Color'],emission.inputs['Color']);links.new(tex.outputs['Alpha'],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(emission.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])

# Coordinates are X horizontal, Z up. Camera sees the front of the illustration.
specs=[
 ('root',None,(0,0,.9),(0,0,1.2)),
 ('torso','root',(0,0,1.15),(-.06,0,1.72)),
 ('head','torso',(-.06,0,1.69),(-.09,0,2.06)),
 ('arm_far','torso',(-.18,.04,1.65),(-.32,.04,1.31)),
 ('forearm_far','arm_far',(-.32,.04,1.31),(-.21,.04,1.02)),
 ('thigh_far','root',(-.10,.03,1.19),(-.25,.03,.75)),
 ('shin_far','thigh_far',(-.25,.03,.75),(-.04,.03,.23)),
 ('shoe_far','shin_far',(-.04,.03,.23),(.13,.03,.12)),
 ('thigh_near','root',(.13,-.02,1.18),(.35,-.02,.72)),
 ('shin_near','thigh_near',(.35,-.02,.72),(.20,-.02,.15)),
 ('shoe_near','shin_near',(.20,-.02,.15),(.41,-.02,.08)),
 ('arm_near','torso',(.15,-.07,1.64),(.30,-.07,1.32)),
 ('forearm_near','arm_near',(.30,-.07,1.32),(.18,-.07,1.08)),
]
armdata=bpy.data.armatures.new('Deriva skeleton');rig=bpy.data.objects.new('RIDER — rear three-quarter',armdata);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,parent,a,b in specs:
    bone=armdata.edit_bones.new(name);bone.head=a;bone.tail=b
    if parent:bone.parent=armdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
mapping=[('head',0,.34),('torso',1,.51),('arm_far',2,.21),('arm_near',3,.23),('forearm_far',4,.19),('forearm_near',5,.20),('thigh_far',6,.26),('thigh_near',7,.29),('shin_far',8,.22),('shin_near',9,.24),('shoe_far',10,.32),('shoe_near',11,.34)]
lookup={s[0]:s for s in specs}
for name,index,width in mapping:
    _,_,a,b=lookup[name];a=Vector(a);b=Vector(b)
    u0,v0,u1,v1=cell_bounds(index)
    if name in ('torso','head'):
        low=a;high=b;direction=(high-low).normalized();center=(low+high)/2
        height=(b-a).length*1.18
    elif name.startswith('shoe'):
        direction=Vector((0,0,1));center=(a+b)/2;height=.17
    else:
        direction=(a-b).normalized();center=(a+b)/2;height=(b-a).length*1.36
    horizontal=Vector((direction.z,0,-direction.x))
    verts=[center-horizontal*width/2-direction*height/2,center+horizontal*width/2-direction*height/2,center+horizontal*width/2+direction*height/2,center-horizontal*width/2+direction*height/2]
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],[(0,1,2,3)]);data.update()
    obj=bpy.data.objects.new(name+' / painted cutout',data);scene.collection.objects.link(obj);data.materials.append(material)
    uv=data.uv_layers.new(name='Atlas');coords=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]
    for loop in data.loops:uv.data[loop.index].uv=coords[loop.vertex_index]
    group=obj.vertex_groups.new(name=name);group.add(list(range(4)),1,'REPLACE');modifier=obj.modifiers.new('Articulated by bones','ARMATURE');modifier.object=rig

# One quiet 1-second balance loop; both endpoints are identical.
scene.frame_start=1;scene.frame_end=24
for f in [1,7,13,19,25]:
    phase=(f-1)/24*2*math.pi
    for name in ['root','torso','head','arm_near','arm_far','forearm_near','forearm_far']:
        bone=rig.pose.bones[name];bone.rotation_mode='XYZ'
        bone.rotation_euler.y=math.sin(phase)*({'root':.015,'torso':.022,'head':-.015}.get(name,.025))
        bone.keyframe_insert(data_path='rotation_euler',frame=f)
    rig.pose.bones['root'].location.y=math.sin(phase)*.006
    rig.pose.bones['root'].keyframe_insert(data_path='location',frame=f)

camera_data=bpy.data.cameras.new('Sprite camera');camera=bpy.data.objects.new('Sprite camera',camera_data);scene.collection.objects.link(camera)
camera.location=(.05,-10,1.07);camera.rotation_euler=(math.pi/2,0,0);camera_data.type='ORTHO';camera_data.ortho_scale=2.32;scene.camera=camera
scene.render.filepath=os.path.join(OUT,'idle-')
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'deriva-rider-v1.blend'))
if '--render' in sys.argv:bpy.ops.render.render(animation=True)
else:scene.render.filepath=os.path.join(OUT,'preview.png');bpy.ops.render.render(write_still=True)
