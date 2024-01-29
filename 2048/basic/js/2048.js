/**
 * GameField
 * ゲーム「2048」を制御する。
 */
class GameField {
    /** @type {number[][]} ゲームフィールド */
    #field;
    /** @type {boolean} ゲームがクリア済みかどうか */
    #gameCleared;

    /**
     * @constructor
     */
    constructor() {
        this.#gameCleared = false;
        this.#field =
            Array(LINEUP_PANELS)
                .fill(null)
                .map(() =>
                    Array(LINEUP_PANELS)
                        .fill(0)
                );
        //取得する値の範囲を決める関数
        const r = () => this.#random(0, LINEUP_PANELS - 1);
        let i = 0;
        
        //重ならない2地点に2枚のパネルを生成する。
        while (i < 2) {
            const vec = new Vec(r(), r());
            const p = this.#field[vec.y][vec.x];
            if (p === 0) {
                this.#field[vec.y][vec.x] = 2;
                i++;
            }
        }
        
        /*
        //デバッグ用。任意のマスに任意のパネルを生成する。
        const debug = (panels) => {
            for(let p of panels) {
                if (p[1] !== 0) {
                    this.#field[p[0].y][p[0].x] = p[1];
                }
            }
        }
        const panels = () => Array(LINEUP_PANELS ** 2)
            .fill(null)
            .map((_, i) => 
                [new Vec(i%4, Math.floor(i/4)), (2**(i+2) <= 131_072 ? 2**(i+2) : 0)]
            );
        
        debug(panels());
        */
    }
    get flattenedField() {
        return this.#field.flat();
    }

