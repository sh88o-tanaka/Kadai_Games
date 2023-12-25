class Mankara {
    _field;
    _turn;
    _pocket;

    constructor(pocket, stone) {
        //console.log("Mankara class init");
        this._pocket = pocket;
        this._turn = true;
        //フィールド配列の初期化。ゴールに相当する部分は0、それ以外はstoneの値にする。
        this._field = Array((pocket+1) * 2).fill(0).map((_, i, ar) => i === pocket || i === ar.length - 1 ? 0 : stone);
        //console.log(this._field);
//        console.log(this.isWin());
//        this.tanemaki(9);
    }
    getField() {
        return this._field;
    }
    isFirst() {
        return this._turn;
    }
    isWin() {
        //先手のポケットにある石の数を足した値
        const p1pocketSum = this._field.slice(0, this._pocket).reduce(((p, c)=> p + c));
        //後手のポケットにある石の数を足した値
        const p2pocketSum = this._field.slice(this._pocket + 1, this._field.length - 1).reduce(((p, c)=> p + c));
        //どちらかが0になったら勝敗がついたことがわかる。
        return p1pocketSum <= 0 || p2pocketSum <= 0;
    }
    tanemaki(num) {
        //指定したポケットに石がなかったら種まきを行わない。
        if (this._field[num] <= 0) return false;
        //指定ポケットから石を取り出す。
        const stone = this._field[num];
        this._field[num] = 0;

        //ゴールに相当する要素番号を配列にした。
        const GOAL_NUMBER = [this._pocket, this._field.length - 1];
        //割り算（剰余の計算）に使う「割る数」を決める。
        const length = this._field.length;
//        console.log(GOAL_NUMBER, length);

        //指定したポケット番号と、その中にある石の数を足し、それを要素数で割る。
        //その余りがゴール番号のどちらかと等しい場合、種まきの最後がゴールで終わることになる。
        //ゴールで終わったらターンを変更しないので、isTurnChangeはfalseとする。それ以外はtrue。
        const isTurnChange = !GOAL_NUMBER.includes((num + stone) % length);
//        console.log(isTurnChange);

        //取り出した石の数だけ繰り返す。
        for (let i = 0; i < stone; i++) {
            //反時計回りで隣の要素番号に更新する。要素の数以上になったら0に戻る。
            num = num + 1 === this._field.length ? 0 : num + 1;
            //その要素番号内の値に1を足す。
            this._field[num] += 1;
        }
//        console.log(this._field);
        //勝敗がまだついておらず、かつターン変更が必要だったら、手番の値を更新する。
        if (!this.isWin() && isTurnChange) this._turn = !this._turn;

        //種まきが正常に終了したことを返却。
        return true;
    }
}