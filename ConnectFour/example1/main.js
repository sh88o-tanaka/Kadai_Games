$(function () {
    let connectFour;    //フィールドの情報(ConnectFourFieldクラス)
    let LOCK = false;   //操作のロック

    //アナウンス用文字列
    const announceStr = {
        turn: "の番です。",
        winner: "の勝ちです！",
        draw: "引き分けです。"
    }
    //情報文字列表示用の#info要素
    const info = $("#info");

    //リセットボタン押下
    $("#reset").on("click", function () {
        init();
    });

    //クリックイベントを登録する。
    $("th").on("click", onClickThElement);

    function onClickThElement() {
        if (LOCK) return; //ロックされていたら操作を受け付けない。
        //押下したth要素の番号をConnectFourField.dropStone()メソッドに伝え、操作結果を確認する。
        const isGameOver = connectFour.dropStone($(this).data("col"));
        //操作結果に応じて表示などを切り替える。
        switch (isGameOver) {
            case GAME_STATE.WIN:
                win();
                break;
            case GAME_STATE.DRAW:
                drawGame();
                break;
            case GAME_STATE.PENDING:
                changeTurn();
                break;
        }
        //フィールドを描画。
        fieldDraw();
    }

    //勝利時の表示
    function win() {
        LOCK = true;
        const turn = connectFour.getTurn();
        info.empty();
        info.append(createStoneObject(turn), announceStr.winner);
    }
    //引き分け時の表示
    function drawGame() {
        LOCK = true;
        info.empty()
        info.append(announceStr.draw);
    }
    //ターン変更後の表示
    function changeTurn() {
        const turn = connectFour.getTurn();
        info.empty();
        info.append(createStoneObject(turn), announceStr.turn);
    }

    //石を表現するjQueryオブジェクトを新規作成する。引数の値に応じて先手の石、後手の石を作り分ける。
    function createStoneObject(turn) {
        if (turn === STONE.FIRST) return $("<span class='first-move'>").text("●");
        else return $("<span class='second-move'>").text("●");
    }

    //フィールドの描画
    function fieldDraw() {
        //表示に必要な2次元配列を取得。
        const f = connectFour.getField();
        //tr要素の集合を取得。
        const trs = $("tbody").children();
        for (let y = 0; y < f.length; y++) {
            //1行ごとtd要素の集合を取得
            const tds = $(trs[y]).children();
            for (let x = 0; x < f[y].length; x++) {
                //各td要素を1度空にする
                const td = $(tds[x]).empty();
                //対応する2次元配列の座標がSTONE.NONE以外だったら、対応する色の石を表示する。
                if (f[y][x] !== STONE.NONE) td.append(createStoneObject(f[y][x]));
            }
        }
    }

    //初期化
    function init() {
        LOCK = false; //ロック解除
        $("td").empty(""); //全td要素の中身を空にする。
        info.empty(); //#infoを空にする。
        connectFour = new ConnectFourField(); //ConnectFourFieldクラスを新規作成して初期化。
        const turn = connectFour.getTurn(); //ターンを先手にする。
        info.append(createStoneObject(turn), announceStr.turn); //先手番の表示
        fieldDraw(); //フィールドの描画
    }
    init();
});