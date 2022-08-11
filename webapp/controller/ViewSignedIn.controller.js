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
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("SignedInView").attachMatched(function(oEvent) {
                    this._signedIn();
                }, this);

                firebaseApp = ServiceManager.initFirebase(this);
            },

            _signedIn: function() {
                firebaseApp = ServiceManager.initFirebase(this);
            },

            onNavBack: function(oEvent) {
                window.history.go(-1);
            },

            onAddData: function(oEvent) {
                //Add data: https://firebase.google.com/docs/firestore/manage-data/add-data
                db = firebaseApp.firestore();

                //https://firebase.google.com/docs/firestore/query-data/order-limit-data
                db.collection("cities").where("state", "!=", "CA").orderBy("state", "desc")
                .get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        // doc.data() is never undefined for query doc snapshots
                        console.log(doc.id, " => ", doc.data());
                    });
                })
                .catch((error) => {
                    console.log("Error getting documents: ", error);
                });                
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
