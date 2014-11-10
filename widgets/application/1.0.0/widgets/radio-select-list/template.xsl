<xsl:stylesheet
    version="2"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

    xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
    xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
    xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"

    extension-element-prefixes="aviarc"
    exclude-result-prefixes="aviarc cssutils xsltutils"
    >

    <xsl:template match="radio-select-list">
        
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="mandatory"><xsl:if test="xsltutils:isTrue(@mandatory)">mandatory</xsl:if></xsl:variable>
        
        <!-- It seems that all browsers give precedence to the 'height' css property anyway,
             all we have to do is set 1 for single line, 2 for multi -->
        <xsl:variable name="rows">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@multi-line)">2</xsl:when>
                <xsl:otherwise>1</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="invisible-class">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <!-- Prepare initial enabled state.  To agree with the javascript model:
             @selection-field dataset must have a current row
             @enabled set to true -->
        <xsl:variable name="selection-ds-ok">
            <xsl:choose>
                <!--no selection-field is ok-->
                <xsl:when test="not(@selection-field)">y</xsl:when>
                <!--if present, must have a row-->
                <xsl:otherwise>
                    <xsl:variable name="selection-ds-name"><xsl:value-of select="xsltutils:getDatasetName(@selection-field)"/></xsl:variable>
                    <xsl:choose>
                        <xsl:when test="xsltutils:getDatasetCurrentRow($selection-ds-name)">y</xsl:when>
                        <xsl:otherwise>n</xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="enabled">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@enabled) and $selection-ds-ok = 'y'">y</xsl:when>
                <xsl:otherwise>n</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="disabled-class">
            <xsl:if test="$enabled = 'n'">disabled</xsl:if>
        </xsl:variable>
        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $mandatory, ' ', $disabled-class)"/></xsl:variable>

        <div id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'radio-select-list'), $class)} {$invisible-class}" title="{@tooltip}">
            <xsl:choose>
                <xsl:when test="$enabled = 'y'">
                    <select id="{@name}:input" size="{$rows}" title="{@tooltip}" style="display: none;"></select>
                </xsl:when>
                <xsl:otherwise>
                    <select id="{@name}:input" size="{$rows}" disabled="true" title="{@tooltip}" style="display: none;"></select>
                </xsl:otherwise>
            </xsl:choose>
            <div class="select-list-mandatory" title="This field is mandatory. Please make a selection.">                
                This field is mandatory. Please make a selection.
            </div>
        </div>
    </xsl:template>
    
</xsl:stylesheet>