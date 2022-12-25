sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",    
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "../service/ServiceManager",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, Fragment, MessageBox, ServiceManager, formatter) {
        "use strict";
        let firebaseApp, db;
        let groceryModelName;

        return Controller.extend("groceryappfb.controller.ViewSignedIn", {
            formatter: formatter,
            
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
                groceryModelName = this.getOwnerComponent().getModel("fb_signedIn_m").getProperty("/groceryModelName");
                this.getView().byId("page2").setModel(this._signedInModel, groceryModelName);
                ServiceManager.cacheEnteredRecipe(this, []);
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

            onBtnAdd: function(oEvent) {
                const keyStore = this.getView().byId("idDDStore").getValue();
                const enteredingredient = this.getView().byId("idDDIngre").getValue();
                const msgSelectStore = this._i18n.getText("selectStore");
                const msgSelectIngredient = this._i18n.getText("selectIngredient");
        
                if ( keyStore.length === 0 ) {
                  sap.m.MessageToast.show(msgSelectStore);
                  jQuery.sap.delayedCall(500, this, function() {
                    this.getView().byId("idDDStore").focus();
                  });
                  return;
                }
                if ( enteredingredient.length === 0 ) {
                  sap.m.MessageToast.show(msgSelectIngredient);
                  jQuery.sap.delayedCall(500, this, function() {
                    this.getView().byId("idDDIngre").focus();
                  });
                  return;
                }
                firebaseApp = ServiceManager.initFirebase(this);
                if (ServiceManager.checkIfStoreExists(this)) {
                    ServiceManager.addIngredientToDatabase(this, firebaseApp);        
                }
                else {
                    let sMsg = this._i18n.getText("addStoreFirst");
                    const storeName = this.getView().byId("page2").getModel(groceryModelName).getProperty("/DDStoreValue");
                    sMsg = sMsg.replace('&&', storeName);
                    MessageToast.show(sMsg);
                }
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
                        //that._imageUrlModel.getData().ingredient = that._signedInModel.getData().GroceryList[iRowIndex].Ingredient;
                        //that._imageUrlModel.getData().imageURL = that._signedInModel.getData().GroceryList[iRowIndex].URL;
                        that._imageUrlModel.setProperty("/ingredient", that._signedInModel.getData().GroceryList[iRowIndex].Ingredient);
                        that._imageUrlModel.setProperty("/imageURL", that._signedInModel.getData().GroceryList[iRowIndex].URL);
                        that.byId("idImageDialog").setModel(that._imageUrlModel, "image");                                
                        that.getView().addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    let tempImage = that.byId("idImageDialog").getModel("image");
                    tempImage.setProperty("/ingredient", that._signedInModel.getData().GroceryList[iRowIndex].Ingredient);
                    tempImage.setProperty("/imageURL", that._signedInModel.getData().GroceryList[iRowIndex].URL);
                    this.byId("idImageDialog").open();
                }
            },

            onCloseImageDialog: function(oEvent) {
                this.byId("idImageDialog").close();
            },

            onHandleDelete: function(oEvent) {
                //https://sapui5.hana.ondemand.com/sdk/#/topic/a01822c503014bc0bc6e31dfe7906817
                var oList = this.getView().byId("iDtblGroceryList"); // get the list using its Id
                var oSwipedItem = oList.getSwipedItem(); // Get which list item is swiped to delete
                let iDirtyRowIndex = this.getView().byId("iDtblGroceryList").indexOfItem(oSwipedItem);
                if (iDirtyRowIndex >= 0) {
                    ServiceManager.deleteGrocery(this, firebaseApp);
                }
            },

            onSelectedGrocery: function(oEvent) {
                const oCheckBox = oEvent.getSource();
                if ( oEvent.getSource().getSelected() === true ) {
                    const that = this;
                    const sTitle = this._i18n.getText("confirmation");
                    let msgIngre = this._i18n.getText("confirmMoveGrocery");
                    var oList = this.getView().byId("iDtblGroceryList"); // get the list using its Id
                    const iDirtyRowIndex = oList.indexOfItem(oEvent.getSource().getParent());
                    let groceryList = this.getView().byId("page2").getModel(groceryModelName).getProperty("/GroceryList");
                    msgIngre = msgIngre.replace("&&", groceryList[iDirtyRowIndex].Ingredient);
                    MessageBox.show(msgIngre, {
                        icon: MessageBox.Icon.QUESTION,
                        title: sTitle ,
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.NO,
                        onClose: function (oAction) {
                            if (oAction === 'YES') {
                                ServiceManager.movingGroceryToHistory(that, firebaseApp, oCheckBox);
                                oCheckBox.setSelected(false);
                            }
                            else {
                                oCheckBox.setSelected(false);
                            }
                        }
                    });
                }
            },

            onGroceryItemEdit: function(oEvent) {
                // learned from https://plnkr.co/edit/qifky6plPEzFtlpyV2vb?p=preview&preview  
                const bVisible = oEvent.getSource().getDetailControl().getVisible();
                ServiceManager.onPress(oEvent.getSource(), bVisible);
            },

            onBtnAddBack: function(oEvent) {
                const that = this;
                const sTitle = this._i18n.getText("confirmation");
                let msgIngre = this._i18n.getText("confirmMoveGroceryBack");
                const oTable = this.getView().byId("iDtblHistoryGroceryList");
                const oItems = oTable.getSelectedItems();
                if (oItems.length > 0) {
                    MessageBox.show(msgIngre, {
                        icon: MessageBox.Icon.QUESTION,
                        title: sTitle ,
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.NO,
                        onClose: function (oAction) {
                            if (oAction === 'YES') {
                                ServiceManager.movingHistoryGroceryBack(that, firebaseApp);
                            }
                            that.getView().byId("iDtblGroceryList").removeSelections(true);
                            that.getView().byId("iDtblHistoryGroceryList").removeSelections(true);
                            that.getView().byId("idPanelHistory").setExpanded(false);                            
                        }
                    });
                }
            },

            onRecipeChange: function(oEvent) {
                const iDirtyRowIndex = this.getView().byId("iDtblGroceryList").indexOfItem(oEvent.getSource().getParent());
                let groceryList = this.getView().byId("page2").getModel(groceryModelName).getProperty("/GroceryList");
                groceryList[iDirtyRowIndex].dirtyRecipe = oEvent.getSource().getValue();
            },

            onSaveRecipe: function(oEvent) {
                const that = this;
                const oObject = oEvent.getSource();
                this._tempArrayRecipe = [];
                let groceryList = this.getView().byId("page2").getModel(groceryModelName).getProperty("/GroceryList");
                const txt = this._i18n.getText("savingRecipe");
                const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                oGlobalBusyDialog.open();
                Promise.all(groceryList.map(function(grocery, i) {
                    if (grocery.dirtyRecipe.length > 0) {
                        return ServiceManager.saveRecipe(that, firebaseApp, i);
                    }
                })).then(function(res) {
                    ServiceManager.resetRecipeFields(oObject, groceryList);
                    ServiceManager.resetGroceryListView(that);
                    oGlobalBusyDialog.close();

                    ServiceManager.cacheEnteredRecipe(that, that._tempArrayRecipe)
                })
            },

            onCancelRecipe: function(oEvent) {
                const that = this;
                const sTitle = this._i18n.getText("confirmation");
                const oObject = oEvent.getSource();
                let msgIngre = this._i18n.getText("unsavedRecipe");
                let groceryList = this.getView().byId("page2").getModel(groceryModelName).getProperty("/GroceryList");
                const bDirty = ServiceManager.checkIfDirtyRecipeEdit(this);
                if (bDirty === true) {
                    sap.m.MessageBox.confirm(msgIngre, {
                        icon: MessageBox.Icon.QUESTION,
                        title: sTitle ,
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.NO,
                        onClose: function(oAction) {
                          if (oAction === 'YES') {
                            const txt = that._i18n.getText("savingRecipe");
                            const oGlobalBusyDialog = new sap.m.BusyDialog({text: txt});
                            oGlobalBusyDialog.open();
                            Promise.all(groceryList.map(function(grocery, i) {
                                if (grocery.dirtyRecipe.length > 0) {
                                    return ServiceManager.saveRecipe(that, firebaseApp, i);
                                }
                            })).then(function(res) {
                                ServiceManager.resetRecipeFields(oObject, groceryList);
                                ServiceManager.resetGroceryListView(that);
                                oGlobalBusyDialog.close();
                            })
                          }
                          else {
                            ServiceManager.resetRecipeFields(oObject, groceryList);
                            ServiceManager.resetGroceryListView(that);
                          }
                          return;             
                        }
                    });            
                }
                else {
                    ServiceManager.resetRecipeFields(oObject, groceryList);
                    ServiceManager.resetGroceryListView(that);
                    return;
                }
            },

            _onPress: function(oItem, oFlag) {
                //const oFlag = oItem.getDetailControl().getVisible();

                oItem.getDetailControl().setVisible(!oFlag);
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

            onAddStore: function(oEvent) {
                let msg;
                const that = this;
                const sTitle = this._i18n.getText("confirmation");
                const storeName = this.getView().byId("page2").getModel(groceryModelName).getProperty("/DDStoreValue");
                if (ServiceManager.checkIfBlankStore(this)) {
                    msg = this._i18n.getTexT("blankStore");
                    MessageToast.show(msg);
                    return;
                }
                if (ServiceManager.checkIfStoreExists(this)) {
                    let msg = this._i18n.getText("storeExisted");
                    MessageToast.show(msg.replace('&&', storeName));
                }
                else {
                    msg = this._i18n.getText("confirmSaveStore");
                    msg = msg.replace('&&', storeName);
                    sap.m.MessageBox.confirm(msg, {
                        icon: MessageBox.Icon.QUESTION,
                        title: sTitle,
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.NO,
                        onClose: function(oAction) {
                          if (oAction === 'YES') {
                            ServiceManager.saveStoreToDatabase(that, firebaseApp);
                          }
                        }
                    });
                }
            }
        });
    });