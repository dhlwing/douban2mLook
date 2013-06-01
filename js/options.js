$(document).ready(init_options_page);
var option = function(){this.init()};

option.prototype.init = function(){
	$('#link_about_plugin').click(function(){
		$('#update_desc').modal({
		    backdrop:true,
		    keyboard:true,
		    show:true
		});
	});
	$('#button_about_plugin_close').click(function(){$('#update_desc').modal('hide');});
}

new option();