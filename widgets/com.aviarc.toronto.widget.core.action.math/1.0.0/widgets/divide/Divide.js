/*global
YAHOO
*/

(function () {

    YAHOO.namespace("YAHOO.com.aviarc.toronto.widget.core.action.math.v1_0_0");
    var ActionMath = YAHOO.com.aviarc.toronto.widget.core.action.math.v1_0_0;
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    ActionMath.Divide= function () {

    };

    YAHOO.lang.extend(ActionMath.Divide,
                      Toronto.framework.DefaultActionImpl, {

        run: function (state) {
            var value1 = this.getAttribute("value1", state);
            var value2 = this.getAttribute("value2", state);

            // If there is a value attribute, use that as the numeric value
            if (!YAHOO.lang.isUndefined(value1) && !YAHOO.lang.isNull(value1)
                    && !YAHOO.lang.isUndefined(value2) && !YAHOO.lang.isNull(value2)) {
                state.getExecutionState().setReturnValue(this._divideValues(value1, value2));
                return;
            }

            // Otherwise if it has children, run all the children and numericise return value after all children are run
            if (!this.hasChildActions()) {
                return;
            }

            var childActions = this.getActionContext().getActionNode().getChildNodes();

            if (childActions.length > 2) {
                throw new Error("Subtract requires exactly two attributes or exactly two child commands");
            }

            var accumulator = new ActionMath.DivisionAccumlator();
            var returnResultTimeline = {
                resume : function (s) {
                    s.getExecutionState().setReturnValue(accumulator.getResult());
                }
            };

            state.getExecutionState().pushTimeline(returnResultTimeline);

            this._runFrom(0, state, childActions, accumulator);
        },

        _runFrom: function (index, state, actionList, accumulator) {
            var me = this, nextIndex = index + 1;
            if (index < actionList.length) {
                var nextTimeline = {
                    resume: function(s) {
                        accumulator.accumulate(s.getExecutionState().getArgument());
                        me._runFrom(nextIndex, s, actionList, accumulator);
                    }
                };
                state.getExecutionState().pushTimeline(nextTimeline);

                var action = actionList[index];
                action.run(state);
            }
        },

        _divideValues : function (value1, value2) {
            value1 = new BigDecimal(value1);
            value2 = new BigDecimal(value2);

            return value1.divide( value2 ).toString();
        }

    });

    ActionMath.DivisionAccumlator = function() {
        this._result = null;
    };

    ActionMath.DivisionAccumlator.prototype = {
        accumulate : function(result) {
            if (this._result === null) {
                this._result = new BigDecimal(result);
            } else {
                this._result = this._result.divide( new BigDecimal(result) );
            }
        },

        getResult : function() {
            return this._result.toString();
        }
    };

})();
