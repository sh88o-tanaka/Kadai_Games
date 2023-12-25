/**
 * Panelクラス
 * マインスイーパー内の1マスを表す
 */
class Panel {
    //表示する数字の色を指定する。数値ごとに色を変える。
    static textColor = [
        null,       //0
        "blue",     //1
        "green",    //2
        "red",      //3
        "violet",   //4
        "brown",    //5
        "navy",     //6
        "black",    //7
        "gold"      //8
    ];
    /**
     * Panelオブジェクトの初期化
     * @constructor
     * @param {number} y 
     * @param {number} x 
     * @param {number=} isWall 
     */
    constructor(y, x, isWall = false) {
        /** 自分が地雷かどうか @type {boolean} */
        this._isMine = false;
        /** 自分の周りにいくつ地雷が有るか @type {number} */
        this._aroundMines = isWall ? -1 : 0;
        /** 自分のX座標 @type {number} */
        this._x = x;
        /** 自分のY座標 @type {number} */
        this._y = y;
        /** 自分はすでにオープンされたか？ @type {boolean} */
        this._isOpen = false;
        /** 自分にフラグは立てられているか？ @type {boolean} */
        this._isFlag = false;
        /** 自分を表すHTML要素 @type {jQuery<HTMLTableCellElement>} */
        //td要素（HTML）に、JSのデータであるPanelオブジェクトを紐づけておく。
        //イベントが発生した時に取り出すことで、Panelオブジェクトを操作できるようになる。
        this._element = $("<td>").addClass("close").data({ "panel": this });
    }

    /**
     * 左クリック（シングル）の動作
     * @returns {Object | null}
     */
    leftClick() {
        if (this._isOpen || this._isFlag) return null;
        this._isOpen = true;
        this._element.removeClass("close").addClass("open");
        if (this._aroundMines > 0) this._setNumberText();
        else if (this._isMine) this._showMine(true);
        return {
            aroundMines: this._aroundMines,
            isMine: this._isMine
        };
    }
    /**
     * 右クリック時の動作
     */
    rightClick() {
        if (this._isOpen) return;
        this._isFlag = !this._isFlag;
        this._setFlagText();
    }
    /**
     * ゲーム終了時の動作
     */
    showAnswer() {
        //自分にフラグを立てている時、
        //1 :　そこに爆弾がなかったら❌マークを出す。（CSS：miss-flagクラス）
        //2 ： 爆弾があったら何もしない。
        //自分にフラグがなく、かつ爆弾がある時
        //爆弾を表示する
        if (this._isFlag) {
            if (!this._isMine) this.element.addClass("miss-flag");
        }
        else {
            if (this._isMine) this._showMine(false);
        }
    }

    /**
     * 自分の地雷を表示する
     * @param {boolean} isClick このマスがクリックされたかどうか
     */
    _showMine(isClick) {
        this._element.text("💣").addClass(isClick ? "bomb-click" : null);
    }

    /**
     * フラグの設置・非設置について表示変更する。
     */
    _setFlagText() {
        this._element.toggleClass("flag").text(this._isFlag ? "🚩" : "");
    }

    /**
     * 自分の周囲にある地雷数を表示する。
     */
    _setNumberText() {
        this._element
            .text(this._aroundMines)
            .css({ "color": Panel.textColor[this._aroundMines] });
    }
    /** x座標 */
    get x() { return this._x; }
    /** y座標 */
    get y() { return this._y; }
    /** 自分のHTML要素 */
    get element() { return this._element; }
    /** 自分の周囲にある地雷数を設定する */
    set aroundMines(m) { this._aroundMines = m; }
    /** 自分の周囲にある地雷数 */
    get aroundMines() { return this._aroundMines; }
    /** 自分にフラグが立っているかどうか */
    get isFlag() { return this._isFlag; }
    /** 自分が地雷であるかどうかを設定する */
    set isMine(t) { this._isMine = t; }
    /** 自分が地雷かどうか */
    get isMine() { return this._isMine; }
    /** 自分がオープンされたかどうか。なおゲームクリア判定に用いるため、爆弾マスは常にOpenとみなす */
    get isOpen() {
        //aroundMinesが-1だったらtrueを返す。（画面外のパネルである）
        //自分が爆弾だったら常にtrueを返す。（ゲームクリア判定のために開いているとみなしておく）
        //そうでない場合、自分がOpenされていたらtrueを返す。
        if (this._aroundMines === -1 || this._isMine) return true;
        else return this._isOpen;
    }
}