/* global QUnit */

QUnit.config.autostart = false;

sap.ui.require([
   "sap/ui/test/Opa5",
   "sap/ui/test/opaQunit",
   "sap/ui/test/actions/Press"
], function (Opa5, opaTest, Press) {
   "use strict";

   QUnit.module("Controls by id");

   Opa5.extendConfig({
      viewNamespace: "rootui5.browser.view.",
      autoWait: {
         timeoutWaiter: {
            maxDelay: 500 // timeouts with delays >= 500 will not block test execution
         }
      }
   });

   opaTest("Should find element with id in the Browser view", function(Given, When, Then) {
      Given.iStartMyAppInAFrame("../browser.qunit.html");

      Then.waitFor({
         viewName : "Browser",
         id: "burgerMenu",
         success : function (element) {
            Opa5.assert.ok(element, "Found the button: burgerMenu");
         },
         errorMessage : "Did not find the button: burgerMenu"
      });

      Then.waitFor({
         viewName : "Browser",
         id: "SplitAppBrowser",
         success : function (element) {
            Opa5.assert.ok(element, "Found the button: SplitAppBrowser");
         },
         errorMessage : "Did not find the button: SplitAppBrowser"
      });

      Then.iTeardownMyAppFrame();
   });

   opaTest("Should fin element with id in the Tabs Menu view", function(Given, When, Then) {
      Given.iStartMyAppInAFrame("../browser.qunit.html");

      When.waitFor({
         id : "__button3",
         actions : new Press(),
         errorMessage : "Did not find the navigation-button"
      });

      Then.waitFor({
         id: "NewTabCE",
         success : function (element) {
            Opa5.assert.ok(element, "Found the button: new code editor button");
         },
         errorMessage : "Did not find the button: new code editor button"
      });

      Then.iTeardownMyAppFrame();
   });

   opaTest("The Split app should be in tablet mode", function(Given, When, Then) {
      Given.iStartMyAppInAFrame({
         source: "../browser.qunit.html",
         width: 375,
         height: 667
      });

      When.waitFor({
         viewName : "Browser",
         id : "SplitAppBrowser",
         errorMessage : "Did not find the SplitApp"
      });

      Then.waitFor({
         id: "SplitAppBrowser",
         viewName : "Browser",
         success : function (element) {
            Opa5.assert.strictEqual(element.isMasterShown(), false,  "The master should be hidden at start");
         },
         errorMessage : "Master is shown in tablet mode"
      });

      When.waitFor({
         viewName : "Browser",
         id : "burgerMenu",
         actions : new Press(),
         errorMessage : "Did not find the BurgerMenu button"
      });

      Then.waitFor({
         id: "SplitAppBrowser",
         viewName : "Browser",
         success : function (element) {
            Opa5.assert.strictEqual(element.isMasterShown(), true,  "The master should new be visible");
         },
         errorMessage : "The button did not show the master"
      });

      When.waitFor({
         viewName : "Browser",
         id : "burgerMenu",
         actions : new Press(),
         errorMessage : "Did not find the BurgerMenu button"
      });

      Then.iTeardownMyAppFrame();
   });

   QUnit.start();
});