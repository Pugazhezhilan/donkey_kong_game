window.__RENDERING_STARTED__ = false;
const cover = document.getElementById('screen-cover');
const instructions = document.getElementById('screen-instructions');
const soundUI = document.getElementById('sound-ui');
const show = el => el && el.classList.add('show');
const hide = el => el && el.classList.remove('show');

const setScreenState = (mode) => {
  if(!document.body) return;
  document.body.classList.remove('cover-active', 'instructions-active');
  if(mode == 'cover'){
    document.body.classList.add('cover-active');
  }
  if(mode == 'instructions'){
    document.body.classList.add('instructions-active');
  }
};

const snapPanel = (screenEl) => {
  const panel = screenEl?.querySelector('.panel');
  if(!panel){
    return;
  }
  panel.classList.remove('panel-snap');
  void panel.offsetWidth;
  panel.classList.add('panel-snap');
};
const showCover = () => {
  show(cover);
  hide(instructions);
  setScreenState('cover');
  snapPanel(cover);
  if(soundUI){
    soundUI.style.display = 'none';
  }
};
const showInstructions = () => {
  hide(cover);
  show(instructions);
  setScreenState('instructions');
  snapPanel(instructions);
  if(soundUI){
    soundUI.style.display = 'none';
  }
};

const startGame = () => {
  hide(cover);
  hide(instructions);
  setScreenState('');
  if(soundUI){
    soundUI.style.display = 'block';
  }
  if(typeof window.startGameRendering == 'function'){
    window.startGameRendering();
  }
  else{
    console.warn('startGameRendering is not found yet');
  }
};

document.getElementById('btnToInstructions')?.addEventListener('click', () => {
  cover.classList.add('slide-out-left');
  setTimeout(() => {
    cover.classList.remove('slide-out-left');
    showInstructions();
    instructions.classList.add('slide-in-right');
    setTimeout(() => instructions.classList.remove('slide-in-right'), 400);
  }, 320);
});

document.getElementById('btnBackToCover')?.addEventListener('click',() => {
  instructions.classList.add('slide-out-right');
  setTimeout(() => {
    instructions.classList.remove('slide-out-right');
    showCover();
    cover.classList.add('slide-in-left');
    setTimeout(() => cover.classList.remove('slide-in-left'), 400);
  }, 320);
});

document.getElementById('btnStartGame')?.addEventListener('click', startGame);
showCover();