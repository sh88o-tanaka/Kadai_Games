const [LIVE, DEAD] = [1, 0];

class Generation {
    constructor(w, h) {
        this.arr = 
            Array(h+2)
            .fill(null)
            .map(() => Array(w+2).fill(DEAD));
    }

    updateGen() {
        const getLiveNum = (i, j) => {
            const a = this.arr;
            const result = 
             a[i-1][j-1] + a[i-1][j] + a[i-1][j+1] + 
             a[i][j-1]   +             a[i][j+1]   +
             a[i+1][j-1] + a[i+1][j] + a[i+1][j+1];
            return result;
        }

        const arr = this.arr.map((arr) => arr.map(e => e));
        for (let i = 1; i < arr.length - 1; i++) {
            for (let j = 1; j < arr[i].length - 1; j++) {
                const live = getLiveNum(i,j);
                if (arr[i][j] === DEAD) {
                    arr[i][j] = [3].includes(live) ? LIVE : DEAD;
                }
                else {
                    arr[i][j] = [2,3].includes(live) ? LIVE : DEAD;
                }
            }
        }
        this.arr = arr;

    }

    getGenView() {
        return this.arr.slice(1,this.arr.length - 1)
        .map((arr) => {
            return arr.slice(1, arr.length - 1);
        });
    }

    toggle(tr, td) {
        this.arr[tr][td] = this.arr[tr][td] === DEAD ? LIVE : DEAD;
    }
}