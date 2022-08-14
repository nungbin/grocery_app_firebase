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

                //https://stackoverflow.com/questions/25988860/how-call-a-function-by-pressing-enter-key-in-password-input-field-in-login-view
                const input = this.getView().byId("idPassword");
                input.onsapenter = (function(oEvent) {
                  this.onLogin(oEvent);
                }).bind(this);

                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                firebaseApp = ServiceManager.initFirebase(this);
            },

            _firstView: function() {
                firebaseApp = ServiceManager.initFirebase(this);
            },

            onLogin: function(oEvent) {
                const txt = this._i18n.getText("signingIn");
                const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                oGlobalBusyDialog.open();
    
                const email = this.getView().byId("idEmail").getValue(),
                      pass  = this.getView().byId("idPassword").getValue();
                const that = this;

                firebaseApp.auth().signInWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        // Signed in
                        let user = userCredential.user;
                        //MessageToast.show(that._i18n.getText("signInGood"));
                        let oRouter = this.getOwnerComponent().getRouter();
                        oGlobalBusyDialog.close();
                        oRouter.navTo("SignedInView");
                    })
                    .catch((error) => {
                        MessageToast.show(that._i18n.getText("signInBad"));
                        oGlobalBusyDialog.close();
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
