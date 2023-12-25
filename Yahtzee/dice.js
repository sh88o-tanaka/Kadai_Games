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
    /** 
     * @static
     * @async
     * 画像の先読み。ページ表示前に実行すると、画像をメモリキャッシュする。
     * これによりダイスロール時の最初の1回で画像がちらつかなくなる。
     * （※非同期処理で読み込みを実行するため、メイン処理を妨げない。）
     */
    static async preload() {
        for (let i = 0; i < Dice.#diceImgs.length; i++) {
            if (Dice.#diceImgs[i] !== null) {
                //DOMを作成することで画像をロードする。
                $("<img>").attr("src", Dice.#getImgPath(i));
            }
        }
    }
    /** @type {null | number} 決定した出目 */
    #diceNum;
    /** @type {JQuery} 表示するHTML要素 */
    #element;
    /** @type {boolean} 出目をキープしているか？ */
    #isKeep;

    /**
     * @constructor
     * @param {number} num ダイスの番号
     */
    constructor(num) {
        this.#diceNum = null;   //ダイスロールしていないときは未決定を表すnullとする。
        //一方で表示上は仮に出目１としておく。
        this.#element =
            $("<img>")
                .attr("src", Dice.#getImgPath(1))
                .addClass(["dice", "no-" + num])
                //toggleという名称でtoggleKeepClass関数を登録する。関数内のthisを固定化しておく。
                .data({ "toggle": this.toggleKeep.bind(this) });
        this.#isKeep = false;
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
    /**
     * アニメーション後にダイスロールを実行する。
     * @async
     * @param {number} ms    アニメーション時間
     * @param {number} duration     アニメーション間隔（最低50）
     * @returns {Promise<number>}
     */
    async animateDiceroll(ms = 1000, duration = 50) {
        /** アニメーション間隔 */
        const animateDuration = duration && duration > 50 ? duration : 50;
        /** アニメーション時間 */
        const animateMs = ms >= animateDuration ? ms : animateDuration;
        /** ループ回数 */
        const loopNum = Math.round(animateMs / animateDuration);

        /** 
         * アニメ１回の実行関数。画像をランダムなサイコロに入れ替える。
         * Promise(非同期実行)とすることで他の動作を妨げない。
         * @returns {Promise<void>}
         */
        const loopFunc = (/** @type {number} */ms) => new Promise((resolve) => {
            setTimeout(() => {
                this.#element.attr("src", Dice.#getImgPath(this.#random(Dice.#min, Dice.#max)));
                //この約束が果たされたことを示すresolve()を呼び出さなければならない。
                //約束が果たされたことを明示的に呼び出さないと、それを伝えられない。
                resolve();
            }, ms);
        });
        //ループ回数だけ、アニメ関数を実行する。 関数１回ごとにsetTimeoutの時間をずらして設置する。
        const pArray = Array(loopNum).fill(null).map((_, i) => loopFunc(animateDuration * (i + 1)));
        //全てのアニメ関数について完了を待つ。すべてが完了した後、正式なダイスロールを実行する。
        return Promise.all(pArray).then(() => {
            return this.diceroll();
        });
    }

    /**
     * 出目をキープする/キープを解除する。付け替えのトグル
     * @param {number} num キープ時につける番号。キープ解除時は無視される。
     */
    toggleKeep(num) {
        //内部情報をトグルする。
        this.#isKeep = !this.#isKeep;
        this.#element
        .removeClass((_, s)=> s.split(" ").filter((v) => v.includes("k-")))
        .toggleClass(["keep", "k-" + num], this.#isKeep);
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
    /** このダイスがキープ状態かどうか？ */
    get isKeep() {
        return this.#isKeep;
    }

    /** from～toの値をランダムに取る。 */
    #random(from, to) {
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

}

//画像の先読みを実行する。
Dice.preload();