sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Filter, FilterOperator) {
	"use strict";

    return {
        initFirebase(controller) {
            const firebaseConfig = controller.getOwnerComponent().getModel("fb_login_m").getData();
            return firebase.initializeApp(firebaseConfig);
        }
    }
})