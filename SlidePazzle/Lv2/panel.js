/**
 * Panel
 * スライドパズルのパネル1枚を表す
 * @class Panel
 */
class Panel {
    /**
     * スライドパネルを1枚生成し、状態を管理する。
     * 全体の縦横パネル枚数と座標を基に、表示用のHTML要素を作り、それを管理する。
     * @constructor
     * @param {number} y パズル内のy座標（0～）
     * @param {number} x パズル内のx座標（0～）
     * @param {number} maxWidth 盤面の最大幅（マス）
     * @param {number} maxHeight 盤面の最大高さ（マス）
     * @param {string} src 表示する背景画像のURL
     * @param {number} fieldSize 盤面のサイズ
    */
    constructor(y, x, maxWidth, maxHeight, src, fieldSize) {
        /**
         * 自分が空きパネルであるかどうか @type {boolean} @private
         */
        this._isEmpty = x === maxWidth - 1 && y === maxHeight - 1;
        /**
         * このパネルを表すjQuery要素 @type {JQuery<HTMLDivElement>} @private
         */
        this._panelElem = this._createDiv(y, x, maxWidth, maxHeight, src, fieldSize);
    }

    /**
     * div要素を作成、設定し、パネルの表示部分を決定する
     * @param {number} y パネルのy座標
     * @param {number} x パネルのx座標
     * @param {number} maxWidth 盤面の最大幅（マス）
     * @param {number} maxHeight 盤面の最大高さ（マス）
     * @param {string} src 表示する背景画像のURL
     * @param {number} fieldSize 盤面のサイズ
     * @returns {JQuery<HTMLDivElement>}
     * @private
     */
    _createDiv(y, x, maxWidth, maxHeight, src, fieldSize) {
        //要素作成
        const panelElem = $("<div>");
        //div要素の大きさを計算
        const width = String(1 / maxWidth * 100) + "%";
        const height = String(1 / maxHeight * 100) + "%";

        //div要素内の背景画像の表示位置
        const imgLeft = String(x / (maxWidth - 1) * 100) + "%";
        const imgTop = String(y / (maxHeight - 1) * 100) + "%";

        //div要素のCSSを設定
        panelElem.css({
            width: width,
            height: height,
            "background-size": `${fieldSize}px`,
            "background-image": `url(${src})`,
            "background-position": `${imgLeft} ${imgTop}`,
            "z-index": !this._isEmpty ? 1 : 0,
            "visibility": !this._isEmpty ? "visible" : "hidden",
            "opacity": !this._isEmpty ? 1 : 0
        });
        //div要素の属性を設定
        panelElem.attr({
            id: `yx-${y}-${x}`,     //デバッグ用に各要素にidを振る（配列内の要素番号）
            "data-collect-x": x,
            "data-collect-y": y,
            "data-now-x": x,
            "data-now-y": y
        });
        //表示用番号をテキストとして設定する
        //panelElem.text(num);
        return panelElem;
    }
    /**
     * パネルの表示要素を返す
     * @returns {JQuery<HTMLDivElement>}
     */
    get panel() {
        return this._panelElem;
    }
    /**
     * パネルの初期値が空きマスであったかどうかを返す
     * @returns {boolean}
     */
    get isEmpty() {
        return this._isEmpty;
    }
    /**
     * パネルの位置を更新する
     * @param {number} y 更新後のy座標
     * @param {number} x 更新後のx座標
     */
    updatePosition(y, x) {
        //カスタムデータ属性を書き換える
        this._panelElem.attr({
            "data-now-x": x,
            "data-now-y": y
        });
    }
    /**
     * 非表示状態のパネルを表示する
     */
    visible() {
        //CSSを書き換える
        this._panelElem.css({
            "visibility": "visible",
            "opacity": 1,
        });
    }

    /**
      * このパネルの現在のx座標を返す
      * @returns {number}
      */
    get nowX() {
        return this._getDataAttrNumber("data-now-x");
    }

    /**
     * このパネルの現在のy座標を返す
     * @returns {number}
     */
    get nowY() {
        return this._getDataAttrNumber("data-now-y");
    }

    /**
     * このパネルの正解x座標を返す
     */
    get collectX() {
        return this._getDataAttrNumber("data-collect-x");
    }

    /**
     * このパネルの正解y座標を返す
     */
    get collectY() {
        return this._getDataAttrNumber("data-collect-y");
    }

    /**
     * 指定された名前のHTML属性から値を取得し、それを数値として返す。
     * @param {string} name HTML属性名
     * @returns {number} 属性値を数値としたもの
     */
    _getDataAttrNumber(name) {
        return Number(this._panelElem.attr(name));
    }

    /**
     * 現在のパネルの位置が正解座標にあるかどうかを判定する
     * @returns {boolean} 正解座標にあればtrue
     */
    get isCollect() {
        return this.collectX === this.nowX && this.collectY === this.nowY;
    }
    /**
     * パネルの表示位置、表示内容をリセットする。
     */
    reset() {
        //正解座標＝現在座標に書き換えておく（NowXとNowYの初期化）
        this.updatePosition(this.collectY, this.collectX);

        //空白パネルを非可視化
        if (this._isEmpty) {
            this._panelElem.css({
                "visibility": "hidden",
                "opacity": 0
            })
        }
    }
}
