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

        async getStores(controller, firebaseApp) {
            const txt = controller._i18n.getText("retrievingStores");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});

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
                    t.id = doc.id;
                    t.name = doc.data().name;
                    t.shortName = doc.data().shortName;
                    tStores.push(t);
                });
                controller.getView().byId("box0").getModel("Grocery").setProperty("/DDStore", tStores)
                oGlobalBusyDialog.close();
            }
            catch (error) {
                console.log('Error getting documents', error);
            }            
        }
    }
})