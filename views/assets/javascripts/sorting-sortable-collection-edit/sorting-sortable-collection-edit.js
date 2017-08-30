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

    let NAMESPACE = 'qor.collection.sortable',
        EVENT_ENABLE = 'enable.' + NAMESPACE,
        EVENT_DISABLE = 'disable.' + NAMESPACE,
        EVENT_CLICK = 'click.' + NAMESPACE,
        CLASS_ITEM = '.qor-sortable__item',
        CLASS_CHILDREN_ITEM = '> .qor-field__block > .qor-sortable__item',
        CLASS_BUTTON_CHANGE = '>.qor-sortable__button > .qor-sortable__button-change',
        CLASS_BUTTON_DONE = '>.qor-sortable__button > .qor-sortable__button-done',
        CLASS_BUTTON_ADD = '> .qor-field__block > .qor-sortable__button-add',
        CLASS_BUTTON_DELETE = '> .qor-sortable__button-delete',
        CLASS_BUTTON_MOVE = '>.qor-field__block > .qor-sortable__item > .qor-sortable__change .qor-sortable__button-move',
        CLASS_ACTION = '> .qor-sortable__change > .qor-sortable__action',
        CLASS_ACTION_POSITION = '.qor-sortable__action-position',
        CLASS_ITEM_FILTER = '.is-delete,.qor-fieldset--new',
        IS_LOADED = 'sortable-collection-loaded';

    function QorCollectionSortable(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, QorCollectionSortable.DEFAULTS, $.isPlainObject(options) && options);
        this.init();
    }

    QorCollectionSortable.prototype = {
        constructor: QorCollectionSortable,

        init: function() {
            this.bind();
            this.initItemOrder();
        },

        bind: function() {
            this.$element
                .on(EVENT_CLICK, CLASS_BUTTON_MOVE, this.moveItem.bind(this))
                .on(EVENT_CLICK, CLASS_BUTTON_DONE, this.finishMoveItem.bind(this))
                .on(EVENT_CLICK, CLASS_BUTTON_CHANGE, this.startMoveItem.bind(this));
        },

        unbind: function() {
            this.$element
                .off(EVENT_CLICK, CLASS_BUTTON_MOVE, this.moveItem.bind(this))
                .off(EVENT_CLICK, CLASS_BUTTON_DONE, this.finishMoveItem.bind(this))
                .off(EVENT_CLICK, CLASS_BUTTON_CHANGE, this.startMoveItem.bind(this));
        },

        initItemOrder: function(resetResource) {
            var $item = this.$element.find(CLASS_CHILDREN_ITEM).not(CLASS_ITEM_FILTER);

            // return false if no item
            if (!$item.length) {
                return;
            }

            var $select = $item.find(CLASS_ACTION).find(CLASS_ACTION_POSITION),
                orderData = {},
                itemTotal = $item.length,
                template = $item.first().html(),
                fullResourceName,
                resourceNamePrefix;

            if ($select.length) {
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

            $item.each(function(index) {
                var $this = $(this),
                    $action = $this.find(CLASS_ACTION);

                orderData.isSelected = false;
                orderData.itemTotal = itemTotal;
                orderData.itemIndex = index + 1;

                $action.prepend('<select class="qor-sortable__action-position"></select>');

                for (var i = 1; i <= itemTotal; i++) {
                    orderData.index = i;
                    orderData.itemIndex == i ? (orderData.isSelected = true) : (orderData.isSelected = false);
                    $action.find('select').append(window.Mustache.render(QorCollectionSortable.OPTION_HTML, orderData));
                }

                // reset form resource name prop
                if (resetResource) {
                    var resourceName,
                        newPosition,
                        resourceNameEnd,
                        hasPrefixPosition = /\[\d+\]/.test(resourceNamePrefix),
                        $resource = $(this).find('[name^="' + resourceNamePrefix + '"]');

                    if (!$resource.length) {
                        return;
                    }

                    $resource.each(function() {
                        resourceName = $(this).prop('name');
                        resourceNameEnd = resourceName.match(/\.\w+$/);
                        newPosition = `[${orderData.itemIndex}]`;

                        if (hasPrefixPosition) {
                            // fullResourceName = QorResource.SerializableMeta.Sections[0].Items[0(this number is the position)].Name
                            // resourceNamePrefix = QorResource.SerializableMeta.Sections[0].Items
                            // change the last [0].Name to real position
                            resourceName = resourceName.replace(/\[\d+\]\.\w+$/, `${newPosition}${resourceNameEnd}`);
                        } else {
                            resourceName = resourceName.replace(/\[\d+\]/, newPosition);
                        }

                        $(this).prop('name', resourceName);
                    });
                }

                $this.data(orderData);
            });
        },

        moveItem: function(e) {
            let $current = $(e.target).closest(CLASS_ITEM),
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

            $target = this.$element.find(CLASS_CHILDREN_ITEM).filter(function() {
                return $(this).data().itemIndex == insertPosition;
            });

            if (targetPosition == 1) {
                $target.before($current.fadeOut('slow').fadeIn('slow'));
            } else {
                $target.after($current.fadeOut('slow').fadeIn('slow'));
            }

            this.initItemOrder(true);
        },

        finishMoveItem: function(e) {
            let $target = $(e.target),
                $element = this.$element,
                $item = $element.find(CLASS_CHILDREN_ITEM).not(CLASS_ITEM_FILTER),
                $addButton = $element.find(CLASS_BUTTON_ADD),
                $deleteButton = $item.find(CLASS_BUTTON_DELETE),
                $actionButtons = $item.find(CLASS_ACTION);

            $target.hide();
            $actionButtons.hide();

            $element.find(CLASS_BUTTON_CHANGE).show();
            $addButton.show();
            $deleteButton.show();
        },

        startMoveItem: function(e) {
            let $target = $(e.target),
                $element = this.$element,
                $item = $element.find(CLASS_CHILDREN_ITEM).not(CLASS_ITEM_FILTER),
                $addButton = $element.find(CLASS_BUTTON_ADD),
                $deleteButton = $item.find(CLASS_BUTTON_DELETE),
                $actionButtons = $item.find(CLASS_ACTION);

            if (!$item.length) {
                return false;
            }

            $target.hide();

            $element.find(CLASS_BUTTON_DONE).show();
            $actionButtons.show();
            $addButton.hide();
            $deleteButton.hide();
            this.initItemOrder();
        },

        destroy: function() {
            this.unbind();
            this.$element.removeData(NAMESPACE);
        }
    };

    QorCollectionSortable.DEFAULTS = {};

    QorCollectionSortable.OPTION_HTML =
        '<option value="[[index]]" [[#isSelected]]selected[[/isSelected]]>[[index]] of [[itemTotal]]</option>';

    QorCollectionSortable.plugin = function(options) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data(NAMESPACE);
            var fn;

            if (!data) {
                if (/destroy/.test(options)) {
                    return;
                }

                $this.data(NAMESPACE, (data = new QorCollectionSortable(this, options)));
            }

            if (typeof options === 'string' && $.isFunction((fn = data[options]))) {
                fn.apply(data);
            }
        });
    };

    $(function() {
        var selector = '[data-toggle="qor.collection.sortable"]';

        if ($('body').data(IS_LOADED)) {
            return;
        }
        $('body').data(IS_LOADED, true);

        $(document)
            .on(EVENT_DISABLE, function(e) {
                QorCollectionSortable.plugin.call($(selector, e.target), 'destroy');
            })
            .on(EVENT_ENABLE, function(e) {
                QorCollectionSortable.plugin.call($(selector, e.target));
            })
            .triggerHandler(EVENT_ENABLE);
    });

    return QorCollectionSortable;
});
