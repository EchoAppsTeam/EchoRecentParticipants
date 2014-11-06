(function($) {
"use strict";

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.RecentParticipants.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.RecentParticipants.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.mappings = {
	"dependencies.appkey": {
		"key": "dependencies.StreamServer.appkey"
	}
};

dashboard.dependencies = [{
	"url": "{config:cdnBaseURL.apps.appserver}/controls/configurator.js",
	"control": "Echo.AppServer.Controls.Configurator"
}, {
	"url": "{config:cdnBaseURL.apps.dataserver}/full.pack.js",
	"control": "Echo.DataServer.Controls.Pack"
}, {
	"url": "//cdn.echoenabled.com/apps/echo/social-map/v1/slider.js"
}];

dashboard.config.ecl = [{
	"component": "Group",
	"name": "presentation",
	"type": "object",
	"config": {
		"title": "Presentation"
	},
	"items": [{
		"component": "Slider",
		"name": "avatarSize",
		"type": "number",
		"default": 48,
		"config": {
			"title": "Avatar size",
			"desc": "Specifies user avatar size (in px)",
			"min": 10,
			"max": 100,
			"step": 1,
			"unit": "px"
		}
	}, {
		"component": "Slider",
		"name": "maxParticipants",
		"type": "number",
		"default": 15,
		"config": {
			"title": "Maximum participants",
			"desc": "Specifies maximum amount of participants to be displayed at app load time. Note: new participants will be attached to the list.",
			"min": 5,
			"max": 50,
			"step": 1
		}
	}, {
		"component": "Input",
		"name": "maxWidth",
		"type": "number",
		"config": {
			"title": "Maximum width",
			"desc": "Specify a maximum width (in pixels) of an App container",
			"data": {"sample": 500}
		}
	}, {
		"component": "Input",
		"name": "maxHeight",
		"type": "number",
		"config": {
			"title": "Maximum height",
			"desc": "Specify a maximum height (in pixels) of an App container",
			"data": {"sample": 300}
		}
	}]
}, {
	"component": "Group",
	"name": "dependencies",
	"type": "object",
	"config": {
		"title": "Dependencies",
		"expanded": false
	},
	"items": [{
		"component": "Select",
		"name": "appkey",
		"type": "string",
		"config": {
			"title": "StreamServer application key",
			"desc": "Specifies the application key for this instance",
			"options": []
		}
	}]
}, {
	"name": "targetURL",
	"component": "Echo.DataServer.Controls.Dashboard.DataSourceGroup",
	"type": "string",
	"required": true,
	"config": {
		"title": "",
		"expanded": false,
		"labels": {
			"dataserverBundleName": "Echo Recent Participants Auto-Generated Bundle for {instanceName}"
		},
		"apiBaseURLs": {
			"DataServer": "{%= apiBaseURLs.DataServer %}/"
		}
	}
}];

dashboard.modifiers = {
	"dependencies.appkey": {
		"endpoint": "customer/{self:user.getCustomerId}/appkeys",
		"processor": function() {
			return this.getAppkey.apply(this, arguments);
		}
	},
	"targetURL": {
		"endpoint": "customer/{self:user.getCustomerId}/subscriptions",
		"processor": function() {
			return this.getBundleTargetURL.apply(this, arguments);
		}
	}
};

dashboard.init = function() {
	this.parent();
};

dashboard.methods.declareInitialConfig = function() {
	return {
		"targetURL": this.assembleTargetURL(),
		"dependencies": {
			"StreamServer": {
				"appkey": this.getDefaultAppKey()
			}
		}
	};
};

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);
