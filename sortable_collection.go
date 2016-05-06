package sorting

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/jinzhu/gorm"
	"github.com/qor/admin"
	"github.com/qor/qor"
	"github.com/qor/qor/resource"
	"github.com/qor/qor/utils"
	"github.com/qor/roles"
)

type SortableCollection struct {
	PrimaryField string
	PrimaryKeys  []string
}

func (sortableCollection *SortableCollection) Scan(value interface{}) error {
	switch values := value.(type) {
	case []string:
		sortableCollection.PrimaryKeys = values
	case []byte:
		return json.Unmarshal(values, sortableCollection)
	default:
		return errors.New("unsupported driver -> Scan pair for MediaLibrary")
	}

	return nil
}

func (sortableCollection SortableCollection) Value() (driver.Value, error) {
	results, err := json.Marshal(sortableCollection)
	return string(results), err
}

func (sortableCollection SortableCollection) Sort(results interface{}) error {
	values := reflect.ValueOf(results)

	if reflect.Indirect(values).Kind() != reflect.Slice {
		return errors.New("invalid type")
	}

	if values.Kind() == reflect.Ptr {
		values.Elem().Set(sortableCollection.sortResults(values))
	} else {
		return errors.New("unaddressable value")
	}

	return nil
}

func (sortableCollection SortableCollection) sortResults(values reflect.Value) reflect.Value {
	scope := gorm.Scope{Value: values.Interface()}
	if primaryField := scope.PrimaryField(); primaryField != nil {
		var (
			primaryFieldName = primaryField.Name
			indirectValues   = reflect.Indirect(values)
			sliceType        = indirectValues.Type()
			slice            = reflect.MakeSlice(sliceType, 0, 0)
			slicePtr         = reflect.New(sliceType)
			orderedMap       = map[int]bool{}
		)

		slicePtr.Elem().Set(slice)
		for _, primaryKey := range sortableCollection.PrimaryKeys {
			for i := 0; i < indirectValues.Len(); i++ {
				value := indirectValues.Index(i)
				field := value.FieldByName(primaryFieldName)
				if fmt.Sprint(field.Interface()) == primaryKey {
					slicePtr.Elem().Set(reflect.Append(slicePtr.Elem(), value))
					orderedMap[i] = true
				}
			}
		}

		for i := 0; i < indirectValues.Len(); i++ {
			if _, ok := orderedMap[i]; !ok {
				slicePtr.Elem().Set(reflect.Append(slicePtr.Elem(), indirectValues.Index(i)))
			}
		}

		return slicePtr.Elem()
	}

	return reflect.Value{}
}

func (sortableCollection *SortableCollection) ConfigureQorMeta(metaor resource.Metaor) {
	if meta, ok := metaor.(*admin.Meta); ok {
		var (
			name         = strings.TrimSuffix(meta.GetName(), "Sorter")
			res          = meta.GetBaseResource().(*admin.Resource)
			sortableMeta = res.GetMeta(name)
		)

		res.UseTheme("sortable_collection")

		if sortableMeta != nil && (sortableMeta.Type == "select_many" || sortableMeta.Type == "collection_edit") {
			sortableMeta.Type = "sortable_" + sortableMeta.Type

			setter := sortableMeta.GetSetter()
			sortableMeta.SetSetter(func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
				primaryKeys := utils.ToArray(metaValue.Value)
				reflectValue := reflect.Indirect(reflect.ValueOf(record))
				reflectValue.FieldByName(meta.GetName()).Addr().Interface().(*SortableCollection).Scan(primaryKeys)
				setter(record, metaValue, context)
			})

			valuer := sortableMeta.GetValuer()
			sortableMeta.SetValuer(func(record interface{}, context *qor.Context) interface{} {
				results := valuer(record, context)
				isPtr := reflect.ValueOf(results).Kind() == reflect.Ptr

				reflectValue := reflect.Indirect(reflect.ValueOf(record))
				if isPtr {
					reflectValue.FieldByName(meta.GetName()).Interface().(SortableCollection).Sort(results)
					return results
				} else {
					values := reflectValue.FieldByName(meta.GetName()).Interface().(SortableCollection).sortResults(reflect.ValueOf(results))
					return values.Interface()
				}
			})

			meta.SetSetter(func(interface{}, *resource.MetaValue, *qor.Context) {})
			meta.SetPermission(roles.Deny(roles.CRUD, roles.Anyone))
		}
	}
}
