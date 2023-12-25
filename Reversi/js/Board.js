/**
 * @fileoverview Board クラス
 * @classdesc 盤面全体の情報を格納・処理するクラス
 */
class Board {
    /**
     * コンストラクタ 盤面全体のデータ作成
     * @constructor
     */
    constructor() {
        /**
         * Stoneクラスをフィールドサイズの2次元配列で格納する
         * @type {Stone[]}
         */
        this.board = this.init();
        /**
         * 現在の手番
         * @type {Number}
         */
        this.turn = BLACK;
        /**
         * 現在のターン数
         * @type {Number}
         */
        this.turnNum = 1;
        /**
         * 現在の石数
         * @type {Object}
         * @property {Number} BLACK - 黒石
         * @property {Number} WHITE - 白石
         */
        this.stoneNum = {"BLACK" : 0, "WHITE" : 0};
        this.updateReverseList();
        this.getStoneNum();
    }

    /**
     * 現在の各色の石数を返す。
     * @returns {Object} stoneNum - {BLACK,WHITE}の値が入ったオブジェクト
     * @returns {Number} stoneNum.BLACK -黒石の数
     * @returns {Number} stoneNum.WHITE -白石の数
     */
    getStoneNum() {
        this.stoneNum["BLACK"] = 0;
        this.stoneNum["WHITE"] = 0;
        this.board.forEach(function(elm){
            elm.forEach(function(stone){
                if (stone.getColor() == BLACK) this.stoneNum["BLACK"]++;
                else if (stone.getColor() == WHITE) this.stoneNum["WHITE"]++;
            },this);
        },this);
        console.log(this.stoneNum);
        return this.stoneNum;
    }

    /**
     * 引数で渡された座標の石色を変更する。（黒→白 または 白→黒）
     * @param {Number} row - 行数（上から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} col - 列数（左から数えてn番目）1以上FIELD_SIZE以下
     * @returns {void}
     */
    changeStoneColor(row,col) {
        if(!Board.isInBoardField(row,col)) return;
        this.board[row][col].setColor(this.board[row][col].getColor() * -1);
    }
    /**
     * 引数で渡された座標の石色を変更する。変更は無制限。
     * @param {Number} row - 行数（上から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} col - 列数（左から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} color - 色（-1～2）
     * @returns {void}
     */
    setStoneColor(row,col,color) {
        if(Board.isInBoardField(row,col)) return;
        this.board[row][col].setColor(color);
    }

    /**
     * 引数で渡された座標の石色を返す
     * @param {Number} row - 行数（上から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} col - 列数（左から数えてn番目）1以上FIELD_SIZE以下
     * @returns {Number} 石色（-1 ～ 2）
     */
    getStoneColor(row,col) {
        return this.board[row][col].getColor();
    }

    /**
     * 現在の手番を石置きなしでスキップする。
     * @returns {void}
     */
    turnSkip() {
        this.turn *= -1;
    }

    /**
     * 指定された座標に石を置く
     * @param {Number} row - 行数（上から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} col - 列数（左から数えてn番目）1以上FIELD_SIZE以下
     * @returns {boolean} 石を置けたかどうか
     */
    putStone(row,col) {
        const stone = this.board[row][col];
        if (stone.getColor() != NONE) return false;
        if(this.turn == BLACK) {
            if (stone.changableStone.getChangable("BLACK") == 0) return false;
            this.putStoneAndTurnChange("BLACK",stone);
        }
        else {
            if (stone.changableStone.getChangable("WHITE") == 0) return false;
            this.putStoneAndTurnChange("WHITE",stone);
        }
        return true;
    }


    /** 
     * @private
     * @returns {void}
     */
    updateReverseList(){
        for(let row=1;row<FIELD_SIZE+1;row++){
            for(let col=1;col<FIELD_SIZE+1;col++) {
                let stone = this.board[row][col];
                let color = stone.getColor(); 
                stone.changableStone.reset();
                if(color == NONE) this.checkReverseList(row,col,stone);
            }
        }        
    }

