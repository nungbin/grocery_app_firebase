sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "../service/ServiceManager"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, Controller, Fragment, ServiceManager) {
        "use strict";
        let firebaseApp, db;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function() {
                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("SignedInView").attachMatched(function(oEvent) {
                    this._signedIn();
                }, this);

                firebaseApp = ServiceManager.initFirebase(this);
            },

            _signedIn: function() {
                firebaseApp = ServiceManager.initFirebase(this);
                this._signedInModel = this.getOwnerComponent().getModel("fb_signedIn_m");
                this.getView().byId("page2").setModel(this._signedInModel, "Grocery");
                ServiceManager.initialLoad(this, firebaseApp, "initialLoad");
            },

            onNavBack: function(oEvent) {
                window.history.go(-1);
            },

            onStoreComboChange: function(oEvent) {
                const keyStore = oEvent.getSource().getSelectedKey();
                const keyItem  = oEvent.getSource().getSelectedItem();
                firebaseApp = ServiceManager.initFirebase(this);
                ServiceManager.getIngrdients(this, firebaseApp, keyStore);
            },

            onIngreComboChange: function(oEvent) {
                firebaseApp = ServiceManager.initFirebase(this);
                ServiceManager.addIngredientToDatabase(this, firebaseApp);
            },

            onHandleRefresh: function(oEvent) {
                ServiceManager.initialLoad(this, firebaseApp, "initialLoad");
                oEvent.getSource().hide();
            },
            
            onPressIngreURL: function(oEvent) {
                let that = this;
                // create dialog lazily
                if (!this.byId("idImageDialog")) {
                    // load asynchronous XML fragment
                    Fragment.load({
                        id: that.getView().getId(),
                        name: "groceryappfb.view.image",
                        controller: this
                    }).then(function (oDialog) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        that.getView().addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    this.byId("idImageDialog").open();
                }
            },

            onCloseImageDialog: function(oEvent) {
                this.byId("idImageDialog").close();
            }
        });
    });
