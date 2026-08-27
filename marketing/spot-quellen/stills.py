from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont
import os
from design import COPPER, INK, FB, FR

OUT="stills/fertig"; os.makedirs(OUT, exist_ok=True)
W,H=1080,1350

def soft_patch(im, box, blur=11, feather=16, pad=34):
    x,y,w,h=box
    X0,Y0=max(0,x-pad),max(0,y-pad); X1,Y1=min(im.width,x+w+pad),min(im.height,y+h+pad)
    reg=im.crop((X0,Y0,X1,Y1)); bl=reg.filter(ImageFilter.GaussianBlur(blur))
    m=Image.new("L",reg.size,0); ImageDraw.Draw(m).ellipse([x-X0,y-Y0,x-X0+w,y-Y0+h],fill=255)
    m=m.filter(ImageFilter.GaussianBlur(feather))
    im.paste(Image.composite(bl,reg,m),(X0,Y0)); return im

def grade(im):
    im=ImageEnhance.Color(im).enhance(0.52)
    im=ImageEnhance.Contrast(im).enhance(1.16)
    im=ImageEnhance.Brightness(im).enhance(0.94)
    r,g,b=im.split()
    r=r.point(lambda v:max(0,int(v*0.96)))
    b=b.point(lambda v:min(255,int(v*1.06+4)))
    im=Image.merge("RGB",(r,g,b))
    # vignette
    v=Image.new("L",im.size,0); ImageDraw.Draw(v).ellipse([-im.width*0.28,-im.height*0.20,
        im.width*1.28,im.height*1.20], fill=255)
    v=v.filter(ImageFilter.GaussianBlur(190))
    dark=Image.new("RGB",im.size,(6,8,12))
    return Image.composite(im,dark,v)

def grain(im, amount=7):
    import random
    n=Image.effect_noise(im.size, amount).convert("L")
    return Image.blend(im, Image.merge("RGB",(n,n,n)), 0.05)

def typeset(im, head=None, kick=None):
    lay=Image.new("RGBA",im.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    for y in range(0,430):
        d.line([(0,y),(im.width,y)], fill=(6,8,12,int(175*(1-y/430)**1.4)))
    for y in range(im.height-330,im.height):
        d.line([(0,y),(im.width,y)], fill=(6,8,12,int(185*((y-(im.height-330))/330)**1.3)))
    if head:
        f=ImageFont.truetype(FB,58); words=head.split(); lines=[]; cur=""
        for w in words:
            s=(cur+" "+w).strip()
            if d.textlength(s,font=f)<=im.width-150: cur=s
            else: lines.append(cur); cur=w
        if cur: lines.append(cur)
        for i,ln in enumerate(lines):
            tw=d.textlength(ln,font=f); d.text(((im.width-tw)/2, 128+i*72), ln, font=f, fill=INK+(255,))
        yy=128+len(lines)*72+22
        d.line([(im.width/2-44,yy),(im.width/2+44,yy)], fill=COPPER+(225,), width=4)
    if kick:
        f2=ImageFont.truetype(FR,32); tw=d.textlength(kick,font=f2)
        d.text(((im.width-tw)/2, im.height-138), kick, font=f2, fill=COPPER+(255,))
    f3=ImageFont.truetype(FR,20); t="KI-generiert"; tw=d.textlength(t,font=f3)
    d.rounded_rectangle([40,40,40+tw+26,40+36],7,fill=(255,255,255,28))
    d.text((53,47),t,font=f3,fill=(255,255,255,175))
    return Image.alpha_composite(im.convert("RGBA"), lay).convert("RGB")

JOBS=[
 ("s1_kontakt.png","01-kontakt", (60,90,576,720), [], "Punktgenau am Muskel.", "Kugelkopf für die Fläche."),
 ("s2_halbnah.png","02-ueber-die-schulter",(60,120,576,720), [], "Der Bogen führt über die Schulter.", "Ellbogen bleibt unten."),
 ("s3_material.png","03-detail",(150,250,480,600), [], None, None),
 ("s4_gerade.png","04-so-nicht",(100,110,576,720), [], "So kommt niemand da hin.", "Gerader Griff."),
 ("s5_bogen.png","05-bogen",(120,150,576,720), [], "Ohne verdrehten Arm.", "Fester Bogen, nichts zum Anstecken."),
]
for src,name,crop,boxes,head,kick in JOBS:
    im=Image.open(f"stills/raw/{src}").convert("RGB")
    for b in boxes: im=soft_patch(im,b)
    x,y,w,h=crop
    im=im.crop((x,y,x+w,y+h)).resize((W,H), Image.LANCZOS)
    im=grain(grade(im))
    im=typeset(im, head, kick)
    im.save(f"{OUT}/{name}.jpg", quality=93)
    print(name)
