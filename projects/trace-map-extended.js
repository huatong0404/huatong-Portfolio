// Ordinary hexagons visible in the 36 × 36 board beyond the first digital map.
// The original trace-map.js retains every address, event, and connection tile.
(() => {
    const extraRows = [
        [-3, [6, 13]],
        [-2, [1, 5, 6, 7, 9, 15]],
        [-1, [2, 4, 6, 9, 10, 11]],
        [0, [2, 4, 10, 11, 14, 15]],
        [1, [4, 9, 11, 14]],
        [2, [9]],
        [4, [17]],
        [6, [0, 4]],
        [7, [0, 2, 12, 14]],
        [8, [2, 15]],
        [9, [-3, 1, 2]],
        [11, [1]],
        [12, [1, 12, 15]],
        [13, [11, 12, 14, 15, 16]],
        [14, [2, 9, 10, 12, 13, 15, 16]],
        [15, [-3, 9]],
        [16, [1, 6]],
        [17, [-2, 0, 1, 2, 5, 6]],
        [18, [2, 3, 4, 5, 7, 10]],
        [19, [2, 5, 6, 11]],
        [20, [3, 10]]
    ];
    const map = window.TRACE_MAP;
    if (!Array.isArray(map)) return;
    const existing = new Set(map.map(tile => tile.id));
    for (const [c, rows] of extraRows) {
        for (const r of rows) {
            const id = `${c}-${r}`;
            if (existing.has(id)) continue;
            map.push({ id, c, r, x: 80 + 80 * c, y: 76 + 92 * r + (c % 2 ? 46 : 0), kind: 'ordinary' });
        }
    }
    map.sort((a, b) => a.c - b.c || a.r - b.r);
})();
