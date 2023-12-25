/**
 * Boardクラス
 * マインスイーパーの各Panelを束ねた盤面を表す。
 */
class Board {
    /**
     * @private
     * @static
     * 任意のPanelに対する周囲８マスを計算するのに用いる
     */
    static #dyxs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    /**
     * Boardクラスの初期化
     * @constructor
     * @param {number} width 盤面の幅（マス）
     * @param {number} height 盤面の高さ（マス）
     * @param {jQuery<HTMLElement>} root この盤面を挿入する親要素
     * @param {number=} mines 盤面内の地雷数
     */
    constructor(width, height, root, mines = 10) {
        /** 盤面幅 @type {number} */
        this._width = width;
        /** 盤面高さ @type {number} */
        this._height = height;
        /** 
         * 盤面
         * 計算簡略化のため、必要な盤面に対して周囲1マス分多く要素を取得している
         * @type {Panel[][]} */
        this._board = Array(height + 2).fill(null).map((_, y) => {
            return Array(width + 2).fill(null).map((_, x) => {
                if (y === 0 || x === 0 || y === height + 1 || x === width + 1) {
                    return new Panel(y, x, -1);
                }
                else {
                    return new Panel(y, x);
                }
            })
        });
        /** この盤面を挿入する親要素 @type {jQuery<HTMLElement>} */
        this._root = root;
        /** この盤面を表示するHTML要素 */
        this._element = this._createBoard();
        /** ゲームが開始しているかどうか？ @type {boolean} */
        this._isStart = false;
        /** ゲームが終了しているかどうか？ @type {boolean} */
        this._isGameOver = false;
        /** 全体の地雷数 @type {number} */
        this._mines = mines;
        /** 立てられるフラグ数 @type {number} */
        this._remainFlags = mines;

    }
    get element() { return this._element; }
    get remainFlags() { return this._remainFlags; }

