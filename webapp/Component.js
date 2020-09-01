jQuery.sap.registerModulePath("factsheet.req.customer.codan", "/sap/bc/ui5_ui5/sap/z_cus_req_fact");

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"req/customer/codan/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("req.customer.codan.Component", {

		metadata: {
			manifest: "json",
			includes: ["css/style.css"]
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
		}
	});
});