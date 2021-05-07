require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// <----------- Level 2 - Encrypting --------->
// const encrypt = require("mongoose-encryption");

// <---------- Level 3 - Hashing ---------->
// const md5 = require("md5");

// <---------- Level 4 - Salting + Hashing ---------->
/*
const bcrypt = require("bcrypt"); 
const saltRounds = 10;
*/

// <----------- Level 5 and 6 - Cookies and Sessions + Authentication --------->
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// <----------- Level 6 OAuth --------->
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

// <---------- Facebook Oauth Challenge ---------->
const FacebookStrategy = require("passport-facebook");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// <----------- Level 5 and 6 --------->
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  secret: String, // <---------- Add Secret submission button
  password: String,
  googleId: String, // <---------- Level 6
  facebookId: String, // <---------- Facebook Challenge
});

const secretSchema = new mongoose.Schema({
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); // <---------- Level 6

//<---------- Level 2 ---------->
/*
userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});
*/

const User = new mongoose.model("User", userSchema);
const Secret = new mongoose.model("Secret", secretSchema);

// <---------- Level 5 ---------->
passport.use(User.createStrategy());
/*
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
*/

// <---------- Level 6 ---------->
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// <---------- Level 6 ---------->
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

// <---------- Facebook Strategy ----------->
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: "http://localhost:5000/auth/facebook/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { facebookId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

// <---------- Facebook Challenge ---------->
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

app.route("/secrets").get((req, res) => {
  User.find({ secret: { $ne: null } }, (err, foundUsers) => {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets", { usersWithSecrets: foundUsers });
    }
  });
});

app
  .route("/submit")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post((req, res) => {
    const secret = req.body.secret;

    User.findOne({ _id: req.user.id }, (err, foundUser) => {
      if (!err) {
        if (foundUser) {
          foundUser.secret = secret;
          foundUser.save();
          res.redirect("/secrets");
        }
      } else {
        console.log(err);
      }
    });
  });

app.route("/logout").get((req, res) => {
  req.logout();
  res.redirect("/");
});

// <---------- Leve 5 ---------->
/*
app.route("/secrets").get((req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

app.route("/logout").get((req, res) => {
  req.logout();
  res.redirect("/");
});
*/

/*
// <---------- Level 1 - 4 ---------->
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const username = req.body.username;
    // const password = md5(req.body.password); <---------- Level 2
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
*/

app.listen(5000, () => {
  console.log("Server started on Port 5000");
});
