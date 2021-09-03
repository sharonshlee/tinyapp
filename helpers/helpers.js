const bcrypt = require("bcryptjs");

const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// return the user obj containing all the info if email is found
const getUserByEmail = (email, users) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId]; // return the user object
    }
  }
  return false;
};

const authenticateUser = (email, password, users) => {
  const userFound = getUserByEmail(email, users);

  if (userFound && bcrypt.compareSync(password, userFound.password)) {
    return userFound;
  }
  return false;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  authenticateUser,
};
