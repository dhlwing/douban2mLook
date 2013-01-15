var Notify = function() {};
Notify.prototype.isSupport = function() {
    return !! window.webkitNotifications
},
Notify.prototype.getPermission = function(a) {
    window.webkitNotifications.requestPermission(function() {
        a && a(this.checkPermission())
    })
},
Notify.prototype.checkPermission = function() {
    return window.webkitNotifications.checkPermission() == 0
},
Notify.prototype.show = function(img, title, content) {
    var notify = window.webkitNotifications.createNotification(img, title, content);
    notify.show()
};

function init_background() {
    var a = chrome.app.getDetails(),
    b = a.version;
    //alert(a.version);
    console.log("current version: " + b);
    var c = localStorage.version;
    init_db(),
    window.message_config = {
        message_all: 0,
        message_all_unread: 0,
        message_fav: 0,
        message_fav_unread: 0
    }
    sync_message_number(function(a) {})
}
function init_push() {
    localStorage.getItem("noti_desktop") == null && localStorage.setItem("noti_desktop", "on"),
    localStorage.getItem("noti_sound") == null && localStorage.setItem("noti_sound", "on"),
    localStorage.getItem("last_msg_id") == null && localStorage.setItem("last_msg_id", "0"),
    localStorage.getItem("last_msg_date") == null && localStorage.setItem("last_msg_date", ""),
    localStorage.getItem("unchecked_msg") == null && localStorage.setItem("unchecked_msg", "0"),
    localStorage.getItem("item_location") == null && localStorage.setItem("item_location", "cn;global"),
    localStorage.getItem("noti_cat_18301") == null && localStorage.setItem("noti_cat_18301", "on"),
    localStorage.getItem("message_limit") == null && localStorage.setItem("message_limit", "100"),
    limit_message_db(localStorage.getItem("message_limit")),
    chrome.browserAction.onClicked.addListener(function(a) {
        localStorage.setItem("unchecked_msg", 0),
        chrome.browserAction.setBadgeText({
            text: ""
        }),
        chrome.tabs.create({
            url: "http://www.mlook.mobi"
        },
        function(a) {
            mLookTabId = a.id
        })
    });
    var notify = new Notify;
    notify.getPermission(),
    start_push()
}
function start_push() {
    //console.log("looping"),
    get_message(),
    setTimeout(start_push, 6e4)
}
function get_message(a) {
    $.getJSON("http://www.mlook.mobi/api/client/push",
    function(msg) {
        msg.reverse();
        var b = [],
        noti_desktop = localStorage.getItem("noti_desktop"),
        noti_sound = 'on',
        desktop_time = '30',
        last_msg_id = parseInt(localStorage.getItem("last_msg_id")),
        last_msg_date = localStorage.getItem("last_msg_date"),
        item_location = localStorage.getItem("item_location"),
        i = !1;
        $.each(msg,
        function(a, d) {
            var h = !1,
            lastid = parseInt(d.bookid),
            lasttime = d.builddate;
            if (lasttime != last_msg_date && lastid > last_msg_id) {
                r.length > 0 && (h = !0, console.log("item_default: " + r[0])),
                h && (insert_message_db(d), limit_message_db(localStorage.getItem("message_limit")), c == "on" && (i = !0, setTimeout(function() {
                    b[a] = window.webkitNotifications.createHTMLNotification("notification.html?msg_id=" + j),
                    b[a].show(),
                    //console.log("noti array: " + b.length),
                    setTimeout(function() {
                        b[a].cancel()
                    },
                    desktop_time * 1e3)
                },
                3e3))),
                last_msg_date = lasttime,
                last_msg_id = lastid
            }
        }),
        i && noti_sound == "on" && (sync_message_number(), (new Audio("notify.mp3")).play()),
        localStorage.setItem("last_msg_id", f.toString()),
        localStorage.setItem("last_msg_date", g)
    })
}
function init_db() {
    db = get_db(),
    db.transaction(function(a) {
        a.executeSql("create table if not exists messages(msg_id text, msg_title text, msg_desc text, msg_url text, msg_type text, msg_picurl text, msg_date text, msg_buyurl text, msg_fav int, msg_top int)")
    })
}
function get_db() {
    return window.openDatabase("mLook_db", "", "mLook's message DB", 2097152,
    function(a) {})
}
function del_message(a) {
    db = get_db(),
    db.transaction(function(b) {
        b.executeSql("delete from messages where msg_id=" + a, [],
        function(a, b) {})
    })
}

