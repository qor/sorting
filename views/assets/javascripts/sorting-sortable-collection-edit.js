"use strict";var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};!function(t){"function"==typeof define&&define.amd?define(["jquery"],t):t("object"===("undefined"==typeof exports?"undefined":_typeof(exports))?require("jquery"):jQuery)}(function(t){function e(o,n){this.$element=t(o),this.options=t.extend({},e.DEFAULTS,t.isPlainObject(n)&&n),this.init()}var o="qor.collection.sortable",n="click."+o,i="> .qor-field__block > .qor-sortable__item",r="> .qor-sortable__change > .qor-sortable__action";return e.prototype={constructor:e,init:function(){this.bind(),this.initItemOrder()},bind:function(){this.$element.on(n,">.qor-field__block > .qor-sortable__item > .qor-sortable__change .qor-sortable__button-move",this.moveItem.bind(this)).on(n,">.qor-sortable__button > .qor-sortable__button-done",this.finishMoveItem.bind(this)).on(n,">.qor-sortable__button > .qor-sortable__button-change",this.startMoveItem.bind(this))},unbind:function(){this.$element.off(n,this.click)},initItemOrder:function(o){var n=this.$element.find(i).not(".is-delete,.qor-fieldset--new");if(n.size()){var l,s,a=n.find(r).find(".qor-sortable__action-position"),d={},c=n.size(),f=n.first().html();a.size()&&a.remove(),s||(l=f.match(/(\w+)\="(\S*\[\d+\]\S*)"/),l.length&&(l=l[2],s=l.match(/^(\S*)\[(\d+)\]([^\[\]]*)$/),s.length&&(s=s[1]))),n.each(function(n){var i=t(this),l=i.find(r);d.isSelected=!1,d.itemTotal=c,d.itemIndex=n+1,l.prepend('<select class="qor-sortable__action-position"></select>');for(var a=1;a<=c;a++)d.index=a,d.itemIndex==a?d.isSelected=!0:d.isSelected=!1,l.find("select").append(window.Mustache.render(e.OPTION_HTML,d));if(o){var f,b,u,h=/\[\d+\]/.test(s),_=t(this).find('[name^="'+s+'"]');if(!_.length)return;_.each(function(){f=t(this).prop("name"),u=f.match(/\.\w+$/),b="["+d.itemIndex+"]",f=h?f.replace(/\[\d+\]\.\w+$/,""+b+u):f.replace(/\[\d+\]/,b),t(this).prop("name",f)})}i.data(d)})}},moveItem:function(e){var o=t(e.target).closest(".qor-sortable__item"),n=o.data().itemIndex,r=o.find(".qor-sortable__action-position").val(),l=void 0,s=void 0;r!=n&&(l=1==r?1:r<n?r-1:r,s=this.$element.find(i).filter(function(){return t(this).data().itemIndex==l}),1==r?s.before(o.fadeOut("slow").fadeIn("slow")):s.after(o.fadeOut("slow").fadeIn("slow")),this.initItemOrder(!0))},finishMoveItem:function(e){var o=t(e.target),n=this.$element,l=n.find(i).not(".is-delete,.qor-fieldset--new"),s=n.find("> .qor-field__block > .qor-sortable__button-add"),a=l.find("> .qor-sortable__button-delete"),d=l.find(r);o.hide(),d.hide(),n.find(">.qor-sortable__button > .qor-sortable__button-change").show(),s.show(),a.show()},startMoveItem:function(e){var o=t(e.target),n=this.$element,l=n.find(i).not(".is-delete,.qor-fieldset--new"),s=n.find("> .qor-field__block > .qor-sortable__button-add"),a=l.find("> .qor-sortable__button-delete"),d=l.find(r);if(!l.size())return!1;o.hide(),n.find(">.qor-sortable__button > .qor-sortable__button-done").show(),d.show(),s.hide(),a.hide(),this.initItemOrder()},destroy:function(){this.unbind(),this.$element.removeData(o)}},e.DEFAULTS={},e.OPTION_HTML='<option value="[[index]]" [[#isSelected]]selected[[/isSelected]]>[[index]] of [[itemTotal]]</option>',e.plugin=function(n){return this.each(function(){var i,r=t(this),l=r.data(o);if(!l){if(/destroy/.test(n))return;r.data(o,l=new e(this,n))}"string"==typeof n&&t.isFunction(i=l[n])&&i.apply(l)})},t(function(){var o='[data-toggle="qor.collection.sortable"]';t("body").data("sortable-collection-loaded")||(t("body").data("sortable-collection-loaded",!0),t(document).on("disable.qor.collection.sortable",function(n){e.plugin.call(t(o,n.target),"destroy")}).on("enable.qor.collection.sortable",function(n){e.plugin.call(t(o,n.target))}).triggerHandler("enable.qor.collection.sortable"))}),e});