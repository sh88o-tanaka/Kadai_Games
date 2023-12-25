$(function(){

    let pocket, stone, mankara;

    function init(){
        pocket = Number($("#pocket-num").val());
        stone = Number($("#stone-num").val());;
        mankara = new Mankara(pocket, stone);
        createNewPockets();
        draw();
    }

    function createNewPockets(){
        const goals = [$("#p2goal"), $("#p1goal")];
        const goalNumber = [(pocket) * 2 + 1, pocket];
        const p2Pockets = $("#p2pocket");
        const p1Pockets = $("#p1pocket");
        p2Pockets.empty();
        p1Pockets.empty();
        goals.forEach((jq, i) => jq.data({"num" : goalNumber[i]}));
        console.log(goals);

        const p2PocketNumber = [];
        for(let i = pocket * 2; i > pocket; i--) {
            p2PocketNumber.push(i);
        }
        const p1PocketNumber = [];
        for(let i = 0; i < pocket; i++) {
            p1PocketNumber.push(i);
        }

        for(let i = 0; i < p1PocketNumber.length; i++){
            p2Pockets.append(createPocketDiv(p2PocketNumber[i]));
            p1Pockets.append(createPocketDiv(p1PocketNumber[i], true));
        }

        $("div.pocket").on("click", function(){
            if(mankara.isWin() || !$(this).hasClass("clickable")) return;
            const num = $(this).data("num");
            const beforeTurn = mankara.isFirst();
            if(mankara.tanemaki(num)) {
                const isChangeTurn = beforeTurn !== mankara.isFirst();
                if (isChangeTurn) {
                    $("#p2pocket > div").toggleClass("clickable");
                    $("#p1pocket > div").toggleClass("clickable");
                }
                draw();
                updateInfo(mankara.isFirst(), isChangeTurn, mankara.isWin());
            };
            console.log(mankara.getField());
        });
    }
    function createPocketDiv(dataNum, clickable = false) {
        const div = $("<div>").data({"num" : dataNum}).addClass("pocket");
        if(clickable) div.addClass("clickable");
        return div;
    }

    function draw() {
        const field = mankara.getField();
        $(".goal, .pocket").each(function(){
            const jq = $(this);
            const num = jq.data("num");
            const stone = field[num];
            jq.empty();
            for (let i = 0; i < stone; i++) {
                jq.append($("<p>").text("●"));
            }
        });
    }

    function updateInfo(nowTurn, isChangeTurn, isWin = false) {
        const info = $("#info");
        const turn = (nowTurn ? "先手" : "後手");
        if (isWin) {
            info.text(turn + "の勝ちです！");
        }
        else {
            const keep = !isChangeTurn ? "もう一度、" : "";
            info.text(keep + turn + "の番です。");
        }        
    }

    $("#menu-button").on("click", toggleMenu);

    $("#setting").on("submit", function(){
        init();
        toggleMenu();
        return false;
    });
    function toggleMenu() {
        $("#menu, #menu-background").toggleClass("visible");
        const buttonText = $("#menu-button").text();
        $("#menu-button").text(buttonText === "<" ? ">" : "<");

    }

    init();
});