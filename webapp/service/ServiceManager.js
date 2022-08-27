sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",    
], function(Filter, FilterOperator, MessageBox, MessageToast) {
	"use strict";
    const sUsername = "username";
    const sPassword = "password";

    return {
        initFirebase(controller) {
            const firebaseConfig = controller.getOwnerComponent().getModel("fb_login_m").getData();
            return firebase.initializeApp(firebaseConfig);
        },

        initPass(controller) {
            //const passModel = controller.getOwnerComponent().getModel("pass_m").getData();
            const oResult = this.getUserAndPass();

            try {
                if (oResult.username.length !== 0) {
                    controller.getView().byId("idEmail").setValue(oResult.username);
                } 
                if (oResult.password.length !== 0) {
                    controller.getView().byId("idPassword").setValue(oResult.password);
                }    
            }
            catch (error) {
                oResult.username = "";
                oResult.password = "";
            }
        },

        getUserAndPass() {
            let oResult = {
                username: "",
                password: ""
            }
            oResult.username = localStorage.getItem(sUsername);
            oResult.password = localStorage.getItem(sPassword);
            return oResult;
        },

        setUserAndPass(pUsername, pPassword) {
            localStorage.setItem(sUsername, pUsername);
            localStorage.setItem(sPassword, pPassword);
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
                return false;
            }
            else {
                controller.getView().byId("idEmail").setValueState(sap.ui.core.ValueState.None);
                controller.getView().byId("idEmail").setValueStateText("");
                if (!pass.length) {
                    //https://sapui5.hana.ondemand.com/#/api/sap.ui.core.ValueState%23properties
                    controller.getView().byId("idPassword").setValueState(sap.ui.core.ValueState.Error);
                    controller.getView().byId("idPassword").setValueStateText(controller._i18n.getText("emptyPass"));
                    //https://answers.sap.com/questions/424844/how-to-set-focus-textbox-in-sapui5.html
                    jQuery.sap.delayedCall(500, this, function() {
                        controller.getView().byId("idPassword").focus();
                    });
                    return false;
                }
                else {
                    controller.getView().byId("idPassword").setValueState(sap.ui.core.ValueState.None);
                    controller.getView().byId("idPassword").setValueStateText("");
                    return true;
                }    
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
                    t.originalRecipe = t.Recipe;
                    t.dirtyRecipe = "";
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
            const txt = controller._i18n.getText("movingGroceryToHistory");
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

        movingHistoryGroceryBack(controller, firebaseApp) {
            const that = this;
            const oController = controller;
            const oFirebaseApp = firebaseApp;
            const oTable = controller.getView().byId("iDtblHistoryGroceryList");
            const oItems = oTable.getSelectedItems();
            const PGLModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/PastGroceryList");
            const txt = controller._i18n.getText("movingHistoryGroceryBack");
            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
            oGlobalBusyDialog.open();

            try {
                //https://dev.to/jamesliudotcc/how-to-use-async-await-with-map-and-promise-all-1gb5
                Promise.all(oItems.map((oItem) => {
                    const iDirtyRowIndex = oTable.indexOfItem(oItem);
                    const grocery = PGLModel[iDirtyRowIndex];
                    return that._movingHistoryGroceryBack(oController, oFirebaseApp, grocery);
                })).then(function(res) {
                    oGlobalBusyDialog.close();
                })
            }
            catch (error) {
            }
        },

        async _movingHistoryGroceryBack(controller, firebaseApp, grocery) {
            const db = firebaseApp.firestore();
            try {
                const tID = db.collection("grocery").add({
                    storeName:    grocery.Store,
                    ingredient:   grocery.Ingredient,
                    recipe:       grocery.Recipe,
                    url:          grocery.URL,
                    signedInUser: controller._signedInModel.getProperty("/signedInUser"),
                    timestamp:    firebase.firestore.FieldValue.serverTimestamp()
                });
                let glModel = controller.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
                let tGL = {
                    id:             tID,
                    Store:          grocery.Store,
                    Ingredient:     grocery.Ingredient,
                    URL:            grocery.URL,
                    Recipe:         grocery.Recipe,
                    originalRecipe: grocery.Recipe,
                    dirtyRecipe:    "",
                    signedInUser:   controller._signedInModel.getProperty("/signedInUser"),
                    timestamp:      firebase.firestore.FieldValue.serverTimestamp()
                }
                glModel.push(tGL);
                controller.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", glModel);
            }
            catch (error) {
                console.log(error);
            }
        },

        async saveRecipe(controller, firebaseApp, iIndex) {
            const db = firebaseApp.firestore();
            let groceryList = controller.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
            let grocery = groceryList[iIndex];
            try {
                const snapshot = await db.collection("grocery")
                                         .doc(grocery.id)
                                         .update({
                                             recipe:    groceryList[iIndex].dirtyRecipe,
                                             timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                         });
                groceryList[iIndex].Recipe = groceryList[iIndex].dirtyRecipe;
                groceryList[iIndex].originalRecipe = groceryList[iIndex].Recipe;
                controller.getView().byId("page2").getModel("Grocery").setProperty("/GroceryList", groceryList);
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
                oController.getView().byId("idDDIngre").setValue(null);
                that.resetGroceryListView(oController);
                oGlobalBusyDialog.close();
            })
            .catch((error) => {
                console.error(error.message);
                oGlobalBusyDialog.close();
            });            
            //await this._getStores(controller, firebaseApp);
            //await this._getGroceries(controller, firebaseApp);
        },

        checkIfDirtyRecipeEdit(controller) {
            let groceryList = controller.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
            for (let i=0;i<groceryList.length;i++) {
                if (groceryList[i].dirtyRecipe.length > 0) {
                    return true;
                }
            }
            return false;
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

        resetRecipeFields(oObject, groceryList) {
            groceryList.forEach((grocery, i) => {
                if (grocery.dirtyRecipe.length > 0) {
                    const oItem = oObject.getParent().getParent().getItems()[i];
                    groceryList[i].dirtyRecipe = "";
                    oItem.getCells()[3].setValue(groceryList[i].originalRecipe);
                }
            })
        },

        resetGroceryListView(controller) {
            controller.getView().byId("iDtblGroceryList").swipeOut(); // we are done, hide the swipeContent from screen        
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