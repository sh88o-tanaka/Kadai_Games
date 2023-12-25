/**
 * DiceRollクラス
 * ある１回のn個のダイスをまとめ、ダイスロールを管理、実行する。
 */
class DiceRoll {
    /** @type {number} ダイスの個数 */
    #num;
    /** @type {Dice[]} Diceクラスの集合*/
    #dices;
    /** @type {JQuery} 挿入したいHTML要素を表すJQuery*/
    #jqRoot;

    /**
     * @constructor
     * @param {number} num      今回のダイス個数
     * @param {JQuery} jqRoot   挿入したいHTML要素を表すJQuery
     */
    constructor(num, jqRoot = null) {
        this.#num = num;
        this.#dices = Array(num).fill(null).map(_ => new Dice());
        this.#jqRoot = jqRoot;
        //ルート要素にダイスのHTML要素を追加する。
        if (this.#jqRoot) this.#jqRoot.append(this.elements);
    }

    /** ダイスの個数 */
    get num() {
        return this.#num;
    }

    /** Diceクラスの集合 */
    get dices() {
        return this.#dices;
    }

    /** ダイスロールの結果 */
    get diceNums() {
        return this.#dices.map(d => d.diceNum);
    }

    /** 全ダイスのHTML要素群 */
    get elements() {
        return this.#dices.map(d => d.element);
    }

    /** ダイスロールの実行 */
    diceroll() {
        return this.#dices.map(d => d.diceroll());
    }
}

