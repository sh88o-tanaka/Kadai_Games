class ConnectFour {
    static #MIN_PLAYER = 2;
    static #MAX_PLAYER = 4;

    //プライベート定数
    static #STONE = { //石（手番）定義
        NONE: 0,
        WALL: -1,
        playersNumber: Array(ConnectFour.#MAX_PLAYER).fill(0).map((_, i) => i + 1),
    };
    static #SIZE = { //マップサイズ
        WIDTH: 7,
        HEIGHT: 6,
        MIN_WIDTH: 5,
        MIN_HEIGHT: 5,
        MAX_WIDTH: 20,
        MAX_HEIGHT: 20,
    };
    static #GAME_STATE = {   //ゲーム状態
        PENDING: 0,        //続行中
        WIN: 1,            //（いずれかが）勝利
        DRAW: 2            //引き分け
    };

    static #SEARCH_PAIR = [
        [[-1, 0], [1, 0]],     //上下
        [[0, -1], [0, 1]],     //左右
        [[-1, -1], [1, 1]],    //左斜
        [[-1, 1], [1, -1]]     //右斜
    ];
    static #SCORE_WAIT = {
        COM: {
            win: 10_000,
            oneMore: 100,
            wait: 2
        },
        OTHER: {
            win: 1_000,
            oneMore: 60,
            wait: 1
        }
    };
    static #DIFFICULTY = {
        HUMAN: -1,
        EASY: 0,
        NORMAL: 1,
        HARD: 2,
        V_HARD: 3,
    };
    static #CHOICE_WEIGHT = {
        [ConnectFour.#DIFFICULTY.EASY]: (length) => {
            const ar = Array(length).fill(1 / length);
            ar.reduce((a, b, i, arr) => {
                const sum = a + b;
                arr[i] = sum;
                return sum;
            });
            ar[length - 1] = 1;
            return ar;
        }, //選択肢からランダムに選ぶ
        [ConnectFour.#DIFFICULTY.NORMAL]: (length) => { //最善選択肢を40% + α の確率で選び、次善選択肢を10% + αで選ぶ。
            if (length < 2) return [1];
            const array = Array(length).fill(100 / (length * 2));
            array[0] += 40;
            array[1] += 10;
            const ar = array.map((el) => el / 100);
            ar.reduce((a, b, i, arr) => {
                const sum = a + b;
                arr[i] = sum;
                return sum;
            });
            ar[length - 1] = 1;
            return ar;
        },
        [ConnectFour.#DIFFICULTY.HARD]: () => { //最善選択肢を80%で選び、次善選択肢を20%選ぶ。
            const array = Array(2);
            array[0] = 0.8;
            array[1] = array[0] + 0.2;
            return array;
        },
        [ConnectFour.#DIFFICULTY.V_HARD]: () => { //必ず最善を選ぶ。
            const array = [1];
            return array;
        }
    };
    //プライベートインスタンス変数
    #field;
    #turn;
    #playersInfo;
    #gen;
    #numToWin;

    constructor(op = {}) {
        this.#initalCheck(op);

        const initial = {
            width: ConnectFour.#SIZE.WIDTH,
            height: ConnectFour.#SIZE.HEIGHT,
            numToWin: 4,
            playersInfo: [
                { player: ConnectFour.#STONE.playersNumber[0], difficulty: ConnectFour.#DIFFICULTY.HUMAN },
                { player: ConnectFour.#STONE.playersNumber[1], difficulty: ConnectFour.#DIFFICULTY.HUMAN },
            ]
        };
        ConnectFour.mergeOptions(initial, op);

        //各マスの状態を表現するプライベートフィールド。2次元配列
        //表示用フィールドの上下左右に追加で領域を増やし、判定を簡便化する。
        this.#field = [];
        //最上行
        this.#field.push(Array(op.width + 2).fill(ConnectFour.#STONE.WALL));
        //フィールド部分
        this.#field.push(
            ...Array(op.height) //高さ個の要素を作る
                .fill(null) //全てを1度nullで埋める（次のmapメソッドを正しく動作させるために必要）
                .map(() =>
                    //先頭と末尾にWALL、幅分のNONEを格納した配列を返す。
                    [
                        ConnectFour.#STONE.WALL,
                        ...Array(op.width).fill(ConnectFour.#STONE.NONE),
                        ConnectFour.#STONE.WALL
                    ]
                )
        );

        this.#field.push(Array(op.width + 2).fill(ConnectFour.#STONE.WALL));

        this.#turn = ConnectFour.#STONE.playersNumber[0];
        this.#playersInfo = op.playersInfo;
        this.#gen = ConnectFour.#infiniteLoop(this.#playersInfo.length);
        this.#numToWin = op.numToWin;
    }
    //optionと初期値を融合
    static mergeOptions(def, given) {
        if (!given) return def;
        for (const key in def) {
            if (!Object.hasOwn(given, key) || given[key] === undefined) {
                given[key] = def[key];
            }
            else if (given[key] === Object(given[key])) {
                given[key] = ConnectFour.mergeOptions(def[key], given[key]);
            }
        }
        return given;
    }

    //クラス外ではWALLを渡さない。
    static get STONE() {
        return ((NONE, playersNumber) => ({ NONE, playersNumber }))(ConnectFour.#STONE.NONE, ConnectFour.#STONE.playersNumber);
    }

    static get GAME_STATE() { return ConnectFour.#GAME_STATE; }

    static get DIFFICULTY() { return ConnectFour.#DIFFICULTY; }

    //画面の表示に必要な部分の2次元配列だけを返す。
    get field() {
        return this.#field.slice(1, -1).map((el) => el.slice(1, -1));
    }

    get turn() {
        return this.#turn;
    }

    get #nowPlayerInfo() {
        return this.#playersInfo[this.#turn - 1];
    }

    //石を置く。置くことができたらゲーム終了かどうかを判定する。
    //col…列番号
    dropStone(col) {
        //現在の手番をチェック
        const color = this.#turn;
        const f = this.#field;
        const droppable = this.#droppableStone(col);
        if (!droppable) return null;
        else {
            f[droppable[0]][droppable[1]] = color;
            return this.#isGameOver(droppable[0], droppable[1], color);
        }
    }

    //プライベートメソッド。ゲームが終了しているか判定する。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色（＝現在の手番）
    #isGameOver(row, col, color) {
        //探索方向は「上下」「左右」「右斜」「左斜」のペアとする。
        const searchPair = ConnectFour.#SEARCH_PAIR;
        //各探索方向について同じ色でいくつ続いているかを確認し、必要勝利数以上なら勝利
        for (const p of searchPair) {
            const connectionInfo = this.#searchConnection(row, col, color, p, [[row, col]]);
            if (connectionInfo.connection.length >= this.#numToWin)
                return this.#data(ConnectFour.#GAME_STATE.WIN, [row, col], connectionInfo.connection);
        }

        //表示フィールドが全て埋まっているかをチェック（STONE.NONEの要素が0になっていたら全部埋まっている）
        const isDraw = this.field.flat().filter((e) => e === ConnectFour.#STONE.NONE).length === 0;
        //全部埋まっていたら引き分け。
        if (isDraw) return this.#data(ConnectFour.#GAME_STATE.DRAW, [row, col]);

        //ゲーム続行
        this.#changeTurn();
        //もしCOM戦なら、置き場所を探索する。TODO
        let nextDrop = null;
        if (this.#nowPlayerInfo.difficulty !== ConnectFour.#DIFFICULTY.HUMAN) {
            nextDrop = this.#putStoneForCOM();
        }
        return this.#data(ConnectFour.#GAME_STATE.PENDING, [row, col], null , nextDrop);
    }

    //プライベートメソッド。各方向で連続した石の座標を判定する。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色 dxyArray…探索方向のペア initArray…初期値（初期地点の情報など）
    #searchConnection(row, col, color, dxyArray, initArray = []) {

        //探索方向を分解（「上下」なら「上」と「下」）し、それぞれ同色がいくつ続いているかを確認
        const info = {
            connection: initArray,
            nextOfEndPoints: []
        }
        for (const dxy of dxyArray) {
            const i = this.#searchConnectionOneDirection(row, col, color, ...dxy);
            info.connection = info.connection.concat(i.connection);
            info.nextOfEndPoints.push(i.nextOfEndPoint);
        }
        //連続した石の座標を返す。
        return info;
    }

    //プライベートメソッド。1方向で連続した石の座標を数える。
    //row…最後に石を置いた行番号 col…列番号 color…置いた石の色 dy…y方向移動量（-1,0,1） dx…x方向移動量（-1,0,1）
    #searchConnectionOneDirection(row, col, color, dy, dx) {
        let info = {
            connection: [],
            nextOfEndPoint: null,
        };
        //dy, dxで決められた1方向について、同じ色がいくつ連続しているかを確認する。
        while (true) {
            //隣のマスを確認する。
            const next = this.#field[row + dy][col + dx];
            //隣マスが同色だったら
            if (next === color) {
                row += dy; //基準座標を更新
                col += dx;
                info.connection.push([row, col]); //現座標を保存
            }
            //探索終了
            else {
                info.nextOfEndPoint = next;
                return info;
            }
        }
    }
    //ターン変更
    #changeTurn() {
        const value = this.#gen.next().value;
        this.#turn = this.#playersInfo[value].player;
    }

    #initalCheck(op) {
        if (op.width < ConnectFour.#SIZE.MIN_WIDTH)
            throw new Error(`ConnectForField invalid options [width] = ${op.width} : MIN_WIDTH = ${ConnectFour.#SIZE.MIN_WIDTH}`);
        if (op.width > ConnectFour.#SIZE.MAX_WIDTH)
            throw new Error(`ConnectForField invalid options [width] = ${op.width} : MAX_WIDTH = ${ConnectFour.#SIZE.MAX_WIDTH}`);
        if (op.height < ConnectFour.#SIZE.MIN_HEIGHT)
            throw new Error(`ConnectForField invalid options [height] = ${op.height} : MIN_HEIGHT = ${ConnectFour.#SIZE.MIN_HEIGHT}`);
        if (op.height > ConnectFour.#SIZE.MAX_WIDTH)
            throw new Error(`ConnectForField invalid options [height] = ${op.height} : MAX_HEIGHT = ${ConnectFour.#SIZE.MAX_HEIGHT}`);
        if (op.players < 2 || op.players > 4)
            throw new Error(`ConnectForField invalid options [players] = ${op.players} : players valid ${ConnectFour.#MIN_PLAYER} between ${ConnectFour.#MAX_PLAYER}`);
    }

    #putStoneForCOM() {
        /*
        ・置ける座標の算出
        ・各地点にもし石を置いた時、その「有効度」はどれくらいかチェック
        ・「有効度」と「COMの強さ」を加味した「次の置き場所」を判断し、データとして渡す。
         */
        const color = this.#turn;
        const checkCoordinates = this.#checkCoordinates();
        const scores = [];
        //各座標で仮に自分の石を置いたとしたら…？
        for (const c of checkCoordinates) {

            let scoreInfo = {
                point: c,
                score: 0,
            };
            //COM自身が仮置きした場合の情報収集
            this.#scoring(c, color, ConnectFour.#SCORE_WAIT.COM, scoreInfo);
            //ほかプレイヤーが仮置きした場合の情報収集
            const players = this.#playersInfo.filter((el) => el.player !== color).map((el) => el.player);
            for (const player of players) {
                this.#scoring(c, player, ConnectFour.#SCORE_WAIT.OTHER, scoreInfo);
            }
            scores.push(scoreInfo);
        }
        scores.sort((a, b) => {return b.score - a.score});
        const choiceWeight = ConnectFour.#CHOICE_WEIGHT[this.#nowPlayerInfo.difficulty](scores.length);
        return this.#choiceNextDrop(scores, choiceWeight);

    }

    #scoring(c, player, scoreBoard, scoreInfo) {
        for (const dxy of ConnectFour.#SEARCH_PAIR) {
            const connectionInfo = this.#searchConnection(c[0], c[1], player, dxy, [c]);    
            //1,2.自分の勝ちかどうか
            if (connectionInfo.connection.length >= this.#numToWin) scoreInfo.score += scoreBoard.win;
            //3,4.リーチかどうか…置いたときに閉塞区間になっていたらリーチとみなさない
            if (
                connectionInfo.connection.length === this.#numToWin &&
                connectionInfo.nextOfEndPoints.includes(0) //並んだ石の先端どちらかに空きマスがあったら
            )
                scoreInfo.score += scoreBoard.oneMore;
            //5,6.自分の石が何個つながるか
            scoreInfo.score += connectionInfo.connection.length * scoreBoard.wait;
        }
    }
    #choiceNextDrop(scores, choiceWeight) {
        const random = Math.random();
        let index = 0;
        for (let i = 1; i < choiceWeight.length; i++) {
            if(choiceWeight[i - 1] <= random && random < choiceWeight[i]){
                index = i;
                break;
            }
        }
        return scores[index].point;
    }

    #checkCoordinates() {
        const array = [];
        for (let i = 1; i < this.#field[0].length - 1; i++) {
            array.push(this.#droppableStone(i));
        }
        return array.filter((el) => el);
    }
    #droppableStone(col) {
        const f = this.#field;
        //該当する列で、フィールドの1行目がすでに埋まっていたら何もしない。
        if (f[1][col] !== ConnectFour.#STONE.NONE) return null;

        //該当する列で、フィールドの2行目以降にすでに石があったら、その1つ上の行に石を置く。
        for (let i = 2; i < f.length; i++) {
            if (f[i][col] !== ConnectFour.#STONE.NONE) {
                return [i - 1, col];
            }
        }
    }

    #data(state, lastPoint, winPointsArray = null, nextDrop = null) {
        
        const obj = {
            state,
            lastPoint,
            winPointsArray,
            nextDrop,
        }
        return obj;
    }

    static * #infiniteLoop(max) {
        let index = 0;

        while (true) {
            if (index >= max - 1) {
                index = 0;
                yield index;
            }
            else yield ++index;
        }
    }
}