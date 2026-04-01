class Sound{
    constructor(){
        this.ctx = null;
        this.buffers = new Map();
        this.unlocked = false;
        this.masterVolume = 0.8;
    }
    async init(){
        if(this.ctx)return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    }
    async unlock(){
        await this.init();
        if(this.ctx.state == "suspended"){
            try{
                await this.ctx.resume();
            }
            catch(error){
                console.log(error);
            }
        }
        this.unlocked = this.ctx.state == 'running';
    }
    async load(name,url){
        await this.init()
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
        this.buffers.set(name, audioBuffer);
    }
    play(name,{volume=1,rate=1}={}){
        if(!this.ctx)return;
        const buffer = this.buffers.get(name);
        if(!buffer)return;
        if(this.ctx.state != "running")return;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        const gain = this.ctx.createGain();
        gain.gain.value = Math.max(0,Math.min(1,volume*this.masterVolume))
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
    }
}

window.Sound = Sound;