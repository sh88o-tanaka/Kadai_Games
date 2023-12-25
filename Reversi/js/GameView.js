/**
 * @fileoverview GameViewクラス
 * @classdesc ブラウザ画面の描画更新を行うクラス
 */
class GameView {
    /**
     * コンストラクタ 情報の初期化と、必要に応じて盤面の初期状態の描画を行う
     * @constructor
     * @param {Board} board - Boardクラスのインスタンス
     */
    constructor(board) {
        this.reset();
        /**
         * 画面に表示した盤面の基準を示すjQueryオブジェクト
         * @type {jQuery}
         */
        this.boardTbody = this.drawInitBoard(board);
    }
    /**
     * 画面の盤面を描画更新する
     * @param {Board} board - GameControllerから渡された盤面
     * @returns {void}
     */
    redrawBoard(board) {
        for (let x=0;x<FIELD_SIZE;x++) {
            for(let y=0;y<FIELD_SIZE;y++) {
                let td = this.boardTbody.children().eq(x).children().eq(y);
                let stoneColor = board.getStoneColor(x+1,y+1);
                td.text(GameView.drawStoneChar(stoneColor)).addClass(GameView.drawStoneClass(stoneColor));
                if (stoneColor == BLACK && td.hasClass("white")) {
                    td.removeClass("white");
                }
                else if (stoneColor == WHITE && td.hasClass("black")) {
                    td.removeClass("black");
                }
                
                if (board.turn == BLACK) {
                    if (board.board[x+1][y+1].changableStone.getChangable("BLACK") != 0) {
                        td.addClass("clickable");
                    }
                    else {
                        td.removeClass("clickable");
                    }    
                }
                else {
                    if (board.board[x+1][y+1].changableStone.getChangable("WHITE") != 0) {
                        td.addClass("clickable");
                    }
                    else {
                        td.removeClass("clickable");
                    }    
                }
            }
        }
        console.log(board);
        console.log("redrawBoard() end.");
    }
    
    /**
     * 画面の情報領域を描画更新する
     * @param {Board} board - GameControllerから渡された盤面
     * @param {boolean} isPass - パスが発生したかどうか
     */
    redrawInfo(board,isPass) {
        let stoneNum = board.getStoneNum();
        $("#turn").text(board.turn == BLACK ? "黒":"白");
        $("#turnnum").text(board.turnNum);
        $("#black").text(stoneNum["BLACK"]);
        $("#white").text(stoneNum["WHITE"]);
        if(isPass) {
            $("#notification").text((board.turn == BLACK ? "白" : "黒") + "の手番をスキップしました。")
        }
        else {
            $("#notification").text("");
        }
    }

    /**
     * ゲームの結果を表示する
     * @param {Board} board - GameControllerから渡された盤面
     * @returns {void}
     */
    result(board) {
        let stoneNum = board.getStoneNum();
        if (stoneNum["BLACK"] == stoneNum["WHITE"]) $("#notification").addClass("result").text("引き分けです");
        else $("#notification").addClass("result").text((stoneNum["BLACK"] > stoneNum["WHITE"] ? "黒" : "白") + "の勝ちです！");
    }

    /**
     * 画面の情報をリセットする。
     * @returns {void}
     */
    reset() {
        $("#notification").removeClass("result").text("");
        $(".white").removeClass("white");
        $(".black").removeClass("black");

    }

    /**
     * @private
     * @param {Board} board - GameControllerから渡された盤面
     * @returns {jQuery}
     */
    drawInitBoard(board) {
        const boardTbody = $("#board");
        if(boardTbody.children().length == 0) {
            for(let row=0;row<FIELD_SIZE;row++) {
                let tr = $("<tr></tr>");
                for(let col=0;col<FIELD_SIZE;col++) {
                    let td = $("<td></td>");
                    td.attr({
                        "data-row" : row+1,
                        "data-column" : col+1,
                    });
                    let color = board.getStoneColor(row+1,col+1);
                    td.text(GameView.drawStoneChar(color)).addClass(GameView.drawStoneClass(color));
                    tr.append(td);
                }
                boardTbody.append(tr);
            }
        }
        return boardTbody;
    }

    /**
     * @static
     * @private
     * @param {Number} color 
     * @returns {String}
     */
    static drawStoneChar(color){
        let str;
        switch(color) {
            case BLACK :
            case WHITE :
                str = "●";
                break;
            case NONE :
            default :
                str = ""
                break;
        }
        return str;
    }

    /**
     * @static
     * @private
     * @param {*} color 
     * @returns {String}
     */
    static drawStoneClass(color) {
        let str = "";
        switch(color) {
            case BLACK :
                str = "black";
                break;
            case WHITE :
                str = "white";
                break;
            default :
                break;
        }
        return str;
    }
}
