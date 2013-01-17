var bookinfoUrl = "http://www.mlook.mobi/book/info/";
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
function request(paras){ 
    var url = location.href; 
    var paraString = url.substring(url.indexOf("?")+1,url.length).split("&"); 
    var paraObj = {} 
    for (i=0; j=paraString[i]; i++){ 
        paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length); 
    } 
    var returnValue = paraObj[paras.toLowerCase()]; 
    if(typeof(returnValue)=="undefined"){ 
        return 0; 
    }else{ 
        return returnValue; 
    } 
}
function init_options_page() {
    $('div.btn-group[data-toggle-name="noti_switch"]').each(function() {
        var buttonGroup = $(this),
        key = buttonGroup.attr("id"),
        value = localStorage.getItem(key),
        newvalue = buttonGroup.attr("data-default");
        console.log("localStorage: " + key + "= " + value),
        value == null && (localStorage.setItem(key, newvalue), value = newvalue),
        $("button", buttonGroup).each(function() {
            var button = $(this);
            if(button.val() == value){
                button.attr('class','btn btn-primary');
                button.button("toggle");
            } else {
                button.attr('class','btn');
            }
            button.click(function() {
                console.log("radio switch: " + key + " -> " + button.val()),
                localStorage.setItem(key, button.val());
                $("button",buttonGroup).each(function(){
                    $(this).attr('class','btn');
                });
                button.attr('class','btn btn-primary')
            })
        })
    }),
    $("#noti_sound_test").click(function() {
        var button = $(this);
        button.button("loading");
        var audio = new Audio("notify.mp3");
        audio.addEventListener("play",
        function() {
            button.button("loading")
        }),
        audio.addEventListener("ended",
        function() {
            button.button("reset")
        }),
        audio.play()
    }),
    $("#noti_desktop_test").click(function() {
        var a = $(this),
        notify = window.webkitNotifications.createHTMLNotification("notification.html?msg_id=0");
        notify.show();
        var desktop_time = localStorage.getItem("desktop_time");
        setTimeout(function() {
            notify.cancel()
        },
        desktop_time * 1e3)
    });
}
function notifyShow() {
    var a = request("msg_id");
    a == 0 ? ($("#msg_desc").text("mLook精校电子书，分享好的书籍，和朋友一起交流读书心得！"), $("#msg_title").text("mLook"), $("#msg_rate").text("http://www.mlook.mobi"), $("#button_info").click(function() {
        chrome.tabs.create({
            url: 'http://www.mlook.mobi'
        })
    })) : (db = get_db(), db.transaction(function(b) {
        b.executeSql("select * from messages where msg_id=" + a +" order by msg_date desc limit 1", [],
        function(b, c) {
            if (c.rows.length == 1) {
                var d = c.rows.item(0);
                if(d.msg_type == 'book') {
                    d.msg_url == bookinfoUrl+d.msg_id ;
                    var rate = "豆瓣评分：" + d.msg_douban_star;
                } else {
                    d.msg_url == 'http://www.mlook.mobi/api/client/go/'+d.msg_id ;
                    var rate = "mLook精心推荐";
                    
                }
                
                $("#button_info").click(function() {
                    set_message_read(a),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: d.msg_url
                        })
                    })
                });
                $("#msg_title").text(d.msg_title);
                $("#msg_rate").text(rate); 
                $("#msg_desc").text(d.msg_desc);
                if (d.msg_picurl == null || d.msg_picurl == "") d.msg_picurl = "icon.png";
                var e = $("#msg_picurl");
                e.fadeOut("fast",
                function() {
                    e.attr("src", d.msg_picurl),
                    e.fadeIn("fast")
                })
            }
        })
    }))
}

