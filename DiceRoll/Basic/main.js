$(function () {
    /** @type {null | DiceRoll} */
    let diceroll = null;
    let jqRoots = [
        $("#diceroll-0"),
    ];

    /** 初期化関数 */
    function init(jq, num) {
        jq.empty();
        diceroll = new DiceRoll(num, jq);
    }

    function onSubmit(idNum) {
        init(jqRoots[idNum], Number($("#dicenum-" + idNum).val()));

        //アニメーションを伴わないダイスロールと結果表示
        const result = diceroll.diceroll();
        const num = Number($("#dicenum-" + idNum).val());
        $("#result-" + idNum).text(
            `${num}d6 = [${result}]`
        );

        //submitイベントをキャンセルする。
        return false;
    }

    /** ダイスロール！ボタンイベント */
    $("#form-0").on("submit", function () {
        return onSubmit(0);
    })

    for (let i = 0; i < jqRoots.length; i++) {
        init(jqRoots[i], Number($("#dicenum-" + i).val()))
    }
});