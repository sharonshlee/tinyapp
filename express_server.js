const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
} = require("./helpers/helpers.js");

const PORT = 8080;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

//------------------GLOBAL VARIABLES------------------//
const loginErrorMsg = `Please login <a href='/login'>here</a> to access this page.`;
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" },
  adsudy: { longURL: "http://www.facebook.com", userID: "13qeqwe" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
  "13qeqwe": {
    id: "13qeqwe",
    email: "123@123.com",
    password: bcrypt.hashSync("123", 10),
  },
};

//--------------END GLOBAL VARIABLES--------------------//

//-----------------FUNCTIONS----------------------------//
// Return URLs for the specific user only
const getUserUrls = (user_id, urlDatabase) => {
  const urls = {};
  for (const shortURL in urlDatabase) {
    const element = urlDatabase[shortURL];
    if (element.userID === user_id) {
      urls[shortURL] = element.longURL;
    }
  }
  return urls;
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

app.get("/urls", (req, res) => {
  const { user_id } = req.session;

  if (user_id) {
    const urls = getUserUrls(user_id, urlDatabase);
    const templateVars = { urls, user: users[user_id] };
    return res.render("urls_index", templateVars);
  }

  res.redirect("/login");
});

//get route to show form for add new
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    const templateVars = { user: users[user_id] };
    return res.render("urls_new", templateVars);
  }

  res.redirect("/login");
});

//Add a Second Route and Template
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.send(loginErrorMsg);
    return;
  }
  const shortURL = req.params.shortURL;
  const urls = getUserUrls(user_id, urlDatabase);
  const url = urls[shortURL];
  if (!url) {
    res.send("URL does not exist.");
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urls[req.params.shortURL],
    user: users[user_id],
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }
  res.send("URL not found");
});
//-----------------END GETS----------------------//

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!users[user_id]) {
    res.send(loginErrorMsg);
    return;
  }
  const { longURL } = req.body;

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID: user_id };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!users[req.session.user_id]) {
    res.send(loginErrorMsg);
    return;
  }
  const url = urlDatabase[req.params.shortURL];
  if (!url) {
    res.send("Short URL does not exists.");
    return;
  }
  if (url.userID !== req.session.user_id) {
    res.send("Not your Short URL, cannot delete.");
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//-----------------UPDATE----------------//
//show the update form to edit longURL
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const urls = getUserUrls(user_id, urlDatabase);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urls[req.params.shortURL],
    user: users[user_id],
  };

  res.render("urls_show", templateVars);
});

// (POST) to update the longURL in the db
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send(loginErrorMsg);
    return;
  }
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (url.userID !== user.id) {
    res.send("Not your URL.");
    return;
  }

  // Extract the longURL from the form input > name = "longURL"
  // Update the longURL in the db
  urlDatabase[shortURL].longURL = req.body.longURL;

  res.redirect("/urls");
});
//------------END UPDATE-------------------//

//------------LOGIN/LOGOUT----------------//
//GET: Display login form
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//POST: Handle the login form
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // get the user object (authenticated) or false if not
  const user = authenticateUser(email, password, users);

  if (!user) {
    res.statusCode = 403; //email cant be found
    return res.send(`Invalid login, <a href='/login'>please try again.</a>`);
  }

  // log the user in
  req.session.user_id = user.id;
  return res.redirect("/urls");
});

//POST: Logout and delete cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});
//-------------END LOGIN/LOGOUT------------//

//---------------REGISTER-----------------//
//GET: Display register form
app.get("/register", (req, res) => {
  if (!users[req.session.user_id]) {
    res.render("urls_register");
    return;
  }
  res.redirect("/urls");
});

//POST: Handle Registration Form
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  //handle registration errors:
  //email, passwords => "",
  if (!email || !password) {
    return res.send("Email/Password cannot be empty.");
  }

  const id = generateRandomString();
  const userFound = getUserByEmail(email, users);

  //user's email exist in DB
  if (userFound) {
    return res.send("Email already exists.");
  }

  //Use bcrypt When Storing Passwords
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[id] = { id, email, hashedPassword };
  req.session.user_id = id;

  res.redirect("/urls");
});
//-------------END REGISTER---------------//

app.listen(PORT, () => {});
