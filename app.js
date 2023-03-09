const { query } = require("express");

const express = require("express");
const session = require("express-session");

const app = express();
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false })); //body parser

app.use(express.static("public"));
app.use(express.json());

app.use(
  session({
    secret: "secrect word",
    resave: false,
    saveUninitialized: false,
  })
);
app.use((req, res, next) => {
  if (req.session.email) {
    res.locals.isLoggedIn = true;
  } else {
    res.locals.isLoggedIn = false;
  }

  next();
});

const mysql = require("mysql");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "xenol2",
});
connection.connect((err) => {
  err ? console.log.error(err) : console.log(" DB successfully connected"); // ternary operators
});

//custommiddleware
function logTimestamp(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
}
//app.use(logTimestamp);

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/about", logTimestamp, (req, res) => {
  res.render("about");
});
app.get("/welcome", (req, res) => {
  res.render("karibu", { message: "karibu db" });
});
app.post("/welcome", logTimestamp, (req, res) => {
  console.log(req.body);
  res.render("karibu");
});

app.get("/products", (req, res) => {
  connection.query("SELECT * FROM products", (error, results) => {
    // console.log(results);
    res.render("products", { products: results });
  });
});

app.get("/product", (req, res) => {
  connection.query("INSERT INTO welcome(karibu,password) VALUES(?,?)", []);
  res.render("product", { message: "product added to DB" });
});
app.post("/product", (req, res) => {
  connection.query(
    "INSERT INTO products (product_id,product_name,price) VALUES (?,?,?)",
    [req.body.id, req.body.name, req.body.price],
    (error) => {
      if (error) {
        console.log(error);
        res.status(500).render("error");
      } else {
        //get all products to the products page
        connection.query("SELECT * FROM products", (error, results) => {
          console.log(results);
          res.render("products", { products: results });
        });
      }
    }
  );
});

app.post("/product/:id", (req, res) => {
  //delete a product with id in params
  console.log(req.params.id);
  res.redirect("/products");
});
app.get("/login", logTimestamp, (req, res) => {
  res.render("login");
});
app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    res.redirect("/");
  });
});
app.post("/login", logTimestamp, (req, res) => {
  //console.log(req.body);
  //check if email already exists
  //if it does exist, compare the provided password with the password in the database
  //if

  connection.query(
    "SELECT email, password FROM companies WHERE email = ?",
    [req.body.email],
    (error, results) => {
      if (error) {
        request.status(500).render("error");
      } else {
        if (results.length > 0) {
          //compare password
          if (results[0].password === req.body.password) {
            // succefully logged in
            req.session.email = results[0].email;
            res.redirect("/");
          } else {
            res.render("login", { error: "wrong password" });
          }
        } else {
          res.render("login", {
            error: "Email not registered",
          });
        }
      }
    }
  );
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", logTimestamp, (req, res) => {
  console.log(req.body);

  if (req.body.password === req.body.confirm_password) {
    //CHECK IF USER ALREADY EXISTS
    connection.query(
      "SELECT email FROM companies WHERE email =?",
      [req.body.Email],
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).render("error");
        } else {
          // check the length of the results (if greater than zero the email already exists in db else continiue to register/sve data in db)
          if (results.length > 0) {
            res.render("register", { error: " Email already registered" });
          } else {
            //continue to save data in db
            connection.query(
              "INSERT INTO companies(company_name,email,PASSWORD,domain_name,num_of_employees,description,service) VALUES (?, ?, ?, ?, ?, ?,?)",
              [
                req.body.company,
                req.body.Email,
                req.body.password,
                req.body.domain,
                req.body.num_of_employees,
                req.body.description,
                "general-3",
              ],
              (error) => {
                if (error) {
                  console.log(error);
                  res.status(500).render("error");
                } else res.redirect("/login");
              }
            );
          }
        }
      }
    );
  } else {
    //rerender register with an error message
    res.render("register", {
      error: "Password and confirm password do not match",
    });
  }
});
app.listen(3000, () => {
  console.log("listening on port 3000");
});
