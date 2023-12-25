/** ゲーム中の最大人数 */
const MAX_PLAYERS = 2;
/** アニメーション時間（ms） */
const ANIMATE_TIME = 2500;

$(function () {
    /** ダイス領域 */
    const diceField = $("#dice-field");
    /** ダイスロールボタン */
    const diceButton = $("#diceroll");
    /** スコア表 */
    const scoreBoard = $("#score-board");
    /** ダイス領域内の固定表示用要素群 */
    const fixedElement = $("#fixed-element");
    /** 手役成立時の文字列表示領域 */
    const viewHands = $("#view-hands");
    /** ターンや勝ち負けなどの情報表示領域 */
    const turnInfo = $("#turn-info");
    const ruleBackground = $("#rule-background");
    const rule = $("#rule")
    const ruleInfoDt = rule.find("dt");
    const ruleButton = $("#rule-button");
    /** ダイスキープ管理ジェネレータの生成 */
    const diceKeep = toggleDiceKeep();
    const keepReset = () => diceKeep.next([null]);  //ダイスキープ管理ジェネレータのリセット命令
    keepReset();                            //ダイスキープ管理初期化

    /** アニメーション中管理フラグ */
    let isAnimation = false;
    /** ダイスキープを許可するかのフラグ */
    let allowDiceKeep = false;
    /** ターン */
    let turn = 0;
    /** １ターン中に振ったダイスロール回数 */
    let diceRollTimes = 0;
    /** １ターン中の最大ダイスロール回数 */
    const maxDiceRollTimes = 3;
    /** ターン変更関数 */
    const turnChange = (turn, maxPlayers) => turn + 1 === maxPlayers ? 0 : turn + 1;
    /** DiceRollオブジェクト　@type {null | DiceRoll} */
    let diceRoll = null;
    /** ScoreTableオブジェクト @type {null | ScoreTable} */
    let scores = null;

    /** 初期化 */
    function init() {
        //手役成立文字列の領域は一旦退避する（後で戻すため）
        fixedElement.detach();
        diceField.empty();
        scoreBoard.empty();
        diceRoll = new DiceRoll(5, diceField);
        scores = new ScoreTable(scoreBoard, MAX_PLAYERS);
        //対比した領域を再度元の位置に戻す
        diceField.append(fixedElement);
    }

    /** ダイスロールボタン押下 */
    diceButton.on("click", function () {
        allowDiceKeep = true;
        //アニメーション中はボタンを非活性とし、その他のクリック領域も受け付けない。
        isAnimation = true;
        diceButton.prop("disabled", true);
        scores.removeClickable();
        diceRollTimes++;
        turnInfoChange({ turn: turn + 1, diceRollTimes });

        //ダイスロールを実行
        diceRoll.animateDiceroll(ANIMATE_TIME)
            .then(() => {
                //実行後
                isAnimation = false;
                //ダイスロールボタンを条件に応じて活性化する。
                if (diceRollTimes < maxDiceRollTimes) diceButton.prop("disabled", false);

                //手役成立として表示しない手役名
                const exclusionKeyName = ["1", "2", "3", "4", "5", "6", "チョイス", ""];
                //手役が成立したかを判断する。スコア表の、より下にある手役が優先される
                const maxHands = scores.calcTemporaryScores(turn, diceRoll.diceNums);

                //手役成立した文字列が見つかったら、手役成立文字列に表示する。アニメーションも実行（CSSで定義）
                if (!exclusionKeyName.includes(maxHands)) viewHands.text(maxHands + "！").addClass("animate");
                //スコア表をクリック可能にする
                scores.setClickable(turn);
            });
    });

    /** ダイス領域押下 */
    diceField.on("click", function (ev) {
        //ゲームが未開始、またはアニメーション中は受け付けない
        if (!allowDiceKeep || isAnimation) return;
        //クリックした要素がダイスでなかったら受け付けない
        if (!$(ev.target).hasClass("dice")) return;
        //ダイスキープ管理に問い合わせ、キープ状態をトグルする。
        diceKeep.next([ev.target, diceButton]);
    });

    /** スコア表押下 */
    scoreBoard.on("click", function (ev) {
        //ダイスをまだ振っていない、アニメーション中なら受け付けない
        if (diceRollTimes === 0 || isAnimation) return;
        //クリックした要素をScoreTableクラスへ渡し、正しく処理できたら
        if (scores.click(ev.target)) {
            //ゲームオーバー条件を満たしたら勝敗を出して終了。
            if (scores.isGameOver) {
                diceButton.prop("disabled", true);
                return gameOver();
            }
            //ターン変更処理
            turn = turnChange(turn, MAX_PLAYERS);
            scores.turnChange(turn);
            allowDiceKeep = false;
            diceRollTimes = 0;
            diceButton.prop("disabled", false);
            keepReset();
            turnInfoChange({ turn: turn + 1, diceRollTimes });
        }
    });

    /** 手役成立時のアニメ終了後 */
    viewHands.on("animationend", function () {
        $(this).removeClass("animate");
    });

    ruleButton.on("click", toggleClass);
    ruleBackground.on("click", toggleClass);
    function toggleClass() {
        ruleBackground.toggleClass("visible");
        rule.toggleClass("visible");
    }

    ruleInfoDt.on("click", function() {
        $(this).next("dd").slideToggle(150);
    });

    /** ゲーム終了関数 */
    function gameOver() {
        //勝者のリストアップ
        const winner = scores.sumScores.map((v, i, arr) => v === Math.max(...arr) ? i : null).filter(v => v !== null);
        //全員勝者なら引き分け
        if (winner.length === scores.sumScores.length) return turnInfoChange({ isDraw: true });
        //表示文字列の形成
        let str = "";
        for (let i of winner) {
            str += String(i + 1) + "P、 ";
        }
        str = str.slice(0, str.length - 2);
        return turnInfoChange({ isEnd: str });
    }

    /**
     * ダイスのキープ状態を管理するジェネレーター関数
     * サイコロがキープであるかどうかを当関数内で管理し、状態に応じてトグルする。
     */
    function* toggleDiceKeep() {
        const MAX = 5;
        //値の初期化
        const array = Array(MAX).fill(null);
        //配列内の空きスペースを探す関数
        const findSpaceNum = () => array.findIndex(v => v === null);
        //配列内に同じものがあるか、あるなら何番目かを探す関数
        const findNum = (elm) => array.findIndex(v => v === elm);

        while (true) {
            //yield;で入力を受け付けながら処理を一時停止する。
            //2回目以降のnext()で、HTMLElementオブジェクトを受け付ける。
            let [elm, btn] = yield;
            //elmがnullのとき、キープ状態を全て解除する。
            if (elm === null) {
                for (let i = 0; i < array.length; i++) {
                    //Score#toggleKeepClassメソッドを呼び出す
                    if (array[i]) $(array[i]).data("toggle")();
                    array[i] = null;
                }
                continue;
            }
            //同じものがあったら
            if (findNum(elm) !== -1) {
                //Score#toggleKeepClassメソッドを呼び出す
                $(elm).data("toggle")();
                array[findNum(elm)] = null;
            }
            //同じものがなかったら
            else {
                //Score#toggleKeepClassメソッドを呼び出す
                $(elm).data("toggle")(findSpaceNum());
                array[findSpaceNum()] = elm;
            }
            //配列の埋まり具合で、ボタンの活性/非活性を切り替える。
            $(btn).prop("disabled", array.filter(v => v !== null).length >= array.length);
        }
    }

    /**
     * ターン情報の書き換え
     * @param {Object} options 情報更新に必要な値の集合
     * @returns {void}
     */
    function turnInfoChange(options = {}) {
        const option = {
            isEnd : options.isEnd ?? false,
            turn : options.turn ?? 1,
            diceRollTimes : options.diceRollTimes ?? 1,
            isDraw : options.isDraw ?? false
        };
        if (option.isDraw) return turnInfo.text(`ゲーム終了！ 引き分け`);
        if (option.isEnd) return turnInfo.text(`ゲーム終了！ ${option.isEnd}の勝ち！`);
        const spans = turnInfo.children("span");
        $(spans[0]).text("");
        $(spans[1]).text(option.turn);
        $(spans[2]).text(option.diceRollTimes);
    }
    //初期化実行
    init();
});