/**
 * GameField
 * ゲーム「2048」を制御する。
 */
class GameField {
    /** @type {Panel[][][]} ゲームフィールド */
    #field;
    /** @type {jQuery} 要素を追加するjQueryオブジェクト */
    #jqRoot;
    /** @type {boolean} ゲームがクリア済みかどうか */
    #gameCleared;

    /**
     * @constructor
     * @param {jQuery} jqRoot 
     */
    constructor(jqRoot) {
        this.#jqRoot = jqRoot;
        this.#gameCleared = false;
        this.#field =
            Array(LINEUP_PANELS)
                .fill(null)
                .map(() =>
                    Array(LINEUP_PANELS)
                        .fill(null)
                        .map(() => Array())
                );
        //取得する値の範囲を決める関数
        const r = () => this.#random(0, LINEUP_PANELS - 1);
        let i = 0;
        
        //重ならない2地点に2枚のパネルを生成する。
        while (i < 2) {
            const vec = new Vec(r(), r());
            const p = this.#field[vec.y][vec.x];
            if (p.length === 0) {
                this.#field[vec.y][vec.x].push(new Panel(vec, 2, this.#jqRoot));
                i++;
            }
        }
        /*
        //デバッグ用。任意のマスに任意のパネルを生成する。
        const debug = (...panels) => {
            for(let p of panels) {
                if (p[1] !== 0) {
                    this.#field[p[0].y][p[0].x].push(new Panel(p[0], p[1], this.#jqRoot));
                }
            }
        }
        debug(
            [new Vec(0,0),2], [new Vec(1,0),4], [new Vec(2,0),8], [new Vec(3,0),16],
            [new Vec(0,1),4], [new Vec(1,1),8], [new Vec(2,1),512], [new Vec(3,1),128],
            [new Vec(0,2),1024], [new Vec(1,2),16], [new Vec(2,2),64], [new Vec(3,2),1024],
            [new Vec(0,3),256], [new Vec(1,3),512], [new Vec(2,3),32], [new Vec(3,3),1024], 
        );
        */
    }

