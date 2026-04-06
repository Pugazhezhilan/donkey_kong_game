window.__RENDERING_STARTED__ = false;

const cover = document.getElementById('screen-cover');
const instructions = document.getElementById('screen-instructions');
const soundUI = document.getElementById('sound-ui');

const show = (el) => el && el.classList.add('show');
const hide = (el) => el && el.classList.remove('show');

const showCover = () => {
    show(cover);
    hide(instructions);
    if(soundUI){
        soundUI.style.display = 'none';
    }
}

const showInstructions = () => {
    hide(cover);
    show(instructions);
    if(soundUI){
        soundUI.style.display = 'none';
    }
};

const startGame = () => {
    hide(cover);
    hide(instructions);
    if(soundUI)soundUI.style.display = 'block';

    if(typeof window.startGameRendering == 'function'){
        window.startGameRendering();
    }
    else{
        console.warn('startGameRendering not found yet');
    }
};

document.getElementById('btnToInstructions')?.addEventListener('click', showInstructions);
document.getElementById('btnBackToCover')?.addEventListener('click', showCover);
document.getElementById('btnStartGame')?.addEventListener('click', startGame);

showCover();