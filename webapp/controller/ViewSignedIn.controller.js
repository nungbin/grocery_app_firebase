sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "../service/ServiceManager"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, Controller, ServiceManager) {
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
                this.getView().byId("box0").setModel(this._signedInModel, "Grocery");
                ServiceManager.getStores(this, firebaseApp);
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
                debugger;
            },

            onAddData: function(oEvent) {
                return;
                // Add a new document with a generated id.
                db.collection("cities").add({
                    name: "Tokyo",
                    country: "Japan"
                })
                .then((docRef) => {
                    console.log("Document written with ID: ", docRef.id);
                    MessageToast.show(docRef.id + " being added!");
                })
                .catch((error) => {
                    console.log("Error adding document: ", error);
                    MessageToast.show(error);
                });                
            }            
        });
    });
