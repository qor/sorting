# Sorting

Sorting is used to add reordering abilities to [GORM-backend](https://github.com/jinzhu/gorm) models and sort collections

[![GoDoc](https://godoc.org/github.com/qor/sorting?status.svg)](https://godoc.org/github.com/qor/sorting)

## Sorting GORM-backend Models

Sorting all records of a model and save the order into the model's position column

### Register GORM Callbacks

Sorting is utilises [GORM](https://github.com/jinzhu/gorm) callbacks to log data, so you  will need to register callbacks first:

```go
import (
  "github.com/jinzhu/gorm"
  "github.com/qor/sorting"
)

func main() {
  db, err := gorm.Open("sqlite3", "demo_db")
  sorting.RegisterCallbacks(db)
}
```

### Sort Modes

Sorting has defined two modes which could be used as anonymous fields in a model.

- Ascending mode:smallest first (`sorting.Sorting`)
- Descending mode: smallest last (`sorting.SortingDESC`)

They can be used as follows:

```go
// Ascending mode
type Category struct {
  gorm.Model
  sorting.Sorting // this will register a `position` column to model Category, used to save record's order
}

db.Find(&categories)
// SELECT * FROM categories ORDER BY position;

// Descending mode
type Product struct {
  gorm.Model
  sorting.SortingDESC // this will register a `position` column to model Product, used to save record's order
}

db.Find(&products)
// SELECT * FROM products ORDER BY position DESC;
```

### Reordering

```go
// Move Up
sorting.MoveUp(&db, &product, 1)
// If a record is in positon 5, it will be brought to 4

// Move Down
sorting.MoveDown(&db, &product, 1)
// If a record is in positon 5, it will be brought to 6

// Move To
sorting.MoveTo(&db, &product, 1)
// If a record is in positon 5, it will be brought to 1
```

## Sorting Collections

Sorts a slice of data

```go
sorter := sorting.SortableCollection{
  PrimaryKeys: []string{"5", "3", "1", "2"}
}

products := []Product{
  {Model: gorm.Model{ID: 1}, Code: "1"},
  {Model: gorm.Model{ID: 2}, Code: "2"},
  {Model: gorm.Model{ID: 3}, Code: "3"},
  {Model: gorm.Model{ID: 3}, Code: "4"},
  {Model: gorm.Model{ID: 3}, Code: "5"},
}

sorter.Sort(products)

products // => []Product{
         //      {Model: gorm.Model{ID: 3}, Code: "5"},
         //      {Model: gorm.Model{ID: 3}, Code: "3"},
         //      {Model: gorm.Model{ID: 1}, Code: "1"},
         //      {Model: gorm.Model{ID: 2}, Code: "2"},
         //      {Model: gorm.Model{ID: 3}, Code: "4"},
         //    }
```

## Qor Support

[QOR](http://getqor.com) is architected from the ground up to accelerate development and deployment of Content Management Systems, E-commerce Systems, and Business Applications and as such is comprised of modules that abstract common features for such systems.

Although Sorting could be used alone, it works very nicely with QOR - if you have requirements to manage your application's data, be sure to check QOR out!

[QOR Demo:  http://demo.getqor.com/admin](http://demo.getqor.com/admin)

### Sorting GORM-backend Models

After enable sorting modes for GORM-backend models, qor admin will automatically enable the sorting feature for the resource

[Sorting Demo with QOR](http://demo.getqor.com/admin/colors?sorting=true)

### Sorting Collections

If you want to make a `select_many`, `collection_edit` Field be sortable, you could add a `sorting.SortableCollection` field with name Field's name + 'Sorter', which is used to save above field's data's order. then the above Field will be identified to be sortable in qor admin.

```
// For model relations
type Product struct {
  gorm.Model
  l10n.Locale
  Collections           []Collection
  CollectionsSorter     sorting.SortableCollection
  ColorVariations       []ColorVariation `l10n:"sync"`
  ColorVariationsSorter sorting.SortableCollection
}

// For virtual arguments
type selectedProductsArgument struct {
  Products       []string
  ProductsSorter sorting.SortableCollection
}

selectedProductsResource := Admin.NewResource(&selectedProductsArgument{})
selectedProductsResource.Meta(&admin.Meta{Name: "Products", Type: "select_many", Collection: func(value interface{}, context *qor.Context) [][]string {
  var collectionValues [][]string
  var products []*models.Product
  db.DB.Find(&products)
  for _, product := range products {
    collectionValues = append(collectionValues, []string{fmt.Sprint(product.ID), product.Name})
  }
  return collectionValues
}})

Widgets.RegisterWidget(&widget.Widget{
  Name:      "Products",
  Templates: []string{"products"},
  Setting:   selectedProductsResource,
}
```

## License

Released under the [MIT License](http://opensource.org/licenses/MIT).
