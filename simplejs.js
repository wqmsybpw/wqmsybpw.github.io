var mode, css, all_p, all_img, toc, folded;
var simple_css = "/simplestyle.css";
var keywds = ["定义", "定理", "引理", "命题", "性质", "证明", "例", "注", "记号", "引用"];
var keywds_parttern = /[ ]?(定义|定理|引理|命题|性质|推论|证明|例|注|记号){1,2}[:：\s\d\(（]+/;
var light_theme = "body {font-size:18px;margin:0px 16% 0px 16%;background:linear-gradient(to right,#bfe6ba,#fff,#fff,#fff,#fff,#fff,#fff,#bfe6ba);scrollbar-color: #6cf #fff;}";
var dark_theme = "body {font-size:18px;margin:0px 16%;background:linear-gradient(to right,grey,#000,#000,#000,#000,#000,#000,grey);color:white;scrollbar-color: #fff #000;}";
var light_theme_loc = "background-color:white;color:black;";
var dark_theme_loc = "background-color:grey;color:white;";
var light_animation = "notice 2.5s";
var dark_animation = "notice2 2.5s";

function simpleinit() {
    add_button();
    add_simplecss();
    init_var(); //Initialize global variables
    window.onscroll = check_top;
    generate_toc(); //Table of Contents
}

function add_button() {
    let btn1 = document.createElement("button");
    btn1.id = "ch";
    btn1.onclick = change_theme;
    btn1.innerText = "明/暗";
    let btn2 = document.createElement("button");
    btn2.id = "Btop";
    btn2.onclick = go_top;
    btn2.innerText = "Top";
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);
}

function add_simplecss() {
    let sim_css = document.createElement("link");
    sim_css.setAttribute("rel", "stylesheet");
    sim_css.setAttribute("href", simple_css);
    sim_css.setAttribute("crossorigin", "anonymous");
    document.head.appendChild(sim_css);
}

function init_var() {
    mode = 1;
    folded = 0;
    all_p = document.getElementsByTagName("p");
    all_img = document.getElementsByTagName("img");
    css = Array.from(document.styleSheets).slice(-1)[0];
}

function check_top() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("Btop").style.display = "block";
    } else {
        document.getElementById("Btop").style.display = "none";
    }
}

function go_top() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function change_theme() {
    if (!mode) {
        css.deleteRule(0);
        css.insertRule(light_theme, 0);
        Array.from(document.getElementsByTagName("button"))
            .map(i => i.style = light_theme_loc);
        Array.from(document.getElementsByTagName("div"))
            .map(i => i.style = light_theme_loc);
    } else {
        css.deleteRule(0);
        css.insertRule(dark_theme, 0);
        Array.from(document.getElementsByTagName("button"))
            .map(i => i.style = dark_theme_loc);
        Array.from(document.getElementsByTagName("div"))
            .map(i => i.style = dark_theme_loc);
    }
    mode ^= 1;
    window.onscroll();
    if (folded) {
        toc.style.maxHeight = "20px";
        toc.style.overflowY = "hidden";
    }
}

function generate_toc() {
    toc = document.createElement("div");
    toc.className = "toc";
    document.body.appendChild(toc);

    let title = document.createElement("a");
    title.innerText = "目录";
    title.id = "toc_title";
    title.onclick = fold_toc;
    toc.appendChild(title);
    toc.appendChild(document.createElement("br"));

    let lst = keywds.map(_ => new Array());
    for (let i = 0; i < all_p.length; i++) {
        let t = all_p[i].innerText.match(keywds_parttern);
        if (t !== null) {
            lst[keywds.indexOf(t[1])].push(i);
        }
    }

    Array.from({
        length: lst.length
    }, (_, i) => {
        let cnt = 1;
        lst[i].map(k => add_link(i, k, cnt++, "p"));
    });

    Array.from({
        length: all_img.length
    }, (_, i) => {
        let cnt = 1;
        add_link(keywds.indexOf("引用"), i, cnt++, "img");
    });
}

function add_link(index, no, cnt, type) {
    let link = document.createElement("a");
    link.innerText = keywds[index] + cnt;
    link.className = "lk";
    link.onclick = function () {
        jumpto(no, type);
    }
    toc.appendChild(link);
    toc.appendChild(document.createElement("br"));
}

function jumpto(no, type) {
    let elms = (type === "p" ? all_p : all_img);
    elms[no].scrollIntoView({
        block: "center",
        inline: "center"
    });
    elms[no].style.animation = (mode ? light_animation : dark_animation);
    elms[no].addEventListener("animationend", function () {
        elms[no].style.animation = "";
    });
}

function fold_toc() {
    folded ^= 1;
    Array.from(toc.getElementsByClassName("lk"))
        .map(link => link.style.display = (link.style.display === "none" ? "" : "none"));
    toc.style.maxHeight = (toc.style.maxHeight === "20px" ? "300px" : "20px");
    toc.style.overflowY = (toc.style.overflowY === "hidden" ? "scroll" : "hidden");
}