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

  var NAMESPACE = 'qor.collection.sortable';
  var EVENT_ENABLE = 'enable.' + NAMESPACE;
  var EVENT_DISABLE = 'disable.' + NAMESPACE;
  var EVENT_CLICK = 'click.' + NAMESPACE;
  var CLASS_ITEM = '.qor-sortable__item';
  var CLASS_BUTTON_CHANGE = '.qor-sortable__button-change';
  var CLASS_BUTTON_DONE = '.qor-sortable__button-done';
  var CLASS_BUTTON_ADD = '.qor-sortable__button-add';
  var CLASS_BUTTON_DELETE = '.qor-sortable__button-delete';
  var CLASS_BUTTON_MOVE = '.qor-sortable__button-move';
  var CLASS_ACTION = '.qor-sortable__action';
  var CLASS_ACTION_POSITION = '.qor-sortable__action-position';
  var IS_DELETE = '.is-delete';
  var IS_LOADED = 'sortable-collection-loaded';

  function QorCollectionSortable(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, QorCollectionSortable.DEFAULTS, $.isPlainObject(options) && options);
    this.init();
  }

  QorCollectionSortable.prototype = {
    constructor: QorCollectionSortable,

    init: function () {
      this.bind();
      this.initItemOrder();
    },

    bind: function () {
      this.$element.on(EVENT_CLICK, $.proxy(this.click, this));
    },

    unbind: function () {
      this.$element.off(EVENT_CLICK, this.click);
    },

    initItemOrder: function (resetResource) {
      var $item = this.$element.find(CLASS_ITEM).filter(':visible').not(IS_DELETE);

      // return false if haven't any item
      if (!$item.size()){
        return;
      }

      var $select = $item.find(CLASS_ACTION).find(CLASS_ACTION_POSITION),
          orderData = {},
          itemTotal = $item.size(),
          template = $item.first().html(),
          fullResourceName,
          resourceNamePrefix;

      if ($select.size()){
        $select.remove();
      }

      if (!resourceNamePrefix) {
        fullResourceName = template.match(/(\w+)\="(\S*\[\d+\]\S*)"/); // get results : [attribute, name, value]
        if (fullResourceName.length) {

          fullResourceName = fullResourceName[2];
          resourceNamePrefix = fullResourceName.match(/^(\S*)\[(\d+)\]([^\[\]]*)$/); // get results : [input, prefix, index, suffix]

          if (resourceNamePrefix.length) {
            resourceNamePrefix = resourceNamePrefix[1];
          }
        }

      }

      $item.each(function (index) {
        var $this = $(this),
            $action = $this.find(CLASS_ACTION);

        orderData.isSelected = false;
        orderData.itemTotal = itemTotal;
        orderData.itemIndex = index + 1;

        $action.prepend('<select class="qor-sortable__action-position"></select>');

        for (var i = 1; i <= itemTotal; i++) {
          orderData.index = i;
          ( orderData.itemIndex == i ) ? ( orderData.isSelected = true ) : ( orderData.isSelected = false );
          $action.find('select').append(window.Mustache.render(QorCollectionSortable.OPTION_HTML, orderData));
        }

        // reset form resource name prop
        if (resetResource){
          var resourceName,
              newResourceName,
              $resource = $(this).find('[name^="' + resourceNamePrefix + '"]');

          $resource.size() && $resource.each(function () {
            resourceName = $(this).prop('name');
            newResourceName = '[' + orderData.itemIndex + ']';
            resourceName = resourceName.replace(/\[\d+\]/,newResourceName);
            $(this).prop('name',resourceName);
          });
        }

        $this.data(orderData);

      });
    },

    moveItem: function ($ele) {
      var $current = $ele.closest(CLASS_ITEM),
          currentPosition = $current.data().itemIndex,
          targetPosition = $current.find(CLASS_ACTION_POSITION).val(),
          insertPosition,
          $target;


      if (targetPosition == currentPosition) {
        return;
      }

      if (targetPosition == 1) {
        insertPosition = 1;
      } else if (targetPosition < currentPosition) {
        insertPosition = targetPosition - 1;
      } else {
        insertPosition = targetPosition;
      }

      $target = $(CLASS_ITEM).filter(function(){
        return $(this).data().itemIndex == insertPosition;
      });

      if (targetPosition == 1) {
        $target.before($current.fadeOut('slow').fadeIn('slow'));
      } else {
        $target.after($current.fadeOut('slow').fadeIn('slow'));
      }

      this.initItemOrder(true);

    },

    click: function (e) {
      var $target = $(e.target),
          $element = this.$element,
          $item = $element.find(CLASS_ITEM).filter(':visible').not(IS_DELETE);

      if ($target.is(CLASS_BUTTON_MOVE)){
        this.moveItem($target);
      }

      if ($target.is(CLASS_BUTTON_DONE)){
        $target.hide();
        $element.find(CLASS_ACTION).hide();

        $element.find(CLASS_BUTTON_CHANGE).show();
        $element.find(CLASS_BUTTON_ADD).show();
        $element.find(CLASS_BUTTON_DELETE).show();
      }

      if ($target.is(CLASS_BUTTON_CHANGE) && $item.size()){
        $target.hide();

        $element.find(CLASS_BUTTON_DONE).show();
        $element.find(CLASS_ACTION).show();
        $element.find(CLASS_BUTTON_ADD).hide();
        $element.find(CLASS_BUTTON_DELETE).hide();

        this.initItemOrder();
      }

    },

    destroy: function () {
      this.unbind();
      this.$element.removeData(NAMESPACE);
    }
  };

  QorCollectionSortable.DEFAULTS = {};

  QorCollectionSortable.OPTION_HTML = '<option value="[[index]]" [[#isSelected]]selected[[/isSelected]]>[[index]] of [[itemTotal]]</option>';


  QorCollectionSortable.plugin = function (options) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(NAMESPACE);
      var fn;

      if (!data) {

        if (/destroy/.test(options)) {
          return;
        }

        $this.data(NAMESPACE, (data = new QorCollectionSortable(this, options)));
      }

      if (typeof options === 'string' && $.isFunction(fn = data[options])) {
        fn.apply(data);
      }
    });
  };

  $(function () {
    var selector = '[data-toggle="qor.collection.sortable"]';

    if ($('body').data(IS_LOADED)){
      return;
    }
    $('body').data(IS_LOADED,true);

    $(document).
      on(EVENT_DISABLE, function (e) {
        QorCollectionSortable.plugin.call($(selector, e.target), 'destroy');
      }).
      on(EVENT_ENABLE, function (e) {
        QorCollectionSortable.plugin.call($(selector, e.target));
      }).
      triggerHandler(EVENT_ENABLE);
  });

  return QorCollectionSortable;

});
