$(function () {
    //ゲームの現在の状態を司るクラス
    class GameState {
        //各状態をビット演算で計算するため、0と2**nの値をそれぞれ定める。
        static FLAGS = {
            GAMING: 0,     //0b00000　ゲーム中（全フラグオフの状態）
            GAMEOVER: 1,   //0b00001　ゲームオーバー中
            GAMECLEAR: 2,  //0b00010　ゲームクリア中
            RULE: 4,       //0b00100　ルール表示中
            TRANSITING: 8, //0b01000　アニメーション中
        }
        #state;
        constructor(state = GameState.FLAGS.GAMING) {
            this.#state = state;
        }
        //引数で渡された状態を反転する。
        toggle(num) {
            //定義済みの値以外は受け取らない。複数の値の合算も拒否する。
            let ok = false;
            for (const p in GameState.FLAGS) {
                if (num === GameState.FLAGS[p]) ok = true;
            }
            if (!ok) throw new Error(`引数 ${num} はGameStateで定義されていません。`);
            //ビット演算「XOR」を使い、渡された引数のビットだけを反転させる。
            this.#state ^= num;
            console.log("変更後GameState : " + this.#state.toString(2));
        }
        //キー押下イベントを認めてよいかを判定する。
        isPermitKeyDownEvent() {
            return this.#state === GameState.FLAGS.GAMING;
        }
    }

    const hScoreElement = $("#high-score");
    const scoreElement = $("#score");
    const ruleBackground = $("#rule-background");
    const rule = $("#rule")
    /** @type {null | GameField} ゲームフィールド */
    let game;
    /** @type {number} ハイスコア */
    let highScoreNum;
    /** @type {number} 現在スコア */
    let nowScoreNum;
    /** @type {GameState} ゲームの状態管理 */
    let state;

    //パネル移動関数を生成する関数
    const movePanel = (x, y) => async () => game.update(new Vec(x, y));
    //許可するキーと実行内容
    const permitKeys = new Map([
        ["ArrowUp", movePanel(0, -1)],      //↑キー
        ["ArrowDown", movePanel(0, 1)],     //↓キー
        ["ArrowLeft", movePanel(-1, 0)],    //←キー
        ["ArrowRight", movePanel(1, 0)],    //→キー
        ["w", movePanel(0, -1)],
        ["s", movePanel(0, 1)],
        ["a", movePanel(-1, 0)],
        ["d", movePanel(1, 0)],
    ]);

    //キーを押下したとき
    $(document).on("keydown", function (ev) {
        //キー操作禁止状態、同じキーの押しっぱなしは何もしない。
        if (!state.isPermitKeyDownEvent() || ev.originalEvent.repeat) return;
        //許可されるキーだけ実行する。
        if (permitKeys.has(ev.key)) {
            //処理実行中は「アニメーション中」状態に変更する。
            state.toggle(GameState.FLAGS.TRANSITING);
            permitKeys.get(ev.key)()
                .then((score) => {
                    //処理終了時、「アニメーション中」状態を解除する。
                    state.toggle(GameState.FLAGS.TRANSITING);
                    nowScoreNum += score;
                    scoreElement.text(nowScoreNum);
                    if (game.isGameClear) {
                        overlayUpdate("#gameclear", GameState.FLAGS.GAMECLEAR);
                        saveHighScore();
                    }
                    else if (game.isGameOver) {
                        overlayUpdate("#gameover", GameState.FLAGS.GAMEOVER);
                        saveHighScore();
                    }
                });
        }
    });
    //リスタートボタンを押下したとき
    $(".restart").on("click", init);
    //つづけるボタンを押下したとき
    $(".continue").on("click", function () {
        $("#gameclear").removeClass("visible");
        //つづけるボタンを押したので「ゲームクリア中」状態を解除する。
        state.toggle(GameState.FLAGS.GAMECLEAR);
        //ゲームオーバー条件を満たしていたら、ゲームオーバー表示に移行する。
        if (game.isGameOver) overlayUpdate("#gameover", GameState.FLAGS.GAMEOVER);
    });
    //ルールボタンを押下したとき
    $("#rule-button").on("click", toggleClass);
    //ルール表示中の背景を押下したとき
    ruleBackground.on("click", toggleClass);

    //ルール表示のトグル
    function toggleClass() {
        ruleBackground.toggleClass("visible");
        rule.toggleClass("visible");
        //画面の表示状態と同期して「ルール表示中」状態をトグルする。
        state.toggle(GameState.FLAGS.RULE);
    }
    //フィールドへのオーバーレイ表示を実行する。
    function overlayUpdate(selector, flag) {
        //表示するときに指定されたフラグをONにする。
        state.toggle(flag);
        $(selector).addClass("visible");
        $(".result").text(nowScoreNum);
    }
    //ハイスコアを保存する。
    function saveHighScore() {
        if (highScoreNum < nowScoreNum) {
            hScoreElement.text(nowScoreNum);
            localStorage.setItem("high-score", nowScoreNum);
        }
    }
    //ゲームの初期化
    function init() {
        state = new GameState();
        $("#gameover").removeClass("visible");
        $("#gameclear").removeClass("visible");
        nowScoreNum = 0;
        try {
            //localStorageを使い、ハイスコアを永続的に記録する。
            highScoreNum = localStorage.getItem("high-score") ?? 0;
        }
        catch (e) {
            //localStorageが使えない環境では記録しない。
            console.warn("storageが使用できませんでした");
            highScoreNum = 0;
        }
        hScoreElement.text(highScoreNum);
        scoreElement.text(nowScoreNum);
        game?.reset();
        game = new GameField($("#field"));
    }
    //ページ読み込み時のゲーム開始
    init();
});