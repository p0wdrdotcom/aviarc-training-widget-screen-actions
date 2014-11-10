package qmuportal.xmlcommands.bindrules;

import java.util.ArrayList;
import java.util.List;

public class BindSet implements Visitable {
    
    private static final long serialVersionUID = 0L;
    
    private List<BindRule> rules = new ArrayList<BindRule>();

    public void accept(Visitor visitor) {
        visitor.visit(this);
    }

    public void addRule(BindRule rule) {
        rules.add(rule);
    }

    public List<BindRule> getRules() {
        return rules;
    }
    

}
