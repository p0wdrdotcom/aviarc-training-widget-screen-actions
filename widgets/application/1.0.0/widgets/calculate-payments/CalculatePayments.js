/*global
YAHOO
*/

(function () {
    YAHOO.namespace("clientSidePmt");
    var clientSidePmt = YAHOO.clientSidePmt;
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    clientSidePmt.CalculatePayments = function () {
        
    };

    YAHOO.lang.extend(clientSidePmt.CalculatePayments, Toronto.framework.DefaultActionImpl, {
        run: function (state) {
            var paymentsPerYear = parseInt(this.getAttribute('payments-per-year', state),10);
            var years = parseInt(this.getAttribute('years', state),10);
            var interestRate = parseFloat(this.getAttribute('interest', state));
            var principal = parseFloat(this.getAttribute('principal', state));
            
            if (paymentsPerYear > 1
                && years > 0
                && interestRate > 0
                && principal > 0){
                    var rate = interestRate / paymentsPerYear / 100; //create the right decimal value for the percentage
                    var payments = years * paymentsPerYear
                    var payment = Math.abs(this.PMT(rate, payments , principal)); // interest rate is annual
                    state.getExecutionState().setReturnValue(payment);
                }
            
        },
        
        
        PMT: function(rate, nper, pv, fv, type) {
            if (!fv) fv = 0;    
            if (!type) type = 0;
     
            if (rate === 0) return -(pv + fv)/nper;

            var pvif = Math.pow(1 + rate, nper);
            var pmt = rate / (pvif - 1) * -(pv * pvif + fv);
     
            if (type == 1) {
                pmt /= (1 + rate);
            }
     
            return pmt;
        }
        
    });
})();
