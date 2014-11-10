package com.aviarc.toronto.widget.core.validation;

import static com.aviarc.core.util.CollectionUtils.list;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.widget.validation.ContainerPositioningElementValidator;
import com.aviarc.framework.toronto.widget.validation.ElementValidator;
import com.aviarc.framework.xml.compilation.CompilationContext;
import com.aviarc.framework.xml.compilation.SubElement;

import java.util.List;

public class SelectListElementValidator implements ElementValidator {
    
    private static final List<? extends ElementValidator> VALIDATORS = list(
            new ContainerPositioningElementValidator()
    );
    
    public void validate(SubElement<CompiledWidget> subElement, CompilationContext ctx) {
        for (ElementValidator validator : VALIDATORS) {
            validator.validate(subElement, ctx);
        }
    }
    
}
