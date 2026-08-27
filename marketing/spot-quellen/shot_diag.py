from design import *
import sys, os
from PIL import Image

FPS=30
which=sys.argv[1]           # "1" or "2"
dur=float(sys.argv[2])
out=f"seq_d{which}"; os.makedirs(out, exist_ok=True)

bg=base_bg(); body=body_layer(); badge=ki_badge()
if which=="1":
    lay,pts=path_layer(ARM, COPPER+(235,), 5, 14)
    ty=type_layer(head="Diese Stelle erreicht keine Hand.", hs=62, hy=272,
                  kick="So weit kommt der Arm.", ky=1452)
else:
    lay,pts=path_layer(DEV, (244,245,250,255), 12, 27)
    ty=type_layer(head="Der Bogen geht darüber hinweg.", hs=62, hy=272,
                  kick="Fester Bogen. Nichts zum Anstecken.", ky=1452)

N=int(dur*FPS)
for k in range(N):
    t=k/(N-1)
    fr=bg.copy()
    pulse=0.72+0.28*math.sin(t*math.pi*2.2)
    zk = pulse if which=="1" else min(1.35, 0.6+1.1*ease(clamp((t-0.45)/0.3)))
    fr=Image.alpha_composite(fr, glow(ZONE[0],ZONE[1],ZONE[2],ZONE[3], zk))
    ba=body.copy(); ba.putalpha(ba.getchannel("A").point(lambda v:int(v*ease(clamp(t/0.16)))))
    fr=Image.alpha_composite(fr, ba)
    frac=ease(clamp((t-0.14)/0.46))
    if frac>0.02:
        fr=Image.alpha_composite(fr, reveal(lay, pts, frac, 46 if which=="1" else 70))
    if which=="1" and frac>0.97:
        fr=Image.alpha_composite(fr, gap_dashes((716,836),(566,872)))
    if which=="2" and frac>0.6:
        gl=grip_layer(smooth(DEV,4)); gl.putalpha(gl.getchannel("A").point(lambda v:int(v*ease(clamp((frac-0.6)/0.3)))))
        fr=Image.alpha_composite(fr, gl)
    tt=ty.copy(); tt.putalpha(tt.getchannel("A").point(lambda v:int(v*ease(clamp((t-0.06)/0.22)))))
    fr=Image.alpha_composite(fr, tt)
    fr=Image.alpha_composite(fr, badge)
    fr.convert("RGB").save(f"{out}/f{k:04d}.png")
print(out,"done",N)
