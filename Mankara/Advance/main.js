const CLICKABLE = "clickable";

//選択ルールとインスタンス化するクラスの対応リスト
const ruleList = {
    "basic": {
        className: MankaraBasic,
        ruleName: "ベーシック",
    },
    "easy": {
        className: MankaraEasy,
        ruleName: "イージー",
    },
}

$(function () {
    const isLock = (mankara) => mankara.isWin;

    const NowPlayer = (isFirst) => isFirst ? "Player 1" : "Player 2";

    function init() {
        const cell = Number($("#cell").val());
        const stone = Number($("#stone").val());
        const rule = $("#rule").val();

        //選択したルールごとにインスタンス化するクラスを変更する。
        const mankara = new ruleList[rule].className(cell, stone);
        $("#ruleinfo > span").text(ruleList[rule].ruleName);

        createFieldTdElements(cell, mankara, onClick);
        $("#p1-store td").data({ num: cell }).attr({ id: cell });
        $("#p2-store td").data({ num: cell * 2 + 1 }).attr({ id: cell * 2 + 1 });
        draw(mankara);
        info(mankara);
    }

    function createFieldTdElements(cell, mankara, clickHandler) {
        const _createTd = (i, addClass = null) => $("<td>").append($("<div>")).data({ num: i }).addClass(addClass).attr({ id: i });
        const _createPlayerTd = (id, startNum, numOfArticles, addClass = null) => {
            const tr = $(id).empty();
            const isReverse = startNum > numOfArticles;
            if (isReverse) [startNum, numOfArticles] = [numOfArticles, startNum];
            const arr = Array(numOfArticles - startNum).fill(null).map((_, i) => _createTd(i + startNum, addClass));
            if (isReverse) arr.reverse();
            tr.append(arr);
        }
        _createPlayerTd("#p1", 0, cell, CLICKABLE);
        _createPlayerTd("#p2", cell * 2 + 1, cell + 1);
        $("td").on("click", null, mankara, clickHandler);
    }

    function onClick(event) {
        /** @type {Mankara} */
        const mankara = event.data;
        if (isLock(mankara) || !$(this).hasClass(CLICKABLE)) return;
        const target = $(this);
        const num = Number(target.data("num"));
        const beforeTurn = mankara.isFirst;
        if (mankara.tanemaki(num)) {
            draw(mankara);
            if (mankara.isWin) gameOver(mankara);
            else changeTurn(mankara, beforeTurn);
        }
    }

    function gameOver(mankara) {
        if (mankara.isFirst === null) $("#info").text("引き分けです。");
        else $("#info").text(NowPlayer(mankara.isFirst) + "の勝ちです！");
        console.log("ゲーム終了");
    }

    function changeTurn(mankara, beforeTurn) {
        const p1 = $("#p1 td");
        const p2 = $("#p2 td");
        p1.toggleClass(CLICKABLE, mankara.isFirst);
        p2.toggleClass(CLICKABLE, !mankara.isFirst);
        info(mankara, beforeTurn);
    }

    function info(mankara, beforeTurn = null) {
        const text = beforeTurn !== null && beforeTurn === mankara.isFirst ? "もう一度、" : "";
        $("#info").text(text + NowPlayer(mankara.isFirst) + "の番です。");
    }

    function draw(mankara) {
        $("td > div").empty();
        const field = mankara.field;
        $("td").each(function () {
            const num = Number($(this).data("num"));
            console.log(num);
            $(this).children().eq(0).append(field[num]);
        })
    }

    init();

    $("#newgame").on("submit", function () {
        init();
        toggleRelatedMenu();
        return false;
    });

    $("#menu-button").on("click", toggleRelatedMenu);

    function toggleRelatedMenu() {
        $("#background, #menu").toggleClass("visible");
        const str = $("#menu-button").text();
        $("#menu-button").text(str === "<" ? ">" : "<");

    }

});