function sync_message_number(func) {
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("select * from messages", [],
        function(query, result) {
            var allitem = 0,
            unread = 0,
            fav = 0,
            fav_unread = 0;
            for (var h = 0; h < result.rows.length; h++) {
                var row = result.rows.item(h);
                row.msg_fav == 0 ? (allitem++, row.msg_top == 0 && unread++) : (fav++, row.msg_top == 0 && fav_unread++)
            }
            var backPage = chrome.extension.getBackgroundPage();
            backPage.message_config.message_all = allitem,
            backPage.message_config.message_all_unread = unread,
            backPage.message_config.message_fav = fav,
            backPage.message_config.message_fav_unread = fav_unread,
            unread > 0 ? chrome.browserAction.setBadgeText({
                text: unread.toString()
            }) : chrome.browserAction.setBadgeText({
                text: ""
            }),
            func != null && func(j.message_config)
        })
    })
}
function init_popup() {
    $("#all_notify_setread").click(function() {
        db = get_db(),
        db.transaction(function(a) {
            a.executeSql("update messages set msg_top=1 where msg_fav=0", [],
            function(a, b) {
                $("#all_notify_content").fadeOut("fast",
                function() {
                    init_all(),
                    $("#all_notify_content").fadeIn("fast",
                    function() {
                        $("#all_notify_content").css("display", "")
                    })
                })
            })
        })
    }),
    $("#all_notify_remove").click(function() {
        db = get_db(),
        db.transaction(function(a) {
            a.executeSql("delete from messages where msg_fav=0", [],
            function(a, b) {
                $("#all_notify_content").fadeOut("slow",
                function() {
                    $("#all_notify_content").css("display", ""),
                    init_all()
                })
            })
        })
    }),
    $("#fav_notify_setread").click(function() {
        db = get_db(),
        db.transaction(function(a) {
            a.executeSql("update messages set msg_top=1 where msg_fav=1", [],
            function(a, b) {
                $("#fav_notify_content").fadeOut("fast",
                function() {
                    init_fav(),
                    $("#fav_notify_content").fadeIn("fast",
                    function() {
                        $("#fav_notify_content").css("display", "")
                    })
                })
            })
        })
    }),
    $("#fav_notify_remove").click(function() {
        db = get_db(),
        db.transaction(function(a) {
            a.executeSql("delete from messages where msg_fav=1", [],
            function(a, b) {
                $("#fav_notify_content").fadeOut("slow",
                function() {
                    $("#fav_notify_content").css("display", ""),
                    init_fav()
                })
            })
        })
    })
}
function init_all() {
    $("#all_notify").html(""),
    db = get_db(),
    db.transaction(function(a) {
        a.executeSql("select * from messages where msg_fav=0 order by msg_date desc ", [],
        function(a, b) {
            var c = $("#all_notify");
            for (var d = 0; d < b.rows.length; d++) {
                var e = b.rows.item(d),
                f = e.msg_picurl;
                if (f == "" || f == "logo" || f == "blank") f = "smzdm128.png";
                var g = '<div class="row-fluid"><div class="span3"><div style="margin-left:10px;height:80px;width:80px;border:#999 solid 1px;display:table;text-align:center"><div style="height:80px;width:80px;display:table-cell;vertical-align:middle"><img src="' + f + '" style="max-height:80px;max-width:80px;"></div></div></div>';
                g += '<div class="span8"><h4>',
                e.msg_top == 0 && (g += '<span class="badge badge-error">新!</span> '),
                g += e.msg_title + "</h4> <small>" + e.msg_date.substr(0, 19) + "</samll>",
                g += '<p style="margin-top:3px;">',
                g += '<button class="btn-mini btn-info" name="button_detail" detail_url="' + e.msg_url + '" msg_id="' + e.msg_id + '"><i class="icon-search icon-white"></i>详情页面</button> - <button class="btn-mini btn-danger" name="button_buy" buy_url="' + e.msg_buyurl + '" msg_id="' + e.msg_id + '"><i class="icon-shopping-cart icon-white"></i>购买链接</button> - <button class="btn-mini btn-warning" name="button_fav" msg_id="' + e.msg_id + '"><i class="icon-star icon-white"></i>移至收藏</button></p></div></div><hr style="margin:8px 0;">',
                c.append(g)
            }
            sync_message_number(function(a) {
                $("#all_notify_tab").text("所有提醒 (" + a.message_all_unread + "/" + a.message_all + ")")
            }),
            $('button[name="button_detail"]', $("#all_notify")).each(function() {
                var a = $(this);
                a.click(function() {
                    set_message_read(a.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: a.attr("detail_url")
                        })
                    })
                })
            }),
            $('button[name="button_buy"]', $("#all_notify")).each(function() {
                var a = $(this);
                a.click(function() {
                    set_message_read(a.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: a.attr("buy_url")
                        })
                    })
                })
            }),
            $('button[name="button_fav"]', $("#all_notify")).each(function() {
                $(this).click(function() {
                    var a = $(this).parent().parent().parent().parent();
                    a.next().fadeOut(500,
                    function() {
                        a.next().remove()
                    }),
                    a.fadeOut(500,
                    function() {
                        a.remove()
                    }),
                    set_message_fav($(this).attr("msg_id")),
                    init_fav(),
                    sync_message_number(function(a) {
                        $("#all_notify_tab").text("所有提醒 (" + a.message_all_unread + "/" + a.message_all + ")")
                    })
                })
            })
        })
    })
}