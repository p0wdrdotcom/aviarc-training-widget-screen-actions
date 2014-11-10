package com.blacha;

import java.io.Serializable;
import java.text.NumberFormat;
import java.util.Locale;

import com.aviarc.core.datarule.FieldFormatter;
import com.aviarc.core.exceptions.InvalidValueException;

public class CurrencyFormatter implements FieldFormatter, Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private static final NumberFormat  outputFormat   = NumberFormat.getCurrencyInstance();

    public String parseValue(String value, Locale locale) throws InvalidValueException {
        throw new InvalidValueException(); // TODO??
    }

    public String formatValue(String value, Locale locale) {
        if (value == null || "".equals(value)) {    
            return "";
        }
        
        double number = Double.valueOf(value);
        
        return outputFormat.format(number);
    }

    public String getInputMask(Locale locale) {
        return "xxx";
    }
    
    public int compareValues(String value1, String value2) {
        return value1.compareTo(value2);
    }

}
