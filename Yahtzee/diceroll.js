

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
        this.#dices = Array(num).fill(null).map((_, i) => new Dice(i));
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

    /** キープしていないダイス群を取得する */
    get unKeepDices() {
        return this.#dices.filter(d => !d.isKeep);
    }

    /** ダイスロールの実行。キープされているダイスは除外する。 */
    diceroll() {
        this.unKeepDices.forEach(d => d.diceroll());
        return this.diceNums;
    }
    /**
     * 全ダイスにアニメーションでのダイスロールを要請する。
     * @async
     * @param {number} animateMs アニメーション時間
     * @returns {Promise<number[]>} アニメ終了後にダイスロール結果を返すPromise
     */
    async animateDiceroll(animateMs) {
        const pArray = [];
        for (let d of this.unKeepDices) {
            pArray.push(d.animateDiceroll(animateMs));
        }
        const promise = Promise.all(pArray).catch(console.error);
        return promise;

        //高階関数を使うと上記の処理を１行で表せる
        //return Promise.all(this.unKeepDices.map(d => d.animateDiceroll(animateMs))).catch(console.error);
    }
}