    /**
     * 盤面を次の状態へ更新する。
     * @param {Vec} pushKeyVec 押したキーに対応するベクトル座標
     * @returns {Promise<number>} 実行後の加算点数を通知する
     */
    update(pushKeyVec) {

        /**
         * 処理の共通化のため、上下左右キーを受け付けたとき、どのキーであっても座標の左上原点（0,0）から探索処理を始められるようにしたい。
         * そのため、下キーと右キーを押した場合に各軸に対する反転処理（配列の並びを逆転）を行った上で、探索処理を行う。
         * データの更新操作が終わったら、反転を元に戻す。
         */
        /* ----関数内関数定義---- */
        const reverseUpDown = (array) => {
            return array.toReversed();
        }

        const rotateLeft = (array) => {
            const y = array.length;
            const x = array[0].length;
            const result = [[],[],[],[]];
            for (let i = 0; i < y; i++) {
                for (let j = 0; j < x; j++) {
                    result[i][j] = array[j][y-1-i];
                }
            }
            return result;
        }
        const rotateRight = (array) => {
            const y = array.length;
            const x = array[0].length;
            const result = [[],[],[],[]];
            for (let i = 0; i < y; i++) {
                for (let j = 0; j < x; j++) {
                    result[i][j] = array[x-1-j][i];
                }
            }
            return result;
        }

        /**
         * 基準地点へ有効なパネルを1枚引き寄せる。
         * @param {Vec} start 基準地点。その地点にパネルがないことが条件。
         * @param {Vec} vec 引き寄せられるかチェックする座標
         * @param {Vec} dV 探索方向
         * @param {number[][]?} copy フィールド（コピー）
         * @returns 
         */
        const attractPanel = (start, vec, dV, copy) => {
            const c = copy?.[vec.y]?.[vec.x];
            if (c == null) return;
            if (c !== 0) {
                //実際には交換で引き寄せを表す。
                const tmp = copy[start.y][start.x];
                copy[start.y][start.x] = copy[vec.y][vec.x];
                copy[vec.y][vec.x] = tmp;
                return;
            }
            else {
                //さらに探索方向へ1マス進め、引き寄せられるか試みる（再帰処理）
                const newVec = new Vec(vec.x + dV.x, vec.y + dV.y);
                attractPanel(start, newVec, dV, copy);
            }
        }

        /**
         * 空白である各地点から探索方向へ検索し、有効なパネルを引き寄せる。
         * @param {Vec} dV 探索方向
         * @param {number[][]?} copy フィールド（コピー）
         */
        const attractNearPanelAtEmptyPoint = (dV, copy) => {
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    //その座標が空白だったとき、探索方向へ引き寄せを試みる。
                    if (copy[y][x] === 0) {
                        const newVec = new Vec(x + dV.x, y + dV.y);
                        attractPanel(new Vec(x, y), newVec, dV, copy);
                    }
                }
            }
        }

        /**
         * 基準点から探索方向の隣接マスを検索し、自身と同じ数値のパネルなら引き寄せる。
         * @param {Vec} start 基準点。空白でないことが条件。
         * @param {Vec} dV 探索方向
         * @param {number[][]?} copy フィールド（コピー）
         * @returns {number} 合算したならそのスコア。なければ0。
         */
        const attractSameNumByNextPoint = (start, dV, copy) => {
            let score = 0;
            const p = copy?.[start.y]?.[start.x];
            if (p) {
                if (p !== 0) {
                    //探索方向の隣接マスをチェックし、同じ値なら合算する。
                    const d = copy?.[start.y + dV.y]?.[start.x + dV.x];
                    if (d && d !== 0 && d === p) {
                        //基準点に値を足し算する。（または2倍でも良い）
                        copy[start.y][start.x] += d;
                        //引き寄せられた側は0にする。
                        copy[start.y + dV.y][start.x + dV.x] = 0;
                        score = d * 2;
                    }
                }
            }
            return score;
        }
        /**
         * パネルが存在する各地点から探索方向の隣接マスを検索し、自身と同じ数値のパネルなら引き寄せる。
         * @param {Vec} dV 探索方向
         * @param {number[][]} copy フィールド（コピー）
         * @returns {number} 全パネルでの合算スコア
         */
        const unionSameNum = (dV, copy) => {
            let scores = 0;
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    scores += attractSameNumByNextPoint(new Vec(x, y), dV, copy);
                }
            }
            return scores;
        }

        /**
         * パネルを1枚、ランダムな空白マスに生成する。空白マスがないなら無視する。
         * @param {number[][]} copy フィールド（コピー）
         */
        const createPanel = (copy) => {
            const flat = copy.flat(1).filter(num => num === 0);
            if (flat.length === 0) return;
            while (true) {
                const choiceVec = new Vec(this.#random(0, LINEUP_PANELS - 1), this.#random(0, LINEUP_PANELS - 1));
                if (copy[choiceVec.y][choiceVec.x] === 0) {
                    copy[choiceVec.y][choiceVec.x] = this.#createScore();
                    break;
                }
            }
        }
        /**
         * 計算前後で盤面の状況が変わらないかどうかチェックする。
         * @param {number[][]} before 計算前フィールド
         * @param {number[][]} after 計算後フィールド
         * @returns {boolean} 変わらなかったかどうか。変わらないならtrue。
         */
        const checkSameField = (before, after) => {
            const flatBefore = before.flat(1);
            const flatAfter = after.flat(1);
            for (let i = 0; i < flatBefore.length; i++) {
                if (flatBefore[i] !== flatAfter[i]) return false;
            }
            return true;
        }
        /* ----関数内関数定義ここまで---- */

        let copy = this.#fieldCopy();
        switch(pushKeyVec) {
            case KeyVec.VEC.DOWN:
                copy = reverseUpDown(copy);
                break;
            case KeyVec.VEC.LEFT:
                copy = rotateLeft(copy);
                copy = reverseUpDown(copy);
                break;
            case KeyVec.VEC.RIGHT:
                copy = rotateLeft(copy);
                break;
        }

        //探索方向は一律下方向とする。
        const pV = KeyVec.VEC.DOWN;
        //操作実行。パネルをボタン押下方向へ引き寄せる。
        attractNearPanelAtEmptyPoint(pV, copy);
        //パネルの合体を行う
        const score = unionSameNum(pV, copy);
        //再度パネルを引き寄せる。
        attractNearPanelAtEmptyPoint(pV, copy);
        //盤面の反転処理を元に戻す。
        switch(pushKeyVec) {
            case KeyVec.VEC.DOWN:
                copy = reverseUpDown(copy);
                break;
            case KeyVec.VEC.LEFT:
                copy = reverseUpDown(copy);
                copy = rotateRight(copy);
                break;
            case KeyVec.VEC.RIGHT:
                copy = rotateRight(copy);
                break;
        }

        //計算前後で盤面が等しいなら、アニメーションなどの変化がないのでここで終了。
        if (checkSameField(this.#field, copy)) return 0;
        //新たに1枚パネル生成を試みる。
        createPanel(copy);

        //盤面データを更新する。
        this.#field = copy;

        return score;
    }

    /**
     * a以上b以下の整数を取得する。
     * @param {number} a 
     * @param {number} b 
     * @returns {number}
     */
    #random(a, b = 0) {
        if (b < a) [a, b] = [b, a];
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }
    /**
     * 特定の確率で値を返す。新規パネルの値を決める。
     * @returns {number} 4 または 2
     */
    #createScore() {
        return this.#random(1, 100) >= 90 ? 4 : 2;
    }
    /**
     * ゲームオーバー条件を満たしたかどうか
     */
    get isGameOver() {
        for (let y = 0; y < this.#field.length; y++) {
            for (let x = 0; x < this.#field[y].length; x++) {
                if (this.#field[y][x] === 0) return false;  //空きマス（数値0）があったらゲームオーバーではない。
                if (this.#field[y][x] === this.#field[y][x + 1]) return false;  //あるマスの右に同じ数値のパネルがあるならゲームオーバーではない。
                if (this.#field[y][x] === this.#field[y + 1]?.[x]) return false;    //あるマスの下に同じ数値のパネルがあるならゲームオーバーではない。
            }
        }
        return true;
    }

    /**
     * ゲームクリア条件を満たしたかどうか。クリア判定を1度取得すると二度とtrueを返さない。
     */
    get isGameClear() {
        //一度ゲームクリア判定して続行したら、ゲーム中二度とtrueを返さない。
        if (this.#gameCleared) return false;
        const isGameClear = this.#field.flat().filter(p => p.num === CLEAR_NUM).length > 0;
        if (isGameClear) {
            this.#gameCleared = true;
            return true;
        }
        else return false;
    }

    /**
     * フィールドをコピーする。
     * @returns 
     */
    #fieldCopy() {
        const copy = [];
        for (let y of this.#field) {
            const cY = [];
            for (let x of y) {
                cY.push(x);
            }
            copy.push(cY);
        }
        return copy;
    }
}
