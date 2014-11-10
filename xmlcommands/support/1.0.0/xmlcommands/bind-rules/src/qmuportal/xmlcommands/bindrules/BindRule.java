package qmuportal.xmlcommands.bindrules;

import java.util.ArrayList;
import java.util.List;

import com.aviarc.core.runtimevalues.RuntimeValue;
import com.aviarc.core.state.State;

public class BindRule implements Visitable {

    private static final long serialVersionUID = 1L;

    RuntimeValue<String> name;
    List<BindAttribute> attributes = new ArrayList<BindAttribute>();

    public BindRule(RuntimeValue<String> name) {
        this.name = name;
    }

    public RuntimeValue<String> getName() {
        return name;
    }

    public String getName(State state) {
        return name.getValue(state);
    }

    public List<BindAttribute> getAttributes() {
        return attributes;
    }

    public void accept(Visitor visitor) {
       visitor.visit(this);
    }



    
    
}
