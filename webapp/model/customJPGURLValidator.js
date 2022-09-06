sap.ui.define([
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException"
], function (SimpleType, ValidateException) {
    "use strict";
    const sErrorMsg = " is not a valid http jpg format.";

    return SimpleType.extend("groceryappfb.model.customJPGURLValidator", {
        formatValue: function(sValue) {
            return sValue;
        },

        parseValue: function(sValue) {
            return sValue;
        },

        validateValue: function(sValue) {
            //https://stackoverflow.com/questions/4098415/use-regex-to-get-image-url-in-html-js
            //https://blog.bitsrc.io/a-beginners-guide-to-regular-expressions-regex-in-javascript-9c58feb27eb4
            let regex = /http[s]?:\/\/.*\.(?:png|jpg|gif|svg|jpeg)/;
            if (sValue.length > 0) {
                if (!regex.test(sValue)) {
                    throw new ValidateException(sValue + sErrorMsg);
                }    
            }
        }
    });

});