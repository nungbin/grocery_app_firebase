sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",    
], function(Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";

    return {
        initFirebase(controller) {
            const firebaseConfig = controller.getOwnerComponent().getModel("fb_login_m").getData();
            return firebase.initializeApp(firebaseConfig);
        },

        initPass(controller) {
            const passModel = controller.getOwnerComponent().getModel("pass_m").getData();
            controller.getView().byId("idEmail").setValue(passModel.email);
            controller.getView().byId("idPassword").setValue(passModel.pass);
        },

        validateEmailAndPassword(controller) {
            const email = controller.getView().byId("idEmail").getValue(),
                  pass  = controller.getView().byId("idPassword").getValue();

            if (!email.length) {
                //https://sapui5.hana.ondemand.com/#/api/sap.ui.core.ValueState%23properties
                controller.getView().byId("idEmail").setValueState(sap.ui.core.ValueState.Error);
                controller.getView().byId("idEmail").setValueStateText(controller._i18n.getText("emptyEmail"));
                //https://answers.sap.com/questions/424844/how-to-set-focus-textbox-in-sapui5.html
                jQuery.sap.delayedCall(500, this, function() {
                    controller.getView().byId("idEmail").focus();
                });
                return;
            }
            else {
                controller.getView().byId("idEmail").setValueState(sap.ui.core.ValueState.None);
                controller.getView().byId("idEmail").setValueStateText("");
            }
            if (!pass.length) {
                //https://sapui5.hana.ondemand.com/#/api/sap.ui.core.ValueState%23properties
                controller.getView().byId("idPassword").setValueState(sap.ui.core.ValueState.Error);
                controller.getView().byId("idPassword").setValueStateText(controller._i18n.getText("emptyPass"));
                //https://answers.sap.com/questions/424844/how-to-set-focus-textbox-in-sapui5.html
                jQuery.sap.delayedCall(500, this, function() {
                    controller.getView().byId("idPassword").focus();
                });
            }
            else {
                controller.getView().byId("idPassword").setValueState(sap.ui.core.ValueState.None);
                controller.getView().byId("idPassword").setValueStateText("");
            }
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

        _checkIfIngredientExists(controller) {
            // check if entered ingredient exists
            const len = controller.byId("idDDIngre").getItems().length;
            let   enteredingredient = controller.byId("idDDIngre").getValue();
            for (let i=0 ; i < len ; i++) {
                const itemText = controller.byId("idDDIngre").getItems()[i].getProperty("text");              
                if (itemText === enteredingredient) {
                    return true;
                }
            }
            return false;
        },
        
        async addIngredientToDatabase(controller, firebaseApp) {
            const that = this;
            const oController = controller;
            const oFirebaseApp = firebaseApp;
            const enteredIngredient = controller.getView().byId("idDDIngre").getValue();
            let msgIngre = controller._i18n.getText("missingIngredient");
            const sTitle = controller._i18n.getText("confirmation");
            msgIngre = msgIngre.replace("&&", enteredIngredient);
            if (!this._checkIfIngredientExists(controller)) {
                MessageBox.show(msgIngre, {
                    icon: MessageBox.Icon.QUESTION,
                    title: sTitle ,
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.NO,
                    onClose: async function (oAction) {
                        if (oAction === 'YES') {
                            const oGlobalBusyDialog = new sap.m.BusyDialog({text: "Adding " + enteredIngredient + " to database..."});
                            oGlobalBusyDialog.open();
                            //insert ingredient to database
                            await that.insertIngredientToDatabase(controller, firebaseApp);

                            oGlobalBusyDialog.close();
                        }
                        await that.confirmToAddGrocery(controller, firebaseApp);
                    }
                });
            } else {
                await this.confirmToAddGrocery(controller, firebaseApp);
            }
        },

        async insertIngredientToDatabase(controller, firebaseApp) {
            const enteredIngredient = controller.getView().byId("idDDIngre").getValue();
            //const keyStore = controller.getView().byId("idDDStore").getValue();
            const keyStore = controller.getView().byId("idDDStore").getSelectedKey();
            const storeModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/DDStore");
            let ingredient = {
                English: enteredIngredient,
                Chinese: "",
                Thai:    "",
                url:     null
            };
            storeModel.forEach((store) => {
                ingredient[store.id] = false;
            })
            ingredient[keyStore] = true;

            const db = firebaseApp.firestore();
            try {
                await db.collection("ingredient").add(ingredient);
                let ingreModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/DDIngre");
                let tIngre = {
                    id:   ingreModel.length,
                    name: enteredIngredient,
                    url:  null
                }
                ingreModel.push(tIngre);
                controller.getView().byId("page2").getModel("Grocery").setProperty("/DDIngre", ingreModel);
            }
            catch (error) {
                console.log('Error getting documents', error);
            }

        },

        async confirmToAddGrocery(controller, firebaseApp) {
            //Confirm to add grocery
            const that = this;
            const oController = controller;
            const oFirebaseApp = firebaseApp;
            const sTitle = controller._i18n.getText("confirmation");
            const enteredIngredient = controller.getView().byId("idDDIngre").getValue();
            let msgIngre = controller._i18n.getText("confirmAddIngredient");
            msgIngre = msgIngre.replace("&&", enteredIngredient);
            MessageBox.show(msgIngre, {
                icon: MessageBox.Icon.QUESTION,
                title: sTitle ,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: async function (oAction) {
                    if (oAction === 'YES') {
                        let txt = oController._i18n.getText("addingIngre");
                        txt = txt.replace("&&", enteredIngredient);
                        const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                        oGlobalBusyDialog.open();
            
                        const keyStore  = oController.byId("idDDStore").getSelectedKey(),
                              storeText = oController.byId("idDDStore").getSelectedItem().getText(),
                              keyIngre  = oController.byId("idDDIngre").getSelectedKey();
                        let ingreData = oController.getView().byId("page2").getModel("Grocery").getData();
                        let tURL=null;

                        if (keyIngre.length > 0) {
                            tURL = ingreData.DDIngre[keyIngre].url;
                        }
                        const db = oFirebaseApp.firestore();
                        try {
                            await db.collection("grocery").add({
                                storeName:    storeText,
                                ingredient:   enteredIngredient,
                                recipe:       "",
                                url:          tURL,
                                signedInUser: oController._signedInModel.getProperty("/signedInUser"),
                                timestamp:    firebase.firestore.FieldValue.serverTimestamp()
                            });
                            await that._getGroceries(oController, oFirebaseApp);
                        }
                        catch (error) {
                            console.log('Error getting documents', error);
                        }
                        
                        oGlobalBusyDialog.close();
                    }
                }
            });
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
                    t.id = doc.id;
                    i++;
                    t.Store = doc.data().storeName;
                    t.Ingredient = doc.data().ingredient;
                    t.URL = doc.data().url;
                    t.Recipe = doc.data().recipe;
                    tGrocery.push(t);
                });
                controller.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", tGrocery);
            }
            catch(error) {
                console.log('Error getting documents', error); 
            }
        },

        deleteGrocery(controller, firebaseApp) {
            //Confirm to delete grocery
            const that = controller;
            const db = firebaseApp.firestore();
            const sTitle = controller._i18n.getText("confirmation");
            let msgIngre = controller._i18n.getText("confirmDeleteIngredient");
            var oList = controller.getView().byId("iDtblGroceryList"); // get the list using its Id
            const iDirtyRowIndex = oList.indexOfItem(oList.getSwipedItem());
            let groceryList = controller.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
            let groceryID = groceryList[iDirtyRowIndex].id;
            msgIngre = msgIngre.replace("&&", groceryList[iDirtyRowIndex].Ingredient);
            MessageBox.show(msgIngre, {
                icon: MessageBox.Icon.QUESTION,
                title: sTitle ,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: function (oAction) {
                    if (oAction === 'YES') {
                        let txt = that._i18n.getText("deletingIngre");
                        txt = txt.replace("&&", groceryList[iDirtyRowIndex].Ingredient);
                        const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                        oGlobalBusyDialog.open();
            
                        db.collection("grocery").doc(groceryID).delete().then(() => {
                            groceryList.splice(iDirtyRowIndex, 1);
                            that.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", groceryList);
                            //not clear why the below statement would cause duplicate element ID's when adding a new grocery
                            //oList.removeAggregation("items", oSwipedItem); // Remove this aggregation to delete list item from list
                            oList.swipeOut(); // we are done, hide the swipeContent from screen        
                            oGlobalBusyDialog.close();
                        }).catch((error) => {
                            console.error("Error removing document: ", error);
                            oGlobalBusyDialog.close();
                        });
                    }
                    else {
                        oList.swipeOut(); // we are done, hide the swipeContent from screen        
                    }
                }
            });
        },

        async movingGroceryToHistory(controller, firebaseApp, oCheckbox) {
            const iDirtyRowIndex = controller.getView().byId("iDtblGroceryList").indexOfItem(oCheckbox.getParent());
            const groceryListModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
            const ingredient = groceryListModel[iDirtyRowIndex];
            ingredient.signedInUser = controller._signedInModel.getProperty("/signedInUser");
            ingredient.timestamp    = firebase.firestore.FieldValue.serverTimestamp();
            const txt = this._i18n.getText("movingGroceryToHistory");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            const db = firebaseApp.firestore();
            try {
                let tIngre = {};
                //tIngre.id           = ingredient.id;
                tIngre.ingredient   = ingredient.Ingredient;
                tIngre.recipe       = ingredient.Recipe;
                tIngre.signedInUser = ingredient.signedInUser;
                tIngre.storeName    = ingredient.Store
                tIngre.url          = ingredient.URL;
                tIngre.timestamp    = firebase.firestore.FieldValue.serverTimestamp();
                //https://stackoverflow.com/questions/48541270/how-to-add-document-with-custom-id-to-firestore
                await db.collection("groceryHistory").add(tIngre).then(doc => {
                    tIngre.id = doc.id;
                });
                await db.collection("grocery").doc(ingredient.id).delete();
                groceryListModel.splice(iDirtyRowIndex, 1);
                controller.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", groceryListModel);
                let ingreModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/PastGroceryList");
                ingreModel.unshift(ingredient);
                controller.getView().byId("page2").getModel("Grocery").setProperty("/PastGroceryList", ingreModel);
                oGlobalBusyDialog.close();
            }
            catch (error) {
                console.log('Error getting documents', error);
                oGlobalBusyDialog.close();
            }
        },

        async saveRecipe(controller, firebaseApp, grocery) {
            const db = firebaseApp.firestore();
            try {
                const snapshot = await db.collection("grocery")
                                         .doc(grocery.id)
                                         .update({
                                             recipe:    grocery.dirtyRecipe,
                                             timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                         });
            }
            catch(error) {
                console.log('Error getting documents', error); 
            }
        },

        async _getPastGroceries(controller, firebaseApp) {
            const tGrocery = [];
            const db = firebaseApp.firestore();

            try {
                let i=0;
                const snapshot = await db.collection("groceryHistory").orderBy("storeName").orderBy("ingredient").orderBy("timestamp", "desc").limit(20).get();
                snapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    let t = { };
                    t.id = doc.id;
                    i++;
                    t.Store = doc.data().storeName;
                    t.Ingredient = doc.data().ingredient;
                    t.URL = doc.data().url;
                    t.Recipe = doc.data().recipe;
                    //t.timestamp = this._convertFirebaseDateToJSDate(doc.data().timestamp);
                    t.timestamp = doc.data().timestamp;
                    tGrocery.push(t);
                });
                controller.getView().byId("page2").getModel("Grocery").setProperty("/PastGroceryList", tGrocery);
            }
            catch(error) {
                console.log('Error getting documents', error); 
            }
        },

        async initialLoad(controller, firebaseApp, dialogText) {
            const that = this;
            const oController = controller;
            const txt = controller._i18n.getText(dialogText);
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            Promise.all([
                this._getStores(controller, firebaseApp),
                this._getGroceries(controller, firebaseApp),
                this._getPastGroceries(controller, firebaseApp)
            ]).then((values) => {
                oController.getView().byId("idPanelHistory").setExpanded(false);
                oController.getView().byId("idDDIngre").clearSelection();
                that._resetGroceryListView(oController);
                oGlobalBusyDialog.close();
            })
            .catch((error) => {
                console.error(error.message);
                oGlobalBusyDialog.close();
            });            
            //await this._getStores(controller, firebaseApp);
            //await this._getGroceries(controller, firebaseApp);
        },

        onPress(oItem, oFlag) {
            //const oFlag = oItem.getDetailControl().getVisible();

            try {
                oItem.getDetailControl().setVisible(!oFlag);
            }
            catch (error) {
            }
            var oCells = oItem.getCells();
            $(oCells).each(function(i) {
              var oCell = oCells[i];
              if (oCell instanceof sap.m.Input) {
                oCell.setEditable(oFlag);
              }else if (oCell instanceof sap.m.Select) {
                oCell.setEnabled(oFlag);
              }else if (oCell instanceof sap.m.Button) {
                oCell.setVisible(oFlag);                      
              }
            });
        },

        _resetGroceryListView(controller) {
            var oItems = controller.getView().byId("iDtblGroceryList").getItems();
            oItems.forEach((oItem) => {
                this.onPress(oItem, false);
            })
        },

        _convertFirebaseDateToJSDate(fbDate) {
            //date from firebase is represented as
            // let time = {
            //     seconds: 1613748319,
            //     nanoseconds: 47688698687,
            // }            
            const fireBaseTime = new Date(
                fbDate.seconds * 1000 + fbDate.nanoseconds / 1000000,
            );
            return fireBaseTime.toDateString();
            //const atTime = fireBaseTime.toLocaleTimeString();            
        }
    }
})