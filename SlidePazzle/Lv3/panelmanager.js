/**
 * スライドパズル全体の管理統括を行う
 * @class PanelManager
 */
class PanelManager {
    /**
     * @constructor
     * @param {string} src 画像URL
     * @param {number} maxWidthPanels パズルの横パネル枚数
     * @param {number} maxHeightPanels パズルの縦パネル枚数
     * @param {number} fieldSize フィールドの大きさ（px）
     */
    constructor(src, maxWidthPanels, maxHeightPanels, fieldSize) {
        this._maxWidth = maxWidthPanels;
        this._maxHeight = maxHeightPanels;
        //パネル群（2次元配列で座標として管理する）
        this.panels = [];
        for (let y = 0; y < maxHeightPanels; y++) {
            const panelY = [];
            for (let x = 0; x < maxWidthPanels; x++) {
                panelY.push(
                    new Panel(
                        src,
                        y,
                        x,
                        fieldSize,
                        this
                    ));
            }
            this.panels.push(panelY);
        }
    }
    /**
     * パネルの表示情報を渡す
     * @returns {Array<JQuery<HTMLDivElement>>}
     */
    //
    get viewPanels() {
        return this.panels.flat().map(p => p.panel);
    }

    get maxWidth() {
        return this._maxWidth;
    }
    get maxHeight() {
        return this._maxHeight;
    }

    /**
     * パネルをシャッフルする
     */
    shufflePanels() {
        this._resetPanels();
        do {
            //末尾の要素（空きマス）を一時的に取り除く
            const empty = this.panels[this.panels.length - 1].pop();
            let i = 0;

            //右下の空きマスを固定した場合、2*n回交換すれば必ず解法がある。
            //ランダムに2地点を選択するが、交換に適さない座標を選ぶ可能性があるため、for文ではない方法でカウントする
            while (i < 100) {
                const [aY, aX, bY, bX] = [
                    this._randomInteger(0, this._maxHeight - 1), 
                    this._randomInteger(0, this._maxWidth - 1), 
                    this._randomInteger(0, this._maxHeight - 1), 
                    this._randomInteger(0, this._maxWidth - 1)
                ];
                //その座標に要素が存在しなかったらやり直し（空きマス要素を取り除いたので、その座標が選ばれたらやり直し）
                //また、同じ座標を引いてもやり直し
                if (!this.panels[aY][aX] || !this.panels[bY][bX] || (aY === bY && aX === bX)) continue;
                //交換
                [this.panels[aY][aX], this.panels[bY][bX]] = [this.panels[bY][bX], this.panels[aY][aX]];
                //交換回数にインクリメント
                i++;
            }
            //空きマスを元の要素位置に戻す
            this.panels[this.panels.length - 1].push(empty);
            //表示の更新
            for (let i = 0; i < this.panels.length; i++) {
                for (let j = 0; j < this.panels[i].length; j++) {
                    this.panels[i][j].updatePosition(i, j);
                }
            }
        }
        //do...whileを使い、「1度do内（シャッフル）を実行した後に、並びが正解と等しかったらもう一度繰り返す」ようにする。
        while (this.isCollect);
    }

    /**
     * from以上to以下の整数値を返却する。
     * @private
     * @param {number} from 
     * @param {number} to 
     * @returns {number}
     */
    _randomInteger(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    /**
     * パネルを移動させる
     * @param {number} y クリックしたパネルのy座標
     * @param {number} x クリックしたパネルのx座標
     * @returns 
     */
    movePanel(y, x) {
        //空きマスの隣（上下左右）だけクリックを受け付ける。
        if (this.isCollect || !this._isMovable(y, x)) return;
        const [empY, empX] = this.emptyPosYX;
        //表示上の更新
        this.panels[empY][empX].updatePosition(y, x);
        this.panels[y][x].updatePosition(empY, empX);
        //データ上の位置交換
        [this.panels[empY][empX], this.panels[y][x]] = [this.panels[y][x], this.panels[empY][empX]];

        if (this.isCollect) this._gameClear();
    }
    /**
     * スライドパズルが正答になったかどうかを判定する
     * @returns {boolean} 全パネルが正解であったらtrue
     */
    get isCollect() {
        return !this.panels.flat().map(p => p.isCollect).includes(false);
    }

    /**
     * 空きマスのパネルを取得する
     * @returns {Panel} 空きマスを表すPanel
     */
    get emptyElem() {
        return this.panels.flat().find(p => p.isEmpty);
    }

    /**
     * 空きマスのy座標とx座標を取得する
     * @returns {Array<number>} y座標、x座標を格納した配列
     */
    get emptyPosYX() {
        const emptyElem = this.emptyElem;
        return [emptyElem.nowY, emptyElem.nowX];
    }

    /**
     * ゲームクリア後に行う作業を実行する
     */
    _gameClear() {
        setTimeout(() => {
            this.emptyElem.visibleImg();
            this.panels.flat().map(p => p.hideBorder());
        }, 300);
    }

    /**
     * 渡されたyx座標のパネルが動かせるかどうか検証する。
     * @param {number} y 
     * @param {number} x 
     * @returns {boolean} 動かせるならtrue
     */
    _isMovable(y, x) {
        try {
            const [empY, empX] = this.emptyPosYX;
            if (
                (
                    y === empY && (
                        x + 1 === empX || x - 1 === empX
                    )
                ) ||
                (
                    x === empX && (
                        y + 1 === empY || y - 1 === empY
                    )
                )
            ) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (e) {
            console.error(`invalid position! y=${y}, x=${x}`);
            throw e;
        }
    }
    /**
     * 各パネルの情報をリセットし、元の位置へ戻す
     */
    _resetPanels() {
        this.panels.flat().forEach((p) => p.reset());
        const copy = this.panels.map((ar) => ar.map((p) => p));
        for (let y = 0; y < copy.length; y++) {
            for (let x = 0; x < copy[y].length; x++) {
                const Y = this.panels[y][x].nowY;
                const X = this.panels[y][x].nowX;
                copy[Y][X] = this.panels[y][x];
            }
        }
        this.panels = copy;
    }
}