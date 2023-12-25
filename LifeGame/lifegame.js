let gen;
let intervalId = null;
const INTERVAL = 500;
$(function(){
    const tbody = $("#field");
    $("form").on("submit", function(){
        console.log("onSubmit");
        createField();
        return false;
    });
    $("#start").on("click", function(){
        console.log("#start onClick");
        if(intervalId) return;
        toggleVisibleButton();
        intervalId = window.setInterval(update, INTERVAL);
    });

    $("#stop").on("click", function(){
        console.log("#stop onClick");
        if (!intervalId) return;
        toggleVisibleButton();
        window.clearInterval(intervalId);
        intervalId = null;
    });

    $("#next").on("click", function(){
        update();
    });
    function toggleVisibleButton() {
        $("button").each(function(){
            const isDisabled = $(this).prop("disabled");
            $(this).prop("disabled", !isDisabled);
        })
    }
    function update() {
        gen.updateGen();
        draw();
    }

    function createField() {
        const width = Number($("#width").val());
        const height = Number($("#height").val());

        gen = new Generation(width, height);

        tbody.empty();
        const trs = [];
        for (let i = 1; i <= height; i++) {
            const tr = $("<tr>");
            for (let j = 1; j <= width; j++) {
                const td = 
                $("<td>")
                .data({
                    "tr" : i,
                    "td" : j,
                })
                .on("click", function(){
                    const {tr, td} = $(this).data();
                    gen.toggle(tr, td);
                    draw();
                });
                
                tr.append(td);
            }
            trs.push(tr);
        }
        tbody.append(trs);
    }

    function draw() {
        const view = gen.getGenView();
        const trs = $("tr");
        for (let i = 0; i < trs.length; i++) {
            const tr = trs.eq(i);
            const tds = $(tr.children());
            for (let j = 0; j < tds.length; j++) {
                const td = tds.eq(j);
                if (view[i][j] === 1) {
                    td.addClass("live");
                } 
                else {
                    td.removeClass("live");
                }
            }
        }
    }
    createField();
});