const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongodb = require("mongodb");
const rateLimit = require("express-rate-limit");
const config = require("./config.json");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes." }
});

const signupLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 2, // limit each IP to 2 requests per windowMs
  message: { message: "Too many signup attempts from this IP, please try again after 30 minutes." }
});

app.post("/signup", signupLimiter, async (req, res) => {
  const { username, password } = req.body;
  let client;
  try {
    client = await mongodb.MongoClient.connect(config.uri, { useNewUrlParser: true });
  } catch (error) {
    console.log("--> Error connecting to MongoDB: " + error)
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  
  const db = client.db("userDB");
  const collection = db.collection("users");
  const user = await collection.findOne({ Username: username });
  if (user) {
    res.status(400).json({ error: "Username already taken" });
  } else {
    // Generate a salt with a cost factor of 10
  bcrypt.genSalt(10, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    // Store the salt in a variable
    salt = result;
    console.log('Generated salt:', salt);

    bcrypt.hash(password, salt, (err, hash) => {
     if (err) {
        console.error(err);
        return;
      }
      storeEncryptedPassword(hash, username);
     // Store the hash with username in the database
      async function storeEncryptedPassword (password, username) {
       const result = await collection.insertOne({ Username: username, Password: password, Roles: ['user'] });
       client.close();
       res.json({ message: "Sign up successful" });
      }
    });
  });   
  }
});

app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  let client;
  try { 
    client = await mongodb.MongoClient.connect(config.uri, { useNewUrlParser: true }); 
  } catch (error) {
    console.log("--> Error connecting to MongoDB: " + error)
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  const db = client.db("userDB");
  const collection = db.collection("users");

  let user;

  try {
    // Retrieve the user's hashed password from the database based on their username
    user = await collection.findOne({ Username: username });
    console.log(username)

    if (!user) {
      console.log('--> Login attempted for non-existent user.');
      return;
    }

    // Use bcrypt to compare the hashed password with the plaintext password entered by the user
    bcrypt.compare(password, user.Password, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      if (result) {
        // Password is correct
        const token = jwt.sign({ id: user._id, roles: user.Roles }, config.jwtSecret, { expiresIn: '1h' });
        console.log("--> A visitor logged in. Token: " + token) //Debug
        res.status(200).json({ message: "Login successful", token });
      } else {
        // Password is incorrect
        res.status(401).json({ error: "Invalid username or password" });
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
});



app.post("/verify", async (req, res) => {
  const token = req.headers["authorization"];
  console.log("--> A visitor requested session verification. Used token: " + token) //Debug
  try {
    const decodedToken = jwt.verify(token, config.jwtSecret);
    const jsonDecodedToken = JSON.stringify(decodedToken);
    console.log("--> Token decoded: " + jsonDecodedToken) //Debug
    console.log("--> Token expires at: " + decodedToken.exp) //Debug
    const currentTime = Math.floor(Date.now() / 1000);
    console.log("--> Current time: " + currentTime) //Debug
    if (decodedToken.exp < currentTime) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    
    const client = await mongodb.MongoClient.connect(config.uri, { useNewUrlParser: true });
    const db = client.db("userDB");
    const collection = db.collection("users");
    const user = await collection.findOne({ _id: new mongodb.ObjectId(decodedToken.id) });

    client.close();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Could add code to refresh token here

    res.json({ "token": token, "username": user.Username });
  } catch (error) {
    console.log("--> Session used an invalid token: " + error)
    res.status(401).json({ message: "Invalid token" });
  }
});




app.get('/roles', function(req, res) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, config.jwtSecret, function(err, decoded) {
      if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

      res.status(200).send({ roles: decoded.roles });
  });
});

function checkRole(roles) {
  return function(req, res, next) {
      const token = req.headers['authorization'];
      if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });

      jwt.verify(token, config.jwtSecret, function(err, decoded) {
          if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

          if (decoded.roles.some(r => roles.includes(r))) {
              req.userId = decoded.id;
              req.userRoles = decoded.roles;
              next();
          } else {
              res.status(403).send({ auth: false, message: 'You do not have the required role.' });
          }
      });
  }
}

