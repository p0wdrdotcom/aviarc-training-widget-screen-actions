
(function (){
    var L = YAHOO.lang;
    YAHOO.namespace("nz.co.aviarc.datarule");

    YAHOO.nz.co.aviarc.datarule.CurrencyFormatRule = function(sourceField){
        //debugger;
        this.sourceField = sourceField.toLowerCase();
        this.formatter = new YAHOO.nz.co.aviarc.datarule.CurrencyFormatter();
    };

    YAHOO.nz.co.aviarc.datarule.CurrencyFormatRule.prototype = {
        toString : function(){
            return "CurrencyFormatter";
        },

        initialize : function(context){
            this._context = context.getUpdateContext();
            this._context.getCommonRowUpdateContext().getFieldUpdateContext(this.sourceField).setFieldFormatter(this.formatter);
        },

        getDisplayName: function(){
            return this.toString() + ":" + this.sourceField;
        }

    };

    YAHOO.nz.co.aviarc.datarule.CurrencyFormatter = function(){

    };

    YAHOO.nz.co.aviarc.datarule.CurrencyFormatter.prototype = {
        decimals : 2,
        delim :',',
        dec : '.',

        parseValue : function(value, locale, size){
            value=value + '';
            value = value.replace(/[$, ]/g, "").trim();

            if (value === '') {
                return 0;
            }
            var i = parseFloat(value);
            i = this._roundValue(i);

            if (isNaN (value)){
                throw new Toronto.core.validation.InvalidValueException('amount is not numeric.');
            }
            return i;
        },


        getInputMask : function(){
            return "$9999.99";
        },

        formatValue : function(n, locale){
            var symbol = n < 0 ? "- $" : "$";
            var i = parseInt(n = Math.abs(+n || 0).toFixed(this.decimals), 10) + "";
            var j = (j = i.length) > 3 ? j % 3 : 0;

            return symbol +
                    (j ? i.substr(0, j) + this.delim : "") +
                    i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + this.delim) +
                    (this.dec + Math.abs(n - i).toFixed(this.decimals).slice(2));

        },
        compareValues : function(value1, value2){
           value1 = parseFloat(this.parseValue(value1));
           value2 = parseFloat(this.parseValue(value2));

           return value1 < value2 ? 1:-1;
        },
        _roundValue: function(value){
            return Math.round(value * Math.pow(10, this.decimals)) / Math.pow(10, this.decimals);
        }
    };

})();
