from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, os, sys

W,H = 1080,1920
S = 2
GRAPHITE=(10,13,19); COPPER=(226,112,58); COPPER_D=(171,75,29)
INK=(240,241,245)
FB="/mnt/skills/examples/canvas-design/canvas-fonts/WorkSans-Bold.ttf"
FR="/mnt/skills/examples/canvas-design/canvas-fonts/WorkSans-Regular.ttf"

def ease(t):  return t*t*(3-2*t)
def clamp(v,a=0.0,b=1.0): return max(a,min(b,v))

# ---------------- silhouette ----------------
HALF=[(470,0),(494,50),(524,85),(570,95),(616,89),(648,68),(672,53),(692,51),
      (716,93),(740,162),(762,232),(786,283),(818,304),(862,302),(916,290),
      (978,272),(1042,249),(1096,224),(1158,207),(1212,214),(1264,236),
      (1322,244),(1380,242)]

def outline():
    r=[(540+hw,y) for y,hw in HALF]
    l=[(540-hw,y) for y,hw in reversed(HALF)]
    return l+r

def smooth(p,n=4):
    for _ in range(n):
        o=[p[0]]
        for i in range(1,len(p)-1):
            o.append(((p[i-1][0]+2*p[i][0]+p[i+1][0])/4,(p[i-1][1]+2*p[i][1]+p[i+1][1])/4))
        o.append(p[-1]); p=o
    return p

def sc(p): return [(x*S,y*S) for x,y in p]

def body_layer():
    img=Image.new("RGBA",(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(img)
    o=smooth(outline(),3)
    d.line(sc(o+[o[0]]), fill=COPPER+(235,), width=5*S, joint="curve")
    for y in range(700,1360,34):
        d.line(sc([(540,y),(540,y+17)]), fill=COPPER_D+(150,), width=3*S)
    for y in (760,880,1000,1120,1240):          # measurement ticks
        d.line(sc([(300,y),(330,y)]), fill=COPPER_D+(110,), width=3*S)
    return img.resize((W,H), Image.LANCZOS)

def glow(cx,cy,rx,ry,k=1.0):
    g=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(g)
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry], fill=COPPER+(int(120*k),))
    g=g.filter(ImageFilter.GaussianBlur(52))
    d=ImageDraw.Draw(g); d.ellipse([cx-rx*.55,cy-ry*.55,cx+rx*.55,cy+ry*.55], fill=COPPER+(int(200*k),))
    return g.filter(ImageFilter.GaussianBlur(18))

ZONE=(540,872,128,80)

ARM=[(844,818),(814,780),(776,758),(736,764),(714,798),(716,836)]
DEV=[(826,1180),(820,1080),(816,980),(810,890),(800,812),(772,752),
     (726,718),(676,728),(636,766),(608,816),(596,858)]

def path_layer(pts, color, width, cap):
    img=Image.new("RGBA",(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(img)
    p=smooth(pts,4)
    d.line(sc(p), fill=color, width=width*S, joint="curve")
    x,y=p[-1]
    d.ellipse([(x-cap)*S,(y-cap)*S,(x+cap)*S,(y+cap)*S], fill=color)
    return img.resize((W,H), Image.LANCZOS), p

def reveal(layer, pts, frac, thick):
    n=max(2,int(len(pts)*clamp(frac)))
    m=Image.new("L",(W,H),0); d=ImageDraw.Draw(m)
    d.line(pts[:n], fill=255, width=thick, joint="curve")
    x,y=pts[n-1]; r=thick//2+30
    d.ellipse([x-r,y-r,x+r,y+r], fill=255)
    m=m.filter(ImageFilter.GaussianBlur(6))
    out=layer.copy(); a=out.getchannel("A")
    out.putalpha(Image.eval(Image.merge("L",[a]).point(lambda v:v), lambda v:v))
    out.putalpha(Image.composite(a, Image.new("L",(W,H),0), m))
    return out

# ---------------- type ----------------
def wrap(d,t,f,mw):
    ws=t.split(); L=[]; c=""
    for w in ws:
        s=(c+" "+w).strip()
        if d.textlength(s,font=f)<=mw: c=s
        else: L.append(c); c=w
    if c: L.append(c)
    return L

def type_layer(head=None, hs=64, hy=300, kick=None, ks=32, ky=1520, col=INK, kcol=COPPER, rule=True):
    img=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    if head:
        f=ImageFont.truetype(FB,hs); ls=wrap(d,head,f,W-190); lh=hs+18
        for i,ln in enumerate(ls):
            tw=d.textlength(ln,font=f); d.text(((W-tw)/2, hy+i*lh), ln, font=f, fill=col+(255,))
        if rule:
            yy=hy+len(ls)*lh+26
            d.line([(540-46,yy),(540+46,yy)], fill=COPPER+(220,), width=4)
    if kick:
        f2=ImageFont.truetype(FR,ks); tw=d.textlength(kick,font=f2)
        d.text(((W-tw)/2, ky), kick, font=f2, fill=kcol+(255,))
    return img

def ki_badge():
    img=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    f=ImageFont.truetype(FR,22); t="KI-generiert"; tw=d.textlength(t,font=f)
    d.rounded_rectangle([54,190,54+tw+30,190+40],8,fill=(255,255,255,26))
    d.text((69,198),t,font=f,fill=(255,255,255,170))
    return img

def base_bg():
    bg=Image.new("RGB",(W,H),GRAPHITE)
    v=Image.new("L",(W,H),0); dv=ImageDraw.Draw(v)
    dv.ellipse([-260,120,W+260,H-120], fill=70)
    v=v.filter(ImageFilter.GaussianBlur(240))
    tint=Image.new("RGB",(W,H),(20,26,38))
    return Image.composite(tint,bg,v).convert("RGBA")


def gap_dashes(a,b,col=COPPER_D,alpha=190):
    img=Image.new("RGBA",(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(img)
    n=9
    for i in range(n):
        t0=i/n; t1=t0+0.055
        p0=(a[0]+(b[0]-a[0])*t0, a[1]+(b[1]-a[1])*t0)
        p1=(a[0]+(b[0]-a[0])*t1, a[1]+(b[1]-a[1])*t1)
        d.line(sc([p0,p1]), fill=col+(alpha,), width=3*S)
    return img.resize((W,H), Image.LANCZOS)

def grip_layer(pts, color=(244,245,250,255), width=19):
    img=Image.new("RGBA",(W*S,H*S),(0,0,0,0)); d=ImageDraw.Draw(img)
    p=smooth(pts,4); seg=p[int(len(p)*0.80):]
    d.line(sc(seg), fill=color, width=width*S, joint="curve")
    return img.resize((W,H), Image.LANCZOS)
