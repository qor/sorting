# Sorting

Sorting is used to add sorting and reordering abilities to [GORM-backend](https://github.com/jinzhu/gorm) models.

[![GoDoc](https://godoc.org/github.com/qor/sorting?status.svg)](https://godoc.org/github.com/qor/sorting)

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
  sorting.Sorting // this will register a `position` column to model Category, add it with gorm AutoMigrate
}

db.Find(&categories)
// SELECT * FROM categories ORDER BY position;

// Descending mode
type Product struct {
  gorm.Model
  sorting.SortingDESC // this will register a `position` column to model Product, add it with gorm AutoMigrate
}

db.Find(&products)
// SELECT * FROM products ORDER BY position DESC;
```

### Reorder

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

## Qor Support

[QOR](http://getqor.com) is architected from the ground up to accelerate development and deployment of Content Management Systems, E-commerce Systems, and Business Applications and as such is comprised of modules that abstract common features for such systems.

Although Sorting could be used alone, it works very nicely with QOR - if you have requirements to manage your application's data, be sure to check QOR out!

[QOR Demo:  http://demo.getqor.com/admin](http://demo.getqor.com/admin)

[Sorting Demo with QOR](http://demo.getqor.com/admin/colors?sorting=true)

## License

Released under the [MIT License](http://opensource.org/licenses/MIT).
