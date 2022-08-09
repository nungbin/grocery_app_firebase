sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";
        let firebaseApp, db;

        return Controller.extend("groceryappfb.controller.View1", {
            onInit: function () {
                // For Firebase JS SDK v7.20.0 and later, measurementId is optional
                const firebaseConfig = {
                    apiKey: "AIzaSyCnZn5FVOvY3sLcqQRDfx6xbkkCm7D2Sts",
                    authDomain: "demobook1-bd299.firebaseapp.com",
                    projectId: "demobook1-bd299",
                    storageBucket: "demobook1-bd299.appspot.com",
                    messagingSenderId: "1092205087657",
                    appId: "1:1092205087657:web:6214731f2d15362f60d2b8",
                    measurementId: "G-LFRD47GFGB"
                };
                
                firebaseApp = firebase.initializeApp(firebaseConfig);
                db = firebaseApp.firestore();
            },

            onLogin: function() {
                firebaseApp.auth().signInWithEmailAndPassword("", "")
                    .then((userCredential) => {
                        // Signed in
                        var user = userCredential.user;
                        console.log(user);
                    // ...
                    })
                    .catch((error) => {
                        var errorCode = error.code;
                        var errorMessage = error.message;
                    });

            }
        });
    });
