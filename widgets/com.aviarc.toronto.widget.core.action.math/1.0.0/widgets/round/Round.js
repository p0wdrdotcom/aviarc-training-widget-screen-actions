/*global
YAHOO
*/

(function () {

    YAHOO.namespace("YAHOO.com.aviarc.toronto.widget.core.action.math.v1_0_0");
    var ActionMath = YAHOO.com.aviarc.toronto.widget.core.action.math.v1_0_0;
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    ActionMath.Round = function () {
        
    };

    YAHOO.lang.extend(ActionMath.Round,
                      Toronto.framework.DefaultActionImpl, {

        run: function (state) {
            var childActions = this.getActionContext().getActionNode().getChildNodes();

            var precision = this.getAttribute("precision", state);
            
            var accumulator = new ActionMath.RoundingAccumulator(precision);
            var returnResultTimeline = {
                resume : function (s) {
                    s.getExecutionState().setReturnValue(accumulator.getResult());                
                }
            };
            
            state.getExecutionState().pushTimeline(returnResultTimeline);
            
            this.runFrom(0, state, childActions, accumulator);
        },
         
        runFrom: function (index, state, actionList, accumulator) {
            var me = this, nextIndex = index + 1;
            if (index < actionList.length) {
                var nextTimeline = {
                    resume: function(s) {
                        accumulator.accumulate(s.getExecutionState().getArgument());
                        me.runFrom(nextIndex, s, actionList, accumulator);
                    }
                };
                state.getExecutionState().pushTimeline(nextTimeline);

                var action = actionList[index];
                action.run(state);
            }
        }
    });
    
    ActionMath.RoundingAccumulator = function(precision) {
        this._result = 0;
        this._precision = precision;
    }
    
    ActionMath.RoundingAccumulator.prototype = {
        accumulate : function(result) {
            this._result = parseFloat(result).toFixed(this._precision);
        },
        
        getResult : function() {
            return this._result;
        }
    }

})();