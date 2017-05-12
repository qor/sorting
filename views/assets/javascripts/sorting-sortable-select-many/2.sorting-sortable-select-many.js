(function(factory) {
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
})(function($) {

    'use strict';

    var $body = $('body');
    var NAMESPACE = 'qor.chooser.sortable';
    var EVENT_ENABLE = 'enable.' + NAMESPACE;
    var EVENT_CLICK = 'click.' + NAMESPACE;
    var EVENT_DISABLE = 'disable.' + NAMESPACE;
    var CLASS_CHOSE = '.select2-selection__choice';
    var CLASS_CHOSE_REMOVE = '.select2-selection__choice__remove';
    var CLASS_CHOSE_CONTAINER = '.select2-container';
    var CLASS_CHOSE_INPUT = '.select2-search__field';
    var CLASS_SORTABLE_BODY = '.qor-dragable';
    var CLASS_SORTABLE = '.qor-dragable__list';
    var CLASS_SORTABLE_HANDLE = '.qor-dragable__list-handle';
    var CLASS_SORTABLE_DELETE = '.qor-dragable__list-delete';
    var CLASS_SORTABLE_DATA = '.qor-dragable__list-data';
    var CLASS_SORTABLE_BUTTON_ADD = '.qor-dragable__button-add';
    var CLASS_BOTTOMSHEETS = '.qor-bottomsheets';
    var CLASS_PARENT = '.qor-dragable';
    var CLASS_SELECT_FIELD = '.qor-dragable__list';
    var IS_LOADED = 'sortable-select-many-loaded';
    var CLASS_MANY = 'qor-bottomsheets__select-many';
    var CLASS_DELETED_ITEM = 'qor-selected-many__deleted';

    function QorChooserSortable(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, QorChooserSortable.DEFAULTS, $.isPlainObject(options) && options);
        this.init();
    }

    QorChooserSortable.prototype = {
        constructor: QorChooserSortable,

        init: function() {
            var $this = this.$element,
                select2Data = $this.data(),
                $parent = $this.parents(CLASS_SORTABLE_BODY),
                placeholderText = $this.data('placeholder'),
                self = this,
                option = {
                    minimumResultsForSearch: 8,
                    dropdownParent: $this.parent()
                };

            this.$selector = $parent.find(CLASS_SORTABLE_DATA);
            this.$sortableList = $parent.find(CLASS_SORTABLE);
            this.$parent = $parent;

            var sortEle = $parent.find(CLASS_SORTABLE)[0];

            this.sortable = window.Sortable.create(sortEle, {
                animation: 150,
                handle: CLASS_SORTABLE_HANDLE,
                filter: CLASS_SORTABLE_DELETE,
                dataIdAttr: 'data-index',

                onFilter: function(e) {
                    var $ele = $(e.item);
                    var eleIndex = $ele.data('index');

                    $ele.remove();
                    self.removeItemsFromList(eleIndex);
                },
                onUpdate: function() {
                    self.renderOption();
                }
            });

            if (select2Data.remoteData) {
                option.ajax = $.fn.select2.ajaxCommonOptions(select2Data);

                option.templateResult = function(data) {
                    var tmpl = $this.parents('.qor-field').find('[name="select2-result-template"]');
                    return $.fn.select2.ajaxFormatResult(data, tmpl);
                };

                option.templateSelection = function(data) {
                    if (data.loading) return data.text;
                    var tmpl = $this.parents('.qor-field').find('[name="select2-selection-template"]');
                    return $.fn.select2.ajaxFormatResult(data, tmpl);
                };
            }

            $this.on('change', function() {

                    setTimeout(function() {
                        $parent.find(CLASS_CHOSE).hide();
                    }, 1);

                    $(CLASS_CHOSE_INPUT).attr('placeholder', placeholderText);
                })
                .on('select2:select', function(e) {
                    self.addItems(e.params.data);
                })
                .on('select2:unselect', function(e) {
                    self.removeItems(e.params.data);
                });

            $this.select2(option);

            $parent.find(CLASS_CHOSE_CONTAINER).hide();
            $parent.find(CLASS_CHOSE).hide();
            $(CLASS_CHOSE_INPUT).attr('placeholder', placeholderText);

            this.bind();
        },

        bind: function() {
            this.$parent.on(EVENT_CLICK, CLASS_SORTABLE_BUTTON_ADD, this.show.bind(this));
        },

        unbind: function() {
            this.$parent.off(EVENT_CLICK, CLASS_SORTABLE_BUTTON_ADD, this.show);
        },

        show: function(e) {
          var $this = $(e.target).parent('.qor-dragable__button-add');
          if ($this.attr('data-selectmany-url')) {
              var data = $this.data();

              this.BottomSheets = $body.data('qor.bottomsheets');
              this.bottomsheetsData = data;

              this.$selector = data.selectId ? $(data.selectId) : $this.closest(CLASS_PARENT).find('select');
              this.$selectFeild = this.$selector.closest(CLASS_PARENT).find(CLASS_SELECT_FIELD);

              // select many templates
              this.SELECT_MANY_SELECTED_ICON = $('[name="select-many-selected-icon"]').html();
              this.SELECT_MANY_UNSELECTED_ICON = $('[name="select-many-unselected-icon"]').html();
              this.SELECT_MANY_HINT = $('[name="select-many-hint"]').html();
              this.SELECT_MANY_TEMPLATE = $('[name="select-many-template"]').html();

              data.url = data.selectmanyUrl;

              this.BottomSheets.open(data, this.handleBottomSelect.bind(this));
          } else {
              var $container = this.$parent.find(CLASS_CHOSE_CONTAINER);

              $container.show();
              this.$parent.find(CLASS_SORTABLE_BUTTON_ADD).hide();
              setTimeout(function() {
                  $container.find(CLASS_CHOSE_INPUT).click();
              }, 100);
          }
        },

        handleBottomSelect: function () {
          var $bottomsheets = $(CLASS_BOTTOMSHEETS),
          options = {
            onSelect: this.onSelectResults.bind(this),  // render selected item after click item lists
            onSubmit: this.onSubmitResults.bind(this)   // render new items after new item form submitted
          };

          $bottomsheets.qorSelectCore(options).addClass(CLASS_MANY);
          this.initItems();
        },

        onSelectResults: function (data) {
          if ($(CLASS_SORTABLE).find('li[data-index="' + data.primaryKey + '"]').size() == 0) {
            this.addItems(data);
          } else {
            this.removeItems(data);
          }
        },

        onSubmitResults: function (data) {
          this.addItems(data);
        },

        initItems: function () {
          var $tr = $(CLASS_BOTTOMSHEETS).find('tbody tr'),
              selectedIconTmpl = this.SELECT_MANY_SELECTED_ICON,
              unSelectedIconTmpl = this.SELECT_MANY_UNSELECTED_ICON,
              selectedIDs = [],
              primaryKey,
              $selectedItems = this.$selectFeild.find('[data-primary-key]').not('.' + CLASS_DELETED_ITEM);

          $selectedItems.each(function () {
            selectedIDs.push($(this).data().primaryKey);
          });

          $tr.each(function () {
            var $this = $(this),
                $td = $this.find('td:first');

            primaryKey = $this.data().primaryKey;

            if (selectedIDs.indexOf(primaryKey) !='-1') {
              $this.addClass(CLASS_SELECTED);
              $td.append(selectedIconTmpl);
            } else {
              $td.append(unSelectedIconTmpl);
            }
          });
        },

        renderItem: function(data) {
            return window.Mustache.render(QorChooserSortable.LIST_HTML, data);
        },

        renderOption: function() {
            var indexArr = this.sortable.toArray();
            var $selector = this.$parent.find(CLASS_SORTABLE_DATA);

            $selector.empty();

            window._.each(indexArr, function(id) {
                $selector.append(window.Mustache.render(QorChooserSortable.OPTION_HTML, ({
                    'value': id
                })));
            });
        },

        removeItems: function(data) {
            $(CLASS_SORTABLE).find('li[data-index="' + data.primaryKey + '"]').remove();
            this.renderOption();
        },

        removeItemsFromList: function(index) {
            this.renderOption();
        },

        addItems: function(data, isNewData) {
            data.id = data.Id || data.ID || data[Object.keys(data)[0]];
            data.value = data.Name || data.text || data.Text || data.Title || data.Code || data.Id || data.ID || data[Object.keys(data)[0]];
            this.$sortableList.append(this.renderItem(data));
            this.renderOption();

            if (isNewData) {
              this.BottomSheets.hide();
            }
        },

        destroy: function() {
            this.sortable.destroy();
            this.unbind();
            this.$element.select2('destroy').removeData(NAMESPACE);
        }
    };

    QorChooserSortable.DEFAULTS = {};

    QorChooserSortable.LIST_HTML = '<li data-index="[[primaryKey]]" data-value="[[value]]"><span>[[value]]</span><div><i class="material-icons qor-dragable__list-delete">clear</i><i class="material-icons qor-dragable__list-handle">drag_handle</i></div></li>';

    QorChooserSortable.OPTION_HTML = '<option selected value="[[value]]"></option>';

    QorChooserSortable.plugin = function(options) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data(NAMESPACE);
            var fn;

            if (!data) {

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

    $(function() {
        var selector = 'select[data-toggle="qor.chooser.sortable"]';

        if ($('body').data(IS_LOADED)) {
            return;
        }

        $('body').data(IS_LOADED, true);

        $(document).
        on(EVENT_DISABLE, function(e) {
            QorChooserSortable.plugin.call($(selector, e.target), 'destroy');
        }).
        on(EVENT_ENABLE, function(e) {
            QorChooserSortable.plugin.call($(selector, e.target));
        }).
        triggerHandler(EVENT_ENABLE);
    });

    return QorChooserSortable;

});
