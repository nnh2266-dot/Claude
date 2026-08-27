from PIL import Image, ImageDraw, ImageFilter
import os, sys, subprocess, imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe()
U="/root/.claude/uploads/047845cc-b7df-5c14-a091-e016fb8df504"

def soft_patch(im, box, blur=11, feather=16, pad=34):
    x,y,w,h=box
    X0,Y0=max(0,x-pad),max(0,y-pad)
    X1,Y1=min(im.width,x+w+pad),min(im.height,y+h+pad)
    reg=im.crop((X0,Y0,X1,Y1))
    bl=reg.filter(ImageFilter.GaussianBlur(blur))
    m=Image.new("L",reg.size,0)
    d=ImageDraw.Draw(m)
    d.ellipse([x-X0, y-Y0, x-X0+w, y-Y0+h], fill=255)
    m=m.filter(ImageFilter.GaussianBlur(feather))
    im.paste(Image.composite(bl,reg,m),(X0,Y0))
    return im

JOBS={
 "C":dict(src="bcf71d3d-ElevenLabs_video_geminiomniflash_She_holds_the_m_20260816T05_40_19.mp4",
          ss=1.85, t=2.2,
          boxes=[(197,760,86,60),(92,985,90,62),(0,1062,86,74)],
          boxes_end=[(307,945,96,66),(157,1180,100,68),(18,1258,96,80)]),
 "A":dict(src="8f69be11-ElevenLabs_video_geminiomniflash_Same_woman_sam_20260816T06_14_12.mp4",
          ss=0.35, t=2.6,
          boxes=[(316,676,84,60),(322,838,84,58),(84,940,84,70)]),
 "B":dict(src="da55be44-ElevenLabs_video_geminiomniflash_She_holds_the_m_20260816T05_46_49.mp4",
          ss=0.70, t=3.0,
          boxes=[(218,864,86,58),(232,1074,86,58),(30,1170,80,72)]),
}
tag=sys.argv[1]; J=JOBS[tag]
raw=f"raw_{tag}"; cln=f"cln_{tag}"
os.makedirs(raw,exist_ok=True); os.makedirs(cln,exist_ok=True)
subprocess.run([FF,"-y","-ss",str(J["ss"]),"-t",str(J["t"]),"-i",f'{U}/{J["src"]}',
                f"{raw}/f%04d.png","-loglevel","error"],check=True)
files=sorted(os.listdir(raw)); n=0
be=J.get("boxes_end")
for i,fn in enumerate(files):
    im=Image.open(f"{raw}/{fn}").convert("RGB")
    t=i/max(1,len(files)-1)
    for k,b in enumerate(J["boxes"]):
        if be:
            e=be[k]; b=tuple(int(b[j]+(e[j]-b[j])*t) for j in range(4))
        im=soft_patch(im,b)
    im.save(f"{cln}/{fn}"); n+=1
print(tag,"cleaned",n)
