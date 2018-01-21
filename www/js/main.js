var appKey    = "0421a03ce2158bfce26e33c0fc4b16d751f6aef377b3c18eddad5d2b32f7b81a";
var clientKey = "1b5c54952d7a75b06982ea941848ab3fb0aa5a11631e3726f41c9bcabb04a8a3";
var ncmb = new NCMB(appKey, clientKey);

var optionTime = {
    twentyFour: true
};

$(function() {
    init();
    $("#getTotal").click(getTotal);
    $("#refresh_question").click(refreshQuestion);
    $("#change").click(changeQuestion);
    $("#changeGPS").click(changeGPS);
    $("#selectQ").change(displaySentence);
    $("#reset").click(reset);
    $("#titleChange").click(titleChange);
    $("#startstop").click(startstop);
    $("#startTime").wickedpicker(optionTime);
    $("#startTimeOn").click(startTimeOn);
    $("#startTimeFlip").change(timeOnOff);
    $("#stopTime").wickedpicker(optionTime);
    $("#stopTimeOn").click(stopTimeOn);
    $("#stopTimeFlip").change(stopOnOff);
    $("#rankonoff").change(rankonoff);
    tableRefresh();
});

function init() {
    var Title = ncmb.DataStore("Title");
    var Start = ncmb.DataStore("Start");
    var Rank = ncmb.DataStore("Rank");

    Title.fetchAll()
         .then(function(result) {
             $("#titleOld").html(result[0].title);
         });
         
    Start.fetchAll()
         .then(function(result) {
             if (result[0].start) {
                 $("#stampState").html("スタンプラリー稼働中");
             } else {
                 $("#stampState").html("スタンプラリー停止中");
             }
             $("#startTimeFlip").val(result[0].onoff).flipswitch("refresh");
             $("#stopTimeFlip").val(result[0].stoponoff).flipswitch("refresh");
         });
    
    Rank.fetchAll()
        .then(function(result) {
            $("#nowRank").html("現在は「 " + result[0].rank + " 位」まで確定しています");
            $("#rankonoff").val(result[0].onoff).flipswitch("refresh");
         });
}

/*   ユーザーのクリア状況をサーバーから取得・表示   */
function getTotal() {
    var Clear = ncmb.DataStore("Clear");
    Clear.order("num", false)
         .fetchAll()
         .then(function(result) {
            for (var i = 1; i <= 7; i++) {
                $("#total" + i).html("クリア人数: " + result[i-1].total + "人");
            }
         });
}

/*   タイトルを変更する   */
function titleChange() {
    var Title = ncmb.DataStore("Title");
    
    Title.fetchAll()
         .then(function(result) {
             result[0].set("title", $("#titleNew").val())
                      .update();
             $("#titleOld").html($("#titleNew").val());
             alert("タイトルの変更が完了しました。");
             $("#titleNew").val("");
         });
}

/*   現在の問題文をサーバーから取得・表示   */
function refreshQuestion() {
    var Question = ncmb.DataStore("Question");
    
    Question.order("num", false)
        .fetchAll()
        .then(function(result) {
            for (var i=1; i<=7; i++) {
                $("#question" + i).html(result[i-1].sentence);
            }
        });
}

/*   問題変更画面で選択した問題の現在の問題文を表示   */
function displaySentence() {
    var Question = ncmb.DataStore("Question");
    var Qnum = $("#selectQ").val();
    
    if (!parseInt(Qnum, 10)) {
        $("#oldSentence").html("");
    } else {
        Question.equalTo("num", parseInt(Qnum, 10))
            .fetchAll()
            .then(function(result) {
                $("#oldSentence").html(result[0].sentence);
            })
            .catch(function(err){
               alert(err);
            });
    }
}

/*   サーバー上の問題文を変更   */
function changeQuestion() {
    var Question = ncmb.DataStore("Question");
    var Qnum = $("#selectQ").val();
    var sentenceNew = $("#sentenceQ").val();

    if (!parseInt(Qnum, 10)) {
        alert("問題が選択されていません");
    } else {
        Question.equalTo("num", parseInt(Qnum, 10))
            .fetchAll()
            .then(function(result) {
                result[0].set("sentence", sentenceNew)
                         .update();
                $("#oldSentence").html(sentenceNew);
                alert("更新完了");
                $("#sentenceQ").val("");
            })
            .catch(function(err){
               alert(err);
            });
    }
}

