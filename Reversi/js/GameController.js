/**
 * @fileoverview GameController クラス
 * @classdesc ユーザー操作の受付、情報の管理と指揮を行うクラス
 */
class GameController {
    /**
     * コンストラクタ 管理する情報の初期化を行う
     * @constructor
     */
    constructor() {
        /**
         * 盤面
         * @type {Board}
         */
        this.board = new Board();
        /**
         * 描画更新用クラスのインスタンス
         * @type {GameView}
         */
        this.gameView = new GameView(this.board);
    }

    /**
     * ゲームの表示状態をリセットする。
     * @returns {void}
     */
    resetAll() {
        this.gameView.reset();
        this.redrawAll();
    }

    /**
     * クリックした座標を基に、石の着手や情報更新を実行する。
     * 画面の更新やスキップ・ゲーム終了の判定も行う。
     * @param {Number} row - クリックした行数（上からn行目） 
     * @param {Number} column - クリックした列数（左からm行目）
     * @returns {void}
     */
    putStone(row,column) {
        if(this.board.putStone(row,column)) {
            this.redrawBoard();
            let isPass = this.passCheck();
            let passNum = 0;
            if (isPass) {
                passNum++;
            }
            console.log("passNum = " + passNum);
            this.redrawInfo(isPass);
            if(isPass){
                this.redrawBoard();
                passNum = this.passCheck() ? passNum + 1 : 0;
            }
            if(this.isGameOver(passNum)) {
                this.result();
            }
        }
    }

    /**
     * @private
     * @param {boolean} isPass 
     * @returns {void}
     */
    redrawAll(isPass = false) {
        this.gameView.redrawBoard(this.board);
        this.gameView.redrawInfo(this.board, isPass);
    }

    /**
     * @private
     * @returns {void}
     */
    redrawBoard() {
        this.gameView.redrawBoard(this.board);
    }
    /**
     * @private
     * @param {boolean} isPass 
     * @returns {void}
     */
    redrawInfo(isPass = false) {
        this.gameView.redrawInfo(this.board, isPass);
    }

    /**
     * @private
     * @returns {void}
     */
    result() {
        this.gameView.result(this.board);
    }
    /**
     * @private
     * @returns {boolean}
     */
    passCheck() {
        if($(".clickable").length == 0) {
            this.board.turnSkip();
            return true;
        }
        return false;
    }

    /**
     * @private
     * @param {Number} passNum
     * @returns {boolean}
     */
    isGameOver(passNum) {
        let black = this.board.stoneNum["BLACK"];
        let white = this.board.stoneNum["WHITE"];
        if( black == 0 || white == 0 ||          //黒、または白の石が０（パーフェクトゲーム）
            black + white >= FIELD_SIZE**2 ||    //フィールドを全て埋めた
            passNum >= 2                    //両手番が同時にパス（手詰まり）
        ) {
            return true;
        }
        return false;
    }
}
