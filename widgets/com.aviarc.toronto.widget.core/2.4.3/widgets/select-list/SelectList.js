/*global
YAHOO
parseBoolean
printf
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_4_3");
    var Toronto = YAHOO.com.aviarc.framework.toronto;
    var L = YAHOO.lang;
    var REFRESH = {};
    var $ = YAHOO.jQuery_1_9_1_core;

    Toronto.widget.core.v2_4_3.SelectList = function () {
        this.onSelectedChanged = new Toronto.client.Event("SelectList onSelectedChanged");
        this.onValueChanged = this.onSelectedChanged;
        this.onEnabledChanged = new Toronto.client.Event("SelectList onEnabledChanged");
        this.onValidChanged = new Toronto.client.Event("SelectList onValidChanged");
        this.onMandatoryChanged = new Toronto.client.Event("SelectList onMandatoryChanged");
        this.onFocus = new Toronto.client.Event("SelectList onFocus");
        this.onOpen = new Toronto.client.Event("SelectList onOpen");
        this.onClose = new Toronto.client.Event("SelectList onClose");
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_4_3.SelectList, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_4_3.SelectList.superclass.startup.apply(this, arguments);

            this._validHandler = null;
            this._readOnlyHandler = null;
            this._mandatoryHandler = null;

            if (!YAHOO.lang.isUndefined(this.getAttribute('selection-field')) && parseBoolean(this.getAttribute('select-row'))) {
                throw new Error("'selection-field' and 'select-row' cannot be used simultaneously");
            }

            this._inputElement = this.getNamedElement("input");

            this._onChangeEvent = widgetContext.createManagedEvent("SelectList onchange ManagedEvent");
            this._inputElement.onchange = this._onChangeEvent.makeDOMEventFunction();

            this._inputElementHandlers = [
                this._onChangeEvent.bindHandler(this._inputElementChanged, this),
                this._onChangeEvent.bindHandler(this._doAction, this)
            ];

            this._attrEnabled = parseBoolean(this.getAttribute('enabled'));
            this._attrMandatory = parseBoolean(this.getAttribute('mandatory'));

            this._dsEnabled = false;
            this._readOnly = false;

            this._mandatory = this._attrMandatory;
            this._dsMandatory = false;

            this._valid = true;
            this._attrValid = true;

            this._autoRefresh = parseBoolean(this.getAttribute('auto-refresh'));

            if (this._attrEnabled && parseBoolean(this.getAttribute('focus'))) {
                this.focus();
            }

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);



        },

        _cleanup: function () {
            this._cachedStyledElements = null;
            this._inputElementHandlers[1].unbind();
            this._inputElementHandlers[0].unbind();
            this._inputElement.onchange = null;
            this._inputElement = null;
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_4_3.SelectList.superclass.bind.apply(this, arguments);

            this._valuesDs = dataContext.findDataset(this.getAttribute('dataset'));
            this._valuesDsCurrentRowChangedHandler = this._valuesDs.onCurrentRowChanged.bindHandler(this._dataCurrentRowChanged, this);
            this._valuesDsDataChangedHandler = this._valuesDs.onDataChanged.bindHandler(this.refresh, this);
            this._valuesDsRowCommitActionChangedHandler = this._valuesDs.onRowCommitActionChanged.bindHandler(this.refresh, this);

            var selectionField = this.getAttribute('selection-field');
            if (!YAHOO.lang.isUndefined(selectionField)) {
                this._selectionField = selectionField.split('.');
                this._selectionDs = dataContext.findDataset(this._selectionField[0]);
                this._selectionDs.onCurrentRowChanged.bindHandler(this._selectionFieldChanged, this);
                this._dataChangeBinding = this._selectionDs.bindOnCurrentRowFieldChangedHandler(this._selectionField[1], this._selectionFieldChanged, this);
                this._selectionDs.onContentsReplaced.bindHandler(this._selectionFieldChanged, this);
                this._dsEnabled = (this._selectionDs.getCurrentRow() !== null) ? true : false;
                this._bindFieldEvents();
            }

            this._enabled = this._attrEnabled && this._dsEnabled;
        },

        _bindFieldEvents: function(enable){
            var row = null;
            if (this._dsEnabled){
                row = this._selectionDs.getCurrentRow();
            }

            if((enable || YAHOO.lang.isUndefined(enable)) && row !== null){

                // Unbind the old events
                if(this._validHandler !== null){
                    this._bindFieldEvents(false);
                }

                var metadata = row.getFieldObject(this._selectionField[1]).getMetadata();
                this._validHandler = metadata.onValidChanged.bindHandler(this._validChanged, this, 'SelectList');
                this._readOnlyHandler = metadata.onReadOnlyChanged.bindHandler(this._readOnlyChanged, this, 'SelectList');
                this._mandatoryHandler = metadata.onMandatoryChanged.bindHandler(this._mandatoryChanged, this, 'SelectList');


                this._mandatoryChanged({oldValue:false, newValue:metadata.isMandatory()});
                this._readOnlyChanged({oldValue:false, newValue:metadata.isReadOnly()});
                this._checkValid();


            }else if(this._validHandler !== null){
                this._validHandler.unbind();
                this._readOnlyHandler.unbind();
                this._mandatoryHandler.unbind();

                this._validHandler = null;
                this._readOnlyHandler = null;
                this._mandatoryHandler = null;
            }
        },
        /**
         * Called by DOM event when changing the item in the select list
         * If an action is specified and the selected item is not the null option, perform the action
         */
        _doAction: function () {
            // Selected null option?  Don't want to perform the action
            var selectedOption = this._inputElement.options[this._inputElement.selectedIndex];
            var newRowIndex = parseInt(selectedOption.datasetRowIndex, 10);
            if (newRowIndex === -1) {
                return;
            }


            var action = this.getAttribute('action');
            if (!YAHOO.lang.isUndefined(action) && action !== '') {
                this.getWidgetContext().getSystem().submitScreen({
                    action: action,
                    validate: parseBoolean(this.getAttribute('validate'))
                });
            }
        },

        /**
         * Rebuild the contents of the select list when the rows in the dataset change
         */
        _dataChanged: function () {
            if (!this._autoRefresh && arguments[0] !== REFRESH) {
                return;
            }

            // Clear all options
            var inputElement = this._inputElement;
            while (inputElement.firstChild) {
                inputElement.removeChild(inputElement.firstChild);
            }

            this._contents = [];
            this._values = [];

            // optional null-option-text with empty value
            var nullOption = this.getAttribute('null-option-text');
            if (!YAHOO.lang.isUndefined(nullOption)) {
                var option = this._makeOption(inputElement, "", nullOption, -1);
                option.className = "null-option-text";
            }

            // iterate over the dataset
            var idFieldName = this.getAttribute('id-field');
            var displayFieldName = this.getAttribute('display-field');
            var rows = this._valuesDs.getAllRows();
            if (rows.length !== 0) {
                for (var i=0; i<rows.length; i++) {
                    var row = rows[i];
                    // Don't show rows that have been marked as deleted
                    if (row.isMarkedDeleted()) {
                        continue;
                    }
                    this._makeOption(inputElement, row.getField(idFieldName), row.getFieldObject(displayFieldName).getFormattedValue(), row.getDatasetRowIndex());
                }
            }

            this._checkEnabled();
        },

        _makeOption : function (selectList, value, text, datasetRowIndex) {
            var option = document.createElement("option");
            this._values.push(value);

            // In IE if you set option.value to null, it will actually set it to "null"
            // not what you want! If we don't set it, it stays as an "", which Aviarc
            // interprets as a null when going back to the server
            if (value !== null) {
                option.value = value;
            } // Also ensure the text in the dropdown isn't "null"
            if (text === null) {
                text = "";
            }

            option.appendChild(document.createTextNode(text));
            if (!YAHOO.lang.isUndefined(datasetRowIndex)) {
                option.datasetRowIndex = datasetRowIndex;
            }
            selectList.appendChild(option);
            this._contents.push(option);

            return option;
        },

        /**
         * Change the selected item when the current row changes in the input dataset
         */
        _dataCurrentRowChanged: function () {
            if (!this._autoRefresh && arguments[0] !== REFRESH) {
                return;
            }
            if (!parseBoolean(this.getAttribute('select-row'))) {
                return;
            }
            if (this._valuesDs.getRowCount() === 0) {
                return;
            }
            if (this._valuesDs.getCurrentRow() === null) {
                if ( !YAHOO.lang.isUndefined(this.getAttribute('null-option-text'))) {
                    this._inputElement.value = "";
                    this._checkValid(true);
                }else{
                    this._checkValid(false);
                }
            } else {
                this._checkValid(true);
                // IE again - it appears that in refresh() the repaint from _dataChanged() has not completed before _dataCurrentRowChanged is called
                if (YAHOO.env.ua.ie > 0) {
                    this._inputElement.style.outline = "0px solid black";
                    this._inputElement.style.outline = "";
                }
                this._inputElement.value = this._valuesDs.getCurrentRowField(this.getAttribute('id-field'));
                if (YAHOO.env.ua.ie > 0) {
                    this._inputElement.style.outline = "0px solid black";
                    this._inputElement.style.outline = "";
                }
            }
        },

        /**
         * Called by onDataChanged in selection-field dataset
         */
        _selectionFieldChanged: function () {
            if (!this._autoRefresh && arguments[0] !== REFRESH) {
                return;
            }
            if (YAHOO.lang.isUndefined(this.getAttribute('selection-field'))) {
                return;
            }

            this._bindFieldEvents();
            this._checkEnabled();
            if (this._selectionDs.getCurrentRow() === null) {
                this._checkValid(false);
            } else {
                try {
                    this._dataChangeBinding.disable();
                    var newValue = this._selectionDs.getCurrentRowField(this._selectionField[1]);
                    if (YAHOO.lang.isUndefined(newValue) || YAHOO.lang.isNull(newValue)) {
                        newValue = "";
                    }
                    if (newValue === "" && YAHOO.lang.isUndefined(this.getAttribute('null-option-text'))) {
                        this._checkValid(false);
                        return;
                    } else {
                        var inputElement = this._inputElement;
                        var oldValue = inputElement.value;
                        var me = this;

                        if (YAHOO.env.ua.ie > 0) {
                            this._inputElement.style.outline = "0px solid black";
                            this._inputElement.style.outline = "";
                        }
                        inputElement.value = newValue;
                        if (YAHOO.env.ua.ie > 0) {
                            this._inputElement.style.outline = "0px solid black";
                            this._inputElement.style.outline = "";
                        }

                        if (inputElement.value !== newValue) {
                            me._checkValid(false);
                        } else {
                            me._checkValid(true);
                             if (arguments[0] !== REFRESH && oldValue !== newValue) {
                                  this.onSelectedChanged.fireEvent({
                                      value: newValue,
                                      widget: this.getWidgetContext().getWidgetNode()
                                  });
                              }
                        }
                    }
                } finally {
                    this._dataChangeBinding.enable();
                }
            }
        },

        refresh: function () {
            delete(this._invalidItem);
            this._valid = true;
            this.removeClass("invalid");
            this._dataChanged(REFRESH);
            this._dataCurrentRowChanged(REFRESH);
            this._selectionFieldChanged(REFRESH);
            
            //Selectyze changes
            var selectList = this.getNamedElement('input');
            
            if (!YAHOO.lang.isUndefined(this.selectyze)){
                this.selectyze.remove();
            }
            
            
            
            
            $(selectList).Selectyze({
                                    effectOpen:'',
                                    effectClose:''});
            this.selectyze = $(selectList).next();
            
            //setup for the yoink from into the body
            this._containerElement = this.getContainerElement();
            this._originalParent = this._containerElement.parentNode;
            this._originalNextSib = this._containerElement.nextSibling;
            
            
            // sneaky as pluk the first li and add a class to it...  didn't want to modify the Selectyze code to do it
            $(selectList).next().find('ul').children('li:first-child').addClass('first-select-item');
            var me = this;
            var $theList = $(selectList).next().find('ul');
            
            if (this._valuesDs.getRowCount() > 6){
            
            this.theListScroller = $theList.mCustomScrollbar({
                      advanced:{
                          updateOnContentResize: true,
                        autoScrollOnFocus : false
                      },
                      set_height:  200 + 'px',
                      theme: 'dark-thick'
                    });
            }
            
            this.theList = $theList;
             var onOpenList = function () {
                 //yoink it out into the top document
                 var $container = $(me._containerElement);
                 var $parent = $container.parent();
                 var parentHeight = $parent.height();
                 var width = $container.width();
                 var offset = $container.offset();
                 
                 document.body.appendChild(me._containerElement);
                 
                 $container.css("width", width +"px");
                 $container.css("top", offset.top +"px");
                 $container.css("left", offset.left +"px");
                 $parent.css("height", parentHeight + "px");
                 me.onOpen.fireEvent({
                                      widget: me.getWidgetContext().getWidgetNode()
                                  });
             };
             var onCloseList = function() {
                 //back from whence you came.
                 var $container = $(me._containerElement);
                 var $parent = $container.parent();
                 $parent.css("height", 'auto');
                 $container.css("width", null);
                 $container.css("top", 0);
                 $container.css("left", 0);
                 me._originalParent.insertBefore(me._containerElement, me._originalNextSib);
                 me.onClose.fireEvent({
                                      widget: me.getWidgetContext().getWidgetNode()
                                  });
             };
             $theList.on('openlist', onOpenList);
             $theList.on('closelist', onCloseList);

            
        },

        /**
         * Called by DOM event on <select/>
         */
        _inputElementChanged: function () {
            var value = this._inputElement.value;

            if (!YAHOO.lang.isUndefined(this.getAttribute('selection-field'))) {
                this._dataChangeBinding.disable();
                this._selectionDs.getCurrentRow().setField(this._selectionField[1], value);
                this._dataChangeBinding.enable();
            }

            if (parseBoolean(this.getAttribute('select-row'))) {
                var selectedOption = this._inputElement.options[this._inputElement.selectedIndex];
                var newRowIndex = parseInt(selectedOption.datasetRowIndex, 10);
                this._valuesDsCurrentRowChangedHandler.disable();
                if (newRowIndex === -1) {
                    this._valuesDs.clearCurrentRow();
                } else {
                    this._valuesDs.setCurrentRowIndex(newRowIndex);
                }
                this._valuesDsCurrentRowChangedHandler.enable();
            }

            // If we're picking an item from the list, that item must be valid
            this._checkValid(true);

            this.onSelectedChanged.fireEvent({
                value: value,
                widget: this.getWidgetContext().getWidgetNode()
            });
        },

        validate: function () {
            var valid = this._checkValid(this._attrValid);

            if (!valid.isValid){
                if (valid.dataset){
                    var row = this._selectionDs.getCurrentRow();
                    var metadata = this._selectionDs.getCurrentRow().getFieldObject(this._selectionField[1]).getMetadata();
                    return metadata.getValidationInfo();
                }
                return [new Toronto.core.WidgetValidationInfo('select-list contains invalid value',
                                                            this.getWidgetID())];
            }

            if (this.getMandatory() && this._inputElement.value === ''){
                return [new Toronto.core.WidgetValidationInfo('select-list must contain a value',
                                                            this.getWidgetID())];
            }

            return true;

        },

        /**
         * Put the browser focus on this input element.
         */
        focus: function () {
            this._inputElement.focus();
            this.onFocus.fireEvent({ widget: this.getWidgetContext().getWidgetNode()});
        },

        getValue: function () {
            if (!this._valid) {
                return null;
            }

            var value = this._inputElement.value;
            return value;
        },

        setValue: function (value) {
            if (!this._attrEnabled) {
                return;
            }
            this._inputElement.value = value;
            if (this._inputElement.value != value) {
                this._checkValid(false);
                return;
            }

            // setting .value doesn't fire the DOM event - this will ensure the dataset gets updated
            this._inputElementChanged();
        },

        /**
         * Enable / ReadOnly Changes
         */
        _readOnlyChanged: function(args){
            this._readOnly = args.newValue;
            this._checkEnabled();
        },

        _checkEnabled: function(){
            var hasSelectionField = YAHOO.lang.isUndefined(this._selectionDs) || this._selectionDs.getCurrentRow() !== null;

            var enabled = this._attrEnabled && hasSelectionField && !this._readOnly;
            this[enabled ? 'removeClass' : 'addClass' ]('disabled');

            if (this._enabled !== enabled) {
                this._enabled = enabled;
                this._inputElement.disabled = enabled ? "" : "true";
                this.onEnabledChanged.fireEvent({
                    enabled: enabled,
                    widget: this.getWidgetContext().getWidgetNode()
                });
            }
        },

        setEnabled: function (enabled) {
            this._attrEnabled = parseBoolean(enabled);
            this._checkEnabled();
        },

        getEnabled: function () {
            var hasSelectionField = YAHOO.lang.isUndefined(this._selectionDs) || this._selectionDs.getCurrentRow() !== null;
            return this._attrEnabled && hasSelectionField && !this._readOnly;
        },

        /**
         * Mandatory Changes
         */
        getMandatory: function() {
            return this._attrMandatory || this._dsMandatory;
        },

        setMandatory: function(mandatory) {
            this._attrMandatory = parseBoolean(mandatory);
            this._checkMandatory();
        },

        _mandatoryChanged: function(args){
            this._dsMandatory = args.newValue;
            this._checkMandatory();
        },

        _checkMandatory: function(){
            var mandatory = this.getMandatory();

            if (mandatory !== this._mandatory) {
                if (mandatory) {
                    this.addClass("mandatory");
                } else {
                    this.removeClass("mandatory");
                }
                this._mandatory = mandatory;
                this.onMandatoryChanged.fireEvent({ widget: this.getWidgetContext().getWidgetNode(),
                                                    mandatory: this._mandatory });
            }
        },
        /***
         * Valid Change
         */
        _validChanged : function(args){
            this._checkValid();
        },

        setAutoRefresh: function (autoRefresh) {
            this._autoRefresh = parseBoolean(autoRefresh);
        },

        getAutoRefresh: function () {
            return this._autoRefresh;
        },

        getValid: function(){
            return this._valid; // this._dsValid && this._attrValid;
        },


        _checkValid: function(attrValid){
            var valid = {isValid : true, reason : '', dataset: false};
            // Check to see if the dataset is valid
            if(this._dsEnabled){
                var row = this._selectionDs.getCurrentRow();
                if (row !== null){
                    var metadata = this._selectionDs.getCurrentRow().getFieldObject(this._selectionField[1]).getMetadata();
                    if(!metadata.isValid()){
                        valid.isValid  = false;
                        valid.reason = metadata.getInvalidReason().join("\n");
                        valid.dataset = true;
                    }
                }
            }
            // Check to see if our current selection is valid
            if (!L.isUndefined(attrValid)){
                this._attrValid = attrValid;
                if (! attrValid){
                    valid.isValid = attrValid;
                    this._createInvalidItem();
                }
            }

            if(valid.isValid){
                if (!YAHOO.lang.isUndefined(this._invalidItem)) {
                    this._inputElement.removeChild(this._invalidItem);
                    delete(this._invalidItem);
                }
                this.removeClass('invalid');
            }else{
                this._lastError = valid.reason;
                this.addClass('invalid');
            }
            if (this._valid != valid.isValid){
                this.onValidChanged.fireEvent({
                    widget: this.getWidgetContext().getWidgetNode(),
                    valid: valid.isValid
                });
            }

            this._valid = valid.isValid;
            return valid;
        },

        _createInvalidItem: function(){
             if (YAHOO.lang.isUndefined(this._invalidItem)) {
                var invalidItem = document.createElement("option");
                invalidItem.value = "\x00";
                invalidItem.appendChild(document.createTextNode(""));
                var inputElement = this._inputElement;
                inputElement.appendChild(invalidItem);
                // IE won't select the option immediately, presumably doesn't exist until we allow the browser to repaint
                if (YAHOO.env.ua.ie > 0) {
                    this._inputElement.style.outline = "0px solid black";
                    this._inputElement.style.outline = "";
                }
                inputElement.value = "\x00";
                if (YAHOO.env.ua.ie > 0) {
                    inputElement.selectedIndex = inputElement.options.length - 1;
                    this._inputElement.style.outline = "0px solid black";
                    this._inputElement.style.outline = "";
                }
                this._invalidItem = invalidItem;
            }
        },

        getStyledElements: function () {
            return [
                this.getContainerElement()
            ];
        }
    });

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_4_3.SelectList, Toronto.util.CssUtils);

})();
