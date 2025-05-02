const TOWERS = 3;
const DISKS = 8;
;
const showBoard = () => document.body.style.opacity = 1;

const setBoardSize = () => {

    let minSide = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    let cssBoardSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-size')) / 100;
    let boardSize = Math.ceil(minSide * cssBoardSize / TOWERS) * TOWERS;

    document.documentElement.style.setProperty('--board-size', `${boardSize}px`);
}

const disableTapZoom = () => {

    const preventDefault = (e) => e.preventDefault();

    document.body.addEventListener('touchstart', preventDefault, {passive: false});
    document.body.addEventListener('mousedown', preventDefault, {passive: false});
}

const placeDisks = () => {

    let disks = document.querySelectorAll('.disk');
    let positions = [...document.querySelectorAll('.tower:first-child .position')].reverse();


    disks.forEach((disk, i) => {

        let diskRect = disk.getBoundingClientRect();

        console.log(diskRect.width);

        let positionRect = positions[i].getBoundingClientRect();
        let offsetPlus = (positionRect.width - diskRect.width) / 2;
        let offsetLeft = positionRect.left - diskRect.left + offsetPlus;
        let offsetTop = positionRect.top - diskRect.top;

        disk.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;
    });
}

const init = () => {

    disableTapZoom();
    // setBoardSize(); 
    placeDisks();
    showBoard();
}

window.onload = () => document.fonts.ready.then(init);