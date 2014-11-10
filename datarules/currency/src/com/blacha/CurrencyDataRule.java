package com.blacha;
import java.util.Map;
import java.util.Set;

import com.aviarc.core.components.AviarcURN;
import com.aviarc.core.dataset.update.DatasetMetadataUpdateContext;
import com.aviarc.core.runtimevalues.RuntimeValue;
import com.aviarc.framework.datarule.xml.XMLDataRule;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRequirementsCollector;
import com.aviarc.framework.toronto.screen.TorontoClientSideCapable;
import com.aviarc.framework.toronto.screen.TorontoClientSideCapableCreator;
public class CurrencyDataRule implements XMLDataRule, TorontoClientSideCapable, TorontoClientSideCapableCreator {
    
    private static final long serialVersionUID = 1L;
    private String _fieldName;

    private static final CurrencyFormatter _formatter = new CurrencyFormatter();
    private AviarcURN _urn;
    private RuntimeValue<String> _field;
    public void onBoundToDataset(DataRuleInitializationContext context) {
        _fieldName = _field.getValue(context.getState());
        context.getUpdateContext().getCommonRowUpdateContext().getFieldUpdateContext(_fieldName).setFieldFormatter(_formatter);
    }

    public TorontoClientSideCapable makeClientSideCapable(ScreenRenderingContext renderingContext) {
        return this;
    }

    public String getJavascriptDeclaration() {
        return "new YAHOO.nz.co.aviarc.datarule.CurrencyFormatRule('" + _fieldName + "')";
    }

    public void registerRequirements(ScreenRequirementsCollector collector) {
        collector.requireWidgetJSInclude(_urn, "currency.js");
    }

    public Set<String> getRequiredDatasets() {
        return null;
    }

    public void initialize(InitializationContext context) {
        _field = context.getCompiledElementContext().getAttribute("source-field").getRuntimeValue();
        _urn = context.getDataRuleDefinition().getURN();
    }
    public String getDisplayName() {
        return "Currency:" + _fieldName;
    }

    public Map<DatasetMetadataUpdateContext, TorontoClientSideCapable> getDataRules() {
        return null;
    }
}
