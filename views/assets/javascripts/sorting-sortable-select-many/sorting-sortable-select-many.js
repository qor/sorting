(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node / CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {

  'use strict';

  var Mustache = window.Mustache;
  var Sortable = window.Sortable;
  var _ = window._;
  var NAMESPACE = 'qor.chooser.sortable';
  var EVENT_ENABLE = 'enable.' + NAMESPACE;
  var EVENT_CLICK = 'click.' + NAMESPACE;
  var EVENT_DISABLE = 'disable.' + NAMESPACE;
  var CLASS_MULTI = '.chosen-container-multi';
  var CLASS_CHOSE = '.search-choice';
  var CLASS_CHOSE_CONTAINER = '.chosen-container';
  var CLASS_SORTABLE_BODY = '.qor-dragable';
  var CLASS_SORTABLE = '.qor-dragable__list';
  var CLASS_SORTABLE_HANDLE = '.qor-dragable__list-handle';
  var CLASS_SORTABLE_DELETE = '.qor-dragable__list-delete';
  var CLASS_SORTABLE_DATA = '.qor-dragable__list-data';
  var CLASS_SORTABLE_BUTTON_ADD = '.qor-dragable__button-add';
  var IS_LOADED = 'load-sortable-select-many';

  function QorChooserSortable(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, QorChooserSortable.DEFAULTS, $.isPlainObject(options) && options);
    this.init();
  }

  QorChooserSortable.prototype = {
    constructor: QorChooserSortable,

    init: function () {
      var $this = this.$element;
      var $parent = $this.parents(CLASS_SORTABLE_BODY);
      var self = this;

      this.$selector = $parent.find(CLASS_SORTABLE_DATA);
      this.$sortableList = $parent.find(CLASS_SORTABLE);
      this.$parent = $parent;

      var sortEle = $parent.find(CLASS_SORTABLE)[0];

      this.sortable = Sortable.create(sortEle, {
          animation: 150,
          handle: CLASS_SORTABLE_HANDLE,
          filter: CLASS_SORTABLE_DELETE,
          dataIdAttr: 'data-index',

          onFilter: function (e){
            // TODO
            var $ele = $(e.item);
            var eleIndex = $ele.data('index');

            $ele.remove();
            self.removeItems(eleIndex);
          },
          onUpdate: function (){
            self.renderOption();
          }
      });

      if (!$this.prop('multiple')) {
        if ($this.children('[selected]').length) {
          $this.prepend('<option value=""></option>');
        } else {
          $this.prepend('<option value="" selected></option>');
        }
      }

      $this.on('chosen:ready', function (e,chosen) {

        $(chosen.chosen.search_field).attr('placeholder',this.$element.data('placeholder'));
        $parent.find(CLASS_CHOSE).hide();
        $parent.find(CLASS_CHOSE_CONTAINER).hide();

      }.bind(this));

      $this.chosen({
        allow_single_deselect: true,
        search_contains: true,
        disable_search_threshold: 10,
        width: '100%',
        display_selected_options: false
      })
      .on('change', function (e,params) {
        var $target = $(e.target);
        var $chosenMulti = $target.next(CLASS_MULTI);
        var selected = params.selected;

        if (!$chosenMulti.size()){
          return;
        }

        $parent.find(CLASS_CHOSE).hide();

        if (selected){
          this.addItems(selected);
        }

      }.bind(this));

      this.bind();

    },

    bind: function () {
      this.$parent.on(EVENT_CLICK, CLASS_SORTABLE_BUTTON_ADD,  this.show.bind(this));
    },

    unbind: function () {
      this.$parent.off(EVENT_CLICK, CLASS_SORTABLE_BUTTON_ADD, this.show);
    },

    show: function () {
      this.$parent.find(CLASS_CHOSE_CONTAINER).show().find('.search-field input').click();
      this.$parent.find(CLASS_SORTABLE_BUTTON_ADD).hide();
    },

    renderItem: function (data) {
      return Mustache.render(QorChooserSortable.LIST_HTML, data);
    },

    renderOption: function () {
      var indexArr = this.sortable.toArray();
      var $selector = this.$selector;

      $selector.empty();

      _.each(indexArr,function(id){
        $selector.append( Mustache.render(QorChooserSortable.OPTION_HTML, ({'value': id})));
      });

    },

    removeItems: function (index) {
      var $this = this.$element;
      var targetOption = $this.find('[data-index="' + index + '"]');
      var optionArrayIndex = $this.find('option').index(targetOption);

      this.$parent.find(CLASS_CHOSE).find('[data-option-array-index="' + optionArrayIndex + '"]').click();

      this.renderOption();
    },

    addItems: function (index) {
      var $this = this.$element;
      var data = $this.find('option[value="' + index + '"]').data();

      this.$sortableList.append(this.renderItem(data));
      this.renderOption();
    },

    destroy: function () {
      this.sortable.destroy();
      this.unbind();
      this.$element.chosen('destroy').removeData(NAMESPACE);
    }
  };

  QorChooserSortable.DEFAULTS = {};

  QorChooserSortable.LIST_HTML = '<li data-index=[[index]] data-value=[[value]]><span>[[value]]</span><i class="material-icons qor-dragable__list-delete">clear</i><i class="material-icons qor-dragable__list-handle">drag_handle</i></li>';
  QorChooserSortable.OPTION_HTML = '<option selected value=[[value]]></option>';

  QorChooserSortable.plugin = function (options) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {
        if (!$.fn.chosen) {
          return;
        }

        if (/destroy/.test(options)) {
          return;
        }

        $this.data(NAMESPACE, (data = new QorChooserSortable(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.apply(data);
      }
    });
  };

  $(function () {
    var selector = 'select[data-toggle="qor.chooser.sortable"]';

    if ($('body').data(IS_LOADED)) {
      return;
    }

    $('body').data(IS_LOADED,'true');

    $(document).
      on(EVENT_DISABLE, function (e) {
        QorChooserSortable.plugin.call($(selector, e.target), 'destroy');
      }).
      on(EVENT_ENABLE, function (e) {
        QorChooserSortable.plugin.call($(selector, e.target));
      }).
      triggerHandler(EVENT_ENABLE);
  });

  return QorChooserSortable;

});
