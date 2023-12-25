/**
 * Mankara
 * マンカラの盤面、勝敗、ターンなどを管理する。
 * 実際のルールはサブクラスが実装する。
 */
class Mankara {
    /**
     * マンカラの各情報を生成する。
     * @param {number} pocket 各プレイヤーのマス数
     * @param {number} stone 各マスに初期配置される石の数
     */
    constructor(pocket, stone) {
        //min～maxの値を16進数の2文字に変換する。
        const randomHex = (min = 0, max = 255) => Math.floor(Math.random() * max + min).toString(16).padStart(2, "0");
        //「#XXXXXX」の文字を作成し、色を決定する。
        const randomColor = () => `#${randomHex(0, 200)}${randomHex(0, 200)}${randomHex(0, 200)}`;
        //<p>要素を作り、色を設定した「●」を作る＝石の作成。
        const createStone = () => $("<p>").css({ color: randomColor() }).text("●");
        //与えられた初期の石の数だけ要素を持った配列を作成する。＝ポケットの作成
        const createPocket = (s) => Array(s).fill(null).map(() => createStone());
        //与えられたポケット数だけ、ポケットの配列を作成する。また末尾にゴールを表す配列を合成する。＝プレイヤー1人分の情報作成。
        const createOnePlayer = (p, s) => Array(p).fill(null).map(() => createPocket(s)).concat([[]]);
        //プレイヤーを2人分作成して合成する。＝フィールドの完成。
        this._field = createOnePlayer(pocket, stone).concat(createOnePlayer(pocket, stone));
        this._pocket = pocket;
        this._turn = true;
    }
    /**
     * 今の手番が先手かどうかを返す。手番参照用の変数
     * @returns {boolean} 先手ならtrue
     */
    get isFirst() {
        return this._turn;
    }

    get field() {
        return this._field;
    }
    /**
     * サブクラスに実装してもらうメソッド。
     * スーパークラスの本メソッドを参照した場合はErrorを投げる。
     */
    tanemaki() {
        throw new Error("Mankaraのサブクラスをインスタンス化してください。");
    }
    get isWin() {
        throw new Error("Mankaraのサブクラスをインスタンス化してください。");
    }
}

/**
 * マンカラ・ベーシックのルールに合わせた情報管理を行う。
 * constructorなどはスーパークラスが担当する。
 */
class MankaraBasic extends Mankara {
    /**
     * 引数で受け取ったマスの石を、マンカラ・ベーシックのルールに従って再配置する。
     * @param {number} num 種まき元のポケット番号
     * @returns 種まきが実行できたかどうかをbooleanで返却する。
     */
    tanemaki(num) {
        const pick = this._field[num];
        if (pick.length === 0) return false;
        this._field[num] = [];

        const isTurnChange = () => {
            const temp = pick.length + num;
            const MAX = (this._pocket + 1) * 2;
            return !(
                (temp % MAX === this._pocket) ||
                (temp % MAX === MAX - 1)
            );    
        }
        let p;
        while (p = pick.pop()) {
            num = num + 1 < (this._pocket + 1) * 2 ? num + 1 : 0;
            this._field[num].push(p);
        }
        if (!this.isWin && isTurnChange()) this._turn = !this._turn;
        return true;
    }
    /**
    * 勝敗がついたかどうかを返す。
    */
    get isWin() {
        const p1Field = this._field.slice(0, this._pocket).flat();
        const p2Field = this._field.slice(this._pocket + 1, -1).flat();
        if (p1Field.length === 0 || p2Field.length === 0) return true;
        else return false;
    }
}

/**
 * マンカラ・イージーのルールに合わせた情報管理を行う。
 * constructorなどはスーパークラスが担当する。
 */
class MankaraEasy extends Mankara {
    /**
     * 引数で受け取ったマスの石を、マンカラ・イージーのルールに従って再配置する。
     * @param {number} num 種まき元のポケット番号
     * @returns 種まきが実行できたかどうかをbooleanで返却する。
     */
    tanemaki(num) {
        const pick = this._field[num];
        if (pick.length === 0) return false;
        this._field[num] = [];

        const isTurnChange = !(
            (num < this._pocket && pick.length + num === this._pocket) ||
            (num > this._pocket && pick.length + num === (this._pocket * 2) + 1));

        let p;
        while (p = pick.pop()) {
            //先手は後手ゴール（Fieldの末端）に入れてはいけない。
            if (this.isFirst) {
                num = num + 1 < (this._pocket + 1) * 2 - 1 ? num + 1 : 0;
            }
            //後手は先手ゴール（Field番号＝this._pocket）に入れてはいけない。
            else {
                //次の番号が先手ゴールだった場合はそこをスキップする。
                if (num + 1 === this._pocket) num += 2;
                else {
                    num = num + 1 < (this._pocket + 1) * 2 ? num + 1 : 0;
                }
            }
            this._field[num].push(p);    
        }
        if (!this.isWin && isTurnChange) this._turn = !this._turn;
        return true;
    }
    /**
    * 勝敗がついたかどうかを返す。
    */
    get isWin() {
        const p1Field = this._field.slice(0, this._pocket).flat();
        const p2Field = this._field.slice(this._pocket + 1, -1).flat();
        if (p1Field.length === 0 || p2Field.length === 0) {
            //どちらが勝ったかを表すためにthis._turnの値を勝者の手番に書き換える。
            if (this._field[this._pocket].length === this._field[this._field.length - 1].length) this._turn = null;
            else this._turn = this._field[this._pocket].length > this._field[this._field.length - 1].length;
            return true;
        }
        else return false;
    }
}