app.get("/test", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    res.json({"message": `Authorized, success.`});
    // console.log("--> A visitor accessed test endpoint.\n `-> Info: " + JSON.stringify(decoded)) //Debug
  } catch (error) {
    res.status(400).json({"error": `Access denied, invalid token. (Refresh to login)`});
  }
});

app.get('/owner', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded.roles.includes('owner')) {
      return res.status(403).send("Access denied. You don't have owner privileges.");
    }

    res.json({ message: "Owner endpoint accessed" });
  } catch (error) {
    res.status(400).json({ error: "Access denied, invalid token. (Refresh to login)" });
  }
});

app.get('/admin', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
      const decoded = jwt.verify(token, config.jwtSecret);
      if (!decoded.roles.includes('admin')) {
          return res.status(403).send("Access denied. You don't have admin privileges.");
      }
      // Admin code here
      res.json({ message: "Admin endpoint accessed" });
  } catch (error) {
      res.status(400).json({ error: "Access denied, invalid token. (Refresh to login)" });
  }
});

app.get('/moderator', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
      const decoded = jwt.verify(token, config.jwtSecret);
      if (!decoded.roles.includes('admin') && !decoded.roles.includes('moderator')) {
          return res.status(403).send("Access denied. You don't have moderator privileges.");
      }
      // Moderator code here
      res.json({ message: "Moderator endpoint accessed" });
  } catch (error) {
      res.status(400).json({ error: "Access denied, invalid token. (Refresh to login)" });
  }
});


app.post('/owner/addRole', async (req, res) => {
  const { username, role } = req.body;
  let client;
  try { 
      client = await mongodb.MongoClient.connect(config.uri, { useNewUrlParser: true }); 
      const db = client.db("userDB");
      const collection = db.collection("users");

      const token = req.headers['authorization'];
      if (!token) return res.status(401).send("Access denied. No token provided.");

      try {
          const decoded = jwt.verify(token, config.jwtSecret);
          if (!decoded.roles.includes('owner')) {
              return res.status(403).send("Access denied. You don't have owner privileges.");
          }

          const user = await collection.findOne({ Username: username });

          if (!user) return res.status(404).send("No user found.");

          // Update user document in the database to add the role
          await collection.updateOne(
              { _id: user._id },
              { $addToSet: { Roles: role } } // Add the role to the Roles array if it doesn't already exist
          );

          res.status(200).send({ message: `Role '${role}' added to user '${username}' successfully.` });
      } catch (error) {
          res.status(400).json({ error: "Access denied, invalid token. (Refresh to login)" });
          console.error(error);
      }
  } catch (error) {
      console.log("--> Error connecting to MongoDB: " + error);
      res.status(500).json({ error: "Internal server error" });
  } finally {
      if (client) {
          await client.close();
      }
  }
});

app.post('/owner/removeRole', async (req, res) => {
  const { username, role } = req.body;
  let client;
  try { 
      client = await mongodb.MongoClient.connect(config.uri, { useNewUrlParser: true }); 
      const db = client.db("userDB");
      const collection = db.collection("users");

      const token = req.headers['authorization'];
      if (!token) return res.status(401).send("Access denied. No token provided.");

      try {
          const decoded = jwt.verify(token, config.jwtSecret);
          if (!decoded.roles.includes('owner')) {
              return res.status(403).send("Access denied. You don't have owner privileges.");
          }

          const user = await collection.findOne({ Username: username });

          if (!user) return res.status(404).send("No user found.");

          // Update user document in the database to remove the role
          await collection.updateOne(
              { _id: user._id },
              { $pull: { Roles: role } } // Remove the role from the Roles array
          );

          res.status(200).send({ message: `Role '${role}' removed from user '${username}' successfully.` });
      } catch (error) {
          res.status(400).json({ error: "Access denied, invalid token. (Refresh to login)" });
          console.error(error);
      }
  } catch (error) {
      console.log("--> Error connecting to MongoDB: " + error);
      res.status(500).json({ error: "Internal server error" });
  } finally {
      if (client) {
          await client.close();
      }
  }
});


const port = config.port || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
