sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Filter, FilterOperator) {
	"use strict";

    return {
        initFirebase(controller) {
            const firebaseConfig = controller.getOwnerComponent().getModel("fb_login_m").getData();
            return firebase.initializeApp(firebaseConfig);
        },

        custConcat(...args) {
            let resultStr="";
            //args.push("AA");
            //args.push("");
            //args.push("CC");
            
            args.forEach((arg) => {
                if ( arg != 'undefined' && arg != "" ) {
                    if ( resultStr === "" ) {
                        resultStr = arg;
                    }
                    else {
                        if ( resultStr.slice(-1) === ")" ) {
                            resultStr = resultStr.slice(0, -1) + "/" + arg + ")";
                        } 
                        else {
                            resultStr = resultStr + " (" + arg + ")";
                        }  
                    }
                }
            })
            return resultStr;
        },

        async getStores(controller, firebaseApp) {
            const txt = controller._i18n.getText("retrievingStores");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            //Add data: https://firebase.google.com/docs/firestore/manage-data/add-data
            //https://firebase.google.com/docs/firestore/query-data/order-limit-data
            //db.collection("cities").where("state", "!=", "CA").orderBy("state", "desc")
            const db = firebaseApp.firestore();

            try {
                const snapshot = await db.collection("store").orderBy("name").get();
                const tStores = [];
                snapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    let t = { };
                    t.id = doc.data().shortName;
                    t.name = doc.data().name;
                    tStores.push(t);
                });
                controller.getView().byId("box0").getModel("Grocery").setProperty("/DDStore", tStores)
                oGlobalBusyDialog.close();
            }
            catch (error) {
                console.log('Error getting documents', error);
            }            
        },

        async getIngrdients(controller, firebaseApp, storeName) {
            const txt = controller._i18n.getText("retrievingIngredients");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            //Add data: https://firebase.google.com/docs/firestore/manage-data/add-data
            //https://firebase.google.com/docs/firestore/query-data/order-limit-data
            //db.collection("cities").where("state", "!=", "CA").orderBy("state", "desc")
            const db = firebaseApp.firestore();

            try {
                const snapshot = await db.collection("ingredient").where(storeName, "==", true).get();
                const tIngres = [];
                let i=0;
                snapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    let t = { };
                    t.id = i;
                    i++;
                    t.name = this.custConcat(doc.data().English, doc.data().Chinese, doc.data().Thai);
                    tIngres.push(t);
                });
                controller.getView().byId("box0").getModel("Grocery").setProperty("/DDIngre", tIngres);
                oGlobalBusyDialog.close();
            }
            catch (error) {
                console.log('Error getting documents', error);
            }            
        }        
    }
})