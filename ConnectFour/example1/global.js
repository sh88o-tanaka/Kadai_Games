//グローバル定数
const STONE = { //石（手番）定義
    NONE: 0,
    FIRST: 1,
    SECOND: 2,
    WALL: 3,
};
const GAME_STATE = {   //ゲーム状態
    PENDING: 0,        //続行中
    WIN: 1,            //（いずれかが）勝利
    DRAW: 2            //引き分け
};

const SIZE = { //マップサイズ
    WIDTH: 7,
    HEIGHT: 6
};