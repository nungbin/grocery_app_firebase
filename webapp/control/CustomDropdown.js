// Created using JS Bin
// http://jsbin.com

// Copyright (c) 2022 by anonymous (http://jsbin.com/paqelujoru/2/edit)

// Released under the MIT license: http://jsbin.mit-license.org
sap.ui.define(["sap/ui/core/Control"], function(Control) {
	"use strict";
	return Control.extend("groceryappfb.control.CustomDropdown", {
        metadata: {
            properties : {
                placeholder: {type : "string", defaultValue : ""}
            },
            aggregations : {
                _input: {type : "sap.m.Input", multiple: false, visibility : "hidden"},
                items:  {type : "sap.m.ActionListItem", multiple : true, singularName : "item"}
            },
			events : {
                addStore: {
					parameters: {
                        storeName: {type: "string"}
					}
                },
				selectionChange: {
					parameters: {
						value:     {type: "int"}
					}
				}
			}                            
        },

        init: function() {
            this.setAggregation("_input", new sap.m.Input({
                placeholder:      this.getPlaceholder(),
                showValueHelp:    true,
                liveChange:       this._onLiveChange.bind(this),
                valueHelpRequest: this._onValueHelp.bind(this)
            }));
        },

        onBeforeRendering: function() {
            this.getAggregation("_input").setPlaceholder(this.getPlaceholder());
        },

        onAfterRendering: function() {
        },

        renderer: function (oRm, oControl) {
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oControl.getAggregation("_input"));
            oRm.write("</div>");
        },

        _onLiveChange: function(oEvent) {
            this._openPopover();
            this.__customFilter(this.getAggregation("_input").getValue().toUpperCase());
            this._oPopover.openBy(this);
        },

        _onValueHelp: function(oEvent) {
            this._openPopover();
            this.__customFilter(this.getAggregation("_input").getValue().toUpperCase());
            this._checkIfPopoverOpen();
        },

        _onPressOk: function(oEvent) {
            this._closePopover();
        },

        _onAddStore: function(oEvent) {
            this._oPopover.close();
			this.fireEvent("addStore", {
                storeName: this.getAggregation("_input").getValue(),
			});
        },

        _onItemSelected: function(oEvent) {
            this.getAggregation("_input").setValue(oEvent.getSource().getProperty("text"));
            const pos = oEvent.getSource().getParent().getItems().indexOf(oEvent.getSource());
            this._oPopover.close();
			this.fireEvent("selectionChange", {
				value: pos
			});
        },

        _openPopover: function() {
            if (this._oList === undefined) {
                this._oList = new sap.m.List({
                    noDataText:       "Please enter a store and click on Add to add a store."
                });    
            }
            this._oList.unbindAggregation("items");
            this._oList.setModel(this.getModel());
            this.getBindingInfo("items").template.attachPress(this._onItemSelected.bind(this));
            // this._oList.bindItems(this.getBindingInfo("items").path, 
            //                       this.getBindingInfo("items").template);
            this._oList.bindAggregation("items", {  path:  this.getBindingInfo("items").path,
                                                           template: this.getBindingInfo("items").template,
                                                           templateShareable: true
                                                 }
                                       );

            if (this._oPopover === undefined) {
                //https://stackoverflow.com/questions/45475348/sapui5-using-popover-as-a-tooltip
                this._oPopover = new sap.m.Popover({
                    showHeader: false,
                    showArrow: false,
                    //https://github.com/SAP/openui5/blob/master/src/sap.m/test/sap/m/Toolbar.html
                    customHeader: new sap.m.Toolbar({
                        content: [
                            new sap.m.Button({
                                text: "Add store",
                                type: sap.m.ButtonType.Default,
                                press: this._onAddStore.bind(this)
                            }).addStyleClass("sapUiTinyMarginBeginEnd"),
                            new sap.m.Button({
                                text: "Ok",
                                type: sap.m.ButtonType.Accept,
                                press: this._onPressOk.bind(this)
                            }).addStyleClass("sapUiTinyMarginBeginEnd")    
                        ]
                    }),
                    placement: sap.m.PlacementType.Bottom
                });
            }
            this._oPopover.removeAllContent();
            this._oPopover.addContent(this._oList);
            this._oPopover.setInitialFocus(this._oList.getId());
        },

        _checkIfPopoverOpen: function() {
            if (this._oPopover.isOpen() === false) {
                this._oPopover.openBy(this);
            }
            else {
                this._oPopover.close(); 
            }
        },

        _closePopover: function() {
            if (this._oPopover !== undefined && this._oPopover !== null) {
                this._oPopover.close();
            }
        },
        
        __customFilter(pText) {
            this._oList.getItems().forEach(function(item, i) {
                if (item.getText().toUpperCase().includes(pText)) {
                    item.setVisible(true);
                }
                else {
                    item.setVisible(false);
                }
            });          
        }
    })
})