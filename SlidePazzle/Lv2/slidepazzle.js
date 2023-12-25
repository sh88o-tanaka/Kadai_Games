/**
 * スライドパズルの情報を管理する @type {PanelManager}
 */
let panels;

//imglist.phpの結果ら除外してほしいファイル名
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
    $("#game-field").on("click", function (ev) {
        const y = Number($(ev.target).data("now-y"));
        const x = Number($(ev.target).data("now-x"));
        panels.movePanel(y, x);
        draw();
    });

    //---イベントハンドラここまで--------

    /**
     * ゲームを初期化する。
     */
    function gameInit() {
        gameField.empty();
        const [yPanels, xPanels] = [Number($("#y-panels").val()), Number($("#x-panels").val())];
        const src = $("#play-src").val();
        panels = new PanelManager(yPanels, xPanels, src, gameField.width());
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

    //ページ読み込み時の初期化
    function pageInit() {
        //画像の遅延読み込み
        $.ajax({
            url: "imglist.php",
            type: "json",
            method: "GET",
            data: {
                exclude: EXCLUSION_IMAGE_NAME
            },
        }).done(function (data) {
            //console.log(data);
            //サムネイルの表示
            data.thumbnails.forEach(v =>
                $("#play-images").append(
                    $("<div>").addClass("play-img").append(
                        $("<img>").attr("src", v)
                    )
                )
            );

            //要素を作成した後にイベントを設定。
            $(".play-img").on("click", function () {
                const img = $(this).children()[0];
                const src = img.src.replace("/thumbnail", "");
                //先読み処理。ブラウザ内でキャッシュされれば表示を高速化できる。
                const preImage = new Image();
                preImage.src = src;

                if ($(this).hasClass("selected")) return;
                $(".play-img").removeClass("selected");
                $(this).addClass("selected");
                $("#play-src").val(src);
            });
        }).fail(function (jqXHR, status) {
            console.warn(status);
            console.warn(jqXHR);
        });
        //最初の画像に予め選択状態を付与しておく
        $(".play-img").eq(0).addClass("selected");
    }

    //ページ読み込み時の処理
    gameInit();
    pageInit();

});