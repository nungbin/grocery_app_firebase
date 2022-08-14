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
            await this._getStores(controller, firebaseApp);
            oGlobalBusyDialog.close();         
        },

        async _getStores(controller, firebaseApp) {
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
                controller.getView().byId("page2").getModel("Grocery").setProperty("/DDStore", tStores)
            }
            catch (error) {
                console.log('Error getting documents', error);
            }
        },

        async getIngrdients(controller, firebaseApp, storeName) {
            const txt = controller._i18n.getText("retrievingIngredients");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            controller.getView().byId("idDDIngre").clearSelection();
            controller.getView().byId("idDDIngre").setSelectedKey(null);
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
                    t.url = doc.data().url;
                    tIngres.push(t);
                });
                controller.getView().byId("page2").getModel("Grocery").setProperty("/DDIngre", tIngres);
            }
            catch (error) {
                console.log('Error getting documents', error);
            }
            oGlobalBusyDialog.close();            
        },
        
        async addIngredientToDatabase(controller, firebaseApp) {
            const txt = controller._i18n.getText("addingIngre");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            var   enteredingredient = controller.byId("idDDIngre").getValue();
            const keyStore  = controller.byId("idDDStore").getSelectedKey(),
                  storeText = controller.byId("idDDStore").getSelectedItem().getText(),
                  keyIngre  = controller.byId("idDDIngre").getSelectedKey();
            let ingreData = controller.getView().byId("page2").getModel("Grocery").getData();
            const tGrocery = [];
            const db = firebaseApp.firestore();
            try {
                await db.collection("grocery").add({
                    storeName:  storeText,
                    ingredient: enteredingredient,
                    url:        ingreData.DDIngre[keyIngre].url
                });

                await this._getGroceries(controller, firebaseApp);
            }
            catch (error) {
                console.log('Error getting documents', error);
            }
            
            oGlobalBusyDialog.close();
        },

        async _getGroceries(controller, firebaseApp) {
            const tGrocery = [];
            const db = firebaseApp.firestore();

            try {
                let i=0;
                const snapshot = await db.collection("grocery").orderBy("storeName").orderBy("ingredient").get();
                snapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    let t = { };
                    t.id = i;
                    i++;
                    t.Store = doc.data().storeName;
                    t.Ingredient = doc.data().ingredient;
                    t.URL = doc.data().url;
                    tGrocery.push(t);
                });
                controller.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", tGrocery);
            }
            catch(error) {
                console.log('Error getting documents', error); 
            }
        },

        async initialLoad(controller, firebaseApp, dialogText) {
            const txt = controller._i18n.getText(dialogText);
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            await this._getStores(controller, firebaseApp);
            await this._getGroceries(controller, firebaseApp);

            oGlobalBusyDialog.close();
        }
    }
})