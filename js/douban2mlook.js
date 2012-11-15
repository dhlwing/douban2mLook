function ajaxget(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    return xhr.responseText;
}

function getQueryUrl(query) {
    //data is book title
    var timestamp = new Date().getTime();
    var url = "http://www.mlook.mobi/api/search?q={{query}}&limit=1&f=douban&timestamp="+timestamp;
    url = url.replace("{{query}}", query);
    return url;
}

function getBookUrl(id) {
    return "http://www.mlook.mobi/book/info/"+id;
}

function getButton(url,dbBookUrl) {
    var btn;
    if (url != '') {
        btn = '<a href="'+url+'?rel=doubanbook2mlook"  title="点击去 www.mlook.mobi 下载电子版" style="float:left;display: inline-block;background: #33A057;border: 1px solid #2F7B4B;color: white;padding: 1px 10px;border-radius:3px;margin-right: 8px;" target="_blank">mLook download</a>';
    }
    else {
        btn = '<a href="http://www.mlook.mobi/book/upload/new_from_douban?title='+ query +'&rel=doubanbook2mlook&url='+dbBookUrl.toString()+'" title="mLook 没有找到书籍的电子版，如果你有，可以点击创建书籍" style="float:left;display: inline-block;background: #8D37C3;border: 1px solid #8D37C3;color: white;padding: 1px 10px;border-radius:3px;margin-right: 8px;" target="_blank">添加到mLook</a>';
    }
    return btn;
}

function handleResult(content,dbBookUrl) {
    if(content != 'false' && content != '[]') {
        eval('info = '+content);
        var bookname = info.bookname;
        var id = info.bookid;
        //if (bookname == query) {}
        var downloadUrl = getBookUrl(id);
        return getButton(downloadUrl);
    } else {
        return getButton('',dbBookUrl);
    }
}

function sendQuery(query,dbBookUrl) {
    var content = ajaxget(getQueryUrl(query));
    var btn = handleResult(content,dbBookUrl);
    return btn;
}

var url = window.location.toString();
var query;

// Book Page
if ( url.indexOf('subject')!=-1 ){
    query = $("#mainpic img").attr("alt"); 
    var btn = $(sendQuery(query,url));
    $('div.a_stars').before(btn);
} else if( (url.indexOf('mine')!=-1)||(url.indexOf('people')!=-1) ){
    // People's Book List Page
    $('div.item ul').each(function(){
        query = $('li.title a em', this).text();
        dbBookUrl = $('li.title a', this).attr('href');
        var btn = $(sendQuery(query,dbBookUrl));
        $('div.opt-r', this).after(btn.css("float","right"));
    });
    
} else if( url.indexOf('doulist')!=-1 ){
    // System's Book List Page : doulist
    $('div.article table').each(function(){
        query = $('div.pl2 a', this).text();
        dbBookUrl = $('div.pl2 a', this).attr('href');
        var btn = $(sendQuery(query,dbBookUrl));
        $('td > span.rr', this).prepend(btn);
    });
} else if( url.indexOf('tag')!=-1 ){
    // System's Book List Page : tag
    $('div.article table').each(function(){
        query = $('div.pl2 a', this).contents().eq(0).text();
        console.log(query);
        //query = $('div.pl2 a', this).text();
        //var replace = $('div.pl2 a span', this).text();
        //query = query.replace(replace,'');
        dbBookUrl = $('div.pl2 a', this).attr('href');
        var btn = $("<div style='float:right'>"+sendQuery(query,dbBookUrl)+"</div>");
        $('td p.pl', this).append(btn);
    });
}