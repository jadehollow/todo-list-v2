// Express 
const express = require("express");
const app = express();

// Modules
require("dotenv").config();
const _ = require("lodash");

//Mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Global Variables
const titleCase = (str) => _.map(str.split(" "), _.capitalize).join(" ");

// .use/.set
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.set("views", "./views");
app.set("view engine", "ejs");

// Database
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Database is connected");

    // Item Schema
    const itemSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        }
    });
    const Item = mongoose.model("Item", itemSchema);

    // Default Items
    const item1 = new Item({
        name: "Welcome to your Todo List!"
    });
    const item2 = new Item({
        name: "Hit the + button to add an item."
    });
    const item3 = new Item({
        name: "<-- Hit this to delete an item."
    });
    const defaultItems = [item1, item2, item3];

    // List Schema
    const listSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        items: [itemSchema]
    });
    const List = mongoose.model("List", listSchema);

    // Home Page
    app.get("/", (req, res) => {
        Item.find(function (err, foundItems) {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Items inserted");
                    }
                });

                res.redirect("/");
            } else {
                res.render("index", {
                    listTitle: "Today",
                    newListItems: foundItems
                });
            }
        });
    });

    // Routing
    app.get("/:customListName", function (req, res) {
        const customListName = req.params.customListName;
        
        List.findOne({ name: customListName }, function (err, foundList) {
            if (!err) {
                if (!foundList) {
                    // Create a new list
                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    });

                    list.save();
                    res.redirect(`/${customListName}`);
                } else {
                    // Show an existing list
                    res.render("index", {
                        listTitle: titleCase(foundList.name),
                        newListItems: foundList.items
                    });
                }
            }
        });
    });

    // Post
    app.post("/", (req, res) => {
        const itemName = titleCase(req.body.newItem);
        const listName = _.lowerCase(req.body.list);
        const item = new Item({
            name: itemName
        });

        if (listName === "today") {
            item.save();
            res.redirect("/");
        } else {
            List.findOne({ name: listName }, function (err, foundList) {
                foundList.items.push(item);
                foundList.save();

                res.redirect(`/${listName}`);

            });
        }
    });
	
	// New List
	app.post("/list", function (req, res) {
        const newUserList = req.body.newList;
        console.log(newUserList);

        List.findOne({ name: newUserList }, function (err, foundList) {
            if (!err) {
                if (!foundList) {
                    // Create a new list
                    const list = new List({
                        name: newUserList,
                        items: defaultItems
                    });

                    list.save();
                    res.redirect(`/${newUserList}`);
                } else {
                    // Show an existing list
                    res.render("index", {
                        listTitle: titleCase(foundList.name),
                        newListItems: foundList.items
                    });
                }
            }
        });
    });

    // Delete
    app.post("/delete", (req, res) => {
        const checkedItemId = req.body.checkbox;
        const checkedListName = _.lowerCase(req.body.checkedListName);

        if (checkedListName === "today") {
            Item.findOneAndDelete(
                {_id: checkedItemId}, 
                function (err){
                    if (!err) {
                        console.log("Deleted");
                        res.redirect("/");
                    }
                }
            );
        } else {
            List.findOneAndUpdate(
                {name: checkedListName}, 
                {$pull: {items: {_id: checkedItemId}}}, 
                function(err, foundList){
                    if (!err) {
                        console.log("Deleted");
                        res.redirect(`/${checkedListName}`);
                    }
                }
            );
        }
    });

    //////////

});






// Listen on port
let port = process.env.PORT;
if (port == null || port == "") {
    port = 8000;
}
app.listen(port);
console.log(`Server is running on ${port}.`);
