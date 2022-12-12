const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash")


const app = express();

//nujno mora biti ejs pod app express !!
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-eva:Test123@cluster0.2xmla7a.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

//mongoose model is usually capitalised

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  item: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default item to DB!")
        };
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    };
  });
});

app.get("/:todoName", function(req, res) {
  const todoName = _.capitalize(req.params.todoName);


  List.findOne({
    name: todoName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: todoName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + todoName)
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.item
        });
      }
    };
  });
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.item.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Checked item was deleted!")
        res.redirect("/")
      };
    });

  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        item: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      };
    });
  };
});


app.get("/about", function(req, res) {
  res.render("about");
})

app.listen(3000, function() {
  console.log("Server running on port 3000");
});
