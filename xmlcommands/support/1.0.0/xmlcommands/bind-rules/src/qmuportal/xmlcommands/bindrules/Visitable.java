package qmuportal.xmlcommands.bindrules;

import java.io.Serializable;

public interface Visitable extends Serializable {
    
    void accept(Visitor visitor);

}
