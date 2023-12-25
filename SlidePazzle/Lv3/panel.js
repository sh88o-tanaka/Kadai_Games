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
     * @param {string} src 画像名
     * @param {number} y パズル内のy座標（0～）
     * @param {number} x パズル内のx座標（0～）
     * @param {number} fieldSize パズル盤面の大きさ
     * @param {PanelManager} parent Panelを管理するManagerクラス。操作イベント発生時に通知する。
     */
    constructor(src, y, x, fieldSize, parent) {
        /**
         * このパネルの正解x座標 @type {number} @private
         */
        this._collectX = x;
        /**
         * このパネルの正解y座標 @type {number} @private
         */
        this._collectY = y;
        /**
         * このパネルの現在x座標 @type {number} @private
         */
        this._nowX = x;
        /**
         * このパネルの現在y座標 @type {number} @private
         */
        this._nowY = y;
        /**
         * 呼び出し元のPanelManagerクラス @type {PanelManager} @private
         */
        this._parent = parent;
        /**
         * 自分が空きパネルであるかどうか @type {boolean} @private
         */
        this._isEmpty = x === this._parent.maxWidth - 1 && y === this._parent.maxHeight - 1;
        /**
         * このパネルを表すjQuery要素 @type {JQuery<HTMLDivElement>} @private
         */
        this._panelElem = this._createDiv(y,x,src, fieldSize);
    }

    /**
     * Div要素を作成、設定し、パネルの表示部分を決定する
     * @param {number} y パネルのy座標
     * @param {number} x パネルのx座標
     * @param {string} src 画像のURL
     * @returns {JQuery<HTMLDivElement>}
     * @private
     */
    _createDiv(y, x, src, fieldSize) {
        const panelElem = $("<div>");
        //div要素自身の配置（要素の左上を基準とする）
        const pos = this._calcPosition(y, x);
        //div要素の大きさ
        const width = String(1 / this._parent.maxWidth * 100) + "%";
        const height = String(1 / this._parent.maxHeight * 100) + "%";

        //div要素内の背景画像の表示位置
        const imgLeft = String(x / (this._parent.maxWidth - 1) * 100) + "%";
        const imgTop = String(y / (this._parent.maxHeight - 1) * 100) + "%";

        //div要素のCSSを設定。この内topとleftは別メソッドで更新することがある。その他は作成時に決めた後は固定値。
        panelElem.css({
            top: pos.top,
            left: pos.left,
            width: width,
            height: height,
            "background-size" : `${fieldSize}px`,
            "background-image": `url(${src})`,
            "background-position": `${imgLeft} ${imgTop}`,
            "z-index": !this._isEmpty ? 1 : 0,
            "visibility": !this._isEmpty ? "visible" : "hidden",
            "opacity": !this._isEmpty ? 1 : 0
        });
        //デバッグ用に各要素にidを振る（配列内の要素番号）
        panelElem.attr({
            id: `yx-${y}-${x}`
        })
        //パネル要素に自分自身のデータクラス（このクラスのインスタンス）を紐付ける。
        panelElem.data({panel : this});
        //クリックしたらPanelManager#movePanelを実行する
        /*panelElem.on("click", this, (e) => {
            const parent = e.data._parent;
            parent.movePanel(e.data.nowY, e.data.nowX);
        });
        */
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
        this._nowY = y;
        this._nowX = x;
        const pos = this._calcPosition(y, x);
        this._panelElem.css({
            top: pos.top,
            left: pos.left
        });
    }
    /**
     * 非表示状態のパネルを表示する
     */
    visibleImg() {
        this._panelElem.css({
            "visibility": "visible",
            "opacity": 1,
        });
    }
    /** 
     * パネルの枠線を非表示にする
     */
    hideBorder() {
        this._panelElem.addClass("border-hidden");
    }
    /** 
     * パネルの枠線を表示する
     */
    showBorder() {
        this._panelElem.removeClass("border-hidden");
    }
    /**
     * このパネルの正解のx座標を返す
     * @returns {number}
     */
    get collectX() {
        return this._collectX;
    }
    /**
     * このパネルの正解のy座標を返す
     * @returns {number}
     */
    get collectY() {
        return this._collectY;
    }

    /**
     * このパネルの現在のx座標を返す
     * @returns {number}
     */
    get nowX() {
        return this._nowX;
    }
    /**
     * このパネルの現在のy座標を返す
     * @returns {number}
     */
    get nowY() {
        return this._nowY;
    }

    /**
     * 現在のパネルの位置が正解座標にあるかどうかを判定する
     * @returns {boolean} 正解座標にあればtrue
     */
    get isCollect() {
        return this._collectX === this._nowX && this._collectY === this._nowY;
    }
    /**
     * パネルの表示位置、表示内容をリセットする。
     */
    reset() {
        //正解座標＝現在座標に書き換えておく（NowXとNowYの初期化）
        this.updatePosition(this.collectY, this.collectX);

        this.showBorder();
        if (this._isEmpty) {
            this._panelElem.css({
                "visibility": "hidden",
                "opacity": 0
            })
        }
    }

    /**
     * パネルの座標に基づいて実際のposition表示位置を算出する
     * @private
     * @param {number} y 
     * @param {number} x 
     * @returns {Positions} top,left …表示位置（0～100%）
     */
    _calcPosition(y, x) {
        const top = String(y / this._parent.maxHeight * 100) + "%";
        const left = String(x / this._parent.maxWidth * 100) + "%";        
        /**
         * @typedef Positions
         * @type {object}
         * @property {string} top - positionのtopプロパティ値（0～100%）
         * @property {string} left - positionのleftプロパティ値（0～100%）
        */
        return { top, left };
    }
}