function init_background() {
    var a = chrome.app.getDetails(),
    b = a.version;
    console.log("current version: " + b);
    var c = localStorage.version;
    init_db(),
    window.message_config = {
        message_all: 0,
        message_all_unread: 0,
        message_fav: 0,
        message_fav_unread: 0,
        message_dig: 0,
        message_dig_unread: 0
    }
    sync_message_number(function(a) {});
}
function init_push() {
    localStorage.getItem("noti_desktop") == null && localStorage.setItem("noti_desktop", "on"),
    localStorage.getItem("noti_sound") == null && localStorage.setItem("noti_sound", "on"),
    localStorage.getItem("last_msg_id") == null && localStorage.setItem("last_msg_id", "0"),
    localStorage.getItem("last_dig_id") == null && localStorage.setItem("last_dig_id", "0"),
    localStorage.getItem("last_msg_date") == null && localStorage.setItem("last_msg_date", ""),
    localStorage.getItem("last_dig_date") == null && localStorage.setItem("last_dig_date", ""),
    localStorage.getItem("unchecked_msg") == null && localStorage.setItem("unchecked_msg", "0"),
    localStorage.getItem("desktop_time") == null && localStorage.setItem("desktop_time", "30"),

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
        console.log(msg);
        var b = [],
        noti_desktop = localStorage.getItem("noti_desktop"),
        noti_sound = localStorage.getItem("noti_sound"),
        desktop_time = localStorage.getItem("desktop_time"),

        last_msg_id = parseInt(localStorage.getItem("last_msg_id")),
        last_dig_id = parseInt(localStorage.getItem("last_dig_id")),
        last_msg_date = localStorage.getItem("last_msg_date") ? localStorage.getItem("last_msg_date"):0,
        last_dig_date = localStorage.getItem("last_dig_date") ? localStorage.getItem("last_dig_date"):0,
        i = !1;
        console.log(last_msg_id);
        last_msg_id = last_msg_id ? last_msg_id : 0;
        last_dig_id = last_dig_id ? last_dig_id : 0;
        $.each(msg,
        function(a, d) {
            var h = !1;
            var lastbookid = lastdigid = 0;
            var lasttime = d.builddate;
            if(d.itemtype == 'book') {
                lastbookid = parseInt(d.bookid);
                if (lasttime != last_msg_date && lastbookid > last_msg_id) {
                    (insert_message_db(d), limit_message_db(localStorage.getItem("message_limit")), noti_desktop == "on" && (i = !0, setTimeout(function() {
                        b[a] = window.webkitNotifications.createHTMLNotification("notification.html?msg_id=" + lastbookid),
                        b[a].show(),
                        console.log("noti array: " + b.length),
                        setTimeout(function() {
                            b[a].cancel()
                        },
                        desktop_time * 1e3)
                    },
                    3e3))),
                    last_msg_date = lasttime,
                    last_msg_id = lastbookid
                }
            } else {
                lastdigid = parseInt(d.bookid);
                if (lasttime != last_dig_date && lastdigid > last_dig_id) {
                    (insert_message_db(d), limit_message_db(localStorage.getItem("message_limit")), noti_desktop == "on" && (i = !0, setTimeout(function() {
                        b[a] = window.webkitNotifications.createHTMLNotification("notification.html?msg_id=" + lastdigid),
                        b[a].show(),
                        console.log("noti array: " + b.length),
                        setTimeout(function() {
                            b[a].cancel()
                        },
                        desktop_time * 1e3)
                    },
                    3e3))),
                    last_dig_date = lasttime,
                    last_dig_id = lastdigid
                }
            }
            
        }),
        i && noti_sound == "on" && (sync_message_number(), (new Audio("notify.mp3")).play()),
        localStorage.setItem("last_msg_id", last_msg_id.toString()),
        localStorage.setItem("last_msg_date", last_msg_date);
        localStorage.setItem("last_dig_id", last_dig_id.toString()),
        localStorage.setItem("last_dig_date", last_dig_date)
    })
}
function init_db() {
    db = get_db(),
    db.transaction(function(a) {
        a.executeSql("create table if not exists messages(msg_id text, msg_title text, msg_desc text null, msg_url text null, msg_isbn text null,msg_type text null, msg_picurl text null, msg_date text null, msg_douban_star text null,msg_average_star text null,msg_fav int, msg_top int)")
    })
}
function get_db() {
    return window.openDatabase("mLook_db", "", "mLook's message DB", 2097152,
    function(a) {})
}
function insert_message_db(a) {
    db = get_db();
    db.transaction(function(b) {
        b.executeSql('insert into messages values ("' + a.bookid + '","' + a.bookname + '","' + a.desc + '","' + a.linkurl + '","'+a.isbn +'","' + a.itemtype + '","' + a.convert + '","' + a.builddate + '", "' + a.douban_star +'","'+a.average_star+'",0,0)')
    })
}
function limit_message_db(a) {
    db = get_db(),
    db.transaction(function(b) {
        b.executeSql("delete from messages where msg_id in (select msg_id from messages where msg_fav=0 order by msg_date desc limit " + a + ",100000)")
    })
}
function del_message(a) {
    db = get_db(),
    db.transaction(function(b) {
        b.executeSql("delete from messages where msg_id=" + a, [],
        function(a, b) {})
    })
}
function set_message_read(a) {
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("update messages set msg_top=1 where msg_id=" + a, [],
        function(a, b) {})
    })
}
function set_message_fav(a) {
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("update messages set msg_fav=1 where msg_id=" + a, [],
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
            fav_unread = 0,
            dig = 0,
            dig_unread = 0;
            for (var h = 0; h < result.rows.length; h++) {
                var row = result.rows.item(h);
                if(row.msg_fav == 0) {
                    if(row.msg_type=="dig") {
                        dig++;
                        if(row.msg_top == 0) {
                            dig_unread++;
                            unread++;
                        } 
                    } else {
                        allitem++;
                        row.msg_top == 0 && unread++;
                    }
                } else {
                    if(row.msg_type=="dig") {
                        dig++;
                        if(row.msg_top == 0 ) {
                            dig_unread++;
                            unread++;
                        }
                    } else {
                        fav++;
                        row.msg_top == 0 && fav_unread++;
                    }
                }
            }
            var backPage = chrome.extension.getBackgroundPage();
            backPage.message_config.message_all = allitem,
            backPage.message_config.message_all_unread = unread,
            backPage.message_config.message_fav = fav,
            backPage.message_config.message_fav_unread = fav_unread,
            backPage.message_config.message_dig = dig,
            backPage.message_config.message_dig_unread = dig_unread,
            unread > 0 ? chrome.browserAction.setBadgeText({
                text: unread.toString()
            }) : chrome.browserAction.setBadgeText({
                text: ""
            }),
            func != null && func(backPage.message_config)
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
    }),
    $("#dig_notify_remove").click(function() {
        db = get_db(),
        db.transaction(function(a) {
            a.executeSql("delete from messages where msg_type='dig'", [],
            function(a, b) {
                $("#dig_notify_content").fadeOut("slow",
                function() {
                    $("#dig_notify_content").css("display", ""),
                    init_dig()
                })
            })
        })
    })
}
function init_fav() {
    $("#fav_notify").html(""),
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("select * from messages where msg_fav=1 order by msg_date desc ", [],
        function(query, result) {
            var c = $("#fav_notify"),
            d = 0;
            for (var e = 0; e < result.rows.length; e++) {
                var f = result.rows.item(e),
                g = f.msg_picurl;
                if (g == "" || g == "logo" || g == "blank") g = "icon.png";
                var h = '<div class="row-fluid"><div class="span3"><div style="margin-left:10px;height:80px;width:80px;border:#999 solid 1px;display:table;text-align:center"><div style="height:80px;width:80px;display:table-cell;vertical-align:middle"><img src="' + g + '" style="max-height:133px;max-width:80px;"></div></div></div>';
                h += '<div class="span8"><h4>',
                f.msg_top == 0 && (h += '<span class="badge badge-error">新!</span> ', d++);
                if(f.msg_type == "book") {
                    h += f.msg_title + "</h4> <small>豆瓣评分：" + f.msg_douban_star + "</small>";
                    h += "<br><samll>ISBN:"+f.msg_isbn+"</samll>"
                }
                h += '<p style="margin-top:3px;">',
                h += '<button class="btn-mini btn-info" name="button_detail" detail_url="' + bookinfoUrl+f.msg_id + '" msg_id="' + f.msg_id + '"><i class="icon-search icon-white"></i>详情页面</button>   <button class="btn-mini btn-warning" name="button_buy" buy_url="http://www.amazon.cn/gp/search?ie=UTF8&camp=536&creative=3200&index=books&keywords='+f.msg_title+'&linkCode=ur2&tag=dhlwing-23" msg_id="' + e.msg_id + '"><i class="icon-shopping-cart icon-white"></i>卓越购买</button>  <button class="btn-mini btn-danger" name="button_del" msg_id="' + f.msg_id + '"><i class="icon-remove icon-white"></i>删除</button></p></div></div><hr style="margin:8px 0;">',
                c.append(h)
            }
            sync_message_number(function(a) {
                $("#fav_notify_tab").text("本地收藏 (" + a.message_fav_unread + "/" + a.message_fav + ")")
            }),
            $('button[name="button_detail"]', $("#fav_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("detail_url")
                        })
                    })
                })
            }),
            $('button[name="button_buy"]', $("#fav_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("buy_url")
                        })
                    })
                })
            }),
            $('button[name="button_del"]', $("#fav_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    var b = $(this).parent().parent().parent();
                    b.next().fadeOut(500,
                    function() {
                        b.remove()
                    }),
                    b.fadeOut(500,
                    function() {
                        b.remove()
                    }),
                    del_message(button.attr("msg_id")),
                    sync_message_number(function(a) {
                        $("#fav_notify_tab").text("本地收藏 (" + a.message_fav_unread + "/" + a.message_fav + ")")
                    })
                })
            })
        })
    })
}

