sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(Controller) {
      "use strict";
      let parentController, parentFirebaseApp, parentServiceManager;
  
      return Controller.extend("groceryappfb.controller.addIngredient", {
        onInit: function(controller, firebaseApp, ServiceManager) {
            parentController     = controller;
            parentFirebaseApp    = firebaseApp;
            parentServiceManager = ServiceManager;
        },

        onPressOk: async function(oEvent) {
            let saveIngredient = false;
            const tt = oEvent.getSource().getParent().getModel("ingreToStore").getProperty("/saveIngreToStore/saveIngreToStore");
            for (const t of tt) {
                if (t.flag) {
                    saveIngredient = true;
                    break;
                }
            }
            parentController.getView().byId("page2").getModel("Grocery").setProperty("/DDStore", oEvent.getSource().getParent().getModel("ingreToStore").getProperty("/saveIngreToStore/saveIngreToStore"));
            parentController.getOwnerComponent().getModel("fb_signedIn_m").setProperty("/saveIngreToStore/JPGURL", oEvent.getSource().getParent().getModel("ingreToStore").getProperty("/saveIngreToStore/JPGURL"));
            oEvent.getSource().getParent().close();
            if (saveIngredient) {
                let tMsg = parentController._i18n.getText("addingIngreToDatabase");
                tMsg = tMsg.replace('&&', oEvent.getSource().getParent().getModel("ingreToStore").getProperty("/saveIngreToStore/ingredient"));
                const oGlobalBusyDialog = new sap.m.BusyDialog({text: tMsg});
                oGlobalBusyDialog.open();
                //insert ingredient to database
                await parentServiceManager.insertIngredientToDatabase(parentController, parentFirebaseApp);

                oGlobalBusyDialog.close();
            }
            await parentServiceManager.confirmToAddGrocery(parentController, parentFirebaseApp);
        },

        onPressCancel: async function(oEvent) {
            //oEvent.getSource().getParent().getModel("ingreToStore").setProperty("/saveIngreToStore/OK", false);
            //parentController.getOwnerComponent().getModel("fb_signedIn_m").setProperty("/saveIngreToStore", oEvent.getSource().getParent().getModel("ingreToStore").getProperty("/saveIngreToStore"));
            oEvent.getSource().getParent().close();
            await parentServiceManager.confirmToAddGrocery(parentController, parentFirebaseApp);
        }
      });
    }
  );