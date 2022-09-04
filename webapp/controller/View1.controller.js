sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/mvc/Controller",
    "../service/ServiceManager"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, MessageBox, Controller, ServiceManager) {
        "use strict";
        let firebaseApp;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function () {
                const that = this;

                //Password field is not contained in a form
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("FirstView1").attachMatched(function(oEvent) {
                    this._firstView();
                }, this);

                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._signedInModel = this.getOwnerComponent().getModel("fb_signedIn_m");
                this._initFirstView();
            },

            _firstView: function() {
                this._initFirstView();
            },

            _initFirstView: function() {
                //https://stackoverflow.com/questions/25988860/how-call-a-function-by-pressing-enter-key-in-password-input-field-in-login-view
                const input1 = this.getView().byId("idEmail");
                input1.onsapenter = (function(oEvent) {
                  this.onLogin(oEvent);
                }).bind(this);
                const input2 = this.getView().byId("idPassword");
                input2.onsapenter = (function(oEvent) {
                  this.onLogin(oEvent);
                }).bind(this);

                firebaseApp = ServiceManager.initFirebase(this);
                ServiceManager.initPass(this);
            },

            onLogin: function(oEvent) {
                const that = this;
                const txt = this._i18n.getText("signingIn");
                const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                const email = this.getView().byId("idEmail").getValue(),
                      pass  = this.getView().byId("idPassword").getValue();
                const oRouter = this.getOwnerComponent().getRouter();
                if ( ServiceManager.validateEmailAndPassword(this) === true) {
                    oGlobalBusyDialog.open();
                    firebaseApp.auth().signInWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        // Signed in
                        let user = userCredential.user;
                        that._signedInModel.setProperty("/signedInUser", user.email);
                        //Compare localStorage's username's and password's. 
                        //  if different, prompt to have username and password remembered
                        const oResult = ServiceManager.getUserAndPass();
                        if (oResult.username !== email || oResult.password !== pass) {
                            const sTitle = that._i18n.getText("confirmation");
                            const msgUserPass = that._i18n.getText("rememberUserAndPass");
                            MessageBox.show(msgUserPass, {
                                icon: MessageBox.Icon.QUESTION,
                                title: sTitle ,
                                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                emphasizedAction: MessageBox.Action.NO,
                                onClose: async function (oAction) {
                                    if (oAction === 'YES') {
                                        ServiceManager.setUserAndPass(email, pass);
                                    }
                                    
                                    oGlobalBusyDialog.close();
                                    oRouter.navTo("SignedInView");
                                }
                            });    
                        }
                        else {
                            oGlobalBusyDialog.close();
                            oRouter.navTo("SignedInView");
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        MessageToast.show(that._i18n.getText("signInBad"));
                        oGlobalBusyDialog.close();
                    });
                }
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
