sap.ui.define(['sap/ui/core/Component',
               'sap/ui/core/mvc/Controller',
               'sap/ui/core/Icon',
               'sap/ui/core/mvc/XMLView',
               'sap/m/Text',
               'sap/m/CheckBox',
               'sap/m/MessageBox',
               'sap/m/MessageToast',
               'sap/m/TabContainerItem',
               'sap/ui/layout/Splitter',
               "sap/ui/core/ResizeHandler",
               "sap/ui/layout/HorizontalLayout",
               "sap/ui/table/Column",
               "sap/ui/core/util/File",
               "sap/ui/model/json/JSONModel",
               "rootui5/browser/model/BrowserModel",
               "sap/ui/core/Fragment",
               "sap/m/Link",
               "sap/ui/codeeditor/CodeEditor",
               "sap/m/TabContainerItem",
],function(Component, Controller, CoreIcon, XMLView, mText, mCheckBox, MessageBox, MessageToast, TabContainerItem,
           Splitter, ResizeHandler, HorizontalLayout, tableColumn, File, JSONModel, BrowserModel, Fragment, Link, CodeEditor) {

   "use strict";

   /** Central ROOT RBrowser controller
    * All Browser functionality is loaded after main ui5 rendering is performed */

   return Controller.extend("rootui5.browser.controller.Browser", {
      onInit: async function () {

        this.globalId = 1;

         this.websocket = this.getView().getViewData().conn_handle;

         // this is code for the Components.js
         // this.websocket = Component.getOwnerComponentFor(this.getView()).getComponentData().conn_handle;

         this.websocket.SetReceiver(this);
         this.websocket.Connect();

         // if true, most operations are performed locally without involving server
         this.standalone = this.websocket.kind == "file";

         // create model only for browser - no need for anybody else
         this.model = new BrowserModel();

         // copy extra attributes from element to node in the browser
         // later can be done automatically
         this.model.addNodeAttributes = function(node, elem) {
            node.icon = elem.icon;
            node.fsize = elem.fsize;
            node.mtime = elem.mtime;
            node.ftype = elem.ftype;
            node.fuid = elem.fuid;
            node.fgid = elem.fgid;
            node.className = elem.className
         };

         var t = this.getView().byId("treeTable");
         t.setModel(this.model);

         this.model.assignTreeTable(t);
         t.addColumn(new tableColumn({
            label: "Name",
            autoResizable: true,
            visible: true,
            template: new HorizontalLayout({
               content: [
                         new CoreIcon({src:"{icon}"}),
                         new mText({text:" {name}", renderWhitespace: true, wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Size",
            autoResizable: true,
            visible: true,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fsize}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Time",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{mtime}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "Type",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{ftype}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "UID",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fuid}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "GID",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{fgid}", wrapping: false })
                         ]
            })
         }));
         t.addColumn(new tableColumn({
            label: "ClassName",
            autoResizable: true,
            visible: false,
            template: new HorizontalLayout({
               content: [
                         new mText({text:"{className}", wrapping: false })
                         ]
            })
         }));

         // catch re-rendering of the table to assign handlers
         t.addEventDelegate({
            onAfterRendering: function() { this.assignRowHandlers(); }
         }, this);

         // FIXME: one have to find direct method to configure this
         this.byId("browserMaster").addEventDelegate({
            onAfterRendering: function() { this.getView().byId("treeTableBox").$().children().first().css('flex-grow',1); }
         }, this);


            let tabContainerItem = this.getView().byId("defaultCodeEditor");

            this.newCodeEditor();

            //
            // defaultCodeEditor.attachChange( function() {
            //    this.getModel().setProperty("/modified", true);
            // });

            this.drawingOptions = { TH1: 'hist', TH2: 'COL', TProfile: 'E0'};

      },

     /* =========================================== */
     /* =============== Code Editor =============== */
     /* =========================================== */

     newCodeEditor: async function () {
       const oTabContainer = this.getView().byId("myTabContainer");

       const oTabContainerItem = new TabContainerItem("CodeEditor"+this.globalId, {
         icon: "sap-icon://write-new-document",
         name: "Code Editor",
         additionalText: "untitled"
       });

       const oCodeEditorFragment = this.newCodeEditorFragment(this.globalId);
       let ID = this.globalId;
       this.globalId++;

       oTabContainerItem.addContent(oCodeEditorFragment);
       oTabContainer.addItem(oTabContainerItem);
       oTabContainer.setSelectedItem(oTabContainerItem);

       sap.ui.getCore().byId("CodeEditor" + ID + "CodeEditor").setModel(new JSONModel({
         code: "",
         ext: "",
         filename: "",
         fullpath: "",
         modified: false
       }));
     },

     newCodeEditorFragment: function(ID) {
       let fragment = new sap.ui.layout.Splitter("CodeEditor" + ID + "Splitter", {
           orientation: "Vertical",
           contentAreas: [
             new sap.m.Toolbar("CodeEditor" + ID + "Toolbar", {
               content: [
                 new sap.ui.unified.FileUploader("CodeEditor" + ID + "FileUploader", { }),
                 new sap.m.Button("CodeEditor" + ID + "SaveAs", {
                   text: "Save as...",
                   tooltip: "Save current file as...",
                 }),
                 new sap.m.Button("CodeEditor" + ID + "Save", {
                   text: "Save",
                   tooltip: "Save current file",
                 }),
                 new sap.m.Button("CodeEditor" + ID + "Run", {
                   text: "Run",
                   tooltip: "Run Current Macro",
                   icon: "sap-icon://play",
                   enabled: false,
                 }),
               ],
               layoutData: new sap.ui.layout.SplitterLayoutData("CodeEditor" + ID + "SplitterLayoutData", {
                 size: "35px",
                 resizable: false
               })
             }),
             new sap.ui.codeeditor.CodeEditor("CodeEditor" + ID + "CodeEditor", {
               height: "100%",
               colorTheme: "default",
               type: "c_cpp",
               value: "{/code}"
             })
           ]
         });
       sap.ui.getCore().byId("CodeEditor" + ID + "FileUploader").attachChange(this.onChangeFile, this);
       sap.ui.getCore().byId("CodeEditor" + ID + "SaveAs").attachPress(this.onSaveAs, this);
       sap.ui.getCore().byId("CodeEditor" + ID + "Save").attachPress(this.onSaveFile, this);
       sap.ui.getCore().byId("CodeEditor" + ID + "Run").attachPress(this.onRunMacro, this);
       sap.ui.getCore().byId("CodeEditor" + ID + "CodeEditor").attachChange(function () {
         this.getModel().setProperty("/modified", true);
       });
       return fragment;
     },

     /** @brief Handle the "Save As..." button press event */
     onSaveAs: function() {
       const oEditor = this.getView().byId("aCodeEditor");
       const oModel = oEditor.getModel();
       const sText = oModel.getProperty("/code");
       let filename = oModel.getProperty("/filename");
       let ext = oModel.getProperty("/ext");
       if (filename === undefined) filename = "untitled";
       if (ext === undefined) ext = "txt";
       File.save(sText, filename, ext);
       oModel().setProperty("/modified", false);
     },

     /** @brief Handle the "Save" button press event */
     onSaveFile: function() {
       const oEditor = this.getSelectedCodeEditorTab();
       const oModel = oEditor.getModel();
       const sText = oModel.getProperty("/code");
       const fullpath = oModel.getProperty("/fullpath");
       if (fullpath === undefined)
         return onSaveAs();
       oModel.setProperty("/modified", false);
       return this.websocket.Send("SAVEFILE:" + fullpath + ":" + sText);
     },

     reallyRunMacro: function() {
       const oEditor = this.getSelectedCodeEditorTab();
       const oModel = oEditor.getModel();
       const fullpath = oModel.getProperty("/fullpath");
       if (fullpath === undefined)
         return this.onSaveAs();
       return this.websocket.Send("RUNMACRO:" + fullpath);
     },

     /** @brief Handle the "Run" button press event */
     onRunMacro: function() {
       const oEditor = this.getSelectedCodeEditorTab();
       const oModel = oEditor.getModel();
       if (oModel.getProperty("/modified") === true) {
         MessageBox.confirm('The text has been modified! Do you want to save it?', {
           title: 'Run Macro',
           icon: sap.m.MessageBox.Icon.QUESTION,
           actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL],
           onClose: (oAction) => {
             if (oAction === MessageBox.Action.YES)
               this.onSaveFile();
             else if (oAction === MessageBox.Action.CANCEL)
               return;
             return this.reallyRunMacro();
           }
         });
       }
       else
         return this.reallyRunMacro();
     },

     getSelectedCodeEditorTab: function(no_warning) {
       // FIXME: Thibault, one can much easily detect widget type
       // otherwise too many checks required
       let oTabItemString = this.getView().byId("myTabContainer").getSelectedItem();

       if(oTabItemString.indexOf("CodeEditor") !== -1) {
         let oCodeEditor = sap.ui.getCore().byId(oTabItemString+"CodeEditor");
         if (oCodeEditor) {
           return oCodeEditor;
         }
       } else {
         if (!no_warning) MessageToast.show("Sorry, you need to select a code editor tab", {duration: 1500});
         return -1;
       }
     },

     /** @brief Extract the file name and extension
      * @desc Used to set the editor's model properties and display the file name on the tab element  */
     setFileNameType: function(filename) {
       var oEditor = this.getSelectedCodeEditorTab();
       var oModel = oEditor.getModel();
       var oTabElement = oEditor.getParent().getParent();
       var ext = "txt";
       let runButton = this.getRunButtonFromCodeEditor(oEditor);
       runButton.setEnabled(false);
       if (filename.lastIndexOf('.') > 0)
         ext = filename.substr(filename.lastIndexOf('.') + 1);

       switch(ext.toLowerCase()) {
         case "c":
         case "cc":
         case "cpp":
         case "cxx":
           runButton.setEnabled(true);
           oEditor.setType('c_cpp');
           break;
         case "h":
         case "hh":
         case "hxx":
           oEditor.setType('c_cpp');
           break;
         case "f":
           oEditor.setType('fortran');
           break;
         case "htm":
         case "html":
           oEditor.setType('html');
           break;
         case "js":
           oEditor.setType('javascript');
           break;
         case "json":
           oEditor.setType('json');
           break;
         case "md":
           oEditor.setType('markdown');
           break;
         case "py":
           oEditor.setType('python');
           break;
         case "tex":
           oEditor.setType('latex');
           break;
         case "cmake":
         case "log":
         case "txt":
           oEditor.setType('plain_text');
           break;
         case "xml":
           oEditor.setType('xml');
           break;
         default: // unsupported type
           if (filename.lastIndexOf('README') >= 0)
             oEditor.setType('plain_text');
           else
             return false;
           break;
       }
       console.log(oEditor.getType());
       oTabElement.setAdditionalText(filename);
       if (filename.lastIndexOf('.') > 0)
         filename = filename.substr(0, filename.lastIndexOf('.'));
       oModel.setProperty("/filename", filename);
       oModel.setProperty("/ext", ext);
       return true;
     },

     /** @brief Handle the "Browse..." button press event */
     onChangeFile: function(oEvent) {
       var oEditor = this.getSelectedCodeEditorTab();
       var oModel = oEditor.getModel();
       var oReader = new FileReader();
       oReader.onload = function() {
         oModel.setProperty("/code", oReader.result);
       };
       var file = oEvent.getParameter("files")[0];
       if (this.setFileNameType(file.name))
         oReader.readAsText(file);
     },

     /* =========================================== */
     /* =============== Code Editor =============== */
     /* =========================================== */

     _getSettingsMenu: async function () {
       if (!this._oSettingsMenu) {
         let myThis = this;
         await Fragment.load({name: "rootui5.browser.view.settingsmenu"}).then(function (oSettingsMenu) {
           let oModel = new JSONModel({
             "TH1": [
               { "name": "hist" },
               { "name": "P" },
               { "name": "P0" },
               { "name": "E" },
               { "name": "E1" },
               { "name": "E2" },
               { "name": "E3" },
               { "name": "E4" },
               { "name": "E1X0" },
               { "name": "L" },
               { "name": "LF2" },
               { "name": "B" },
               { "name": "B1" },
               { "name": "A" },
               { "name": "TEXT" },
               { "name": "LEGO" },
               { "name": "same" }
             ],
             "TH2": [
               { "name": "COL" },
               { "name": "COLZ" },
               { "name": "COL0"},
               { "name": "COL1" },
               { "name": "COL0Z" },
               { "name": "COL1Z" },
               { "name": "COLA" },
               { "name": "BOX" },
               { "name": "BOX1" },
               { "name": "PROJ" },
               { "name": "PROJX1" },
               { "name": "PROJX2" },
               { "name": "PROJX3" },
               { "name": "PROJY1" },
               { "name": "PROJY2" },
               { "name": "PROJY3" },
               { "name": "SCAT" },
               { "name": "TEXT" },
               { "name": "TEXTE" },
               { "name": "TEXTE0" },
               { "name": "CONT" },
               { "name": "CONT1" },
               { "name": "CONT2" },
               { "name": "CONT3" },
               { "name": "CONT4" },
               { "name": "ARR" },
               { "name": "SURF" },
               { "name": "SURF1" },
               { "name": "SURF2" },
               { "name": "SURF4" },
               { "name": "SURF6" },
               { "name": "E" },
               { "name": "A" },
               { "name": "LEGO" },
               { "name": "LEGO0" },
               { "name": "LEGO1" },
               { "name": "LEGO2" },
               { "name": "LEGO3" },
               { "name": "LEGO4" },
               { "name": "same" }
             ],
             "TProfile": [
               { "name": "E0" },
               { "name": "E1" },
               { "name": "E2" },
               { "name": "p" },
               { "name": "AH" },
               { "name": "hist" }
             ]
           });
           oSettingsMenu.setModel(oModel);
           oSettingsMenu.attachConfirm(myThis.handleSettingsConfirm);
           myThis.getView().addDependent(oSettingsMenu);

           myThis._oSettingsMenu = oSettingsMenu;
         });
         sap.ui.getCore().byId("do-TH1").attachChange(this, this.handleSettingsChange);
         sap.ui.getCore().byId("do-TH2").attachChange(this, this.handleSettingsChange);
         sap.ui.getCore().byId("do-TProfile").attachChange(this, this.handleSettingsChange);
       }
       return this._oSettingsMenu;
     },

     onSettingPress: async function() {
        await this._getSettingsMenu();
        this._oSettingsMenu.open();
     },

     handleSettingsChange: function(oEvent, myThis) {
        let graphType = oEvent.getSource().sId.split("-")[1];
        myThis.drawingOptions[graphType] = oEvent.getSource().mProperties.value;
        // ß
     },

      /** @brief Assign the "double click" event handler to each row */
      assignRowHandlers: function() {
         var rows = this.byId("treeTable").getRows();
         for (var k=0;k<rows.length;++k) {
            rows[k].$().dblclick(this.onRowDblClick.bind(this, rows[k]));
         }
      },

      /** @brief Send RBrowserRequest to the browser */
      sendBrowserRequest: function(_oper, args) {
         var req = { path: "", first: 0, number: 0, sort: _oper };
         JSROOT.extend(req, args);
         this.websocket.Send("BRREQ:" + JSON.stringify(req));
      },

      updateBReadcrumbs: function(jsonString) {
        let json = JSON.parse(jsonString);
        let split = json.path.split("/");
        let oBreadcrumbs = this.getView().byId("breadcrumbs");
        oBreadcrumbs.removeAllLinks();
        for (let i=0; i<split.length; i++) {
          if (i === split.length-1) {
            oBreadcrumbs.setCurrentLocationText(split[i]);
          } else if (i === 0) {
             let link = new Link();
             if (split[i].length === 2 && split[i][1] === ':') // Windows drive letter
               link.setText(split[i]);
             else
               link.setText("/");
            link.attachPress(this, this.onBreadcrumbsPress, this);
            oBreadcrumbs.addLink(link);
          } else {
            let link = new Link({text: split[i]});
            link.attachPress(this, this.onBreadcrumbsPress, this);
            oBreadcrumbs.addLink(link);
          }
        }
      },

     onBreadcrumbsPress: function(oEvent) {
        let sId = oEvent.getSource().sId;
        let oBreadcrumbs = oEvent.getSource().getParent();
        let oLinks = oBreadcrumbs.getLinks();
        let path = "/";
        for (let i = 1; i<oLinks.length; i++) {
          if (oLinks[i].sId === sId ) {
            path += oLinks[i].getText();
            break;
          }
          path += oLinks[i].getText() + "/";
        }

        console.log('calling onBreadcrumbsPress', path);

        this.websocket.Send('CHDIR:' + path);

        this.doReload(true);
     },

     sendDblClick: function(fullpath, opt) {
        this.websocket.Send('DBLCLK: ["'  + fullpath + '","' + (opt || "") + '"]' );
     },

      /** @brief Double-click event handler */
      onRowDblClick: function(row) {
        var ctxt = row.getBindingContext(),
            prop = ctxt ? ctxt.getProperty(ctxt.getPath()) : null,
            fullpath = (prop && prop.fullpath) ? prop.fullpath.substr(1, prop.fullpath.length-2) : "";

        if (row._bHasChildren) {
          let rowText = row.getCells()[0].getContent()[1].getText().substr(1);
          if(!rowText.endsWith(".root")) {
            let oBreadcrumbs = this.getView().byId("breadcrumbs");
            let links = oBreadcrumbs.getLinks();
            let currentText =  oBreadcrumbs.getCurrentLocationText();
            let path = "/";
            for (let i = 1; i<links.length; i++) {
              path += links[i].getText() + "/";
            }
            path += currentText + "/";

            if (row._iLevel !== 0) { // If the clicked row is a child, i need to find all the path from that child to the upper parent
              let ilevel = row._iLevel;
              let rows = row.getParent().getRows();
              let rowIndex;
              let result = [];
              let i;
              for (i=0; i<rows.length; i++) {
                if (rows[i] === row) {
                  rowIndex = i;
                  break;
                }
              }
              for (i = rowIndex; i !== -1; i--) {
                if (rows[i]._iLevel === ilevel-1) {
                  result.push(rows[i].getCells()[0].getContent()[1].getText().substr(1));
                  ilevel--;
                  if(ilevel === 0) {
                    break;
                  }
                }
              }
              result = result.reverse();
              result.push(rowText);
              for (i=0; i<result.length; i++) {
                path += result[i] + "/";
              }
            } else {
              path += rowText + "/";
            }

            this.websocket.Send('CHDIR:' + path);

            this.doReload(true);

            return;
          }
        }

        if (!fullpath) return;

        // first try to activate editor
        let codeEditor = this.getSelectedCodeEditorTab();
        if(codeEditor !== -1) {
          var oModel = codeEditor.getModel();

          // FIXME: wrong place, only when server returns result, one can update full path or model
          oModel.setProperty("/fullpath", fullpath);
          this.getSaveButtonFromCodeEditor(codeEditor).setEnabled(true);
          var filename = fullpath.substr(fullpath.lastIndexOf('/') + 1);
          if (this.setFileNameType(filename))
             return this.sendDblClick(fullpath, "$$$editor$$$");
        }

        let viewerTab = this.getSelectedImageViewer(true);
        if (viewerTab !== -1) {
           // FIXME: wrong place, should be configured when server replied
           viewerTab.setAdditionalText(fullpath);
           return this.sendDblClick(fullpath, "$$$image$$$");
        }

        let className = this.getBaseClass(prop ? prop.className : "");
        let drawingOptions = "";
        if (className && this.drawingOptions[className])
           drawingOptions = this.drawingOptions[className];

        return this.sendDblClick(fullpath, drawingOptions);
      },

      getBaseClass: function(className) {
         if (typeof className !== 'string')
            className = "";
         if (className.match(/^TH1/)) {
            return "TH1";
         } else if (className.match(/^TH2/)) {
            return "TH2";
         }
         return className;
      },

      OnWebsocketOpened: function(handle) {
         this.isConnected = true;

         if (this.model)
            this.model.sendFirstRequest(this.websocket);

      },

      OnWebsocketClosed: function() {
         // when connection closed, close panel as well
         console.log('CLOSE WINDOW WHEN CONNECTION CLOSED');

         if (window) window.close();

         this.isConnected = false;
      },

     getSelectedImageViewer: function(no_warning) {
       let oTabItemString = this.getView().byId("myTabContainer").getSelectedItem();

       let oTabItem = sap.ui.getCore().byId(oTabItemString);

       if (oTabItem.getName() === "Image Viewer") {
         return oTabItem;
       }

       if (!no_warning) MessageToast.show("Sorry, you need to select an image viewer tab", {duration: 1500});
       return -1;
     },

     getSaveButtonFromCodeEditor: function(oCodeEditor) {
        let oSplitter = oCodeEditor.getParent();
        let oToolBar = oSplitter.mAggregations.contentAreas[0];
        let oToolBarContent = oToolBar.getContent();

        return oToolBarContent[2];
     },

     getRunButtonFromCodeEditor: function(oCodeEditor) {
       let oSplitter = oCodeEditor.getParent();
       let oToolBar = oSplitter.mAggregations.contentAreas[0];
       let oToolBarContent = oToolBar.getContent();

       return oToolBarContent[3];
     },

     /** Entry point for all data from server */
     OnWebsocketMsg: function(handle, msg, offset) {

       console.log(msg);

         if (typeof msg != "string")
            return console.error("Browser do not uses binary messages len = " + mgs.byteLength);

         let mhdr = msg.split(":")[0];
         msg = msg.substr(mhdr.length+1);

         switch (mhdr) {
         case "INMSG":
            this.processInitMsg(msg);
            break;
         case "FREAD":  // file read
            let result = this.getSelectedCodeEditorTab();
            if (result !== -1)
               result.getModel().setProperty("/code", msg);
            break;
         case "FIMG":  // image file read
            let imageTab = this.getSelectedImageViewer(true);
            if(imageTab !== -1) {
               // FIXME: why not use imageTab??
               let oContent = sap.ui.getCore().byId(this.getView().byId("myTabContainer").getSelectedItem());
               let oImage = oContent.getContent()[0].getItems()[0];
               oImage.setSrc(msg);
            }
            break;
         case "CANVS":  // canvas created by server, need to establish connection
            var arr = JSON.parse(msg);
            this.createCanvas(arr[0], arr[1], arr[2]);
            break;
         case "GETWORKDIR":
            this.updateBReadcrumbs(msg);
            break;
         case "SLCTCANV": // Selected the back selected canvas
           let oTabContainer = this.byId("myTabContainer");
           let oTabContainerItems = oTabContainer.getItems();
           for(let i=0; i<oTabContainerItems.length; i++) {
             if (oTabContainerItems[i].getAdditionalText() === msg) {
               oTabContainer.setSelectedItem(oTabContainerItems[i]);
               break;
             }
           }
           break;
         case "BREPL":   // browser reply
            if (this.model) {
               var bresp = JSON.parse(msg);
               this.model.processResponse(bresp);

               if (bresp.path === '/') {
                  var tt = this.getView().byId("treeTable");
                  var cols = tt.getColumns();
                  tt.autoResizeColumn(2);
                  tt.autoResizeColumn(1);
                  // for (var k=0;k<cols.length;++k)
                  //    tt.autoResizeColumn(k);
               }
            }
            break;
         default:
            console.error('Non recognized msg ' + mhdr + ' len=' + msg.length);
         }
      },

      /** Get the ID of the currently selected tab of given tab container */
      getSelectedtabFromtabContainer: function(divid) {
         var  tabContainer = this.getView().byId('myTabContainer').getSelectedItem();
         return tabContainer.slice(6, tabContainer.length);
      },

      /** Show special message instead of nodes hierarchy */
      showTextInBrowser: function(text) {
         var br = this.byId("treeTable");
         br.collapseAll();
         if (!text || (text === "RESET")) {
            br.setNoData("");
            br.setShowNoData(false);

            this.model.setNoData(false);
            this.model.refresh();

         } else {
            br.setNoData(text);
            br.setShowNoData(true);
            this.model.setNoData(true);
            this.model.refresh();
         }
      },

      onBeforeRendering: function() {
         this.renderingDone = false;
      },

      onAfterRendering: function() {
         this.renderingDone = true;
      },

      /** Reload (refresh) file tree browser */
      onRealoadPress: function (oEvent) {
         this.doReload(true);
      },

      doReload: function(force) {
         if (this.standalone) {
            this.showTextInBrowser();
            this.paintFoundNodes(null);
            this.model.setFullModel(this.fullModel);
         } else {
            this.model.reloadMainModel(force);
         }
      },

      /** Quit ROOT session */
      onQuitRootPress: function(oEvent) {
         this.websocket.Send("QUIT_ROOT");
      },

      onSearch : function(oEvt) {
         this.changeItemsFilter(oEvt.getSource().getValue());
      },

      /** Submit node search query to server, ignore in offline case */
      changeItemsFilter: function(query, from_handler) {

         if (!from_handler) {
            // do not submit immediately, but after very short timeout
            // if user types very fast - only last selection will be shown
            if (this.search_handler) clearTimeout(this.search_handler);
            this.search_handler = setTimeout(this.changeItemsFilter.bind(this, query, true), 1000);
            return;
         }

         delete this.search_handler;

         this.model.changeItemsFilter(query);
      },


      /** @brief Add Tab event handler */
      addNewButtonPressHandler: async function(oEvent) {
        var oButton = oEvent.getSource().mAggregations._tabStrip.mAggregations.addButton;

        // create action sheet only once
        if (!this._actionSheet) {
          let myThis = this;
          await Fragment.load({name: "rootui5.browser.view.tabsmenu"}).then(function (oFragment) {
            myThis.getView().addDependent(oFragment);
            myThis._actionSheet = oFragment;
          });
          sap.ui.getCore().byId("NewTabR6").attachPress("NEWTCANVAS", this.newRootXCanvas, this);
          sap.ui.getCore().byId("NewTabR7").attachPress("NEWRCANVAS", this.newRootXCanvas, this);
          sap.ui.getCore().byId("NewTabCE").attachPress("", this.newCodeEditor, this);
          sap.ui.getCore().byId("NewTabIV").attachPress("", this.newImageViewer, this);
        }
        this._actionSheet.openBy(oButton);
      },

     newRootXCanvas: function(oEvent, msg) {
       if (this.isConnected)
          this.websocket.Send(msg);
     },

     newImageViewer: async function() {
       let oTabContainer = this.getView().byId("myTabContainer");

       let tabContainerItem = new TabContainerItem({
         icon: "sap-icon://background",
         name:"Image Viewer",
         additionalText: "untitled"
       });

       await Fragment.load({name: "rootui5.browser.view.imageviewer"}).then(function (oFragment) {
         tabContainerItem.removeAllContent();
         tabContainerItem.addContent(oFragment);
       });

       oTabContainer.addItem(tabContainerItem);
       oTabContainer.setSelectedItem(tabContainerItem);
     },

      /** process initial message, now it is list of existing canvases */
      processInitMsg: function(msg) {
         this.websocket.Send('GETWORKDIR:'); // Update the breadcrumbs
         var arr = JSROOT.parse(msg);
         if (!arr) return;

         for (var k=0; k<arr.length; ++k) {
            this.createCanvas(arr[k][0], arr[k][1], arr[k][2]);
         }
      },

      createCanvas: function(kind, url, name) {
         console.log("Create canvas ", url, name);
         if (!url || !name) return;

         var oTabContainer = this.byId("myTabContainer");
         var oTabContainerItem = new TabContainerItem({
            name: "ROOT Canvas",
            icon: "sap-icon://column-chart-dual-axis"
         });

         oTabContainerItem.setAdditionalText(name); // name can be used to set active canvas or close canvas

         oTabContainer.addItem(oTabContainerItem);

         // Change the selected tabs, only if it is new one, not the basic one
         if(name !== "rcanv1") {
           oTabContainer.setSelectedItem(oTabContainerItem);
         }

         var conn = new JSROOT.WebWindowHandle(this.websocket.kind);

         // this is producing
         var addr = this.websocket.href, relative_path = url;
         if (relative_path.indexOf("../")==0) {
            var ddd = addr.lastIndexOf("/",addr.length-2);
            addr = addr.substr(0,ddd) + relative_path.substr(2);
         } else {
            addr += relative_path;
         }

         var painter = null;

         if (kind == "root7") {
            painter = new JSROOT.v7.TCanvasPainter(null);
         } else {
            painter = new JSROOT.TCanvasPainter(null);
         }

         painter.online_canvas = true;
         painter.use_openui = true;
         painter.batch_mode = false;
         painter._window_handle = conn;
         painter._window_handle_href = addr; // argument for connect

         XMLView.create({
            viewName: "rootui5.canv.view.Canvas",
            viewData: { canvas_painter: painter },
            height: "100%"
         }).then(function(oView) {
            oTabContainerItem.addContent(oView);
            // JSROOT.CallBack(call_back, true);
         });
      },

      tabSelectItem: function(oEvent) {
         var oTabContainer = this.byId("myTabContainer");
         var oItemSelected = oEvent.getParameter('item');

         if (oItemSelected.getName() != "ROOT Canvas") return;

         console.log("Canvas selected:", oItemSelected.getAdditionalText());

         this.websocket.Send("SELECT_CANVAS:" + oItemSelected.getAdditionalText());

      },

      /** @brief Close Tab event handler */
      tabCloseHandler: function(oEvent) {
         // prevent the tab being closed by default
         oEvent.preventDefault();

         var oTabContainer = this.byId("myTabContainer");
         var oItemToClose = oEvent.getParameter('item');
         // prevent closing the Code Editor
         if (oItemToClose.getName() == "Code Editor") {
            MessageToast.show("Sorry, you cannot close the Code Editor", {duration: 1500});
            return;
         }

         var pthis = this;

         MessageBox.confirm('Do you really want to close the "' + oItemToClose.getName() + '" tab?', {
            onClose: function (oAction) {
               if (oAction === MessageBox.Action.OK) {
                  if (oItemToClose.getName() == "ROOT Canvas")
                     pthis.websocket.Send("CLOSE_CANVAS:" + oItemToClose.getAdditionalText());

                  oTabContainer.removeItem(oItemToClose);

                  MessageToast.show('Closed the "' + oItemToClose.getName() + '" tab', {duration: 1500});
               }
            }
         });
      }
   });

});