    /**
     * 盤面を次の状態へ更新する。
     * @param {Vec} pushKeyVec 押したキーに対応するベクトル座標
     * @returns {Promise<number>} 実行後の加算点数を通知する
     */
    async update(pushKeyVec) {
        /**
         * 処理の共通化のため、上下左右キーを受け付けたとき、どのキーであっても座標の左上原点（0,0）から探索処理を始められるようにしたい。
         * そのため、下キーと右キーを押した場合に各軸に対する反転処理（配列の並びを逆転）を行った上で、探索処理を行う。
         * データの更新操作が終わったら、反転を元に戻す。
         */
        /* ----関数内関数定義---- */
        /**
         * 基準地点へ有効なパネルを1枚引き寄せる。
         * @param {Vec} start 基準地点。その地点にパネルがないことが条件。
         * @param {Vec} vec 引き寄せられるかチェックする座標
         * @param {Vec} dV 探索方向
         * @param {Panel[][][]?} copy フィールド（コピー）
         * @returns 
         */
        const attractPanel = (start, vec, dV, copy) => {
            const c = copy?.[vec.y]?.[vec.x];
            if (c) {
                if (c.length !== 0) {
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
        }

        /**
         * 空白である各地点から探索方向へ検索し、有効なパネルを引き寄せる。
         * @param {Vec} dV 探索方向
         * @param {Panel[][][]?} copy フィールド（コピー）
         */
        const attractNearPanelAtEmptyPoint = (dV, copy) => {
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    //その座標が空白だったとき、探索方向へ引き寄せを試みる。
                    if (copy[y][x].length === 0) {
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
         * @param {Panel[][][]?} copy フィールド（コピー）
         */
        const attractSameNumByNextPoint = (start, dV, copy) => {
            const p = copy?.[start.y]?.[start.x];
            if (p) {
                if (p.length === 1) {
                    const panelScore = p[0].num;
                    //探索方向の隣接マスをチェックし、同じ値ならそのPanelを同じ配列に置く。
                    const d = copy?.[start.y + dV.y]?.[start.x + dV.x];
                    if (d && d.length === 1 && d[0].num === panelScore) {
                        p.push(d.pop());
                    }
                }
            }
        }
        /**
         * パネルが存在する各地点から探索方向の隣接マスを検索し、自身と同じ数値のパネルなら引き寄せる。
         * @param {Vec} dV 探索方向
         * @param {Panel[][][]?} copy フィールド（コピー）
         */
        const unionSameNum = (dV, copy) => {
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    attractSameNumByNextPoint(new Vec(x, y), dV, copy);
                }
            }
        }
        /**
         * フィールド（コピー）内の全パネルに対して座標の更新を行う。Panelによりアニメーションが実行される。
         * @param {Panel[][][]?} copy フィールド（コピー）
         */
        const slide = (copy) => {
            copy.forEach((ps, y) =>
                ps.forEach((p, x) => {
                    p[0]?.slide(new Vec(x, y));
                    p[1]?.goBelow().slide(new Vec(x, y));
                })
            );
        }

        /**
         * パネルを1枚、ランダムな空白マスに生成する。空白マスがないなら無視する。
         * @param {Panel[][][]} copy フィールド（コピー）
         */
        const createPanel = (copy) => {
            const flat = copy.flat(1).filter(ar => ar.length === 0);
            if (flat.length === 0) return;
            const choice = flat[this.#random(0, flat.length - 1)];
            for (let y = 0; y < copy.length; y++) {
                for (let x = 0; x < copy[y].length; x++) {
                    if (copy[y][x] === choice) {
                        copy[y][x].push(new Panel(new Vec(x, y), this.#createScore(), this.#jqRoot));
                        return;
                    }
                }
            }
        }
        /**
         * 計算前後で盤面の状況が変わらないかどうかチェックする。
         * @param {Panel[][][]} before 計算前フィールド
         * @param {Panel[][][]} after 計算後フィールド
         * @returns {boolean} 変わらなかったかどうか。変わらないならtrue。
         */
        const checkSameField = (before, after) => {
            const flatBefore = before.flat(1);
            const flatAfter = after.flat(1);
            for (let i = 0; i < flatBefore.length; i++) {
                if (
                    flatBefore[i].length !== flatAfter[i].length ||
                    flatBefore[i]?.[0]?.num !== flatAfter[i]?.[0]?.num
                ) return false;
            }
            return true;
        }
        /* ----関数内関数定義ここまで---- */

        //反転を行ったかどうか
        const isReverse = {
            x: false,
            y: false,
        }
        //盤面の更新にはコピーしたフィールドを使う。
        let copy = this.#fieldCopy();
        const pV = pushKeyVec;

        //押したキーの向きによってフィールドを反転させ、常に『左上』から処理を開始できるようにする。
        //下キーを押した場合は上下反転
        if (pV.y > 0) {
            copy.reverse();
            isReverse.y = true;
        }
        else pV.y *= -1;

        //右キーを押した場合は左右反転
        if (pV.x > 0) {
            for (let y of copy) y.reverse();
            isReverse.x = true;
        }
        else pV.x *= -1;


        //操作実行。パネルをボタン押下方向へ引き寄せる。
        attractNearPanelAtEmptyPoint(pV, copy);
        //パネルの合体を行う
        unionSameNum(pV, copy);
        //再度パネルを引き寄せる。
        attractNearPanelAtEmptyPoint(pV, copy);
        //盤面の反転処理を元に戻す。
        if (isReverse.y) copy.reverse();
        if (isReverse.x) for (let y of copy) y.reverse();

        //計算前後で盤面が等しいなら、アニメーションなどの変化がないのでここで終了。
        if (checkSameField(this.#field, copy)) return 0;
        //変化後の盤面で各パネルのデータを更新し、スライドアニメーションを実行する。
        slide(copy);
        //新たに1枚パネル生成を試みる。
        createPanel(copy);
        //アニメーションに必要な時間を取ったあと、不要になった要素の除去と加算スコアを計算する。
        const score = await new Promise((resolve) => {
            setTimeout(() => {
                let sumScore = 0;
                for (let y of copy) {
                    for (let x of y) {
                        if (x.length === 2) {
                            x.pop().removeElement();
                            sumScore += x[0].union();
                        }
                    }
                }
                resolve(sumScore);
            }, 200);
        });
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
                if (this.#field[y][x].length === 0) return false;
                if (this.#field[y][x][0].num === this.#field?.[y]?.[x + 1]?.[0]?.num) return false;
                if (this.#field[y][x][0].num === this.#field?.[y + 1]?.[x]?.[0]?.num) return false;
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
        const isGameClear = this.#field.flat(2).filter(p => p.num === CLEAR_NUM).length > 0;
        if (isGameClear) {
            this.#gameCleared = true;
            return true;
        }
        else return false;
    }

    /**
     * フィールドをコピーする。ただし、Panelオブジェクトは参照コピーとする。
     * @returns 
     */
    #fieldCopy() {
        const copy = [];
        for (let y of this.#field) {
            const cY = [];
            for (let x of y) {
                //各座標のPanelオブジェクトは参照コピーとする。オブジェクトを使い回すことができる。
                cY.push([...x]);
            }
            copy.push(cY);
        }
        return copy;
    }
    /**
     * パネルを全て消去する。
     */
    reset() {
        this.#field.flat(2).forEach(p => p.removeElement());
    }
}
