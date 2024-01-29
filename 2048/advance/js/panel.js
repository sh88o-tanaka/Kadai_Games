/**
 * Panelクラス
 * ゲーム内のパネル1枚を表す。
 */
class Panel {
    /** @type {HTMLElement} */
    #element;
    /** @type {number} */
    #num;
    /** @type {Vec} */
    #vec;

    /**
     * @constructor
     * @param {Vec} vec 
     * @param {number} num
     * @param {jQuery} jqRoot
     */
    constructor(vec, num, jqRoot) {
        if (!this.#checkNum(num)) throw new Error("Invalid num Error : 2のn乗でない数値は許可されません");
        this.#vec = vec;
        this.#num = num;
        this.#element =
            $("<div>")
                //p-XXでパネルの表示位置を制御し、s-XXで表示する値と対応するパネル色を制御する。
                .addClass(["invisible", "panel", "p-" + vec.index, "s-" + num])
                .text(num);

        jqRoot.append(this.#element);
        //非同期かつ最速でinvisibleクラスを消し、transitionを発生させる。パネルの発生アニメーション。
        const pr = new Promise((resolve) => setTimeout(() => {
            resolve();
        }, 0));
        pr.then(() => {
            this.#element.removeClass("invisible")
        }
        );
    }

    /**
     * 引数が2のn乗であるかを検査する
     * @private
     * @param {number} num 検査値
     * @returns {boolean}
     */
    #checkNum(num) {
        if (num === 1) return true;
        if (num % 2 !== 0) return false;
        else return this.#checkNum(num / 2);
    }
    get element() { return this.#element; }
    get vec() { return this.#vec; }
    get num() { return this.#num; }

    /**
     * パネルを削除する。
     * @returns {Panel}
     */
    removeElement() {
        this.#element.remove();
        return this;
    }
    /**
     * パネルのクラスを書き換え、スライドアニメーションを表示する。
     * @param {Vec} vec このパネルの新しいXY座標
     * @returns {Panel}
     */
    slide(vec) {
        const oldVec = this.#vec;
        this.#vec = vec;
        this.#element
            .addClass("p-" + vec.index)
            .removeClass(() => oldVec.x !== vec.x || oldVec.y !== vec.y ? "p-" + oldVec.index : "");
        return this;
    }
    /**
     * パネルが重なる際の重なり順を制御する。呼び出したパネルは、スライド後に下に潜り込む。
     * @returns {Panel}
     */
    goBelow() {
        this.#element.attr({ "z-index": 0 });
        return this;
    }

    /**
     * パネルの合体を表現する。呼び出されたパネルの値を2倍にし、クラスを書き換える。
     * @returns {number}
     */
    union() {
        const oldNum = this.#num;
        this.#num *= 2;
        this.#element
            //合体アニメーションを実行後にクラスを除去。大きさを戻す。
            .one("transitionend", () => {
                this.#element.removeClass("union");
            })
            //対応するパネルの表示に切り替え、合体アニメーションを実行。一瞬パネルが大きくなる。
            .addClass(["union", "s-" + this.#num])
            //古い値のクラスは除去。
            .removeClass("s-" + oldNum)
            .text(this.#num);

        return this.#num;
    }
    /**
     * コンソール表示の内容を変える。値のみ表示にする。
     * @returns {number}
     */
    toString() {
        return this.#num;
    }
}