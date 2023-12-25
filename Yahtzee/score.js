/**
 * Scoreクラス
 * １つの手役の成立をチェックし、その結果をセルに表示する役割を持つ
 */
class Score {
    /** 手役成立条件関数 @type {Function} */
    #checker;
    /** 表示用HTML要素 */
    #element;
    /** そのスコアを確定させたか？ */
    #isDecided;
    /** 確定したスコア */
    #decidedScore;
    /** 未確定の一時的スコア */
    #temporaryScore;

    /**
     * @constructor
     * @param {Function} checker 手役成立条件関数
     */
    constructor(checker) {
        this.#decidedScore = 0;
        this.#temporaryScore = 0;
        this.#checker = checker;
        this.#isDecided = false;
        this.#element = $("<td>").addClass("undecided");
    }
    /**
     * ダイスロールの結果から手役が成立しているかを判断し、仮のスコアを表示する
     * @param {number[]} results ダイスロールの結果
     * @returns 
     */
    viewTemporaryValue(results) {
        if (this.#isDecided) return 0;
        this.#temporaryScore = this.#checker(results)
        this.#element.text(this.#temporaryScore);
        return this.#temporaryScore;
    }
    /**
     * 仮のスコアを非表示にする
     * @returns {void}
     */
    deleteTemporaryValue() {
        if (this.#isDecided) return;
        this.#temporaryScore = 0;
        this.#element.text("");
    }

    /** スコアのHTML要素を押下したときの挙動 */
    click() {
        if (this.#isDecided) return false;
        this.#element.removeClass("undecided").text(this.#temporaryScore);
        this.#decidedScore = this.#temporaryScore;
        this.#isDecided = true;
        return true;
    }

    /** クリック可能状態の表示に切り替える */
    setClickable() {
        this.#element.addClass("clickable");
    }

    /** クリック可能状態表示を解除する */
    removeClickable() {
        this.#element.removeClass("clickable");
    }

    /** HTML要素を取得する @returns {HTMLElement} */
    get element() {
        return this.#element[0];
    }
    /** 確定したスコアを取得する */
    get score() {
        return this.#isDecided ? this.#decidedScore : 0;
    }
    /** スコアが確定状態かどうか */
    get isDecided() {
        return this.#isDecided;
    }
}