sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",     
    "../service/ServiceManager",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (MessageToast, Controller, Fragment, MessageBox, Messagetoast, ServiceManager, formatter) {
        "use strict";
        let firebaseApp, db;

        return Controller.extend("groceryappfb.controller.View1", {
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
                    let groceryList = this.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
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
                let groceryList = this.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
                groceryList[iDirtyRowIndex].dirtyRecipe = oEvent.getSource().getValue();
            },

            onSaveRecipe: function(oEvent) {
                const that = this;
                const oObject = oEvent.getSource();
                let groceryList = this.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
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
                })
            },

            onCancelRecipe: function(oEvent) {
                const that = this;
                const sTitle = this._i18n.getText("confirmation");
                const oObject = oEvent.getSource();
                let msgIngre = this._i18n.getText("unsavedRecipe");
                let groceryList = this.getView().byId("page2").getModel("Grocery").getProperty("/GroceryList");
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
            }
        });
    });
