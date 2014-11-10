package qmuportal.xmlcommands.bindrules;

public interface Visitor {

    void visit(BindRule rules);
    void visit(BindSet set);
    void visit(BindAttribute attribute);

}
