/************************************************************************
*************************************************************************
@Name :           Selectyze - jQuery Plugin
@Revison :        1.1
@Date :         25/01/2011
@Author:         Mickael SURREL - ALPIXEL Agency - (www.myjqueryplugins.com - www.alpixel.fr) 
@Author:         Geoff McIver - mangled to actually work without z-index and other things
@License :         Open Source - MIT License : http://www.opensource.org/licenses/mit-license.php
 
**************************************************************************
*************************************************************************/
(function($) {
    $.fn.Selectyze = function(opt) {
        var defaults = {
            theme:'css3',
            effectOpen : 'slide',
            effectClose : 'slide'
        }; 
        
        if(this.length)
        return this.each(function() {
            
            /** vars **/
            var 
                opts = $.extend(defaults, opt),
                $this = $(this),
                optionselected = $this.find('option').filter(':selected'),
                DivSelect = $('<div>', {'class' : 'DivSelectyze '+opts.theme+''}),
                UlSelect = $('<ul>',{'class':'UlSelectize'}),
                liHtml = '';
            
            zIndex = 9999;

            /** DOM construction && manipulation **/
            constructList($this);
            $this.hide();
            $this.after(DivSelect);
            DivSelect.html('<a href="#" rel="'+optionselected.val()+'" class="selectyzeValue">'+optionselected.text()+'</a>');

            UlSelect.appendTo(DivSelect).html(liHtml);
            $('.DivSelectyze').each(function(i,el){
                //$(this).css('z-index',zIndex);
                //zIndex -= 10;
            });

            /** Actions **/
            n=false;
            DivSelect.mouseenter(function() {n =false; }).mouseleave(function() {n = true;});
            
            DivSelect.find('a.selectyzeValue').click(function(e){
                e.preventDefault();
                
                closeList($('ul.UlSelectize').not($(this).next()));
                openList($(this).next('ul.UlSelectize'));
                UlSelect.find("li a").first().focus(); // select the first option so they can use the keyboard too
            });
            
            DivSelect.find('a.selectyzeValue').keydown(function(e) {
                var isOpen = UlSelect.is(":visible");
                var keyPressed = parseInt(e.which, 10);
                if (keyPressed === 40 || keyPressed === 13) { // down arrow or enter key
                    if (!isOpen) {
                        // open the select list
                        e.preventDefault();
                        closeList($('ul.UlSelectize').not($(this).next()));
                        openList($(this).next('ul.UlSelectize'));    
                        UlSelect.find("li a").first().focus(); // select the first option
                    } 
                } 
            });

            UlSelect.find("li a").keydown(function(e) {
                var numberOfOptions = UlSelect.find('li a').length;
                var keyPressed = parseInt(e.which, 10);
                if (keyPressed === 40 || keyPressed === 38) { // down or up arrows
                    e.preventDefault(); // prevent default key behaviour of screen scrolling
                    var newCurrentOptionIndex;
                    UlSelect.find("li a").each(function(index) {
                        if ($(this).is(":focus")) {
                            if (keyPressed === 40) { // down arrow
                                if (index === numberOfOptions - 1) {
                                    newCurrentOptionIndex = 0;  // last option. loop back to the first option.
                                } else {
                                    newCurrentOptionIndex = index + 1;    
                                }
                            } else if (keyPressed === 38) { // up arrow
                                if (index === 0) {
                                    newCurrentOptionIndex = numberOfOptions - 1; // first option. loop back to the last option.
                                } else {
                                    newCurrentOptionIndex = index - 1;    
                                }
                            }
                        }
                    });
                    UlSelect.find("li a").eq(newCurrentOptionIndex).focus(); // select the new option
                } else if (keyPressed === 27) { // Esc key
                    // close the select list
                    $('ul.UlSelectize').trigger('closelist');
                    closeList($this.next().find('.UlSelectize'));
                } else if (keyPressed === 9) { // tab key
                    var selectedOption;    
                    UlSelect.find("li a").each(function(index) {
                        if ($(this).is(":focus")) {
                            selectedOption = index;
                            return true;
                        }
                    });
                    var lastOptionIsSelected = (selectedOption === (numberOfOptions - 1));
                    if (lastOptionIsSelected) {
                        // they tabbed past the last option, the focus is moving away from the select list - close the select list
                        $('ul.UlSelectize').trigger('closelist');
                        closeList($this.next().find('.UlSelectize'));
                    }
                }
            });
            
            UlSelect.find('a').click(function(e){
                e.preventDefault();
                
                var textValueString = "";
                var maxlength = 29;
                if ($(this).text().length > maxlength) {
                    textValueString = $(this).text().substring(0,maxlength) + "...";
                } else {
                    textValueString = $(this).text();
                }
                DivSelect.find('a.selectyzeValue').text(textValueString);
                $this.val($(this).attr('rel'));           
                $this.trigger('change'); 
                $('ul.UlSelectize').trigger('closelist');
                closeList($this.next().find('.UlSelectize'));
            });
            
            $(document).click(function(e){if(n) { closeList($('.UlSelectize').not(':hidden'));}});

            /** Construct HTML list ul/li **/
            function constructList(el){
                /** Creat list content **/
                if(el.has('optgroup').length)
                {
                    el.find('optgroup').each(function(i,el){
                        liHtml += '<li><span class="optgroupTitle">'+$(this).attr('label')+'</span><ul>';
                        $(this).children().each(function(i,el){
                            liHtml += '<li><a rel="'+$(this).val()+'" href="#">'+$(this).text()+'</a></li>';
                        });
                        liHtml += '</ul></li>';
                    });
                }
                else
                {
                    el.find('option').each(function(i,el){
                        liHtml += '<li><a rel="'+$(this).val()+'" href="#">'+$(this).text()+'</a></li>';
                    });
                }
            }

            /** Effect Open list **/
            function openList(el) {
                el.trigger('openlist');
                switch (opts.effectOpen) {
                    case 'slide' :
                        if(!el.is(':hidden')) el.stop(true,true).slideUp('fast');    
                        else el.stop(true,true).slideDown('fast');    
                    break;
                    case 'fade':
                        if(!el.is(':hidden')) el.stop(true,true).fadeOut('fast');    
                        else el.stop(true,true).fadeIn('fast');    
                    break;
                    default :
                        if(!el.is(':hidden')) el.stop(true,true).hide();    
                        else el.stop(true,true).show();    
                }
            }
            
            /** Effect Close list **/
            function closeList(el) {
                el.trigger('closelist');
                switch (opts.effectClose) {
                    case 'slide' :
                        el.stop(true,true).slideUp('fast');
                    break;
                    case 'fade':
                        el.stop(true,true).fadeOut('fast');
                    break;
                    default :
                        el.hide();    
                }
            }
            
        });
    }
})(YAHOO.jQuery_1_9_1_core);
