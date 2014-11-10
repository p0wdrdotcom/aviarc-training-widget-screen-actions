package qmuportal.xmlcommands.bindrules;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.aviarc.core.command.Command;
import com.aviarc.core.databroker.DataBrokerException;
import com.aviarc.core.datarule.DataRule;
import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetMetadata.BindDataRulesContext;
import com.aviarc.core.dataset.DatasetMetadata.BindDataRulesContextImpl;
import com.aviarc.core.dataset.DatasetRow;
import com.aviarc.core.exceptions.CommandException;
import com.aviarc.core.exceptions.NoSuchTemporaryFileException;
import com.aviarc.core.exceptions.NoSuchResourceException;
import com.aviarc.core.logging.LoggingHub;
import com.aviarc.core.resource.ResourceDirectory;
import com.aviarc.core.resource.ResourceFile;
import com.aviarc.core.resource.ResourceLocator;
import com.aviarc.core.resource.TemporaryResourceID;
import com.aviarc.core.resource.TemporaryResourceManager;
import com.aviarc.core.runtimevalues.RuntimeValue;
import com.aviarc.core.state.State;
import com.aviarc.framework.datarule.DataRuleUtil;
import com.aviarc.framework.datarule.DataRuleUtil.DataRuleException;
import com.aviarc.framework.datarule.xml.DataRuleCompilationElementFactoryImpl;
import com.aviarc.framework.datarule.xml.DataRuleGroup;
import com.aviarc.framework.datarule.xml.XMLDataRule;
import com.aviarc.framework.diagnostics.ResourceCompilationResult;
import com.aviarc.framework.xml.command.AbstractXMLCommand;
import com.aviarc.framework.xml.compilation.AviarcXMLResourceCompilationException;
import com.aviarc.framework.xml.compilation.AviarcXMLResourceCompiler;
import com.aviarc.framework.xml.compilation.CompiledElementContext;
import com.aviarc.framework.xml.compilation.ElementFactory;

public class BindRules extends AbstractXMLCommand {

    private static final long serialVersionUID = 0L;

    private BindSet _bindSet;
    private RuntimeValue<String> _dataset;
    private RuntimeValue<String> _rulesFile;
    private RuntimeValue<String> _rulesURN;
    private RuntimeValue<String> _rulesDataset;

    public void doInitialize(InitializationContext ctx) {
        _bindSet = new BindSet();
        _dataset = ctx.getElementContext().getAttribute("dataset").getRuntimeValue();
        if (ctx.getElementContext().getAttribute("rules-file") != null) {
            _rulesFile = ctx.getElementContext().getAttribute("rules-file").getRuntimeValue();
        }
        if (ctx.getElementContext().getAttribute("rules-urn") != null) {
            _rulesURN = ctx.getElementContext().getAttribute("rules-urn").getRuntimeValue();
        }
        if (ctx.getElementContext().getAttribute("rules-dataset") != null) {
            _rulesDataset = ctx.getElementContext().getAttribute("rules-dataset").getRuntimeValue();
        }
        for (CompiledElementContext<Command> rule : ctx.getElementContext().getSubElements("rule")) {
            BindRule br = new BindRule(rule.getAttribute("name").getRuntimeValue());
            for (CompiledElementContext<Command> attribute : rule.getSubElements("attribute")) {
                RuntimeValue<String> name = attribute.getAttribute("name").getRuntimeValue();
                RuntimeValue<String> value = attribute.getAttribute("value").getRuntimeValue();
                BindAttribute att = new BindAttribute(name, value);
                br.getAttributes().add(att);
            }
            _bindSet.addRule(br);
        }
    }

    // DataRuleUtil.bindDataRules(dataset, currentState, someParameters,
    // rulesFile);

    public void run(State state) {
        // Bind data rules from sub-elements
        Dataset dataset = state.getApplicationState().getDatasetStack().findDataset(_dataset.getValue(state));
        
        addSubElementDataRules(state, dataset);
        
        // Bind data rules from referenced file
        if (_rulesFile != null) {
            addFileDataRules(state, dataset);
        } else if (_rulesURN != null){
            addURNDataRules(state, dataset);
        } else if (_rulesDataset != null) {
            Dataset rulesDataset = state.getApplicationState().getDatasetStack().findDataset(_rulesDataset.getValue(state));
            addDatasetDataRules(state, dataset, rulesDataset);
        }
    }
    
    /** Binds data rules defined as sub-elements.
     * 
     * @param state Aviarc State.
     * @param dataset Dataset to bind data rules to.
     */
    private void addSubElementDataRules(State state, Dataset dataset) {
        Visitor visitor = new VisitorImpl(state);
        _bindSet.accept(visitor);
        String dataRulesXMLString = visitor.toString();

        try{
            bindDataRules(dataset, state, dataRulesXMLString, "BindRules-subElements");
        } catch (DataRuleException e) {
            throw new CommandException(e);
        }
    }
    
    /** Binds data rules defined in a file.
     * 
     * @param state Aviarc State.
     * @param dataset Dataset to bind data rules to.
     */
    private void addFileDataRules(State state, Dataset dataset) {
        ResourceDirectory customRulesDir = state.getCurrentApplicationInstance().getApplication()
                .getMetadataDirectory().getDirectory("custom-rules");
        ResourceFile rulesFile = customRulesDir.getFile(String.format("%s.xml", _rulesFile.getValue(state)));
        
        try {
            Map<String, String> someParameters = new HashMap<String, String>();
            DataRuleUtil.bindDataRules(dataset, state, someParameters, rulesFile, "bind-rules");
        } catch (DataRuleException e) {
            throw new CommandException(e);
        }
    }
    
