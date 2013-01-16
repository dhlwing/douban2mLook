
$(document).ready(init_popup);
$(document).ready(init_all);
$(document).ready(init_fav);
$(document).ready(init_dig);
$(document).ready(function(){
	db = get_db();
	db.transaction(function (query) {
		query.executeSql('update messages set msg_top=1 where msg_fav=0',[],function(query,rs){
			chrome.browserAction.setBadgeText({text:''});
		});
	});
});
