/**
 * ScoreTableクラス
 * スコア表全体を管理するクラス。各手役の成立条件も管理する。
 */
class ScoreTable {
    static BONUS_SCORE = 35;
    static BONUS_BORDER = 63;
    //各手役のルールをひとまとめにする。
    /**
     * その数字が配列内にいくつ含まれているかを計算する関数を作る関数
     * @static
     * @param {number} num
     * @returns {(result : number[]) => number}
     */
    static lengthFilter = (num) => {
        return (result) => result.filter(v => v === num).length;
    }
    /**
     * 出目ごとのスコアを計算する関数を作る関数
     * @static
     * @param {number} num
     * @returns {(result: number[]) => number}
     */
    static scoringNumber = (num) => {
        //その出目のサイコロ数 × 出目 を返す。
        return (result) => ScoreTable.lengthFilter(num)(result) * num;
    }
    /**
     * ストレートの手役かどうかを確認する関数を作る関数
     * @static
     * @param {number[][]} collects その手役が成立する数値配列の集合
     * @param {number} score        手役成立時のスコア
     * @returns {(result: number[]) => number}
     */
    static straightChecker = (collects, score) => {
        return (result) => {
            //渡された手役成立配列全てに対して実施する。
            for (let collect of collects) {
                //その出目が存在するかをチェックする配列
                const checker = [...collect].fill(0);
                for (let i = 0; i < collect.length; i++) {
                    //collect内の要素（出目）が渡された出目配列内にいくつあるかを確認し、チェッカーに保存する。
                    checker[i] = ScoreTable.lengthFilter(collect[i])(result);
                }
                //チェッカー内の値が全て0でなかったら（1以上なら）、その手役は成立している。ほかの手役成立配列は実施する必要がないのでここですぐにreturn。
                if (ScoreTable.lengthFilter(0)(checker) === 0) return score;
            }
            //全配列でチェッカーを満たすものは存在しなかったので、スコア0。
            return 0;
        }
    }
    /**
     * 各手役の名前と、手役成立ルールの集合
     * @type {Map<string, (result: number[]) => number}
     */
    static rules = new Map([
        ["1", ScoreTable.scoringNumber(1)],
        ["2", ScoreTable.scoringNumber(2)],
        ["3", ScoreTable.scoringNumber(3)],
        ["4", ScoreTable.scoringNumber(4)],
        ["5", ScoreTable.scoringNumber(5)],
        ["6", ScoreTable.scoringNumber(6)],
        ["チョイス", (result) => result.reduce((a, c) => a + c)],
        ["フォーダイス", (result) => {
            for (let i = 1; i <= 6; i++) {
                if (ScoreTable.lengthFilter(i)(result) >= 4) {
                    return result.reduce((a, c) => a + c);
                }
            }
            return 0;
        }],
        ["フルハウス", (result) => {
            let pair = 0;
            let threecard = 0;
            for (let i = 1; i <= 6; i++) {
                //同じ出目が2個存在したら、その出目を記録
                if (ScoreTable.lengthFilter(i)(result) === 2) pair = i;
                //同じ出目が3個存在したら、その出目を記録
                else if (ScoreTable.lengthFilter(i)(result) === 3) threecard = i;
            }
            //両方あるなら、出目の合計を返し、そうでないならスコア0。
            return pair !== 0 && threecard !== 0 ? result.reduce((a, c) => a + c) : 0;
        }],
        ["S・ストレート", ScoreTable.straightChecker([[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]], 15)],
        ["B・ストレート", ScoreTable.straightChecker([[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]], 30)],
        ["ヨット", (result) => {
            for (let i = 1; i <= 6; i++) {
                if (ScoreTable.lengthFilter(i)(result) === 5) {
                    return 50;
                }
            }
            return 0;
        }],
    ]);

