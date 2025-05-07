const DISKS = 8;
const TOWERS = 3;

const showBoard = () => document.body.classList.add('visible');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        let positionRect = positions[i].getBoundingClientRect();
        let offsetPlus = (positionRect.width - diskRect.width) / 2;
        let offsetLeft = positionRect.left - diskRect.left + offsetPlus;
        let offsetTop = positionRect.top - diskRect.top;

        positions[i].dataset.disk = i;

        disk.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`;
    });
}

// const getTower = (x, y) => {

//     let towers = [...document.querySelectorAll('.tower')];

//     for (let [i, tower] of towers.entries()) {

//         let towerRect = tower.getBoundingClientRect();

//         if (x >= towerRect.left && x <= towerRect.right && y >= towerRect.top && y <= towerRect.bottom) {
//             return i;
//         }
//     }

//     return null;
// }

const getDisk = (tower) => {

    let positions = [...tower.querySelectorAll('.position')];
    let topPosition = positions.find(pos => pos.dataset.disk != undefined);

    return topPosition ? [topPosition, topPosition.dataset.disk] : [positions[positions.length - 1], null];
}

const startSwipe = (e) => {

    if (aiMode()) return;

    let x,y;
    let board = document.querySelector('.board');

    if (e.type == 'touchstart') {
        x = e.touches[e.touches.length - 1].clientX;
        y = e.touches[e.touches.length - 1].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    // let touch = e.touches[e.touches.length - 1];
    // let elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    let elements = document.elementsFromPoint(x, y);
    let tower = [...elements].find(element => element.classList.contains('tower'));
    let [_, disk] = getDisk(tower);

    if (disk != null) tower.classList.add('from');

    board.addEventListener('touchmove', processSwipe);
    board.addEventListener('touchend', endSwipe);
    board.addEventListener('mousemove', processSwipe);
    board.addEventListener('mouseup', endSwipe);
}

const processSwipe = (e) => {

    let x,y;

    if (e.type == 'touchmove') {
        x = e.touches[e.touches.length - 1].clientX;
        y = e.touches[e.touches.length - 1].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }

    console.log(x, y);

    // let touch = e.touches[e.touches.length - 1];
    let towers = document.querySelectorAll('.tower');
    let from = document.querySelector('.from');
    // let elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    let elements = document.elementsFromPoint(x, y);
    let tower = [...elements].find(element => element.classList.contains('tower'));

    towers.forEach(tower => tower.classList.remove('to'));

    if (tower != null && from != null && !tower.classList.contains('from')) {
        tower.classList.add('to');
    }
}

const endSwipe = async () => {

    let board = document.querySelector('.board');
    let from = document.querySelector('.from');
    let to = document.querySelector('.to');
    let towers = document.querySelectorAll('.tower');

    board.removeEventListener('touchmove', processSwipe);
    board.removeEventListener('touchend', endSwipe);
    board.removeEventListener('mousemove', processSwipe);
    board.removeEventListener('mouseup', endSwipe);

    if (to == null) {
        towers.forEach(tower => tower.classList.remove('from'));
        return;
    }

    disableTouch();

    let [position1, disk1] = getDisk(from);
    let [position2, disk2] = getDisk(to);

    if (disk2 != null) {
        position2 = position2.previousElementSibling;
    }

    let disks = document.querySelectorAll('.disk');
    let disk = disks[disk1];
    let style = window.getComputedStyle(disk);
    let matrix = new DOMMatrix(style.transform);
    let boardRect = board.getBoundingClientRect();
    let pos1Rect = position1.getBoundingClientRect();
    let pos2Rect = position2.getBoundingClientRect();

    disk.classList.add('move');

    if (disk2 != null && disk1 < disk2) {

        disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - pos1Rect.height}px)`;
        await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
        
        disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42}px)`;
        await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
        
        from.classList.remove('from');
        to.classList.remove('to');
        disk.classList.remove('move');

        enableTouch();
        return; 
    }

    let offset1 = pos1Rect.top - boardRect.top + pos1Rect.height;
    let offset2 = pos1Rect.left - pos2Rect.left;
    let offset3 = pos1Rect.top - pos2Rect.top;

    disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - offset1}px)`;
    await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
    
    disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset1}px)`;
    await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
    
    disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset3}px)`;
    await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
    
    from.classList.remove('from');
    to.classList.remove('to');
    disk.classList.remove('move');

    delete position1.dataset.disk;
    position2.dataset.disk = disk1;

    checkWin(to) ? endGame(to) : enableTouch();
}

const checkWin = (tower) => {

    let towers = [...document.querySelectorAll('.tower')];
    let index = [...towers].indexOf(tower);
    let positions = tower.querySelectorAll('.position');

    if (index == 0) return false;
    
    for (let i = 0; i < positions.length; i++) {
        
        if (Number(positions[i].dataset.disk) != DISKS - i - 1) {
            return false;
        }
    }

    return true;
}

const endGame = (tower) => {

}

const aiPlay = async () => {

    const solvePuzzle =  (n, source, destination, auxiliary) => {

        if (n == 0) return;
    
        solvePuzzle(n - 1, source, auxiliary, destination);

        moves.push([source, destination]);
        
        solvePuzzle(n - 1, auxiliary, destination, source);
    }

    let moves = [];
    let board = document.querySelector('.board');
    let towers = [...document.querySelectorAll('.tower')];

    board.classList.add('ai');

    solvePuzzle(DISKS, 0, 2, 1);

    let start = performance.now();

    for (let move of moves) {

        towers[move[0]].classList.add('from');
        towers[move[1]].classList.add('to');
        
        await endSwipe();
        // await sleep(200);
    }

    let end = performance.now();
    let time = Math.floor((end - start) / 1000);

    console.log(`AI took ${time} seconds to solve the puzzle`);
}

const aiMode = () => {

    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let mode = urlParams.get('mode');
    
    // return mode == 'ai';

    return true;
}

const enableTouch = () => {

    let board = document.querySelector('.board');

    board.addEventListener('touchstart', startSwipe);
    board.addEventListener('mousedown', startSwipe);
}

const disableTouch = () => {

    let board = document.querySelector('.board');

    board.removeEventListener('touchstart', startSwipe);
    board.removeEventListener('mousedown', startSwipe);
}

const init = () => {

    disableTapZoom();
    // setBoardSize(); 
    placeDisks();
    showBoard();
    enableTouch();

    if (aiMode()) setTimeout(aiPlay, 2000);
}

window.onload = () => document.fonts.ready.then(init);