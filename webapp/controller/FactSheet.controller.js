sap.ui.define([
	"req/customer/codan/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/core/MessageType",
	"sap/ui/core/message/Message",
	"sap/m/MessageToast",
	"req/customer/codan/model/postcodeValidator",
	"sap/ui/core/ValueState"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox, MessagePopover, MessagePopoverItem, MessageType, Message,
	MessageToast, postcodeValidator, ValueState) {
	"use strict";

	return BaseController.extend("req.customer.codan.controller.FactSheet", {
		oMessageManager: {},
		_oFactSheetComponent: undefined,
		
		oDefault: {
			busy: false,
			ready: false,
			orgAssignments: [],
			helpPopoverTitle: "",
			helpPopoverText: "",
			submitAction: "Submit for Approval",
			editBankDetails: false,
			bankDetailPopup: {
				bankVerifiedWithMsg: "",
				bankVerifiedTelMsg: ""
			},
			bankDetailsLocked: false
		},


		/**
		 * Called when the worklist controller is instantiated, sets initial
		 * values and initialises the model
		 * @public
		 */
		onInit: function () {
			// Call the BaseController's onInit method (in particular to initialise the extra JSON models)
			BaseController.prototype.onInit.apply(this, arguments);

			// Model used to manipulate control states
			var oViewModel;
			oViewModel = new JSONModel(this.oDefault);
			this.setModel(oViewModel, "detailView");

			// Set route handlers
			this.getRouter().getRoute("existingCustomer").attachPatternMatched(this._onRouteExistingCustomer, this);
			this.getRouter().getRoute("newCustomer").attachPatternMatched(this._onRouteNewCustomer, this);

			// Initialise the message manager
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(this.oMessageManager.getMessageModel(), "message");
			this.oMessageManager.registerObject(this.getView(), true);
		},
		
		/**
		 * Handle route 'newCustomer'
		 *
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onRouteNewCustomer: function (oEvent) {
			this._resetRequest();
			this._sCompanyCode = oEvent.getParameter("arguments").companyCode;
			this._sCustomerId = undefined;
			this._setFactSheetComponent();
		},
		
		/**
		 * Handle route 'existingCustomer'
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onRouteExistingCustomer: function (oEvent) {
			this._resetRequest();
			this._sCustomerId = oEvent.getParameter("arguments").id;
			this._sCompanyCode = oEvent.getParameter("arguments").companyCode;
			this._setFactSheetComponent();
		},
		
		_resetRequest: function() {
			var oDetailModel = this.getModel("detailView");
			oDetailModel.setProperty("/ready", false); // disable until factsheet ready
		},

		
		_onFactsheetReady: function() {
			this.getModel("detailView").setProperty("/ready", true); // allow save/submit
		},

		_setFactSheetComponent: function() {
			if (!this._oFactSheetComponent) {
				this._intializeFactSheetComponent();
			} else {
				this._oFactSheetComponent.setRequest({
					customerId: this._sCustomerId,
					companyCode: this._sCompanyCode
				});
			}
		},
		
		_intializeFactSheetComponent: function() {
			var oSemanticMessagesIndicator = this.byId("messagesIndicator");
            sap.ui.component({
                name: "factsheet.req.customer.codan",
                settings: {
					messagesButton: oSemanticMessagesIndicator,
					ready: this._onFactsheetReady.bind(this),
					submitted: this._afterRequestSubmitted.bind(this)
                },
                async: true,
                manifestFirst : true  //deprecated from 1.49+
                // manifest : true    //SAPUI5 >= 1.49
            }).then(function(oComponent){
            	// Set component container to this component
            	this._oFactSheetComponent = oComponent;
                this.byId("componentFactSheet").setComponent(this._oFactSheetComponent);
                
            	// Now that component is ready set initial customer/company
				oComponent.setRole("R"); // Requestor
				oComponent.setRequest({
					customerId: this._sCustomerId,
					companyCode: this._sCompanyCode
				});
            }.bind(this)).catch(function(oError) {
                jQuery.sap.log.error(oError);
            });
		},
		
		_afterRequestSubmitted: function() {
			this._navBack();
		},

		onPressSubmit: function () {
			this._oFactSheetComponent.submit();
		},

		onPressSave: function () {
			this._oFactSheetComponent.save();
		},

		cancelBankDetailsDialog: function () {
			if (this._oBankDialog) {
				if (this._oBankDialog.close) {
					this._oBankDialog.close();
				}
				this._oBankDialog.destroy();
				delete this._oBankDialog;
			}

			this.getModel("detailView").setProperty("/bankDetailPopup", {
				bankVerifiedWithMsg: "",
				bankVerifiedTelMsg: ""
			});
		},

		onNavBack: function () {
			var navBack = this._navBack;

			if (this.getModel("detailView").getProperty("/editable") && this._oFactSheetComponent.hasPendingChanges()) {
				MessageBox.confirm("Unsaved changes will be lost. Do you wish to continue?", {
					title: "Data Loss Confirmation",
					onClose: function (sAction) {
						if (sAction === sap.m.MessageBox.Action.OK) {
							navBack();
						}
					}

				});
				return;
			}
			this._navBack();

		},

		displayMessagesPopover: function (oEvent) {
			var oMessagesButton = oEvent ? oEvent.getSource() : this.getView().byId("factSheetPage")
				.getAggregation("messagesIndicator").getAggregation("_control");

			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						template: new MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}",
							subtitle: "{message>subtitle}"
						})
					},
					initiallyExpanded: true
				});
				oMessagesButton.addDependent(this._messagePopover);
			}

			if (oEvent || !this._messagePopover.isOpen()) {
				this._messagePopover.toggle(oMessagesButton);
			}
		},

		_setBusy: function (busy) {
			this.getModel("detailView").setProperty("/busy", busy);
		}

	});
});