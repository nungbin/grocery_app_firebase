sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(Controller) {
      "use strict";
  
      return Controller.extend("groceryappfb.controller.addIngredient", {
        onInit: function() {
        },

        onCloseAddIngreDialog: function(oEvent) {
            oEvent.getSource().getParent().close();
        }
      });
    }
  );