/*   現在位置を選択した問題の位置情報に設定する   */
function changeGPS() { 
    var onSuccess = function(position) {
        var Point = ncmb.DataStore("Point");
        var Qnum = parseInt($("#selectQ").val(), 10);
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        
        if (!Qnum) {
            alert("問題が選択されていません");
        } else {
            Point.equalTo("Num", Qnum)
                .fetchAll()
                .then(function(result) {
                    result[0].set("latitude", latitude)
                             .set("longitude", longitude)
                             .update();
                    alert("latitude: " + latitude + "\n" +
                          "longitude: " + longitude + "\n" + "設定完了");
            });
        }
    };

    var onError = function(error){
        alert("現在位置を取得できませんでした");
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function reset() {
    var Clear = ncmb.DataStore("Clear");
    
    var yesno = confirm("本当にリセットしてもいいですか？");
    if (yesno == true) {
        Clear.order("num", true)
             .fetchAll()
             .then(function(result) {
                 for (var i = 1; i <= 7; i++) {
                     result[i-1].set("total", 0)
                                .update();
                 }
             });
        alert("リセット完了");
    }
}

/*   スタンプラリーの開始/停止切り替え   */
function startstop() {
    var Start = ncmb.DataStore("Start");

    Start.fetchAll()
         .then(function(result) {
             if (result[0].start) {
                 result[0].set("start", 0)
                          .update();
                 $("#stampState").html("スタンプラリー停止中");
                 alert("スタンプラリーを停止しました");
             } else {
                 result[0].set("start", 1)
                          .update();
                 $("#stampState").html("スタンプラリー稼働中");
                 alert("スタンプラリーを開始しました");
             }
         });
}

/*   スタンプラリー時限スタートOn/Off設定   */
function timeOnOff() {
    var Start = ncmb.DataStore("Start");
    var OnOff = parseInt($("#startTimeFlip").val(), 10);
    
    Start.fetchAll()
         .then(function(result) {
             result[0].set("onoff", OnOff)
                      .update();
         });
}

/*   スタンプラリーの開始時刻を設定   */
function startTimeOn() {
    var Start = ncmb.DataStore("Start");
    var setTime = $("#startTime").val();
    
    Start.fetchAll()
         .then(function(result) {
             result[0].set("time", setTime)
                      .set("start", 0)
                      .update();
             $("#stampState").html("スタンプラリー停止中");
             alert("開始時刻の設定完了");
             var startTime = setInterval(function() {
                 var now = new Date();
                 var h = now.getHours();
                 var m = now.getMinutes();
                 var nowTime = (h + " : " + m);
                 if (setTime == nowTime) {
                     result[0].set("start", 1)
                              .update();
                     $("#stampState").html("スタンプラリー稼働中");
                     alert("スタンプラリーを開始します");
                     clearInterval(startTime);
                 }
             }, 1000);
         });
}

function stopTimeOn() {
    var Start = ncmb.DataStore("Start");
    var setTime = $("#stopTime").val();
    
    Start.fetchAll()
         .then(function(result) {
             result[0].set("stoptime", setTime)
                      .update();
             alert("終了時刻の設定完了");
         });
}

function stopOnOff() {
    var Start = ncmb.DataStore("Start");
    var OnOff = parseInt($("#stopTimeFlip").val(), 10);
    
    Start.fetchAll()
         .then(function(result) {
             result[0].set("stoponoff", OnOff)
                      .update();
         });
}

function tableRefresh() {
    var Title = ncmb.DataStore("Title");
    var Start = ncmb.DataStore("Start");
    //alert("in fc");
    /*   タイトルの取得   */
    /*
    Title.fetchAll()
         .then(function(result) {
             $("#nowStateTable tbody td:eq(0)").html(result[0].title);
         });
    */
    /*   時間関係の取得   */
    /*
    Start.fetchAll()
         .then(function(result) {
             if (result[0].start) {
                 $("#tableState").html("稼働中");
             } else {
                 $("#tableState").html("停止中");
             }
             
         });
    */
}

function rankonoff() {
    var Rank = ncmb.DataStore("Rank");
    var OnOff = parseInt($("#rankonoff").val(), 10);
    
    Rank.fetchAll()
        .then(function(result) {
            result[0].set("onoff", OnOff)
                     .set("rank",0)
                     .update();
         });
}