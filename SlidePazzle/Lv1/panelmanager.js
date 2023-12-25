/**
 * スライドパズル全体の管理統括を行う
 * @class PanelManager
 */
class PanelManager {
    /**
     * @constructor
     * @param {number} maxWidthPanels パズルの横パネル枚数
     * @param {number} maxHeightPanels パズルの縦パネル枚数
     */
    constructor(maxWidthPanels, maxHeightPanels) {
        this._maxWidth = maxWidthPanels;
        this._maxHeight = maxHeightPanels;
        //パネル群（2次元配列で座標として管理する）
        this._panels = [];
        for (let y = 0; y < maxHeightPanels; y++) {
            const panelY = [];
            for (let x = 0; x < maxWidthPanels; x++) {
                const num = y * maxWidthPanels + x + 1;
                panelY.push(
                    new Panel(
                        y,
                        x,
                        num,
                        maxWidthPanels,
                        maxHeightPanels
                    )
                );
            }
            this._panels.push(panelY);
        }
    }
    /**
     * パネルの表示情報を渡す
     * @returns {Array<JQuery<HTMLDivElement>>}
     */
    //
    get viewPanels() {
        //各パネルが持つHTML要素を１次配列として集め、それを呼び出し元へ返す。
        return this._panels.flat().map(p => p.panel);
    }

    /**
     * パネルをシャッフルする
     */
    shufflePanels() {
        //各パネルの情報をリセットする。
        this._resetPanels();

        //do...while開始
        do {
            //繰り返し回数初期化
            let i = 0;

            //右下の空きマスを固定した場合、2*n回交換すれば必ず解法がある。
            //ランダムに2地点を選択するが、交換に適さない座標を選ぶ可能性があるため、for文ではない方法でカウントする
            while (i < 100) {
                const [aY, aX, bY, bX] = [
                    this._randomInteger(0, this._maxHeight - 1),    //パネルAのY座標
                    this._randomInteger(0, this._maxWidth - 1),     //パネルAのX座標

                    this._randomInteger(0, this._maxHeight - 1),    //パネルBのY座標
                    this._randomInteger(0, this._maxWidth - 1)      //パネルBのX座標
                ];
                //パネルA、Bのどちらかが右下要素を選択していたらやり直し。
                //また、同じ座標を引いてもやり直し
                if ((aY === this._maxHeight - 1 && aX === this._maxWidth - 1) ||
                    (bY === this._maxHeight - 1 && bX === this._maxWidth - 1) ||
                    (aY === bY && aX === bX)) continue;

                //交換
                [this._panels[aY][aX], this._panels[bY][bX]] = [this._panels[bY][bX], this._panels[aY][aX]];
                //交換回数にインクリメント
                i++;
            }
            //表示の更新
            for (let y = 0; y < this._panels.length; y++) {
                for (let x = 0; x < this._panels[y].length; x++) {
                    this._panels[y][x].updatePosition(y, x);
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
        //空きマスの隣（上下左右）だけクリックを受け付ける。また、すでにパネルの並びが完成されている場合もクリックを抑止
        if (this.isCollect || !this._isMovable(y, x)) return;
        //空白パネルのある座標を取得する
        const [empY, empX] = this.emptyPosYX;
        //表示上の更新
        this._panels[empY][empX].updatePosition(y, x);
        this._panels[y][x].updatePosition(empY, empX);
        //データ上の位置交換
        [this._panels[empY][empX], this._panels[y][x]] = [this._panels[y][x], this._panels[empY][empX]];

        //イベント処理後に全てのパネルが揃ったなら、ゲームクリア処理を行う
        if (this.isCollect) this._gameClear();
    }
    /**
     * スライドパズルが正答になったかどうかを判定する
     * @returns {boolean} 全パネルが正解であったらtrue
     */
    get isCollect() {
        return !this._panels.flat().map(p => p.isCollect).includes(false);
    }

    /**
     * 空きマスのパネルを取得する
     * @returns {Panel} 空きマスを表すPanel
     */
    get emptyElem() {
        return this._panels.flat().find(p => p.isEmpty);
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
            this.emptyElem.visible();
        }, 300);
    }

    /**
     * 渡されたyx座標のパネルが動かせるかどうか検証する。
     * @param {number} y 
     * @param {number} x 
     * @returns {boolean} 動かせるならtrue
     */
    _isMovable(y, x) {
        const [empY, empX] = this.emptyPosYX;
        if (
            //空のパネルとY軸が同じで、X軸が±1のパネルがクリックされたらtrue
            (
                y === empY && (
                    x + 1 === empX || x - 1 === empX
                )
            ) ||
            //または空のパネルとX軸が同じで、Y軸が±1のパネルがクリックされたらtrue
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
    /**
     * 各パネルの情報をリセットし、元の位置へ戻す
     */
    _resetPanels() {
        //各パネルの情報をリセットする。
        this._panels.flat().forEach((p) => p.reset());

        //パネル全体をシャローコピーする。
        const copy = this._panels.map((ar) => ar.map((p) => p));

        //各パネルのcollectY、collectX座標を取り、その座標に対応するcopy配列の番号にそのパネルを入れる。
        //繰り返し処理が終わるとコピー配列内のパネルは全て初期位置に収まる。
        for (let y = 0; y < copy.length; y++) {
            for (let x = 0; x < copy[y].length; x++) {
                const Y = this._panels[y][x].collectY;
                const X = this._panels[y][x].collectX;
                copy[Y][X] = this._panels[y][x];
            }
        }
        this._panels = copy;
    }
}