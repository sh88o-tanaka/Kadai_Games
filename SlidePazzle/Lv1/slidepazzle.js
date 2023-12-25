/**
 * スライドパズルの情報を管理する @type {PanelManager}
 */
let panels;

const EXCLUSION_IMAGE_NAME = "default.jpg";
$(function () {

    const gameField = $("#game-field");

    //---イベントハンドラ---------------

    //「リセットして反映」ボタンのクリック（フォームのsubmit）
    $("#setting").on("submit", function () {
        gameInit();
        toggleRelatedMenu();
        //フォームの送信は行わないので、falseを返して処理を中断する。
        return false;
    });

    //メニュー表示ボタンのクリック
    $("#menu-button").on("click", toggleRelatedMenu);

    //シャッフルボタンのクリック
    $("#reset").on("click", function () {
        panels.shufflePanels();
        draw();
    });

    //ゲーム盤面のクリック
    $("#game-field").on("click", function(ev) {
        const y = Number($(ev.target).data("now-y"));
        const x = Number($(ev.target).data("now-x"));
        panels.movePanel(y,x);
        draw();
    });

    //ページ読み込み時の処理
    gameInit();

    //---イベントハンドラここまで--------

    /**
     * ゲームを初期化する。
     */
    function gameInit() {
        gameField.empty();
        const [yPanels, xPanels] = [Number($("#y-panels").val()), Number($("#x-panels").val())];
        panels = new PanelManager(yPanels, xPanels);
        gameField.append(panels.viewPanels);
    }

    /**
     * パズルを描画する。
     */
    function draw() {
        gameField.empty();
        gameField.append(panels.viewPanels);
    }

    /**
     * メニュー表示領域をトグルする。
     */
    function toggleRelatedMenu() {
        $("#menu-background, #menu").toggleClass("visible");
        const str = $("#menu-button").text();
        $("#menu-button").text(str === "<" ? ">" : "<");
    }

});