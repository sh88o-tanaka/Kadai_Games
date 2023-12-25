/**
 * @fileoverview アクセス時の実行関数（メイン関数）を定義したファイル
 */
$(function(){
    /** 
     * ゲームの情報管理インスタンス。アクセス時およびリセット毎に新規作成する。
     * @type {GameController}
     */
    let game = new GameController();
    game.resetAll();

    /**
     * 各セルをクリックした時の動作
     * 各セルに予め"data-row"と"data-column"のカスタムデータ属性をもたせること。
     * （本プログラムではGameViewクラスのコンストラクタで実行している）
     */
    $("td").bind("click", function(){
        const row = parseInt($(this).attr("data-row"));
        const column = parseInt($(this).attr("data-column"));
        game.putStone(row,column);
    });
    
    /**
     * リセットボタンを押下した時の動作
     */
    $("#reset_button").bind("click",function(){
        game = new GameController();
        game.resetAll();
    });
    
    /**
     * 各セルにマウスを合わせた時の動作
     */
    $("td").mouseover(function(){
        $(this).addClass("selected");
    });
    /**
     * 各セルからマウスを離した時の動作
     */
    $("td").mouseout(function(){
        $(this).removeClass("selected");
    });
});