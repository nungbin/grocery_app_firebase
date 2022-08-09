/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"prj_test_firebase/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
