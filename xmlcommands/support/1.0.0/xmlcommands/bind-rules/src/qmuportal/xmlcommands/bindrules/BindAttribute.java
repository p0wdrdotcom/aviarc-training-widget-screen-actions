package qmuportal.xmlcommands.bindrules;

import com.aviarc.core.runtimevalues.RuntimeValue;
import com.aviarc.core.state.State;

public class BindAttribute implements Visitable {

    private static final long serialVersionUID = 1L;
    
    
    private RuntimeValue<String> name;
    private RuntimeValue<String> value;

    public BindAttribute(RuntimeValue<String> name, RuntimeValue<String> value) {
        this.name = name;
        this.value = value;
    }

    public RuntimeValue<String> getName() {
        return name;
    }

    public RuntimeValue<String> getValue() {
        return value;
    }
    
    public String getName(State state) {
        return name.getValue(state);
    }

    public String getValue(State state) {
        return value.getValue(state);
    }

    public void accept(Visitor visitor) {
        visitor.visit(this);
    }
    
        

}
