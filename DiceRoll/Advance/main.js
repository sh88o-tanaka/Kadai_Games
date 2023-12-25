$(function () {
    /** @type {null | DiceRoll} */
    let diceroll = null;
    let jqRoots = [
        $("#diceroll-0"),
        $("#diceroll-1")
    ];

    /** 初期化関数 */
    function init(jq, num) {
        jq.empty();
        diceroll = new DiceRoll(num, jq);
    }

    function onSubmit(idNum) {
        init(jqRoots[idNum], Number($("#dicenum-" + idNum).val()));

        if ($("#is-anime-" + idNum).prop("checked")) {
            //アニメーションを伴うダイスロールと結果表示
            diceroll.animateDiceroll(3000)
                .then((results) => {
                    const num = Number($("#dicenum-" + idNum).val());
                    $("#result-" + idNum).text(
                        `${num}d6 = [${results}]`
                    );
                })
                .catch(console.error);
        }
        else {
            //アニメーションを伴わないダイスロールと結果表示
            const result = diceroll.diceroll();
            const num = Number($("#dicenum-" + idNum).val());
            $("#result-" + idNum).text(
                `${num}d6 = [${result}]`
            );
        }

        //submitイベントをキャンセルする。
        return false;
    }

    /** ダイスロール！ボタンイベント */
    $("#form-0").on("submit", function () {
        return onSubmit(0);
    })

    /** ダイスロール！ボタンイベント */
    $("#form-1").on("submit", function () {
        return onSubmit(1);
    })

    for (let i = 0; i < jqRoots.length; i++) {
        init(jqRoots[i], Number($("#dicenum-" + i).val()))
    }
});