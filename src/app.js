(function($) {
"use strict";

var participants = Echo.App.manifest("Echo.Apps.RecentParticipants");

if (Echo.App.isDefined(participants)) return;

participants.config = {
	"targetURL": undefined,
	"presentation": {
		"avatarSize": 48, // in px
		"maxParticipants": 15,
		"maxWidth": undefined,
		"maxHeight": undefined
	},
	"dependencies": {
		"StreamServer": {
			"appkey": undefined,
			"apiBaseURL": "{%= apiBaseURLs.StreamServer.basic %}/",
			"liveUpdates": {
				"transport": "websockets",
				"enabled": true,
				"websockets": {
					"URL": "{%= apiBaseURLs.StreamServer.ws %}/"
				}
			}
		}
	}
};

participants.labels = {
	"noParticipants": "No participants yet.<br>Stay tuned!"
};

participants.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/api.pack.js",
	"control": "Echo.StreamServer.API"
}, {
	"url": "//cdn.echoenabled.com/apps/echo/conversations/v2/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.FaceCollection"
}];

participants.init = function() {
	// check for "targetURL" field, without
	// this field we are unable to retrieve any data
	if (!this.config.get("targetURL")) {
		this.showMessage({
			"type": "error",
			"message": "Unable to retrieve data, target URL is not specified."
		});
		return;
	}

	// attach unique CSS class for this app instance
	// to target this instance in CSS selectors later
	var uniqueCSSClass = this.cssPrefix + this.config.get("context");
	this.set("uniqueCSSClass", uniqueCSSClass);
	this.config.get("target").addClass(uniqueCSSClass);
	this._applyDynamicCSS();

	this.render();
	this.ready();
};

participants.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:facepile}"></div>' +
	'</div>';

participants.templates.empty =
	'<div class="{class:empty}">' +
		'<span class="{class:message}">{label:noParticipants}</span>' +
	'</div>';

participants.renderers.facepile = function(element) {
	var app = this;
	var ss = this.config.get("dependencies.StreamServer");
	this.initComponent({
		"id": "Facepile",
		"component": "Echo.StreamServer.Controls.FaceCollection",
		"config": {
			"target": element,
			"query": this._assembleQuery(),
			"item": {"avatar": true, "text": false},
			"infoMessages": {"layout": "full"},
			"appkey": ss.appkey,
			"apiBaseURL": ss.apiBaseURL,
			"liveUpdates": ss.liveUpdates,
			"maxUsersCount": this.config.get("presentation.maxParticipants"),
			"ready": function() {
				// update no participants UI
				// with consistent message and icon
				if (!this.get("count.visible")) {
					element.empty().append(app.substitute({
						"template": app.templates.empty
					}));
				}
			}
		}
	});
	return element;
};

participants.methods._applyDynamicCSS = function() {
	var app = this;
	var sizeRestrictions = Echo.Utils.foldl([], ["Width", "Height"], function(key, acc) {
		var value = app.config.get("presentation.max" + key);
		if (value) {
			acc.push("max-" + key.toLowerCase() + ": " + value + "px;");
		}
	}).join(" ");
	var css = '.{self:uniqueCSSClass} .echo-streamserver-controls-face-container .echo-streamserver-controls-face-avatar, .{self:uniqueCSSClass} .echo-streamserver-controls-face-container .echo-streamserver-controls-face-avatar img { width: {config:presentation.avatarSize}px; height: {config:presentation.avatarSize}px; }' +
	'.{self:uniqueCSSClass} .echo-streamserver-controls-facecollection { ' + sizeRestrictions + ' overflow: auto; margin: 0px auto; }';
	Echo.Utils.addCSS(this.substitute({"template": css}), this.config.get("context"));
};

participants.methods._assembleQuery = function() {
	var query =
		"childrenof:{config:targetURL} " +
		"itemsPerPage:{config:presentation.maxParticipants} " +
		"sortOrder:reverseChronological " +
		"children:0";
	return this.substitute({"template": query});
};

participants.css =
	'.{class} .echo-streamserver-controls-facecollection-and,' +
		'.{class} .echo-streamserver-controls-facecollection-more { display: none; }' +
	'.{class} .echo-streamserver-controls-face-container .echo-streamserver-controls-face-avatar { margin: 5px; vertical-align: middle; }' +
	'.{class:empty} { border: 1px solid #d2d2d2; background-color: #fff; margin: 0 5px 10px 5px; padding: 30px 20px; text-align: center; }' +
	'.{class:empty} .{class:message} { background: url("//cdn.echoenabled.com/apps/echo/conversations/v2/sdk-derived/images/info.png") no-repeat; margin: 0 auto; font-size: 14px; font-family: "Helvetica Neue", Helvetica, "Open Sans", sans-serif; padding-left: 40px; display: inline-block; text-align: left; width: 140px; line-height: 16px; color: #7f7f7f; }';

Echo.App.create(participants);

})(Echo.jQuery);