    /** Binds data rules referenced by a URN.
    * 
    * @param state Aviarc State.
    * @param dataset Dataset to bind data rules to.
    */
    private void addURNDataRules(State state, Dataset dataset) {
        ResourceLocator locator = state.getAviarc().getResourceLocator();
        try {
            ResourceFile urnfile = locator.getFile(_rulesURN.getValue(state), state);
            try {
                Map<String, String> someParameters = new HashMap<String, String>();
                DataRuleUtil.bindDataRules(dataset, state, someParameters, urnfile, "bind-rules");
            } catch (DataRuleException e) {
                throw new CommandException(e);
            }
        } catch (NoSuchResourceException e) {
            throw new CommandException("Could not find temp file", e);
        } 
    }
    
    
    /** Binds data rules defined in a datset.
     * 
     * @param state Aviarc State.
     * @param dataset Dataset to bind data rules to.
     * @param rulesDataset Dataset of data rules to bind.
     */
    private void addDatasetDataRules(State state, Dataset dataset, Dataset rulesDataset) {
        Document datasetXMLDOM = datasetToXml(rulesDataset);
        String dataRulesXMLString = documentToString(datasetXMLDOM);
        
        try {
            bindDataRules(dataset, state, dataRulesXMLString, "BindRules-dataset");
        } catch (DataRuleException e) {
            throw new CommandException(e);
        }
    }
    
    /** Converts a dataset of data rules into an XML DOM structure. */
    private Document datasetToXml(Dataset dataset){
        DocumentBuilder documentBuilder = null;
        try {
            documentBuilder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            throw new CommandException("There was a parser configuration exception when creating the document builder", e);
        }
        Document document = documentBuilder.newDocument(); 
        
        Element root = document.createElement("data-rules");
        for (DatasetRow datasetRow : dataset.getAllRows()){
            Element rule = document.createElement(datasetRow.getField("rulename"));
            for(String name: datasetRow.getFieldNames()){
                if(name != "rulename") {
                    rule.setAttribute(name, datasetRow.getField(name));
                }
            }
            root.appendChild(rule);
        }
        document.appendChild(root);
        return document;        
    }
    
    /** Converts an XML DOM structure into a String. */
    private String documentToString(Document document){
        TransformerFactory tf = TransformerFactory.newInstance();
        
        Transformer transformer = null;
        try {
            transformer = tf.newTransformer();
        }catch(TransformerConfigurationException e) {
            throw new CommandException(e);
        }
        
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        StringWriter writer = new StringWriter();
        
        try {
            transformer.transform(new DOMSource(document), new StreamResult(writer));
        }catch(TransformerException e) {
            throw new CommandException(e);
        }
        
        return writer.getBuffer().toString();
    }
    
    /**
     * Read in and bind data rules to the dataset.
     * 
     * @param dataset The dataset to bind the data rules to.
     * @param state The current State.
     * @param dataRulesXMLString Datarules defined in XML format.
     * @param dataruleName Descriptive name for datarule. Used for error messages.
     */
    private void bindDataRules(Dataset dataset, 
                                     State state, 
                                     String dataRulesXMLString,
                                     String dataruleName)
                        throws DataRuleException {
        
        // Compile the data rule
        ResourceCompilationResult<XMLDataRule> result = null;
        try {
            InputStream rulesInputStream = new ByteArrayInputStream(dataRulesXMLString.getBytes());
            Source rulesSource = new StreamSource(rulesInputStream);
            Map<String,String> parameters = new HashMap<String, String>();

            result = DataRuleUtil.getDataRules(state.getCurrentApplication(), parameters, rulesSource, "DataBinding.java_" + dataruleName);
            
            if (result == null){
                LoggingHub.getGeneralLogger().debug("No Datarules found for : " + dataruleName);
                return;
            }
        } catch (AviarcXMLResourceCompilationException e) {
            throw new DataRuleException("Errors encountered while preparing rules file",e);
        }
        
        bindCompiledRules(dataset, state, "bind-rules", result);
    }
    
    /** Binds compiled data rules to a dataset.
     * 
     * @param dataset The dataset to bind the data rules to.
     * @param state The current State.
     * @param bindingID Binding ID.
     * @param result Data rules compilation result.
     * @throws DataRuleException
     */
    private void bindCompiledRules(Dataset dataset,
                                   State state,
                                   String bindingID,
                                   ResourceCompilationResult<XMLDataRule> result) throws DataRuleException {
        
        if (result.getResourceCompilationInfo().hasErrors()) {
            throw new DataRuleException("Errors encountered while preparing rules file: \n" + result.getResourceCompilationInfo().toString());
        }
        
        List<DataRule> ruleList = new ArrayList<DataRule>();
        for(DataRule rule : ((DataRuleGroup) result.getResult()).getRules()){
            ruleList.add(rule);
        }
        
        BindDataRulesContext bindCtx = new BindDataRulesContextImpl(bindingID, ruleList, state); 
        dataset.getMetadata().bindDataRules(bindCtx);
    }

}
