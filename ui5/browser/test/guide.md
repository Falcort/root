#Integration tests

## What is an integration test
Integration tests are on the rendered GUI, it will help you verify that all elements that should be created are
well created and usable by the end user.

##How to write an integration test

First create a file named `XXXXXXXXX.qunit.html` and a file named `XXXXXXXXX.qunit.js`.

The file must contain the following lines :
```js

QUnit.config.autostart = false;

sap.ui.require([
   "sap/ui/test/Opa5",
   "sap/ui/test/opaQunit",
   "sap/ui/test/actions/Press"
], function (Opa5, opaTest) {
   "use strict";

   QUnit.module("Controls by id");

   Opa5.extendConfig({
      viewNamespace: "rootui5.view.",
      autoWait : true
   });



   QUnit.start();
});

```

Edit the ```js QUnit.module("Controls by id");```.  
Edit the name of the test file to what your file is going to test.

After the `Opa5.extendConfig({...});` add the following code :
```js
opaTest("Should find elements with id in the Browser view", function(Given, Then) {
   Given.iStartMyAppInAFrame("./browserForTests.html");

   Then.iTeardownMyAppFrame();
});
```

Replace the text with what the test should do.  
This demo function will try to find elements with their ID the in the Browser view only.
A single file can contain multiple `opaTest`, so you can test elements of all views in the same file.

Then the test itself, add those lines in the `opaTest` previously created:
```js
Then.waitFor({
     viewName : "Browser",
     id: "burgerMenu",
     success : function (element) {
        Opa5.assert.ok(true, "Found the button: burgerMenu");
     },
     errorMessage : "Did not find the button: burgerMenu"
});
```

The view name is the view where you want to find the element.  
The id is the OpenUI5 internal ID of the element the test should find.  
The success function will return you the requested object, so you can manipulate it before the assertion.  
The ```js Opa.assert``` is the real test itself if the element return is OK then the test is a success.
If not it will send you the error message.  

You can add as many `Then.waitFor({...});` that you want.

There are a lot of others `assert` functions, but for now there is no documentation, so to find them you can check the OpenUI 5 website.

In the end you have to add your created JS file into the base html file.  

```html
<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Opa sample for retrieving controls by id</title>

    <script id="sap-ui-bootstrap" src="https://openui5.hana.ondemand.com/1.73.0/resources/sap-ui-core.js"></script>

    <script src="https://openui5.hana.ondemand.com/1.73.0/resources/sap/ui/qunit/qunit-2-css.js"></script>
    <script src="https://openui5.hana.ondemand.com/1.73.0/resources/sap/ui/thirdparty/qunit-2.js"></script>
    <script src="https://openui5.hana.ondemand.com/1.73.0/resources/sap/ui/qunit/qunit-junit.js"></script>
    <script src="https://openui5.hana.ondemand.com/1.73.0/resources/sap/ui/qunit/qunit-coverage.js"></script>

    <script src="id.qunit.js"></script>
    <!-- HERE -->
    <script src="YOUR_FILE_HERE.js"></script>
    <!-- HERE -->
</head>
<body>
<div id="qunit"></div>
<div id="qunit-fixture"></div>
</body>
</html>
```
