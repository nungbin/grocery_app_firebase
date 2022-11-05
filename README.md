## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Mon Aug 08 2022 21:32:24 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>@sap/generator-fiori-freestyle|
|**App Generator Version**<br>1.6.7|
|**Generation Platform**<br>[SAP Business Application Studio](https://account.hanatrial.ondemand.com/trial/#/home/trial)|
|**Floorplan Used**<br>simple|
|**Service Type**<br>None|
|**Service URL**<br>N/A
|**Module Name**<br>grocery_app_firebase|
|**Application Title**<br>Test Firebase|
|**Namespace**<br>|
|**UI5 Theme**<br>sap_fiori_3|
|**UI5 Version**<br>1.71.2|
|**Enable Code Assist Libraries**<br>False|
|**Add Eslint configuration**<br>False|

## Grocery Mobile App, with Firebase

A Fiori application.

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  In order to launch the generated app, simply run the following from the generated app root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)



#### To make the app applicable for mobile, keep only these two libraries in manifest.json
```
    "libs": {
      "sap.ui.core": {},
      "sap.m": {}
    }
```
