$(function () {
    const root = $("#root");
    const remainFlag = $("#remain-flag");
    const timeCount = $("#time-count");
    const reset = $("#reset");
    //オーバーレイ表示するメニューの一覧管理
    const overlays = {
        menu : {
            isOpen : false,
            toggleIds : ["#menu-background", "#menu"],
            buttonId : "#menu-button",
        },
        rule : {
            isOpen : false,
            toggleIds : ["#rule-background", "#rule"],
            buttonId : "#rule-button",
        },
    }

    let time = 0;
    let intervalID = null;
    let board;

    //イベントの登録
    /** ゲーム開始イベントの受信 */
    root.on(GAMESTART, timerStart);
    /** ゲームオーバーイベントの受信 */
    root.on(GAMEOVER, function() {
        timerStop();
        reset.text("😱");
    });
    /** ゲームクリアイベントの受信 */
    root.on(GAMECLEAR, function() {
        timerStop();
        reset.text("😎");
    });

    /** フラグ設置（除去）イベントの受信 */
    root.on(FLAGUPDATE, function () {
        let flags = board.remainFlags > 0 ? board.remainFlags : 0;
        format(remainFlag, flags);
    });
    /** resetボタンのクリック */
    $("#reset").on("click", gameInit);

    /** 設定ボタン（< 設定）のクリック */
    $("#menu-button").on("click", function() {
        exclusiveOverlayMenu("menu");
    });
    /** 操作方法ボタン（< 操作方法）のクリック */
    $("#rule-button").on("click", function() {
        exclusiveOverlayMenu("rule");
    });
    /** 高さマス数の更新（制約検証） */
    $("#y-panels").on("change", checkMinesValidity);
    /** 幅マス数の更新（制約検証） */
    $("#x-panels").on("change", checkMinesValidity);
    /** 地雷数の更新（制約検証） */
    $("#mine").on("change", checkMinesValidity);
    /** リセットして反映ボタンの実行 */
    $("#setting").on("submit", function (e) {
        gameInit();
        exclusiveOverlayMenu("menu");
        return false;
    });
    /** ルールのアコーディオン部分を非表示にする */
    $("dt").next().hide();
    /** ルールのアコーディオン部分をクリック */
    $("dt").on("click", function() {
        $(this).next().slideToggle(300);
    }) 

    /** 画面内の数値表示を3桁にフォーマットする */
    function format(jqElm, num) {
        jqElm.text(String(num).padStart(3, "0"));
    }

    /** タイマーを開始する */
    function timerStart() {
        intervalID = window.setInterval(function () {
            time++;
            //999でカウントをMAXとする。（タイマー自体は動かしておく）
            if (time >= 1000) time = 999;
            format(timeCount, time);
        }, 1000);
    }

    /** タイマーを停止する */
    function timerStop() {
        if (!intervalID) return;
        window.clearInterval(intervalID);
        intervalID = null;
    }

    /**
     * メニュー表示領域をトグルする。
     * @param {string[]} toggleIds トグルしたいID名の配列
     * @param {string} button ボタンのID名
     */
    function toggleRelatedMenu(toggleIds, button) {
        const idString = toggleIds.join(",");

        $(idString).toggleClass("visible");
        //ボタンのテキストの内、１文字目（< or >）だけをトグルする。
        const str = $(button).text();
        const a = str.substring(0,1);
        const b = str.substring(1);
        $(button).text((a === "<" ? ">" : "<") + b);
    }
    /**
     * オーバーレイ表示メニューを排他制御で表示する。
     */
    function exclusiveOverlayMenu(name) {
        for(const p in overlays) {
            const obj = overlays[p];
            if (p !== name) {
                //制御対象のオーバーレイ以外は全て非表示にする
                if (obj.isOpen) {
                    obj.isOpen = false;
                    toggleRelatedMenu(obj.toggleIds, obj.button);
                }
            }
            //制御対象のオーバーレイは表示状態をトグルする。
            else {
                obj.isOpen = !obj.isOpen;
                toggleRelatedMenu(obj.toggleIds, obj.button);
            }
        }
    }

    /**
     * ゲームの初期化
     */
    function gameInit() {

        timerStop();
        time = 0;
        format(timeCount, time);
        $("#reset").text("😃");

        root.empty();

        const y = Number($("#y-panels").val());
        const x = Number($("#x-panels").val());
        const mineVal = Number($("#mine").val());
        board = new Board(x, y, root, mineVal);
        root.append(board.element);
        format(remainFlag, mineVal);
    }

    /**
     * 盤面の大きさ（幅×高さ）に対して地雷数が正しいかどうかを評価する。
     */
    function checkMinesValidity() {
        const y = Number($("#y-panels").val());
        const x = Number($("#x-panels").val());
        const mine = $("#mine");
        const mineVal = Number(mine.val());

        if (mineVal < 1 || mineVal >= y * x) {
            mine[0].setCustomValidity("地雷数は1以上、かつ幅×高さよりも少なくしてください。");
        }
        else {
            mine[0].setCustomValidity("");
        }
    }
    gameInit();

});