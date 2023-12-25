<?php
/**
 * スライドパズルに使用可能な画像の名称リスト（相対パス）を返却するJSONレスポンス
 * 画像の使用可能条件は以下の通り。
 * ・JPEGファイルまたはPNGファイルであること。
 * ・imgフォルダ内にパズル用画像、img/thumbnail内にそのサムネイル画像を用意すること。かつファイル名を同一とすること。
 * ・パズル用画像は 1000px以下の正方形の画像であること。（width === heightかつ1000px以下ならどの大きさでも良い）
 * ・サムネイル画像は 100*100px の画像であること。
 * またGETリクエストにてパラメータ「default」を受け付ける。その名称を含む画像は送信リストから除外する。受け付ける文字列は1つ。
 * 
 * レスポンス：JSON（Object）
 * プロパティ
 *   thumbnail : サムネイル画像の相対パスを含む配列
 *   images : パズル用画像の相対パスを含む配列
 */


/** 許可するMIMEタイプ */
$APPROVAL_MIME_TYPE = ["image/png", "image/jpeg"];
/** 許可する拡張子 */
$APPROVAL_EXTENSION = [".png", ".jpeg", ".jpg"];
/** 許可するサムネイル画像の縦横幅（共通、単位px）*/
$APPROVAL_IMAGE_THUMBNAIL_PX = 100;
/** 許可するパズル用画像の縦横幅（共通、単位px）*/
$APPROVAL_IMAGE_PX = 1000;

/** 除外するファイル名 */
$exclusionFileName = isset($_GET["exclude"]) ? $_GET["exclude"] : "";
/** 相対パスリスト */
$files = glob("img/*.*");

/** パズル用画像の適合ファイルリストを作成 */
$collectFiles = imageFileCheck($files, $APPROVAL_MIME_TYPE, $APPROVAL_EXTENSION, ["maxImagePx" => $APPROVAL_IMAGE_PX]);

//適合ファイルリストから除外ファイル名を持つファイルを取り除く
foreach($collectFiles as $key => $value) {
    if($exclusionFileName !== "" && strpos($collectFiles[$key], $exclusionFileName) !== false) {
        $collectFiles[$key] = "";
    }
    else {
        //パズル用画像の合格リストから、サムネイル画像検証用のリストを作成
        $collectFiles[$key] = str_replace("img/", "img/thumbnail/", $value);
    }
}

/** 更にサムネイル画像の適合ファイルリストを作成 */
$collectThumbnailFiles = imageFileCheck($collectFiles, $APPROVAL_MIME_TYPE, $APPROVAL_EXTENSION, ["approvalImagePx" => $APPROVAL_IMAGE_THUMBNAIL_PX]);
$finalCollectFiles = [];

//サムネイル画像の適合ファイルリストからパズル用画像の相対パスを再度逆算し、最終結果とする。
foreach($collectThumbnailFiles as $key => $value) {
    array_push($finalCollectFiles, str_replace("/thumbnail", "", $value));
}

//JSON用配列の作成
$json = [
    "thumbnails" => $collectThumbnailFiles,
    "images" => $finalCollectFiles,
];

responseJSON(json_encode($json));

//optionの初期化用関数
function initOption($options, $name, $init) {
    return isset($options[$name]) ? $options[$name] : $init;
}

/**
 * 相対パスの配列から、条件に適合する要素のみを抽出する。
 * $array …　画像の相対パスを含む配列
 * $approvalMimeType … 許可するMIMEタイプ文字列を含む配列
 * $approvalExtension … 許可する拡張子文字列を含む配列
 * $options … 【任意】追加可能な設定値。追加可能なオプション名（連想配列キー）は以下の通り。
 *     "approvalImagePx" … 許可する画像の縦横幅（共通）数値
 *     "minImagePx" … 画像サイズの最小値。デフォルトは1
 *     "maxImagePx" … 画像サイズの最大値。デフォルトはPHP_INT_MAX
 * 戻り値 $result $array内で条件に適合した画像の相対パスを含む配列
 */
function imageFileCheck($array, $approvalMimeType, $approvalExtension, $options = []) {

    $approvalImagePx = initOption($options, "approvalImagePx", false);
    $minImagePx = initOption($options, "minImagePx", 1);
    $maxImagePx = initOption($options, "maxImagePx", PHP_INT_MAX);

    //結果を入れる配列
    $result = [];
    //Warning以下を無視する。（不正な値を持つ画像を検知した場合にレポートを無視するため）
    $errorReportingLevel = error_reporting();
    error_reporting(E_ERROR);

    foreach($array as $key => $value) {
        //ファイル名チェック
        if(!$value) continue;
        //拡張子チェック
        $isValidExtension = false;
        foreach ($approvalExtension as $k => $v) {
            if (strpos($value, $v) !== false) {
                $isValidExtension = true;
                break;
            }
        }
        if(!$isValidExtension) continue;
        //MIMEタイプチェック
        if(array_search(mime_content_type($value), $approvalMimeType) === false) continue;
        //画像サイズ取得
        $imageSize = getimagesize($value);
        if($imageSize === false) continue;
        //画像サイズに指定があればそのチェック
        if ($approvalImagePx !== false) {
            if($imageSize[0] !== $approvalImagePx || $imageSize[1] !== $approvalImagePx) continue;    
        }
        //画像サイズに指定がない場合は正方形かどうかチェック
        else {
            if($imageSize[0] !== $imageSize[1]) continue;
        }
        //画像サイズ境界値のチェック
        if($imageSize[0] < $minImagePx || $imageSize[0] > $maxImagePx) continue;
    
        //チェックを全部クリアした値を結果配列に入れる
        array_push($result, $value);
    }

    //エラー報告レベルをもとに戻す
    error_reporting($errorReportingLevel);
    //チェックを通過した値の配列を呼び出し元に返す
    return $result;
}

/**
 * JSONを送信する。
 * $json … json_encodeしたオブジェクトの文字列
 */
function responseJSON($json) {
    //JSONを返す旨をレスポンスヘッダにセット
    header("Content-Type: application/json; charset=utf-8");

    //JSON文字列を出力＝ブラウザへ送信
    echo($json);
}