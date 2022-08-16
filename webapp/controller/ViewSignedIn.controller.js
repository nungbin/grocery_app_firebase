sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",     
    "../service/ServiceManager"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, Controller, Fragment, MessageBox, Messagetoast, ServiceManager) {
        "use strict";
        let firebaseApp, db;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function() {
                this._i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("SignedInView").attachMatched(function(oEvent) {
                    this._signedIn();
                }, this);

                firebaseApp = ServiceManager.initFirebase(this);
            },

            _signedIn: function() {
                firebaseApp = ServiceManager.initFirebase(this);
                this._signedInModel = this.getOwnerComponent().getModel("fb_signedIn_m");
                this.getView().byId("page2").setModel(this._signedInModel, "Grocery");
                ServiceManager.initialLoad(this, firebaseApp, "initialLoad");
            },

            onNavBack: function(oEvent) {
                window.history.go(-1);
            },

            onStoreComboChange: function(oEvent) {
                const keyStore = oEvent.getSource().getSelectedKey();
                const keyItem  = oEvent.getSource().getSelectedItem();
                firebaseApp = ServiceManager.initFirebase(this);
                ServiceManager.getIngrdients(this, firebaseApp, keyStore);
            },

            onIngreComboChange: function(oEvent) {
                firebaseApp = ServiceManager.initFirebase(this);
                ServiceManager.addIngredientToDatabase(this, firebaseApp);
            },

            onHandleRefresh: function(oEvent) {
                ServiceManager.initialLoad(this, firebaseApp, "initialLoad");
                oEvent.getSource().hide();
            },
            
            onPressIngreURL: function(oEvent) {
                let that = this,
                    iRowIndex = this.getView().byId("iDtblGroceryList").indexOfItem(oEvent.getSource().getParent());

                // create dialog lazily
                if (!this.byId("idImageDialog")) {
                    // load asynchronous XML fragment
                    Fragment.load({
                        id: that.getView().getId(),
                        name: "groceryappfb.view.image",
                        controller: this
                    }).then(function (oDialog) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        that._imageUrlModel = that.getOwnerComponent().getModel("fb_imageUrl_m");
                        that._imageUrlModel.getData().ingredient = that._signedInModel.getData().GroceryList[iRowIndex].Ingredient;
                        that._imageUrlModel.getData().imageURL = that._signedInModel.getData().GroceryList[iRowIndex].URL;
                        that.byId("idImageDialog").setModel(that._imageUrlModel, "image");                                
                        that.getView().addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    this.byId("idImageDialog").open();
                }
            },

            onCloseImageDialog: function(oEvent) {
                this.byId("idImageDialog").close();
            },

            onHandleDelete: function(oEvent) {
                const that = this;
                const db = firebaseApp.firestore();
                let groceryList, groceryID;

                //https://sapui5.hana.ondemand.com/sdk/#/topic/a01822c503014bc0bc6e31dfe7906817
                var oList = this.getView().byId("iDtblGroceryList"); // get the list using its Id
                var oSwipedItem = oList.getSwipedItem(); // Get which list item is swiped to delete
                let iDirtyRowIndex = this.getView().byId("iDtblGroceryList").indexOfItem(oSwipedItem);
                if (iDirtyRowIndex >= 0) {
                    groceryList = this.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
                    groceryID = groceryList[iDirtyRowIndex].id;

                    //Confirm to delete grocery
                    const sTitle = this._i18n.getText("confirmation");
                    let msgIngre = this._i18n.getText("confirmDeleteIngredient");
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
                }
            }
        });
    });
