const N_DISKS = 8;
const N_TOWERS = 3;

const showBoard = () => document.body.classList.add('visible');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const setBoardSize = () => {

    // let cssBoardWidth = 1;
    let minSide = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    // let cssBoardWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--board-width')) / 100;
    let boardWidth = Math.floor(minSide / N_TOWERS) * N_TOWERS;
    // let mediaQuery = window.matchMedia('(min-width: 460px) and (min-height: 460px) and (orientation: landscape)');
    let mediaQuery = window.matchMedia('(min-width: 460px) and (min-height: 460px)');
    let aspectRatio = mediaQuery.matches ? 0.5 : 0.75;
    let boardHeight = Math.round(boardWidth * aspectRatio / (N_DISKS + 2)) * (N_DISKS + 2);

    document.documentElement.style.setProperty('--board-width', `${boardWidth}px`);
    document.documentElement.style.setProperty('--board-height', `${boardHeight}px`);
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

const resetDisks = () => {

    let disks = document.querySelectorAll('.disk');

    disks.forEach((disk, i) => {

        let position = document.querySelector(`[data-disk='${i}']`);
        let style = window.getComputedStyle(disk);
        let matrix = new DOMMatrix(style.transform);
        let diskRect = disk.getBoundingClientRect();
        let positionRect = position.getBoundingClientRect();       
        let offsetPlus = (positionRect.width - diskRect.width) / 2;
        let offsetLeft = positionRect.left - diskRect.left + offsetPlus;
        let offsetTop = positionRect.top - diskRect.top;

        disk.animate([
            {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`},
            {transform: `translate(${matrix.m41 + offsetLeft}px, ${matrix.m42 + offsetTop}px)`}
        ], {
            duration: 0,
            fill: 'forwards'
        });
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

    // if (aiMode()) return;

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
    board.addEventListener('touchcancel', endSwipe);

    document.addEventListener('mousemove', processSwipe);
    document.addEventListener('mouseup', endSwipe);
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

    // console.log(x, y);

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

    const maxLength = () => {

        let towers = document.querySelectorAll('.tower');
        let position1 = towers[0].querySelector('.position:last-child');
        let position2 = towers[2].querySelector('.position:last-child');
        let pos1Rect = position1.getBoundingClientRect();
        let pos2Rect = position2.getBoundingClientRect();
        let boardRect = board.getBoundingClientRect();
        let offset1 = pos1Rect.top - boardRect.top + pos1Rect.height;
        let offset2 = pos1Rect.left - pos2Rect.left;
        let offset3 = pos2Rect.top - boardRect.top + pos2Rect.height;
        let length = Math.abs(offset1) + Math.abs(offset2) + Math.abs(offset3);

        return length;
    }

    let board = document.querySelector('.board');
    let from = document.querySelector('.from');
    let to = document.querySelector('.to');
    // let towers = document.querySelectorAll('.tower');

    board.removeEventListener('touchmove', processSwipe);
    board.removeEventListener('touchend', endSwipe);
    document.removeEventListener('mousemove', processSwipe);
    document.removeEventListener('mouseup', endSwipe);

    if (from == null) return;

    from.classList.remove('from');

    if (to == null) return;

    to.classList.remove('to');

    // disableTouch();

    let [position1, disk1] = getDisk(from);
    let [position2, disk2] = getDisk(to);

    if (disk2 != null) {
        position2 = position2.previousElementSibling;
    }

    let disks = document.querySelectorAll('.disk');
    let disk = disks[disk1];
    // let style = window.getComputedStyle(disk);
    // let matrix = new DOMMatrix(style.transform);
    // let boardRect = board.getBoundingClientRect();
    // let pos1Rect = position1.getBoundingClientRect();
    // let pos2Rect = position2.getBoundingClientRect();

    let animations = disk.getAnimations();
    // let hasRunningAnimation = animations.some(anim => anim.playState == 'running');
    let runningAnimations = animations.filter(anim => anim.playState == 'running');

    // if (hasRunningAnimation) {
    //     console.log('Animation is running');
    //     return;
    // }
    
    if (runningAnimations.length > 0) {

        console.log('Animation is running');

        // return;

        let start = performance.now();

        await Promise.all(runningAnimations.map(anim => anim.finished)); 
                
        let end = performance.now();
        let time = Math.floor((end - start));

        console.log(time);
    }

    let style = window.getComputedStyle(disk);
    let matrix = new DOMMatrix(style.transform);
    let boardRect = board.getBoundingClientRect();
    let pos1Rect = position1.getBoundingClientRect();
    let pos2Rect = position2.getBoundingClientRect();

    // disk.classList.add('move');

    if (disk2 != null && disk1 < disk2) {

        // disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - pos1Rect.height}px)`;
        // await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
        
        // disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42}px)`;
        // await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));

        let keyframes = [
            {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`},
            {transform: `translate(${matrix.m41}px, ${matrix.m42 - pos1Rect.height}px)`},
            {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`},
        ];

        let timing = {
            duration: 300,
            easing: 'linear',
            fill: 'forwards'
        };

        let animation = disk.animate(keyframes, timing);

        // await animation.finished;
            
            // from.classList.remove('from');
            // to.classList.remove('to');
            // disk.classList.remove('move');

            // enableTouch();
            return; 
    }

    const MAX_DURATION = 400;

    let offset1 = pos1Rect.top - boardRect.top + pos1Rect.height;
    let offset2 = pos1Rect.left - pos2Rect.left;
    let offset3 = pos1Rect.top - pos2Rect.top;

    let length = Math.abs(offset1) + Math.abs(offset2) + Math.abs(pos2Rect.top - boardRect.top + pos2Rect.height);
    let duration1 = aiMode() ? 0.33 : Math.abs(offset1) / length;
    let duration2 =  aiMode() ? 0.33 : Math.abs(offset2) / length;
    let totalDuration = length / maxLength() * MAX_DURATION;

    // let duration3 = Math.abs(pos2Rect.top - boardRect.top + pos2Rect.height) / length;

    // console.log(duration1, duration2, duration3);
    // console.log(duration1, duration2);

    // console.log(length, maxLength(), totalDuration);

    delete position1.dataset.disk;
    position2.dataset.disk = disk1;

    // disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - offset1}px)`;
    // await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
    
    // disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset1}px)`;
    // await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));
    
    // disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset3}px)`;
    // await new Promise(resolve => disk.addEventListener('transitionend', resolve, {once: true}));

    let keyframes = [
        {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`, offset: 0},
        {transform: `translate(${matrix.m41}px, ${matrix.m42 - offset1}px)`, offset: duration1},
        {transform: `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset1}px)`, offset: duration1 + duration2},
        {transform: `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset3}px)`, offset: 1}
    ];

    let timing = {
        duration: aiMode() ? MAX_DURATION : totalDuration,
        easing: 'linear',
        fill: 'forwards'
    };

    disk.animate(keyframes, timing);

    // let animation = disk.animate(keyframes, timing);
    // await animation.finished;

    // from.classList.remove('from');
    // to.classList.remove('to');
    // disk.classList.remove('move');

    // delete position1.dataset.disk;
    // position2.dataset.disk = disk1;

    // checkWin(to) ? endGame(to) : enableTouch();

    if (checkWin(to)) endGame(to);
}

const checkWin = (tower) => {

    let towers = [...document.querySelectorAll('.tower')];
    let index = [...towers].indexOf(tower);
    let positions = tower.querySelectorAll('.position');

    if (index == 0) return false;
    
    for (let i = 0; i < positions.length; i++) {
        
        if (Number(positions[i].dataset.disk) != N_DISKS - i - 1) {
            return false;
        }
    }

    return true;
}

const newGame = async (e, tower, handler) => {

    let board = document.querySelector('.board');
    let disks = [...document.querySelectorAll('.disk')];
    let tower0 = document.querySelector('.tower:first-child');
    let tower0Rect = tower0.getBoundingClientRect();
    let towerRect = tower.getBoundingClientRect();
    let offset = towerRect.left - tower0Rect.left;
    let positions = tower.querySelectorAll('.position');
    let positions0 = [...tower0.querySelectorAll('.position')].reverse();

    board.removeEventListener('touchstart', handler);
    board.removeEventListener('mousedown', handler);

    positions.forEach(position => delete position.dataset.disk); 

    positions0.forEach((position, i) =>  position.dataset.disk = i);

    await Promise.all(disks.map(disk => new Promise(resolve => {
        disk.classList.add('invisible');
        disk.addEventListener('transitionend', resolve, {once: true});
    })));

    await Promise.all(disks.map(disk => new Promise(resolve => {

            let style = window.getComputedStyle(disk);
            let matrix = new DOMMatrix(style.transform);

            let animation = disk.animate([
                {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`},
                {transform: `translate(${matrix.m41 - offset}px, ${matrix.m42}px)`}
            ], {
                duration: 1,
                fill: 'forwards'
            });
            
            animation.addEventListener('finish', resolve, {once: true});
    })));

    await Promise.all(disks.map(disk => new Promise(resolve => {
        disk.classList.remove('invisible');
        disk.addEventListener('transitionend', resolve, {once: true});
    })));

    aiMode() ? setTimeout(aiPlay, 1000) : enableTouch();

    // if (aiMode()) setTimeout(aiPlay, 1000);
}

