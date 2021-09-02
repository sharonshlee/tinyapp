const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

//------------------GLOBAL VARIABLES------------------//
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};
//--------------END GLOBAL VARIABLES--------------------//

//-----------------FUNCTIONS----------------------------//
function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// return the user obj containing all the info if email is found
// otherwise return false
const findUserByEmail = (email, users) => {
  // return Object.keys(usersDb).find(key => usersDb[key].email === email)

  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId]; // return the user object
    }
  }

  return false;
};

const authenticateUser = (email, password, users) => {
  // contained the user info if found or false if not
  const userFound = findUserByEmail(email, users);

  if (userFound && userFound.password === password) {
    return userFound;
  }
  return false;
};
//----------------END FUNCTIONS------------------------//

//----------------------GETS--------------------------//

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//routes should be ordered from most specific to least specific???

//add ejs to template
app.get("/urls", (req, res) => {
  const { user_id } = req.cookies;
  const templateVars = { urls: urlDatabase, user: users[user_id] };

  res.render("urls_index", templateVars);
});

//get route to show form for add new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Add a Second Route and Template
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
//-----------------END GETS----------------------//

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//-----------------UPDATE----------------//
//show the update form to edit longURL
app.post("/urls/:shortURL/update", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };

  res.render("urls_show", templateVars);
});

// PUT (POST) to update the longURL in the db
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // Extract the longURL from the form input > name = "longURL"
  const updatedLongURL = req.body.longURL;

  // Update the longURL in the db
  urlDatabase[shortURL] = updatedLongURL;

  res.redirect("/urls");
});
//------------END UPDATE-------------------//

//------------LOGIN/LOGOUT----------------//
//GET: Display login form
app.get("/login", (req, res) => {
  //res.redirect("/urls"); ???????
  //res.render("urls_index");
  res.render("urls_login");
});

//POST: Handle the login form
app.post("/login", (req, res) => {
  const { username, email, password } = req.body;

  // get the user object (authenticated) or false if not
  const user = authenticateUser(username, password, users);

  if (user) {
    // log the user in
    res.cookie("user_id", user.id);
    res.cookie("user_name", username);
    res.redirect("/urls");
  } else {
    res.send("Sorry, wrong credentials!");
  }
});

//POST: Logout and delete cookies
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.clearCookie("user_id");
  res.redirect("/urls");
});
//-------------END LOGIN/LOGOUT------------//

//---------------REGISTER-----------------//
//GET: Display register form
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//POST: Handle Registration Form
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  const userFound = findUserByEmail(email, users);

  //handle registration errors:
  //email, passwords => "",
  //user's email exist in DB
  if (!email || !password || userFound) {
    return res.send("Error 400.");
  }

  users[userId] = { userId, email, password };
  res.cookie("user_id", userId);

  res.redirect("/urls");
});
//-------------END REGISTER---------------//

app.listen(PORT, () => {});
