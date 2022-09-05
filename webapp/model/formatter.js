sap.ui.define([
    "../service/ServiceManager"
],
    function(ServiceManager) {
        "use strict";
        const valueColorCritical  = "Critical",
              valueColorGood      = "Good";
        let groceryModelName;
        
        return {
            convertFirebaseDateToJSDate: function(fbDate) {
                //date from firebase is represented as
                // let time = {
                //     seconds: 1613748319,
                //     nanoseconds: 47688698687,
                // }
                const sInvalidDate = "Invalid Date";
                const fireBaseTime = new Date(
                    fbDate.seconds * 1000 + fbDate.nanoseconds / 1000000,
                );
                let tTime = fireBaseTime.toDateString();
                if ( tTime === sInvalidDate ) {
                    tTime = new Date().toDateString();
                }
                return tTime;
                //const atTime = fireBaseTime.toLocaleTimeString();            
            },

            checkIfStoreBlank: function(storeName) {
                groceryModelName = this.getOwnerComponent().getModel("fb_signedIn_m").getProperty("/groceryModelName");
            }
        }
    }
)