const solvePuzzle = (n, source, destination, auxiliary) => {

    if (n <= 0) return;

    solvePuzzle(n - 1, source, auxiliary, destination);

    console.log(`Move Disk-${n} FROM ${source} TO ${destination}`);

    solvePuzzle(n - 1, auxiliary, destination, source);
}

solvePuzzle (8, 0, 2, 1);