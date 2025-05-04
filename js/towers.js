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

const touchStart = (e) => {

    let board = document.querySelector('.board');
    let touch = e.touches[e.touches.length - 1];
    let elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    let tower = [...elements].find(element => element.classList.contains('tower'));
    let [position, disk] = getDisk(tower);

    if (disk != null) tower.classList.add('from');

    // let tower = getTower(touch.clientX, touch.clientY);

    board.addEventListener('touchmove', touchMove);
    board.addEventListener('touchend', touchEnd);
}

const touchMove = (e) => {

    let touch = e.touches[e.touches.length - 1];
    let towers = document.querySelectorAll('.tower');
    let from = document.querySelector('.from');
    let elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    let tower = [...elements].find(element => element.classList.contains('tower'));

    towers.forEach(tower => tower.classList.remove('to'));

    if (tower != null && from != null && !tower.classList.contains('from')) {
        tower.classList.add('to');
    }
}

const touchEnd = (e) => {

    let board = document.querySelector('.board');
    let from = document.querySelector('.from');
    let to = document.querySelector('.to');

    board.removeEventListener('touchmove', touchMove);
    board.removeEventListener('touchend', touchEnd);

    if (to == null) {
        from.classList.remove('from');
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

    if (disk2 != null && disk1 < disk2) {

        let offset = pos1Rect.height;

        disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - offset}px)`;

        disk.addEventListener('transitionend', () => {

            disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42}px)`;
    
            disk.addEventListener('transitionend', () => {
        
                from.classList.remove('from');
                to.classList.remove('to');    

                enableTouch();
    
            }, {once: true});
        }, {once: true});
        
        return; 
    }

    let offset1 = pos1Rect.top - boardRect.top + pos1Rect.height;
    let offset2 = pos1Rect.left - pos2Rect.left;
    let offset3 = pos1Rect.top - pos2Rect.top;

    disk.style.transform = `translate(${matrix.m41}px, ${matrix.m42 - offset1}px)`;

    disk.addEventListener('transitionend', () => {

        disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset1}px)`;

        disk.addEventListener('transitionend', () => {

            disk.style.transform = `translate(${matrix.m41 - offset2}px, ${matrix.m42 - offset3}px)`;

            from.classList.remove('from');
            to.classList.remove('to');
            delete position1.dataset.disk;
            position2.dataset.disk = disk1;

            enableTouch();

        }, {once: true});
    }, {once: true});
}

const enableTouch = () => {

    let board = document.querySelector('.board');

    board.addEventListener('touchstart', touchStart);
}

const disableTouch = () => {

    let board = document.querySelector('.board');

    board.removeEventListener('touchstart', touchStart);
}

const init = () => {

    disableTapZoom();
    // setBoardSize(); 
    placeDisks();
    showBoard();
    enableTouch();
}

window.onload = () => document.fonts.ready.then(init);