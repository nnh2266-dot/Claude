from design import *
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
import os
FPS=30

def build_product(dur=3.2, out="seq_prod"):
    os.makedirs(out,exist_ok=True)
    bg=base_bg()
    prod=Image.open("assets/produkt-freigestellt.png").convert("RGBA")
    prod=prod.crop(prod.getchannel("A").getbbox())
    # brighten the matte black so it reads on graphite
    prod=ImageEnhance.Brightness(prod).enhance(1.10)
    prod=ImageEnhance.Contrast(prod).enhance(1.05)
    base_w=760
    ph=int(prod.height*base_w/prod.width)
    glow_l=glow(500,760,300,300,0.30)
    ty=type_layer(head="Vier Aufsätze. Neun Stufen.", hs=62, hy=272,
                  kick="Ein Bogen. Kein Ansteckgriff.", ky=1470)
    badge=ki_badge()
    N=int(dur*FPS)
    for k in range(N):
        t=k/(N-1)
        z=1.0+0.075*ease(t)
        w=int(base_w*z); h=int(ph*z)
        p=prod.resize((w,h), Image.LANCZOS)
        fr=Image.alpha_composite(bg.copy(), glow_l)
        # soft contact shadow
        sh=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(sh)
        d.ellipse([540-w*0.32,1330,540+w*0.32,1398], fill=(0,0,0,140))
        fr=Image.alpha_composite(fr, sh.filter(ImageFilter.GaussianBlur(40)))
        lay=Image.new("RGBA",(W,H),(0,0,0,0))
        pa=p.getchannel("A")
        halo=ImageChops.subtract(pa.filter(ImageFilter.GaussianBlur(11)), pa)
        rim=Image.new("RGBA",p.size,(198,214,240,0)); rim.putalpha(halo.point(lambda v:int(v*0.85)))
        lay.paste(rim, (540-w//2, 935-h//2), rim)
        lay.paste(p, (540-w//2, 935-h//2), p)
        a=ease(clamp(t/0.14))
        lay.putalpha(lay.getchannel("A").point(lambda v:int(v*a)))
        fr=Image.alpha_composite(fr, lay)
        tt=ty.copy(); tt.putalpha(tt.getchannel("A").point(lambda v:int(v*ease(clamp((t-0.05)/0.2)))))
        fr=Image.alpha_composite(fr, tt)
        fr=Image.alpha_composite(fr, badge)
        fr.convert("RGB").save(f"{out}/f{k:04d}.png")
    print(out,N)

def build_end(dur=3.4, out="seq_end"):
    os.makedirs(out,exist_ok=True)
    bg=base_bg()
    wm=Image.open("assets/nackenfrei-wortmarke-weiss.png").convert("RGBA")
    ww=660; wh=int(wm.height*ww/wm.width)
    wm=wm.resize((ww,wh), Image.LANCZOS)
    f1=ImageFont.truetype(FB,52); f2=ImageFont.truetype(FR,34)
    N=int(dur*FPS)
    for k in range(N):
        t=k/(N-1)
        fr=Image.alpha_composite(bg.copy(), glow(540,900,340,300,0.30))
        lay=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(lay)
        a1=ease(clamp(t/0.22)); dy=int(26*(1-a1))
        m=wm.copy(); m.putalpha(m.getchannel("A").point(lambda v:int(v*a1)))
        lay.paste(m, (540-ww//2, 820+dy), m)
        a2=ease(clamp((t-0.20)/0.24))
        s="Ohne fremde Hilfe."
        tw=d.textlength(s,font=f1); d.text(((W-tw)/2, 960+int(20*(1-a2))), s, font=f1, fill=INK+(int(255*a2),))
        a3=ease(clamp((t-0.40)/0.26))
        s2="14 Tage Rückgabe · Versand frei"
        tw2=d.textlength(s2,font=f2); d.text(((W-tw2)/2, 1060), s2, font=f2, fill=COPPER+(int(255*a3),))
        d.line([(540-46,1180),(540+46,1180)], fill=COPPER+(int(220*a3),), width=4)
        fr=Image.alpha_composite(fr, lay)
        fr=Image.alpha_composite(fr, ki_badge())
        fr.convert("RGB").save(f"{out}/f{k:04d}.png")
    print(out,N)

if __name__=="__main__":
    build_product()
