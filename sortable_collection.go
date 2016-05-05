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
	if values.Kind() != reflect.Ptr && values.Elem().Kind() != reflect.Slice {
		return errors.New("invalid type")
	}

	var (
		scope            = gorm.Scope{Value: results}
		primaryFieldName = scope.PrimaryField().Name
		indirectValues   = values.Elem()
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

	values.Elem().Set(slicePtr.Elem())

	return nil
}

func (sortableCollection SortableCollection) ConfigureQorMeta(metaor resource.Metaor) error {
	if meta, ok := metaor.(*admin.Meta); ok {
		name := strings.TrimSuffix(meta.GetName(), "Sorter")
		res := meta.GetBaseResource().(*admin.Resource)
		sortableMeta := res.GetMeta(name)

		setter := sortableMeta.GetSetter()
		sortableMeta.SetSetter(func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
			setter(record, metaValue, context)
		})

		valuer := sortableMeta.GetValuer()
		sortableMeta.SetValuer(func(record interface{}, context *qor.Context) interface{} {
			return valuer(record, context)
		})
	}
	return nil
}