    /**
     * 盤面のHTML要素を作成し、イベントを登録する。
     * @returns {jQuery<HTMLElement>}
     */
    _createBoard() {
        //基準となるtbody要素を作る
        const tbody = $("<tbody id=\"board\">");
        //tr要素を配列で保持するため、その器を定義する
        const trs = [];
        //要素番号0と末尾の要素は「壁」なので、それ以外の要素に対して処理する
        for (let y = 1; y < this._height + 1; y++) {
            //td要素を配列にするため、繰り返し１回毎に空の配列を定義。
            const tds = [];
            ///要素番号0と末尾の要素は「壁」なので、それ以外の要素に対して処理する/
            for (let x = 1; x < this._width + 1; x++) {
                //boardプロパティのyx座標から、td要素を取り出して配列に入れる。
                tds.push(this._board[y][x].element);
            }
            //td要素配列をtr要素に入れ、そのtrを配列に入れておく。
            trs.push($("<tr>").append(tds));
        }
        //tbody要素（HTML）にtr要素群を挿入する。
        //さらにtbody要素にJavaScriptのデータとして、Boardオブジェクトを紐付ける。
        //紐づけておくことで、イベントが発生した時にBoardオブジェクトを操作できるようになる。
        tbody.append(trs).data({ "board": this });

        //左クリック時の動作
        tbody.on("click", function (e) {
            //紐づけておいたBoardオブジェクトを取り出す。
            /** @type {Board} */
            const b = $(this).data("board");
            //すでにゲーム終了フラグが立っていたら何もしない。
            if (b.isGameOver) return;

            //クリックされたtd要素を取り出し、それと紐づいたPanelオブジェクトを取り出す。
            /** @type {Panel} */
            const panel = $(e.target).data("panel");
            if (!panel) return;
            //クリックされたPanelオブジェクトのyx座標を取り出す。
            const yx = [panel.y, panel.x];

            //ゲームがまだ開始していない状態で初めてのクリックだったら（★）
            if (!b._isStart) {
                //地雷を置く座標を必要なだけ、配列として取得する。
                const mines = b._selectMinesXY(b._mines, yx);
                //その座標にあるPanelオブジェクトに地雷であることを知らせる。
                for (let [y, x] of mines) {
                    b._board[y][x].isMine = true;
                }
                //全てのPanelオブジェクトへ、それぞれのPanelの周囲の地雷数を計算して知らせる
                for (let y = 1; y < b._height + 1; y++) {
                    for (let x = 1; x < b._width + 1; x++) {
                        b._board[y][x].aroundMines = b._searchAroundMines(y, x, Board.#dyxs, b);
                    }
                }
                //ゲーム開始フラグを立てる
                b._isStart = true;
                //ゲーム開始イベントを発行
                b._root.trigger(GAMESTART);
            }
            //（★）ここまで---------------------

            let result;
            //クリックされたパネルの左クリック動作を行う。
            if (result = panel.leftClick()) {
                //その結果をつかって、ゲーム終了判定を行う。
                b._gameOverCheck(result, ...yx);
            }
        });

        //右クリック時の動作
        tbody.on("contextmenu", function (e) {
            //紐づけておいたBoardオブジェクトを取り出す。
            /** @type {Board} */
            const b = $(this).data("board");
            //すでにゲーム終了フラグが立っていたら何もしない。
            if (b.isGameOver) return false;

            //クリックされたtd要素を取り出し、それと紐づいたPanelオブジェクトを取り出す。
            /** @type {Panel} */
            const panel = $(e.target).data("panel");
            if (!panel) return false;
            //そのパネルの右クリック動作を実行する。
            panel.rightClick();
            //残り旗数を更新する。
            b._remainFlags = b._mines - b._board.flat().filter(p => p.isFlag).length;
            //残り旗数が更新されたイベントを発行
            b._root.trigger(FLAGUPDATE);

            //右クリックメニューの表示を抑止する。
            return false;
        });

        //ダブルクリック時の動作
        tbody.on("dblclick", function (e) {
            //紐づけておいたBoardオブジェクトを取り出す。
            /** @type {Board} */
            const b = $(this).data("board");
            //すでにゲーム終了フラグが立っていたら何もしない。
            if (b.isGameOver) return;

            //クリックされたtd要素を取り出し、それと紐づいたPanelオブジェクトを取り出す。
            /** @type {Panel} */
            const panel = $(e.target).data("panel");
            if (!panel) return;
            //クリックされたパネルのyx座標を取得する。
            const [y, x] = [panel.y, panel.x];
            let aroundFlags = 0;
            //クリックされたパネルの周囲8マスに、旗がいくつあるか数える
            for (const [dy, dx] of Board.#dyxs) {
                if (b._board[y + dy][x + dx].isFlag) aroundFlags++;
            }
            //クリックされたパネルの数値＝旗の数だったら、周囲8マスの左クリック動作を実行する。
            if (panel.aroundMines === aroundFlags) {
                for (const [dy, dx] of Board.#dyxs) {
                    const [Y, X] = [y + dy, x + dx]
                    let result;
                    if (result = b._board[Y][X].leftClick()) {
                        //ゲーム終了判定を実行する。
                        b._gameOverCheck(result, Y, X);
                    }
                }
            }
        });

        return tbody;
    }

    /** ゲームをクリアできたかどうか */
    get isGameClear() {
        //盤面内の全てのパネルに対して、isOpenがtrueになっていたらゲームクリア
        const result = this._board.flat().filter(p => !p.isOpen).length === 0;
        return result;
    }

    /** ゲームオーバー、またはゲームクリアであるかを確認し、イベントを発行する */
    _gameOverCheck(result, y, x) {
        //ゲーム終了時に行う処理（関数）
        const gameOver = (isShowAnswer, trigger) => {
            //答えを表示する処理
            if (isShowAnswer) this._board.flat().forEach(p => p.showAnswer());

            this._isGameOver = true;
            //ゲームオーバー、またはゲームクリアのイベントを発行する
            this._root.trigger(trigger);
        }

        //地雷を開けたらゲームオーバー
        if (result.isMine) {
            gameOver(true, GAMEOVER);
        }
        //空白パネルを開いたら隣接パネルを再帰的に全て開けていく
        else if (result.aroundMines === 0) {
            this._openBlankPanel(y, x);
        }

        //空白パネルの隣接を全て開けてからゲームクリア判定
        if (this.isGameClear) {
            gameOver(false, GAMECLEAR);
        }
    }

    /**
     * 周囲に地雷がない空白パネルを開いた時、周囲のパネルをすべて開く
     * 再帰的に呼び出される。
     * @param {number} y y座標
     * @param {number} x x座標
     */
    _openBlankPanel(y, x) {
        for (let [dy, dx] of Board.#dyxs) {
            const Y = y + dy;
            const X = x + dx;
            const p = this._board[Y][X];
            //調べたパネルが「壁」だったら処理をスキップ
            if (p.aroundMines < 0) continue;
            //左クリックイベントを実施し、その結果空白パネルを開いていたら再帰呼び出しを行う。
            const result = p.leftClick();
            if (result && result.aroundMines === 0) {
                this._openBlankPanel(Y, X);
            }
        }
    }

    /**
     * 任意のPanelの周囲8マスに、地雷がいくつあるかを探索する。
     * @param {number} y y座標
     * @param {number} x x座標
     * @returns {number} 地雷の数（0～8）
     */
    _searchAroundMines(y, x) {
        //そのパネルが地雷だったら-1としておく。
        if (this._board[y][x].isMine) return -1;
        let mines = 0;
        //周囲8マスのisMineを調べ、その総和を計算する。
        for (let [dy, dx] of Board.#dyxs) {
            if (this._board[y + dy][x + dx].isMine) mines++;
        }
        return mines;
    }

    /**
     * 地雷を設置するyx座標を選択し、配列を作成する。
     * @param {number} count 地雷の設置数
     * @param {number[]} exclude 除外するyx座標。最初にクリックした座標
     * @returns {number[][]} 地雷を設置するyx座標の配列
     */
    _selectMinesXY(count, exclude) {
        //XとYの座標をそれぞれ配列にしておく。先頭には除外するX座標、Y座標を入れておく。
        const Xs = [exclude[1]];
        const Ys = [exclude[0]];
        //座標の配列が地雷の設置数以下の間続ける。
        loop: while (Ys.length < count + 1) {
            //許された数値の範囲でランダムに２つの数値を取得する。
            const [y, x] = [this._random(1, this._height), this._random(1, this._width)];
            //yの値がY座標配列の中に含まれているかをチェック
            const checkY = Ys.map((Y, i) => Y === y ? i : false).filter(b => b !== false);
            //yの値がY座標配列の中に含まれていたら、xの値がX座標配列内にあるかをチェック
            //両方にマッチした場合は「重複」であると言えるので、ここで中断してループの最初に戻る。
            for (let cY of checkY) {
                if (Xs[cY] === x) continue loop;
            }
            //重複ではなかったのでY座標配列、X座標配列に記録する。
            Ys.push(y);
            Xs.push(x);
        }
        //Y座標配列とX座標配列を結合し、[y,x]の組み合わせで２次元配列にする。
        //このとき、先頭は「除外するyx座標」だったので、これを取り除いておく。
        const YX = Ys.map((y, i) => [y, Xs[i]]).slice(1);
        return YX;
    }
    /**
     * from～toまでの範囲で乱数を取得する。
     * @param {number} from 
     * @param {number} to 
     * @returns {number}
     */
    _random(from, to) {
        return Math.floor(Math.random() * (to + 1 - from) + from);
    }
}