/**
 * Diceクラス
 * サイコロ1つの振る舞いを表すクラス。
 */
class Dice {
    /** @private @static 表示画像ディレクトリ */
    static #rootImgDirPath = "./svg/";
    /** @private @static 表示画像URL */
    static #diceImgs = [
        null,       //サイコロの出目と要素番号を合わせるため、0番はnullとして管理する。
        "6d1.svg",
        "6d2.svg",
        "6d3.svg",
        "6d4.svg",
        "6d5.svg",
        "6d6.svg",
    ]
    /** @private @static 出目の最小値（画像配列中、nullでない最初の要素番号） */
    static #min = 1;
    /** @private @static 出目の最大値（画像配列中、nullでない最後の要素番号） */
    static #max = 6;
    /** @private @static 画像の相対パスを取得する */
    static #getImgPath(num) {
        return Dice.#rootImgDirPath + Dice.#diceImgs[num];
    }
    /** @type {null | number} 決定した出目 */
    #diceNum;
    /** @type {JQuery} 表示するHTML要素 */
    #element;

    /**
     * @constructor
     */
    constructor() {
        this.#diceNum = null;   //ダイスロールしていないときは未決定を表すnullとする。
        //一方で表示上は仮に出目１としておく。
        this.#element = $("<img>").attr("src", Dice.#getImgPath(1)).addClass("dice");
    }

    /**
     * ダイスロールを実行する。
     * @returns {number} 決定した出目
     */
    diceroll() {
        this.#diceNum = this.#random(Dice.#min, Dice.#max);
        this.#element.attr("src", Dice.#getImgPath(this.#diceNum));
        return this.#diceNum;
    }

    /** 決定した出目 */
    get diceNum() {
        if (this.#diceNum === null) throw new Error("まだダイスロールしていません。diceroll()後に取得できます。");
        return this.#diceNum;
    }
    /** このDiceのHTML要素 */
    get element() {
        return this.#element;
    }

    /** from～toの値をランダムに取る。 */
    #random(from, to) {
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

}