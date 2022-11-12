const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());
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
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//REGISTER USER API
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const passwordLength = password.length;
  const getUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = "${username}"
  `;

  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES (
                "${username}",
                "${name}",
                "${hashedPassword}",
                "${gender}",
                "${location}"
            )
        `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//LOGIN USER API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = "${username}"
  `;

  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//CHANGE PASSWORD API
app.put("/change-password", async (request, response) => {
  const { oldPassword, username, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const getUserQuery = `
        SELECT
            *
        FROM 
            user
        WHERE
            username = "${username}"
    `;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User Doesn't exists");
  } else {
    const isCurrentPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isCurrentPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updateUserQuery = `
            UPDATE 
                user
            SET 
                password = "${hashedNewPassword}"
            WHERE
                username = "${username}"
          `;
        await db.run(updateUserQuery);
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
