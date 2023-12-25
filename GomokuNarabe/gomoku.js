
class GomokuNarabe {
    constructor() {
        //各マスの状態を表現するプライベートフィールド。2次元配列
        //表示用フィールドの上下左右に追加で領域を増やし、判定を簡便化する。
        this._field = [];
        for (let i = 0; i < SIZE.HEIGHT + 1; i++) {//高さ+1個の要素を作る
            const ar = [];//各要素に対して更に配列作成する。
            for (let j = 0; j < SIZE.WIDTH + 2; j++) { //幅+2個の要素を持った配列を作る。
                ar.push(STONE.NONE);//作った要素全てにSTONE.NONEを代入する。
            }
            this._field.push(ar);
        }

        //最下部1行のみ、STONE.WALLで初期化する
        const tmp = [];
        for (let j = 0; j < SIZE.WIDTH + 2; j++) {
            tmp.push(STONE.WALL);
        }
        this._field.push(tmp);
        //現在ターンの初期化
        this._turn = STONE.FIRST;
    }

    getTurn() {
        return this._turn;
    }

    //画面の表示に必要な部分の2次元配列だけを返す。
    getField() {
        const result = [];
        for (let i = 1; i < this._field.length - 1; i++) {
            const ar = [];
            for (let j = 1; j < this._field[i].length - 1; j++) {
                ar.push(this._field[i][j]);
            }
            result.push(ar);
        }
        return result;
    }

    //石を置く。置くことができたらゲーム終了かどうかを判定する。
    //row…行番号、col…列番号
    putStone(row, col) {
        //フィールドの参照
        const f = this._field;
        if (f[row][col] !== STONE.NONE) return null;

        //現在の手番を確認
        const color = this.getTurn();
        f[row][col] = color;
        //console.log(this.getField());
        return this._isGameOver(row, col, color);
    }

    //プライベートメソッド。ゲームが終了しているか判定する。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色
    _isGameOver(row, col, color) {
        //勝利条件を満たしたかチェック
        //探索方向は「上下」「左右」「右斜」「左斜」のペアとする。
        const searchPair = [
            [[-1, 0], [1, 0]],     //上下
            [[0, -1], [0, 1]],     //左右
            [[-1, -1], [1, 1]],    //左斜
            [[-1, 1], [1, -1]]     //右斜
        ]
        //各探索方向について同じ色でいくつ続いているかを確認し、5以上なら勝利
        for (const p of searchPair) {
            const connectionNum = this._searchConnection(row, col, color, p);
            if (connectionNum >= 5) return GAME_STATE.WIN;
        }

        //表示フィールドが全て埋まっているかをチェック
        const f = this.getField();
        //全部埋まっていたら引き分け。
        const tmp = f.flat();
        if (!tmp.includes(STONE.NONE)) return GAME_STATE.DRAW;

        //ゲーム続行
        this._changeTurn();
        return GAME_STATE.PENDING;
    }

    //プライベートメソッド。各方向で連続した石の数を判定する。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色 dxyArray…探索方向のペア
    _searchConnection(row, col, color, dxyArray) {
        let num = 1;//自分自身を含める。

        //探索方向を分解（「上下」なら「上」と「下」）し、それぞれ同色がいくつ続いているかを確認
        for (const dxy of dxyArray) {
            num += this._searchConnectionOneDirection(row, col, color, dxy[0], dxy[1]);
        }
        //連続した石の数を返す。
        return num;
    }

    //プライベートメソッド。1方向で連続した石の数を数える。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色 dy…y方向移動量（-1,0,1） dx…x方向移動量（-1,0,1）
    _searchConnectionOneDirection(row, col, color, dy, dx) {
        let num = 0;
        //dy, dxで決められた1方向について、同じ色がいくつ連続しているかを確認する。
        while (true) {
            //隣のマスを確認する。
            const next = this._field[row + dy][col + dx];
            //隣マスが同色だったら
            if (next === color) {
                num++; //数をカウント
                row += dy; //基準座標を更新
                col += dx;
                //次のループに向かう。
            }
            //探索終了
            else return num;
        }
    }

    //ターン変更
    _changeTurn() {
        if (this._turn === STONE.FIRST) this._turn = STONE.SECOND;
        else this._turn = STONE.FIRST;
    }
}