    /** 最大プレイ人数 */
    #maxPlayerNum;
    /** HTMLのtable要素 */
    #table;
    /** プレイヤーごとのScoreクラス集合 */
    #playerScores;
    /** 各プレイヤーのボーナスを表示するHTML要素 */
    #playerBonusElements;
    /** 各プレイヤーの合計を表示するHTML要素 */
    #playerSumElements;
    /** 各プレイヤーの列を表すHTML要素 */
    #playerCols;
    /** 各プレイヤーの列タイトルを表すHTML要素 */
    #playerThs;
    /**
     * クラスを初期化し、外部から渡されたtable要素に表示する各要素を構築する。
     * @param {jQuery} jqTable 外部から渡されるtable要素（jQuery）
     * @param {number} playerNum 最大プレイ人数
     */
    constructor(jqTable, playerNum = 1) {
        this.#table = jqTable;
        this.#maxPlayerNum = playerNum;
        this.#playerScores = this.#createPlayerScores();

        this.#playerBonusElements = this.#createBonusElements();
        this.#playerSumElements = this.#createSumElements();

        this.#playerCols = this.#createColGroup();
        this.#playerThs = this.#createThead();
        this.#appendDiceNums();
    }
    /**
     * 手役ごとにプレイヤーのScoreを作成する
     * @returns {Map<string, Score[]>} 手役ごとのScoreの集合
     */
    #createPlayerScores() {
        const data = Array.from(ScoreTable.rules.keys()).map((key) => {
            return [key, Array(this.#maxPlayerNum).fill(null).map(() => new Score(ScoreTable.rules.get(key)))];
        });
        return new Map(data);
    }
    /**
     * ボーナス表示用のHTML要素を作成する
     * @returns {jQuery[]} td要素の集合
     */
    #createBonusElements() {
        const tds = [];
        for (let i = 0; i < this.#maxPlayerNum; i++) {
            const td = $("<td>");
            const diceSum = $("<p>").addClass("bonus-border").text(" / "+ ScoreTable.BONUS_BORDER).prepend($("<span>").addClass("dice-sum").text("0"));
            const bonusScore = $("<p>").addClass("bonus-result").text("　");
            td.append([diceSum, bonusScore]);
            tds.push(td);
        }
        return tds;
    }
    /**
     * 合計表示用のHTML要素を作成する
     * @returns {jQuery[]} td要素の集合
     */
    #createSumElements() {
        const tds = [];
        for (let i = 0; i < this.#maxPlayerNum; i++) {
            const td = $("<td>");
            const sumScore = $("<p>").addClass("sum-score").text("0");
            td.append(sumScore);
            tds.push(td);
        }
        return tds;
    }
    /**
     * colgroup要素を作成する。
     * @returns {jQuery[]} col要素の集合
     */
    #createColGroup() {
        const colGroup = $("<colgroup>").append($("<col>")).appendTo(this.#table);
        const cols = [];
        for (let i = 1; i <= this.#maxPlayerNum; i++) {
            const col = $("<col>").addClass("player");
            cols.push(col);
            colGroup.append(col);
        }
        return cols;
    }
    /**
     * thead要素を作成する
     * @returns {jQuery[]} th要素の集合
     */
    #createThead() {
        const thead = $("<thead>").appendTo(this.#table);
        const tr = $("<tr>").append($("<th>"));
        const ths = []
        for (let i = 1; i <= this.#maxPlayerNum; i++) {
            const th = $("<th>").text(i + "P");
            ths.push(th);
        }
        ths[0].addClass("now-player");
        tr.append(ths);
        thead.append(tr);
        return ths;
    }
    /**
     * スコア表示部分の要素を追加する
     */
    #appendDiceNums() {
        const tbody = $("<tbody>").addClass("hands").appendTo(this.#table);
        for (let key of ScoreTable.rules.keys()) {
            const tr = $("<tr>");
            tr.append($("<th>").text(key));
            tr.append(this.#playerScores.get(key).map(s => s.element));
            tbody.append(tr);
            if (key === "6") {
                tbody.append(
                    $("<tr>")
                        .append($("<th>").text("ボーナス"))
                        .append(this.#playerBonusElements));
            }
        }
        tbody.append(
            $("<tr>")
                .append($("<th>").text("合計"))
                .append(this.#playerSumElements));
    }
    /**
     * 受け取った出目を仮定とした仮のスコアを計算・表示する。
     * @param {number} turn 現在のプレイヤー（0～）
     * @param {number[]} results 受け取る出目
     * @returns {string} 成立した中で最も上位の手役
     */
    calcTemporaryScores(turn, results) {
        let maxHands = "";
        for (let [k, v] of this.#playerScores.entries()) {
            const score = v[turn].viewTemporaryValue(results);
            if (score !== 0) maxHands = k;
        }
        return maxHands;
    }
    /**
     * ターン変更時の表示更新処理
     * @param {number} nextTurn 次のプレイヤー
     */
    turnChange(nextTurn) {
        Array.from(this.#playerScores.values()).flat().forEach(v => v.deleteTemporaryValue());
        this.removeClickable();
        const bonusScores = this.bonusScores;
        const sumScores = this.sumScores;
        for (let i = 0; i < this.#playerSumElements.length; i++) {
            const bonusElement = this.#playerBonusElements[i];
            bonusElement.find(".dice-sum").text(bonusScores[i]);
            const isAllNumDecided = (Array.from(this.#playerScores.values()).slice(0, 6)).map(s => s[i].isDecided).filter(b=>b===false).length === 0
            if (isAllNumDecided) this.#playerBonusElements[i].children(".bonus-result").text("0");
            if (bonusScores[i] >= ScoreTable.BONUS_BORDER) {
                this.#playerBonusElements[i].children(".bonus-result").text(ScoreTable.BONUS_SCORE);
            }
            this.#playerSumElements[i].text(String(sumScores[i]));
        }
        this.#playerThs.forEach(jq => jq.removeClass("now-player"));
        this.#playerThs[nextTurn].addClass("now-player");
    }
    /**
     * クリック可能状態への切替
     */
    setClickable(turn) {
        for (let v of this.#playerScores.values()) {
            v[turn].setClickable();
        }
        this.#playerCols[turn].addClass("turn");
    }
    /**
     * クリック可能状態の解除
     */
    removeClickable() {
        Array.from(this.#playerScores.values()).flat().forEach(v => v.removeClickable());
        this.#playerCols.forEach(v => v.removeClass("turn"));

    }

    /**
     * スコア表をクリックしたときの処理
     * @param {HTMLElement} targetHtml クリックされた要素
     * @returns {void}
     */
    click(targetHtml) {
        if (!$(targetHtml).hasClass("undecided") || !$(targetHtml).hasClass("clickable")) return false;
        const targetScore = Array.from(this.#playerScores.values()).flat().find(v => v.element === targetHtml);
        return targetScore.click();
    }
    /** 各プレイヤーの合計スコア @returns {number[]} */
    get sumScores() {
        const scores = Array.from(this.#playerScores.values()).reduce(this.#reduce, Array(this.#maxPlayerNum).fill(0));
        const bonusScores = this.bonusScores;
        for(let i = 0; i < scores.length; i++) {
            if (bonusScores[i] >= ScoreTable.BONUS_BORDER) scores[i] += ScoreTable.BONUS_SCORE;
        }
        return scores;
    }

    /** 各プレイヤーのボーナスに関わる手役の合計スコア @returns {number[]} */
    get bonusScores() {
        const scores = Array.from(this.#playerScores.values()).slice(0, 6).reduce(this.#reduce, Array(this.#maxPlayerNum).fill(0));
        return scores;
    }
    /** 各スコアの集計関数 */
    #reduce(p, c) {
        for (let i = 0; i < p.length; i++) {
            p[i] += c[i].score;
        }
        return p;
    }
    /** ゲームが終了状態となったかどうか  */
    get isGameOver() {
        const checkAllDecided = Array.from(this.#playerScores.values()).flat().filter(s => !s.isDecided)
        return checkAllDecided.length === 0;
    }
}