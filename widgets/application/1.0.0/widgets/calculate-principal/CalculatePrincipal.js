/*global
YAHOO
*/

(function () {
    YAHOO.namespace("clientSidePmt");
    var clientSidePmt = YAHOO.clientSidePmt;
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    clientSidePmt.CalculatePrincipal = function () {
        
    };

    YAHOO.lang.extend(clientSidePmt.CalculatePrincipal, Toronto.framework.DefaultActionImpl, {
        run: function (state) {
            var paymentsPerYear = parseInt(this.getAttribute('payments-per-year', state),10);
            var years = parseInt(this.getAttribute('years', state),10);
            var interestRate = parseFloat(this.getAttribute('interest', state));
            var payment = parseFloat(this.getAttribute('payment', state));
            
            if (paymentsPerYear > 1
                && years > 0
                && interestRate > 0
                && payment > 0){
                    var principal = this.PV(payment, paymentsPerYear, years, interestRate); 
                    state.getExecutionState().setReturnValue(principal);
                }
        },
        
        PV: function (repayment, paymentsPerYear, years, interest) {
                var p = repayment;
                var i = (interest / paymentsPerYear /100);
                var n = years * paymentsPerYear; 
                var principal = (p * (1 - 1 / (Math.pow(1 + i, n)))) / i;
                return principal;
        }
    });
})();
