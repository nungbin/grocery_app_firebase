sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, Controller) {
        "use strict";
        let firebaseApp, db;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function () {
                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                // For Firebase JS SDK v7.20.0 and later, measurementId is optional
                const firebaseConfig = {
                    apiKey: "AIzaSyCnZn5FVOvY3sLcqQRDfx6xbkkCm7D2Sts",
                    authDomain: "demobook1-bd299.firebaseapp.com",
                    projectId: "demobook1-bd299",
                    storageBucket: "demobook1-bd299.appspot.com",
                    messagingSenderId: "1092205087657",
                    appId: "1:1092205087657:web:6214731f2d15362f60d2b8",
                    measurementId: "G-LFRD47GFGB"
                };
                
                firebaseApp = firebase.initializeApp(firebaseConfig);
                db = firebaseApp.firestore();
            },

            onLogin: function(oEvent) {
                const email = this.getView().byId("idEmail").getValue(),
                      pass  = this.getView().byId("idPassword").getValue();
                const that = this;

                firebaseApp.auth().signInWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        // Signed in
                        let user = userCredential.user;
                        MessageToast.show(that._i18n.getText("signInGood"));
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
