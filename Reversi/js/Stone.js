/**
 * @fileoverview Stone クラス
 * @classdesc 盤面の各セルごとの情報を処理するクラス
 */
class Stone {
    /**
     * コンストラクタ セル情報の新規作成
     * @param {Number} [color=NONE] - colorの初期値（-1,0,1,2のいずれか） 
     * @constructor
     */
    constructor(color = NONE){
        /** 現在の色（-1～2）
         * @type {Number}
         */
        this.color = color;
        /**
         * そのマスに石をおいた時、どのマスがひっくり返るのかを格納する。
         * @property {Array} BLACK - 黒の変更候補
         * @property {Array} WHITE - 白の変更候補
         * @property {Function} getChangable - 変更候補の配列数を数え、そのマスに石をおいた時にいくつひっくり返るかを返す
         * @property {Function} reset - 黒白の変換候補をリセットする
         */
        this.changableStone = {
            BLACK : [],
            WHITE : [],
            /**
             * 変更候補の配列数を数え、そのマスに石をおいた時にいくつひっくり返るかを返す。
             * @param {String} color 数えたい色の名称（"BLACK" or "WHITE"）。文字列で渡すこと。
             * @returns {Number} 数えた値（整数）を返す
             */            
            getChangable : function(color) {
                let num = 0;
                for(let i = 0;i<this[color].length;i++) {
                    num += this[color][i].length;
                }
                return num;
            },
            /**
             * このマスの変更候補をリセットする。
             */
            reset : function() {
                this["BLACK"] = [];
                this["WHITE"] = [];
            },
        };
    }
    /**
     * セル内の色情報を変更する。
     * @param  {Number} color - 色情報のいずれか（-1,0,1,2）。ただし値チェックは行っていない
     * @returns {void}
     */
    setColor(color) {
        this.color = color;
    }
    /**
     * セル内の色情報を返す。
     * @returns {Number} 現在の色情報
     */
    getColor() {
        return this.color;
    }
}
