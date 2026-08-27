import numpy as np, wave, struct

SR=48000
DUR=15.7
BPM=120; BEAT=60/BPM
N=int(SR*DUR)
t=np.arange(N)/SR

def env(a,d,length):
    n=int(length*SR); e=np.zeros(n)
    ai=max(1,int(a*SR)); di=max(1,n-ai)
    e[:ai]=np.linspace(0,1,ai)
    e[ai:]=np.exp(-np.linspace(0,6,di))
    return e

def place(buf, sig, at):
    i=int(at*SR); j=min(len(buf), i+len(sig))
    if i<len(buf): buf[i:j]+=sig[:j-i]

mix=np.zeros(N)

# --- low drone: A1 with a detuned partner, slow swell
for f,a,det in [(55.0,0.30,0.0),(55.0,0.16,0.35),(110.0,0.10,0.0)]:
    mix += a*np.sin(2*np.pi*(f+det)*t) * (0.55+0.45*np.sin(2*np.pi*t/9.0))

# --- pad: A minor, soft, slowly breathing
for f,a in [(220.0,0.055),(261.63,0.045),(329.63,0.035),(440.0,0.018)]:
    lfo=0.6+0.4*np.sin(2*np.pi*t/5.5 + f)
    mix += a*np.sin(2*np.pi*f*t)*lfo

# --- pulse on every beat, slightly stronger on the downbeat
k=0; tt=0.0
while tt<DUR:
    strong = (k%4==0)
    length=0.22
    e=env(0.002,0.2,length)
    n=len(e); tl=np.arange(n)/SR
    body=np.sin(2*np.pi*np.linspace(74,48,n)*tl)          # short pitch drop
    click=np.random.RandomState(k).normal(0,1,n)*np.exp(-np.linspace(0,40,n))
    place(mix, (0.26 if strong else 0.13)*body*e + 0.02*click, tt)
    tt+=BEAT; k+=1

# --- accents on the cuts
CUTS=[0.0,2.0,4.5,7.0,8.5,10.5,13.0]
for i,c in enumerate(CUTS):
    n=int(0.5*SR); tl=np.arange(n)/SR
    thump=np.sin(2*np.pi*np.linspace(90,40,n)*tl)*np.exp(-np.linspace(0,9,n))
    air=np.random.RandomState(100+i).normal(0,1,n)*np.exp(-np.linspace(0,26,n))
    place(mix, 0.34*thump + 0.05*air, max(0,c-0.01))

# --- lift into the endcard
li=int(12.4*SR); ln=int(0.9*SR)
sweep=np.linspace(0,1,ln)**2
seg=np.random.RandomState(7).normal(0,1,ln)*sweep*0.05
mix[li:li+ln]+=seg
# small shimmer on the wordmark
n=int(1.6*SR); tl=np.arange(n)/SR
place(mix, 0.05*np.sin(2*np.pi*880*tl)*np.exp(-np.linspace(0,5,n)), 13.05)

# --- gentle one-pole lowpass to take the edge off
a=0.35
out=np.empty_like(mix); acc=0.0
for i in range(0,N,1):
    acc = acc + a*(mix[i]-acc)
    out[i]=acc
mix = 0.72*out + 0.28*mix

# fades
fi=int(0.35*SR); fo=int(1.1*SR)
mix[:fi]*=np.linspace(0,1,fi); mix[-fo:]*=np.linspace(1,0,fo)

mix/= max(1e-9, np.max(np.abs(mix)))
mix*=0.78
st=np.stack([mix, mix*0.985],axis=1)
pcm=(st*32767).astype(np.int16)
with wave.open("bed.wav","w") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("bed.wav", round(len(mix)/SR,2), "s   peak", round(float(np.max(np.abs(mix))),3))
