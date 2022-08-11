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
        let firebaseApp;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function () {
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteView1").attachMatched(function(oEvent) {
                    this._firstView();
                }, this);

                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                firebaseApp = ServiceManager.initFirebase(this);
            },

            _firstView: function() {
                firebaseApp = ServiceManager.initFirebase(this);
            },

            onLogin: function(oEvent) {
                const email = this.getView().byId("idEmail").getValue(),
                      pass  = this.getView().byId("idPassword").getValue();
                const that = this;

                firebaseApp.auth().signInWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        // Signed in
                        let user = userCredential.user;
                        //MessageToast.show(that._i18n.getText("signInGood"));
                        let oRouter = this.getOwnerComponent().getRouter();
                        oRouter.navTo("SignedInView");
                    })
                    .catch((error) => {
                        MessageToast.show(that._i18n.getText("signInBad"));
                    });

            },

            onShowHidePassword: function(oEvent) {
                //reference: https://jsbin.com/sudasa/edit?css,js,output
                if (oEvent.getSource().getSrc() === 'sap-icon://show') {
                    oEvent.getSource().setSrc('sap-icon://hide');
                    this.getView().byId("idPassword").setType(sap.m.InputType.Text);
                } else {
                    oEvent.getSource().setSrc('sap-icon://show');
                    this.getView().byId("idPassword").setType(sap.m.InputType.Password);
                }                
            }
        });
    });
