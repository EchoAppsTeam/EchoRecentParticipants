(function($) {
"use strict";

if (Echo.AppServer.Dashboard.isDefined("Echo.Apps.RecentParticipants.Dashboard")) return;

var dashboard = Echo.AppServer.Dashboard.manifest("Echo.Apps.RecentParticipants.Dashboard");

dashboard.inherits = Echo.Utils.getComponent("Echo.AppServer.Dashboards.AppSettings");

dashboard.labels = {
	"failedToFetchToken": "Failed to fetch customer DataServer token: {reason}"
};

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

dashboard.config = {
	"appkeys": []
};

dashboard.config.ecl = [{
	"name": "targetURL",
	"component": "Echo.DataServer.Controls.Dashboard.DataSourceGroup",
	"type": "string",
	"required": true,
	"config": {
		"title": "",
		"labels": {
			"dataserverBundleName": "Echo Recent Participants Auto-Generated Bundle for {instanceName}"
		},
		"apiBaseURLs": {
			"DataServer": "{%= apiBaseURLs.DataServer %}/"
		}
	}
}, {
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
}];

dashboard.init = function() {
	var self = this, parent = $.proxy(this.parent, this);
	this._fetchDataServerToken(function() {
		self._requestData(function() {
			self.config.set("ecl", self._prepareECL(self.config.get("ecl")));
			parent();
		});
	});
};

dashboard.methods.declareInitialConfig = function() {
	var keys = this.get("appkeys", []);
	return {
		"targetURL": this._assembleTargetURL(),
		"dependencies": {
			"StreamServer": {
				"appkey": keys.length ? keys[0].key : undefined
			}
		}
	};
};

dashboard.methods._requestData = function(callback) {
	var self = this;
	var customerId = this.config.get("data.customer.id");
	var deferreds = [];
	var request = this.config.get("request");

	var requests = [{
		"name": "appkeys",
		"endpoint": "customer/" + customerId + "/appkeys"
	}, {
		"name": "domains",
		"endpoint": "customer/" + customerId + "/domains"
	}];
	$.map(requests, function(req) {
		var deferredId = deferreds.push($.Deferred()) - 1;
		request({
			"endpoint": req.endpoint,
			"success": function(response) {
				self.set(req.name, response);
				deferreds[deferredId].resolve();
			}
		});
	});
	$.when.apply($, deferreds).done(callback);
};

dashboard.methods._prepareECL = function(items) {
	var self = this;

	var instructions = {
		"targetURL": function(item) {
			item.config = $.extend(true, {
				"bundle": {
					"url": self.get("data.instance.provisioningDetails.bundleURL")
				},
				"domains": self.get("domains"),
				"apiToken": self.config.get("dataserverToken"),
				"instanceName": self.get("data.instance.name"),
				"valueHandler": function() {
					return self._assembleTargetURL();
				}
			}, item.config);
			return item;
		},
		"dependencies.appkey": function(item) {
			item.config.options = $.map(self.get("appkeys"), function(appkey) {
				return {
					"title": appkey.key,
					"value": appkey.key
				};
			});
			return item;
		}
	};
	return (function traverse(items, path) {
		return $.map(items, function(item) {
			var _path = path ? path + "." + item.name : item.name;
			if (item.type === "object" && item.items) {
				item.items = traverse(item.items, _path);
			} else if (instructions[_path]) {
				item = instructions[_path](item);
			}
			return item;
		});
	})(items, "");
};

dashboard.methods._fetchDataServerToken = function(callback) {
	var self = this;
	Echo.AppServer.API.request({
		"endpoint": "customer/{id}/subscriptions",
		"id": this.get("data.customer").id,
		"onData": function(response) {
			var token = Echo.Utils.foldl("", response, function(subscription, acc) {
				return subscription.product.name === "dataserver"
					? subscription.extra.token
					: acc;
			});
			if (token) {
				self.config.set("dataserverToken", token);
				callback.call(self);
			} else {
				self._displayError(
					self.labels.get("failedToFetchToken", {
						"reason": self.labels.get("dataserverSubscriptionNotFound")
					})
				);
			}
		},
		"onError": function(response) {
			self._displayError(self.labels.get("failedToFetchToken", {"reason": response.data.msg}));
		}
	}).send();
};

dashboard.methods._displayError = function(message) {
	this.showMessage({
		"type": "error",
		"message": message,
		"target": this.config.get("target")
	});
	this.ready();
};

dashboard.methods._assembleTargetURL = function() {
	return this.get("data.instance.config.targetURL")
		|| this.get("data.instance.provisioningDetails.targetURL");
};

Echo.AppServer.Dashboard.create(dashboard);

})(Echo.jQuery);
