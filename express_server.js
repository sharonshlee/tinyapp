const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

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

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//routes should be ordered from most specific to least specific

//add ejs to template
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: "" };
  if (req.cookies && req.cookies["username"]) {
    templateVars.username = req.cookies["username"];
  }
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

// Login POST
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

// Logout POST
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

//register GET
app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
