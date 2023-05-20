const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Create user API
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(selectUserQuery);
  //User Creation in user table
  if (dbResponse === undefined) {
    //Password length Check
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //user created here
      const createUserQuery = `
            INSERT INTO
                user(username, name, password, gender, location)
            VALUES
                ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      const userCreateStatus = db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    //If username already exists
    response.status(400);
    response.send("User already exists");
  }
});

//Login User API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const responseOfDB = await db.get(selectUserQuery);
  if (responseOfDB === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, responseOfDB.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Password Reset API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT 
        *
    FROM 
        user
    WHERE
        username = '${username}';`;
  const dbResp = await db.get(selectUserQuery);
  if (dbResp === undefined) {
    response.status(400);
    response.send("please enter valid username");
  } else {
    const isOldPassword = await bcrypt.compare(oldPassword, dbResp.password);
    // console.log(isOldPassword);
    if (isOldPassword === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE user
            SET
                password = '${hashedPassword}';`;
        const passwordUpdate = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
