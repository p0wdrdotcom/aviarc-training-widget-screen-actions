package qmuportal.xmlcommands.bindrules;

import com.aviarc.core.state.State;

public class VisitorImpl implements Visitor {

    private final StringBuilder sb = new StringBuilder();
    private final State state;
    
    public VisitorImpl(State state){
        this.state = state;
    }
    
    public void visit(BindSet set) {
        sb.append("<data-rules>\n");
        for(BindRule rule : set.getRules()){
            rule.accept(this);
        }
        sb.append("</data-rules>");
    } 

    public void visit(BindRule rule) {
        sb.append("\t<").append(rule.getName(state)).append(" ");
        for(BindAttribute attribute : rule.getAttributes()){
            attribute.accept(this);
        }
        sb.append("/>\n");
    }

    public void visit(BindAttribute attribute) {
        sb.append(attribute.getName(state));
        sb.append("=\"").append(attribute.getValue(state)).append("\" ");
    }

    
    public String toString(){
        return sb.toString();
    }


}
