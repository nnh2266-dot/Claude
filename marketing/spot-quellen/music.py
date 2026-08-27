import numpy as np, wave

SR=48000
DUR=13.85
BPM=120; BEAT=60/BPM
CUTS=[0.0,3.0,6.0,8.17,11.17]
N=int(SR*DUR); t=np.arange(N)/SR
mix=np.zeros(N)

def place(buf,sig,at):
    i=int(at*SR); j=min(len(buf),i+len(sig))
    if i<len(buf): buf[i:j]+=sig[:j-i]

# --- sub drone, barely there
mix += 0.22*np.sin(2*np.pi*55.0*t) * (0.6+0.4*np.sin(2*np.pi*t/11.0))
mix += 0.09*np.sin(2*np.pi*82.5*t) * (0.5+0.5*np.sin(2*np.pi*t/7.0+1.1))

# --- warm pad, a minor, each voice breathing on its own
for f,a,ph in [(110.0,0.085,0.0),(164.81,0.055,1.3),(220.0,0.040,2.6),(261.63,0.030,0.7)]:
    mix += a*np.sin(2*np.pi*f*t)*(0.55+0.45*np.sin(2*np.pi*t/6.5+ph))

# --- soft heartbeat on the beat, no click, no noise
k=0; tt=0.0
while tt<DUR:
    n=int(0.30*SR); tl=np.arange(n)/SR
    e=np.concatenate([np.linspace(0,1,int(0.012*SR)), np.exp(-np.linspace(0,7,n-int(0.012*SR)))])
    body=np.sin(2*np.pi*np.linspace(62,44,n)*tl)
    place(mix, (0.20 if k%4==0 else 0.10)*body*e, tt)
    tt+=BEAT; k+=1

# --- one warm swell on each cut, no transient
for i,c in enumerate(CUTS):
    n=int(0.9*SR); tl=np.arange(n)/SR
    e=np.concatenate([np.linspace(0,1,int(0.10*SR)), np.exp(-np.linspace(0,4.5,n-int(0.10*SR)))])
    place(mix, 0.16*np.sin(2*np.pi*np.linspace(70,52,n)*tl)*e, max(0.0,c-0.06))

# --- gentle opening of the pad into the endcard
li=int(11.17*SR)
if li<N:
    mix[li:] *= np.linspace(1.0,1.18,N-li)

# --- two-pole lowpass, takes all edge off
for _ in range(2):
    a=0.28; acc=0.0; out=np.empty_like(mix)
    for i in range(N):
        acc += a*(mix[i]-acc); out[i]=acc
    mix=out

fi=int(0.6*SR); fo=int(1.4*SR)
mix[:fi]*=np.linspace(0,1,fi); mix[-fo:]*=np.linspace(1,0,fo)
mix/=max(1e-9,np.max(np.abs(mix))); mix*=0.62
st=np.stack([mix,mix*0.99],axis=1)
with wave.open("bed.wav","w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st*32767).astype(np.int16).tobytes())
print("bed.wav",round(DUR,2),"s")
