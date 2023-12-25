/**
 * スライドパズルの情報を管理する @type {PanelManager}
 */
let panels;
const EXCLUSION_IMAGE_NAME = "default.jpg";
$(function () {

    const gameField = $("#game-field");

    //---イベントハンドラ---------------

    $("#setting").on("submit", function () {
        gameInit();
        toggleRelatedMenu();
        return false;
    });

    $("#menu-button").on("click", toggleRelatedMenu);

    $("#reset").on("click", function () {
        panels.shufflePanels();
    });

    //ゲーム盤面のクリック
    $("#game-field").on("click", function (ev) {
        const target = $(ev.target);
        if (!target?.data("panel")) return;
        const y = Number($(ev.target).data("panel").nowY);
        const x = Number($(ev.target).data("panel").nowX);
        panels.movePanel(y, x);
    });    
    
    //---イベントハンドラここまで--------

    /**
     * ゲームを初期化する。
     */
    function gameInit() {
        gameField.empty();
        const [yPanels, xPanels] = [Number($("#y-panels").val()), Number($("#x-panels").val())];
        const src = $("#play-src").val();
        panels = new PanelManager(src, yPanels, xPanels, gameField.width());
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
            data.thumbnails.forEach((v, i) => 
                $("#play-images").append(
                    $("<div>").addClass("play-img").append(
                        $("<img>").attr("src", v)
                    )
                )
            );
            
            //実寸ファイルの遅延読み込みを開始。メモリにキャッシュさせることで素早くスライドパズルに表示できる。
            data.images.forEach(v => {
                const img = new Image()
                img.src = v;
            });
            

            //要素を作成した後にイベントを設定。
            $(".play-img").on("click", function () {
                if ($(this).hasClass("selected")) return;
                $(".play-img").removeClass("selected");
                $(this).addClass("selected");
                const img = $(this).children()[0];
                const src = img.src.replace("/thumbnail", "");
                $("#play-src").val(src);
            });
        }).fail(function (jqXHR, status) {
            console.warn(status);
            console.warn(jqXHR);
        });
        $(".play-img").eq(0).addClass("selected");
    }
    pageInit();
    gameInit();

});