/**
 * Vecクラス
 * XY座標を表し、XY座標を1次元要素番号に変換できるクラス。
 */
class Vec {
    /**
     * @constructor
     * @param {number} x X軸座標
     * @param {number} y Y軸座標
     */
    constructor(x, y) {
        /** @type {number} @public */
        this.x = x;
        /** @type {number} @public */
        this.y = y;
    }
    /**
     * xy座標の値から、配列やCSS用の番号を取得する。
     */
    get index() {
        return this.y * LINEUP_PANELS + this.x;
    }
}