const endGame = async (tower) => {

    const handler = (e) => newGame(e, tower, handler);

    let board = document.querySelector('.board');

    disableTouch();
  
    board.addEventListener('touchstart', handler);
    board.addEventListener('mousedown', handler);
}

const aiPlay = async () => {

    const solvePuzzle = (n, source, destination, auxiliary) => {

        if (n == 0) return;
    
        solvePuzzle(n - 1, source, auxiliary, destination);

        moves.push([source, destination]);
        
        solvePuzzle(n - 1, auxiliary, destination, source);
    }

    let moves = [];
    let board = document.querySelector('.board');
    let towers = [...document.querySelectorAll('.tower')];

    board.classList.add('ai');

    solvePuzzle(N_DISKS, 0, 2, 1);

    let start = performance.now();

    for (let move of moves) {

        towers[move[0]].classList.add('from');
        towers[move[1]].classList.add('to');
        
        await endSwipe();
        // await sleep(100);
    }

    let end = performance.now();
    let time = Math.floor((end - start) / 1000);

    console.log(`AI took ${time} seconds to solve the puzzle`);
}

const aiMode = () => {

    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let mode = urlParams.get('mode');
    
    return mode == 'ai';

    // return true;
}

const handleRotation = () => {

    let mediaQuery = matchMedia('(orientation: landscape)');

    mediaQuery.addEventListener('change', () => {
        setBoardSize();
        resetDisks();
    });
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

const disableTapZoom = () => {

    const preventDefault = (e) => e.preventDefault();

    document.body.addEventListener('touchstart', preventDefault, {passive: false});
    document.body.addEventListener('mousedown', preventDefault, {passive: false});
}

const init = () => {

    disableTapZoom();
    handleRotation();
    setBoardSize();
    placeDisks();
    showBoard();

    aiMode() ? setTimeout(aiPlay, 1000) : enableTouch();
}

window.onload = () => document.fonts.ready.then(init);