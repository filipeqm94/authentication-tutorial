require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); <--- Used for encrypting
// const md5 = require("md5");    <-------------------- Used for Hashing
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// userSchema.plugin(encrypt, {     // Used for encryption
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const username = req.body.username;
    // const password = md5(req.body.password); <---------- Used for Hashing
    const password = req.body.password;

    User.findOne({ email: username }, (err, foundUser) => {
      if (err) {
        res.status(404).render(err);
      } else {
        if (foundUser) {
          bcrypt.compare(password, foundUser.password, (err, result) => {
            if (result === true) {
              res.render("secrets");
            } else {
              console.log(err);
            }
          });
        }
      }
    });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (!err) {
        const newUser = new User({
          email: username,
          password: hash,
        });

        newUser.save((err) => {
          if (err) {
            console.log(err);
          } else {
            res.render("secrets");
          }
        });
      } else {
        console.log(err);
      }
    });
  });

app.listen(5000, () => {
  console.log("Server started on Port 5000");
});
