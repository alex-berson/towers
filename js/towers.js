const N_DISKS = 8;
const N_TOWERS = 3;

const showBoard = () => document.body.classList.add('visible');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const setBoardSize = () => {

    let minSide = window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight;
    let aspectRatioWidth = Number(getComputedStyle(document.documentElement).getPropertyValue('--aspect-ratio-width'));
    let aspectRatioHeight = Number(getComputedStyle(document.documentElement).getPropertyValue('--aspect-ratio-height'));
    let boardWidth = Math.floor(minSide * aspectRatioWidth / N_TOWERS) * N_TOWERS;
    let boardHeight = Math.round(boardWidth * aspectRatioHeight / (N_DISKS + 2)) * (N_DISKS + 2);

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

const getTopDisk = (tower) => {

    let positions = [...tower.querySelectorAll('.position')];
    let topPosition = positions.find(pos => pos.dataset.disk != undefined);

    return topPosition ? [topPosition, Number(topPosition.dataset.disk)] :
                         [positions[positions.length - 1], null];
}

const startSwipe = (e) => {
    
    let board = document.querySelector('.board');
    let source = document.querySelector('.source');

    if (source != null) return;

    let x = e.type == 'touchstart' ? e.changedTouches[0].clientX : e.clientX;
    let y = e.type == 'touchstart' ? e.changedTouches[0].clientY : e.clientY;
    let elements = document.elementsFromPoint(x, y);
    let tower = [...elements].find(element => element.classList.contains('tower'));
    let [_, disk] = getTopDisk(tower);

    if (disk == null) return;

    tower.classList.add('source');

    if (e.type == 'touchstart') {
        board.dataset.touchID = e.changedTouches[0].identifier;
    }

    board.addEventListener('touchmove', processSwipe);
    board.addEventListener('touchend', makeMove);
    board.addEventListener('touchcancel', makeMove);

    document.addEventListener('mousemove', processSwipe);
    document.addEventListener('mouseup', makeMove);
}

const processSwipe = (e) => {

    let x,y;
    let board = document.querySelector('.board');

    if (e.type == 'touchmove') {

        let touchID = Number(board.dataset.touchID);
        let touch = [...e.changedTouches].find(touch => touch.identifier == touchID);

        if (!touch) return;

        x = touch.clientX;
        y = touch.clientY;

    } else {
        x = e.clientX;
        y = e.clientY;
    }

    let towers = document.querySelectorAll('.tower');
    let source = document.querySelector('.source');
    let elements = document.elementsFromPoint(x, y);
    let tower = [...elements].find(element => element.classList.contains('tower'));

    towers.forEach(tower => tower.classList.remove('destination'));

    if (tower != null && source != null && !tower.classList.contains('source')) {
        tower.classList.add('destination');
    }
}

const makeMove = async (e) => {

    const MAX_DURATION = 400;

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
    let source = document.querySelector('.source');
    let destination = document.querySelector('.destination');

    if (e && e.type == 'touchend' && e.touches.length != 0 &&
        e.changedTouches[0].identifier != Number(board.dataset.touchID)) {
        return;
    }

    board.removeEventListener('touchmove', processSwipe);
    board.removeEventListener('touchend', makeMove);
    board.removeEventListener('touchcancel', makeMove);
    document.removeEventListener('mousemove', processSwipe);
    document.removeEventListener('mouseup', makeMove);

    if (source == null) return;

    source.classList.remove('source');

    if (destination == null) return;

    destination.classList.remove('destination');

    let [position1, disk1] = getTopDisk(source);
    let [position2, disk2] = getTopDisk(destination);

    if (disk2 != null) {
        position2 = position2.previousElementSibling;
    }

    let disks = document.querySelectorAll('.disk');
    let disk = disks[disk1];
    let animations = disk.getAnimations();
    let runningAnimations = animations.filter(animation => animation.playState == 'running');
    
    if (runningAnimations.length > 0) return;

    let style = window.getComputedStyle(disk);
    let matrix = new DOMMatrix(style.transform);
    let boardRect = board.getBoundingClientRect();
    let pos1Rect = position1.getBoundingClientRect();
    let pos2Rect = position2.getBoundingClientRect();

    if (disk2 != null && disk1 < disk2) {

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

        disk.animate(keyframes, timing);

        return;
    }

    let offset1 = pos1Rect.top - boardRect.top + pos1Rect.height;
    let offset2 = pos1Rect.left - pos2Rect.left;
    let offset3 = pos1Rect.top - pos2Rect.top;

    let length = Math.abs(offset1) + Math.abs(offset2) + Math.abs(pos2Rect.top - boardRect.top + pos2Rect.height);
    let duration1 = aiMode() ? 0.33 : Math.abs(offset1) / length;
    let duration2 = aiMode() ? 0.33 : Math.abs(offset2) / length;
    let totalDuration = length / maxLength() * MAX_DURATION;

    delete position1.dataset.disk;
    position2.dataset.disk = disk1;

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

    let animation = disk.animate(keyframes, timing);

    if (gameOver(destination)) {
        disableTouch();
        await animation.finished;
        endGame(destination);
        return;
    }

    return animation.finished;
}

const gameOver = (tower) => {

    let towers = [...document.querySelectorAll('.tower')];
    let positions = tower.querySelectorAll('.position');

    if ([...towers].indexOf(tower) == 0) return false;

    for (let i = 0; i < positions.length; i++) {
        if (Number(positions[i].dataset.disk) != N_DISKS - i - 1) return false;
    }

    return true;
}

const endGame = async (tower) => {

    const handler = (e) => resetGame(e, tower, handler);

    let board = document.querySelector('.board');
    let chars = [...document.querySelectorAll('.char')]

    await Promise.all(chars.map(async (char, i) => {

        await sleep(200 * i);

        char.classList.add('rotate');

        return new Promise(resolve => {
            char.addEventListener('transitionend', () => {
                char.classList.remove('rotate');
                resolve();
            }, { once: true });
        });
    }));

    board.addEventListener('touchstart', handler);
    board.addEventListener('mousedown', handler);
}

const resetGame = async (e, tower, handler) => {

    let board = document.querySelector('.board');
    let disks = [...document.querySelectorAll('.disk')];
    let tower0 = document.querySelector('.tower:first-child');
    let tower0Rect = tower0.getBoundingClientRect();
    let towerRect = tower.getBoundingClientRect();
    let offset = towerRect.left - tower0Rect.left;
    let positions = tower.querySelectorAll('.position');
    let positions0 = [...tower0.querySelectorAll('.position')].reverse();
    let rod = tower.querySelector('.rod');
    let rod0 = tower0.querySelector('.rod');

    board.removeEventListener('touchstart', handler);
    board.removeEventListener('mousedown', handler);

    positions.forEach(position => delete position.dataset.disk); 
    positions0.forEach((position, i) => position.dataset.disk = i);

    let rodPromises = [rod, rod0].map((rod, i) => new Promise(resolve => {

        rod.classList.add('move');
        rod.style.transform = `translateX(${offset * (2 * i - 1)}px)`;

        rod.addEventListener('transitionend', resolve, {once: true});
    }));

    let diskPromises = disks.map(disk => new Promise(resolve => {

        let style = window.getComputedStyle(disk);
        let matrix = new DOMMatrix(style.transform);
        let animation = disk.animate([
            {transform: `translate(${matrix.m41}px, ${matrix.m42}px)`},
            {transform: `translate(${matrix.m41 - offset}px, ${matrix.m42}px)`}
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'linear'
        });

        animation.addEventListener('finish', resolve, {once: true});
    }));

    await Promise.all([...rodPromises, ...diskPromises]);

    [rod, rod0].forEach(rod => {
        rod.classList.remove('move');
        rod.removeAttribute('style');
    });

    aiMode() ? setTimeout(aiPlay, 500) : enableTouch();
}

const aiMode = () => {

    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    let mode = urlParams.get('mode');

    return mode == 'ai';
}

const aiPlay = async () => {

    const solvePuzzle = (n, source = 0, auxiliary = 1, destination = 2, moves = []) => {

        if (n == 0) return;

        solvePuzzle(n - 1, source, destination, auxiliary, moves);

        moves.push({source, destination});

        solvePuzzle(n - 1, auxiliary, source, destination, moves);

        return moves;
    }

    let moves = solvePuzzle(N_DISKS);
    let board = document.querySelector('.board');
    let towers = [...document.querySelectorAll('.tower')];

    board.classList.add('ai');

    for (let move of moves) {

        towers[move.source].classList.add('source');
        towers[move.destination].classList.add('destination');

        await makeMove();
    }
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

const disableScreen = () => {

    const preventDefault = (e) => e.preventDefault();

    document.addEventListener('touchstart', preventDefault, {passive: false});
    document.addEventListener('mousedown', preventDefault, {passive: false});
}

const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
}

const init = () => {

    registerServiceWorker();
    disableScreen();
    setBoardSize();
    placeDisks();
    showBoard();

    aiMode() ? setTimeout(aiPlay, 1000) : enableTouch();
}

window.onload = () => document.fonts.ready.then(init);