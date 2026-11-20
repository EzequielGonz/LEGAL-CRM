import sys,glob
from PIL import Image
d,patron,salida=sys.argv[1],sys.argv[2],sys.argv[3]; w=int(sys.argv[4]) if len(sys.argv)>4 else 300
fs=sorted(f for f in glob.glob(f'{d}/{patron}') if 'telefono' not in f and ('guia' in patron or '-guia' not in f))
cols=6; h=int(w*1920/1080)
c=Image.new('RGB',(cols*(w+10)+10,((len(fs)+cols-1)//cols)*(h+10)+10),(120,120,120))
for i,f in enumerate(fs):
  im=Image.open(f).convert('RGB'); im=im.resize((w,int(w*im.height/im.width)))
  c.paste(im,(10+(i%cols)*(w+10),10+(i//cols)*(h+10)))
c.save(salida); print(len(fs),c.size)
