let connectFour;    //フィールドの情報(ConnectFourクラス)
const { NONE, playersNumber } = ConnectFour.STONE; //ConnectFourクラスの石（手番）定義から情報を共有する。
const { PENDING, WIN, DRAW } = ConnectFour.GAME_STATE;       //ConnectFourクラスのゲーム状態定義から情報を共有する。
const DIFFICULTY = ConnectFour.DIFFICULTY;
const TIME = 1500;

let LOCK = false;   //操作のロック

$(function () {
    let timeoutId;
    //操作基準となるtable要素
    const table = $("#field");

    //石を表現するjQueryオブジェクト。オブジェクトを毎回新規作成するため、関数として登録し、関数呼び出しで値を返却させる。
    const stone = (() => {
        const obj = {};
        for(const p of playersNumber) {
            obj[p] = () => $(`<span class='player-${p}'>`).text("●");
        }
        return obj;
    })();
    //アナウンス用文字列
    const announceStr = {
        turn: "の番です。",
        winner: "の勝ちです！",
        draw: "引き分けです。",
        thinking: "が考えています..."
    }
    //情報文字列表示用の#info要素
    const info = $("#info");

    $("#players").on("change", function() {
        const max = Number($(this).val());
        const select = $("select[name='iscom']");
        select.each(function(){
            $(this).prop("disabled", true);
        })
        for (let i = 0; i < max; i++) {
            select.eq(i).prop("disabled", false);
        }
    });

    //リセットボタン押下
    $("form").on("submit", function () {
        init();
        return false;
    });

    function onClickThElement() {
        if (LOCK) return; //ロックされていたら操作を受け付けない。
        const point = $(this).data("col");
        drop(point);
    }

    function drop(point) {
        //押下したth要素の番号と現在の手番をConnectFour.dropStone()メソッドに伝え、操作結果を確認する。
        const result = connectFour.dropStone(point);
        //操作結果に応じて表示などを切り替える。
        switch (result.state) {
            case WIN:
                win();
                break;
            case DRAW:
                drawGame();
                break;
            case PENDING:
                changeTurn();
                break;
        }
        const points = [result.lastPoint];
        if (result.winPointsArray) {
            points.push(...result.winPointsArray);
        }
        //フィールドを描画。
        fieldDraw(points);
        //COMが次に打つ場所を受け取っていたら、一定時間後に自動で打つ。
        if (result.nextDrop) comDropStart(result.nextDrop[1]);

    }
    function timeOutDrop(col){
        const id = setTimeout(function() {
            LOCK = false;
            drop(col);
        }, TIME);
        return id;
    }

    //勝利時の表示
    function win() {
        LOCK = true;
        const turn = connectFour.turn;
        info.empty();
        info.append(stone[turn](), announceStr.winner);
    }
    //引き分け時の表示
    function drawGame() {
        LOCK = true;
        info.empty()
        info.append(announceStr.draw);
    }
    //ターン変更後の表示
    function changeTurn() {
        const turn = connectFour.turn;
        info.empty();
        info.append(stone[turn](), announceStr.turn);
    }
    //COM考え中
    function comThinking() {
        const turn = connectFour.turn;
        info.empty();
        info.append(stone[turn](), announceStr.thinking);
    }
    function comDropStart(col) {
        LOCK = true;
        comThinking();
        timeoutId = timeOutDrop(col);
    }

    //フィールドの描画
    function fieldDraw(points = null) {
        //表示に必要な2次元配列を取得。
        const f = connectFour.field;
        //tr要素の集合を取得。
        const trs = $("tbody").children();
        for (let y = 0; y < f.length; y++) {
            //1行ごとtd要素の集合を取得
            const tds = $(trs[y]).children();
            for (let x = 0; x < f[y].length; x++) {
                //各td要素を1度空にする
                const td = $(tds[x]).empty().removeClass("highlight");
                //対応する2次元配列の座標がSTONE_COLOR.NONE以外だったら、対応する色の石を表示する。
                if (points && points?.find((el) => y+1 === el[0] && x+1 === el[1])) td.addClass("highlight");
                if (f[y][x] !== NONE) td.append(stone[f[y][x]]());
            }
        }
    }

    function createOptionTag() {
        $("select[name=\"iscom\"]").each(function(){
            for (let key in DIFFICULTY) {
                const op = $("<option>").val(DIFFICULTY[key]).text(key);
                //それ以外はEASYにselectedをつける
                if (DIFFICULTY[key] === 0) op.prop("selected", true);
                $(this).append(op);
            }
        });
        $("select[name=\"iscom\"]").eq(0).children().eq(0).prop("selected", true);
    }

    //初期化
    function init() {
        LOCK = false; //ロック解除
        clearTimeout(timeoutId);
        const width = Number($("#width").val());
        const height = Number($("#height").val());
        const players = Number($("#players").val());
        const numToWin = Number($("#num-to-win").val());
        createField(width, height);
        $("td").empty(""); //全td要素の中身を空にする。
        info.empty(); //#infoを空にする。
        connectFour = new ConnectFour({width, height, numToWin, playersInfo: getPlayersInfo(players)}); //ConnectFourクラスを新規作成して初期化。
        const turn = connectFour.turn; //ターンを先手にする。
        info.append(stone[turn](), announceStr.turn); //先手番の表示
        fieldDraw(); //フィールドの描画
        if (Number($("select[name='iscom']").eq(0).val()) !== DIFFICULTY.HUMAN) comDropStart(Math.round(width / 2));
    }
    function getPlayersInfo(players) {
        const playersInfo = [];
        const selects = $("select[name=\"iscom\"]").slice(0, players);
        for(let i = 0; i < selects.length; i++) {
            playersInfo.push({
                player : i+1,
                difficulty : Number($(selects[i]).val()),
            });
        }
        return playersInfo;
    }
    //フィールドの動的作成
    function createField(width, height) {
        table.empty();
        const thead = $("<thead>");
        const ths = [];
        for (let i = 0; i < width; i++) {
            const th = 
            $("<th>")
                .text("▼")
                .data({"col" : i+1});
            ths.push(th);
        }
        thead.append(ths);
        table.append(thead);
        //tableに挿入した後、クリックイベントを登録する。
        $("th").on("click", onClickThElement);
        const tbody = $("<tbody>");
        const trs = [];
        for(let i = 0; i < height; i++) {
            const tr = $("<tr>");
            const tds = [];
            for (let j = 0; j < width; j++) {
                tds.push($("<td>"));
            }
            tr.append(tds);
            trs.push(tr);
        }
        tbody.append(trs);
        table.append(tbody);
    }
    createOptionTag();
    init();
});