function init_dig() {
    $("#dig_notify").html(""),
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("select * from messages where msg_type='dig' order by msg_date desc ", [],
        function(query, result) {
            var c = $("#dig_notify"),
            d = 0;
            for (var e = 0; e < result.rows.length; e++) {
                var f = result.rows.item(e),
                g = f.msg_picurl;
                if (g == "" || g == "logo" || g == "blank") g = "icon.png";
                var h = '<div class="row-fluid"><div class="span3"><div style="margin-left:10px;height:80px;width:80px;border:#999 solid 1px;display:table;text-align:center"><div style="height:80px;width:80px;display:table-cell;vertical-align:middle"><img src="' + g + '" style="max-height:133px;max-width:80px;"></div></div></div>';
                h += '<div class="span8"><h4>',
                f.msg_top == 0 && (h += '<span class="badge badge-error">新!</span> ', d++),
                h += f.msg_title + "</h4> " ,
                h += '<p style="margin-top:3px;">',
                h += '<button class="btn-mini btn-info" name="button_detail" detail_url="' + 'http://www.mlook.mobi/api/client/go/'+f.msg_id + '" msg_id="' + f.msg_id + '"><i class="icon-search icon-white"></i>详情页面</button> - <button class="btn-mini btn-danger" name="button_del" msg_id="' + f.msg_id + '"><i class="icon-remove icon-white"></i>删除</button></p></div></div><hr style="margin:8px 0;">',
                c.append(h)
            }
            sync_message_number(function(a) {
                $("#dig_notify_tab").text("推荐 (" + a.message_dig_unread + "/" + a.message_dig + ")")
            }),
            $('button[name="button_detail"]', $("#dig_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("detail_url")
                        })
                    })
                })
            }),
            $('button[name="button_buy"]', $("#dig_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("buy_url")
                        })
                    })
                })
            }),
            $('button[name="button_del"]', $("#dig_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    var b = $(this).parent().parent().parent();
                    b.next().fadeOut(500,
                    function() {
                        b.remove()
                    }),
                    b.fadeOut(500,
                    function() {
                        b.remove()
                    }),
                    del_message(button.attr("msg_id")),
                    sync_message_number(function(a) {
                        $("#dig_notify_tab").text("推荐 (" + a.message_dig_unread + "/" + a.message_dig + ")")
                    })
                })
            })
        })
    })
}
function init_all() {
    
    $("#all_notify").html(""),
    db = get_db(),
    db.transaction(function(query) {
        query.executeSql("select * from messages where msg_fav=0 and msg_type='book' order by msg_date desc ", [],
        function(query, result) {
            var c = $("#all_notify");
            for (var d = 0; d < result.rows.length; d++) {
                var e = result.rows.item(d),
                f = e.msg_picurl;
                if (f == "" || f == "logo" || f == "blank") f = "icon.png";
                var g = '<div class="row-fluid"><div class="span3"><div style="margin-left:10px;height:80px;width:80px;border:#999 solid 1px;display:table;text-align:center"><div style="height:80px;width:80px;display:table-cell;vertical-align:middle"><img src="' + f + '" style="max-height:133px;max-width:80px;"></div></div></div>';
                g += '<div class="span8"><h4>',
                f.msg_top == 0 && (h += '<span class="badge badge-error">新!</span> ', d++),
                g += e.msg_title + "</h4> <small>豆瓣评分：" + e.msg_douban_star + "</samll>",
                g += "<br><samll>ISBN:"+e.msg_isbn+"</samll>"
                g += '<p style="margin-top:3px;">',
                g += '<button class="btn-mini btn-info" name="button_detail" detail_url="' + bookinfoUrl+e.msg_id + '" msg_id="' + e.msg_id + '"><i class="icon-search icon-white"></i>详情页面</button>   <button class="btn-mini btn-warning" name="button_fav" msg_id="' + e.msg_id + '"><i class="icon-star icon-white"></i>移至收藏</button>  <button class="btn-mini btn-warning" name="button_buy" buy_url="http://www.amazon.cn/gp/search?ie=UTF8&camp=536&creative=3200&index=books&keywords='+e.msg_title+'&linkCode=ur2&tag=dhlwing-23" msg_id="' + e.msg_id + '"><i class="icon-shopping-cart icon-white"></i>卓越购买</button></p></div></div><hr style="margin:8px 0;">',
                c.append(g)
            }
            sync_message_number(function(a) {
                $("#all_notify_tab").text("所有提醒 (" + a.message_all_unread + "/" + a.message_all + ")")
            }),
            $('button[name="button_detail"]', $("#all_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("detail_url")
                        })
                    })
                })
            }),
            $('button[name="button_buy"]', $("#all_notify")).each(function() {
                var button = $(this);
                button.click(function() {
                    set_message_read(button.attr("msg_id")),
                    sync_message_number(function() {
                        chrome.tabs.create({
                            url: button.attr("buy_url")
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
    });
}