    /**
     * @private
     * @param {Number} row 
     * @param {Number} col 
     * @param {Stone} stone 
     * @returns {Array}
     */
    checkReverseList(row,col,stone) {
        //８方向
        const drow_dcol = [
            //上、左斜上、左、左斜下、下、右斜下、右、右斜上
            [-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]
        ]


        drow_dcol.forEach(function(elm){
            /**
            * @this {Board}
            */
            let revArray = [];
            revArray = this.reflexReverseList(row,col,elm[0],elm[1],BLACK,revArray);
            stone.changableStone["BLACK"].push(revArray);
            
            revArray = [];
            revArray = this.reflexReverseList(row,col,elm[0],elm[1],WHITE,revArray);
            stone.changableStone["WHITE"].push(revArray);

        },this);

    }
    
    /**
     * @private
     * @param {Number} row 
     * @param {Number} col 
     * @param {Number} drow 
     * @param {Number} dcol 
     * @param {Number} color 
     * @param {Array} revArray 
     * @returns {Array}
     */

    reflexReverseList(row,col,drow,dcol,color,revArray) {
        const checkStone = this.board[row+drow][col+dcol];
        if(checkStone.getColor() * -1 == color) {
            revArray.push([row+drow, col+dcol]);
            return this.reflexReverseList(row+drow,col+dcol,drow,dcol,color,revArray);
        }
        else if(checkStone.getColor() == color) {
            return revArray;
        }
        else {
            return [];
        }
    }

    /**
     * @private
     * @param {Number} color 
     * @param {Stone} stone 
     */
    putStoneAndTurnChange(color,stone){
        this.changeStone(stone.changableStone[color]);
        stone.setColor(this.turn);
        this.updateReverseList();
        this.turn *= -1;
        this.turnNum++;
    }

    /**
     * @private
     * @param {Array} changeArray 
     */
    changeStone(changeArray) {
        changeArray.forEach(function(elm){
            for(let i=0;i<elm.length;i++) {
                this.changeStoneColor(elm[i][0],elm[i][1]);
            }
        },this);
    }

    /**
     * 盤面の初期化を行う
     * @private
     * @returns {void}
     */
    init() {
        //ボードの上下左右１マス分を多く指定しておく。これにより探索関数を平易に記述できる。
        let board_array = new Array(FIELD_SIZE+2);
        for(let i = 0;i < FIELD_SIZE+2 ;i++) {
            board_array[i] = new Array(FIELD_SIZE+2);
            for(let k = 0;k < FIELD_SIZE+2;k++) {
                board_array[i][k] = new Stone(i==0||i==FIELD_SIZE+1||k==0||k==FIELD_SIZE+1 ? WALL : NONE);
            }
        }
        //初期の石置き
        board_array[Math.floor(FIELD_SIZE/2)][Math.floor(FIELD_SIZE/2)].setColor(BLACK);
        board_array[Math.floor(FIELD_SIZE/2)][Math.floor(FIELD_SIZE/2)+1].setColor(WHITE);
        board_array[Math.floor(FIELD_SIZE/2)+1][Math.floor(FIELD_SIZE/2)].setColor(WHITE);
        board_array[Math.floor(FIELD_SIZE/2)+1][Math.floor(FIELD_SIZE/2)+1].setColor(BLACK);
        
        return board_array;
    }

    /**
     * 引数で渡された座標がフィールド内を示しているかチェックする。
     * @static
     * @private
     * @param {Number} row - 行数（上から数えてn番目）1以上FIELD_SIZE以下
     * @param {Number} col - 列数（左から数えてn番目）1以上FIELD_SIZE以下
     * @returns {boolean} フィールド内かどうか
     */
    static isInBoardField(row,col) {
        if(row<=0||row>=FIELD_SIZE+1||col<=0||col>=FIELD_SIZE+1) {
            console.error("Field外を指定しました");
            return false;
        }
        return true;
    }
}
