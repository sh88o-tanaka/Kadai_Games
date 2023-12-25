//手番を表す文字列
const turnInfo = {
    [STONE.FIRST]: "黒",
    [STONE.SECOND]: "白",
};
//ゲームの状態を表す文字列
const infoStr = {
    [GAME_STATE.PENDING]: "の番です。",
    [GAME_STATE.WIN]: "の勝ちです！",
    [GAME_STATE.DRAW]: "引き分けです。"
}

$(function () {
    let lock;           //操作ロック用フラグ
    let gomokuNarabe;   //五目並べクラス用変数
    const trs = $("#play-field tr");        //碁盤の行
    const tds = $("#play-field tr > td");   //碁盤の１マス（列）
    const info = $("#info");                //情報領域を表す要素

    //１マスをクリックした時の処理
    tds.on("click", function () {
        if (lock) return;
        const y = Number($(this).parent().data("row")); //行の取得
        const x = Number($(this).data("column"));       //列の取得

        //石を置く。置けたらその結果を基に分岐する。置けなかった場合は何もせずに終了。
        const result = gomokuNarabe.putStone(y, x);     
        switch (result) {
            case GAME_STATE.PENDING:
                updateInfo(result);
                break;
            case GAME_STATE.WIN:
                lock = true;
                updateInfo(result);
                break;
            case GAME_STATE.DRAW:
                lock = true;
                info.text(info[result]);
                break;
        }
        draw();
    });

    //リセットボタンを押下した時の処理（初期化関数を呼び出す）
    $("#reset").on("click", init);

    //情報表示領域を更新する
    function updateInfo(result) {
        info.text(turnInfo[gomokuNarabe.getTurn()] + infoStr[result]);
    }

    //ゲームの初期化
    function init() {
        lock = false;
        //情報管理用のGomokuNarabeクラスをインスタンス化する。
        gomokuNarabe = new GomokuNarabe();
        //最初の情報を表示する。
        updateInfo(GAME_STATE.PENDING);
        draw();
    }

    //碁盤の描画
    function draw() {
        //碁盤の現状態をクラスから取得する。
        const field = gomokuNarabe.getField();
        //表示している碁盤の情報をクリアする。
        tds.removeClass(["stone1", "stone2"]);
        //各行に対して操作を実行する。引数 y …何行目のtr要素か？（0番から始まる）
        trs.each(function (y) {
            //その行の各trに対して操作を実行する。引数 x …何番目のtd要素か？（0番から始まる）
            $(this).children().each(function (x) {
                //座標y,xの石がNONEなら何もしない。そうでなければ石の色に応じたclassをtd要素に付与する。
                if (field[y] && field[y][x] != null && field[y][x] === STONE.NONE) return;
                $(this).addClass("stone" + field[y][x]);
            });
        });
    }

    //ページ読み込み時の初期化を実行する。
    init();
});