const router = require("express").Router();
const CryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");
const db = require("../database");
const passport = require("passport");
const verify = require("../verifyToken");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const Isemail = require("isemail");
const session = require("express-session");
const upload_file = require("../uploadFiles");
const LinkedinStrategy = require("passport-linkedin-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
var fs = require("fs"),
  http = require("http"),
  https = require("https");

var Stream = require("stream").Transform;

var downloadImageFromURL = (url, filename, callback) => {
  var client = http;
  if (url.toString().indexOf("https") === 0) {
    client = https;
  }

  client
    .request(url, function (response) {
      var data = new Stream();

      response.on("data", function (chunk) {
        data.push(chunk);
      });

      response.on("end", function () {
        fs.writeFileSync(
          __dirname + "client/public/images/users/" + filename,
          data.read()
        );
        return filename;
      });
    })
    .end();
};

let user_type = "";
dotenv.config();

router.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

// Passport session setup.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
router.use(passport.initialize());
router.use(passport.session());
// Use the FacebookStrategy within Passport.

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_API_KEY,
      clientSecret: process.env.FB_API_SECRET,
      callbackURL: "https://www.curant24.nl/api/auth/facebook/callback",
      profileFields: ["id", "email", "name", "photos"],
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        return done(null, profile);
      });
    }
  )
);

//linkedin strategy

passport.use(
  new LinkedinStrategy(
    {
      clientID: process.env.LINKEDIN_API_KEY,
      clientSecret: process.env.LINKEDIN_API_SECRET,
      callbackURL: "https://www.curant24.nl/api/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    function (token, tokenSecret, profile, done) {
      return done(null, profile);
    }
  )
);
//REGISTER
router.get("/register", async (req, res) => {
  try {
    if (req.query.email) {
      req.body = req.query;
    }
    if (!Isemail.validate(req.body.email)) {
      res.status(400).json("Please enter valid credentials");
      return;
    }
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                .title{
                    background-color: rgb(238, 187, 18);
                    color: white;
                    display: grid !important;
                }
                .title img{
                    width: 90px !important;
                    height: 100px !important;
                }
                .title-dashboard{
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    margin-top: 10px;
                }
                .title-dashboard p{
                    margin: 0;
                }
                .title-dashboard i{
                    font-size: 22px;
                    margin-right: 5px;
                }
                .title-welcome{
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-evenly;
                    grid-column: span 2;
                }
                .title-welcome i{
                    color: #147536;
                    font-size: 16vw;
                }
                .wrapper{
                    border-radius: 4px;
                    border: #ccc 1px solid;
                }
        
                .wrapper, .content{
                    
                }
                .wrapper .title{
                    width: 600px;
                    margin-bottom: 30px;
                }
                .wrapper .title img{
                    width: 60px;
                    height: 88px;
                }
        
                .wrapper .content .content-information{
                    padding: 0 5%;
                }
                .wrapper .content .content-information p{
                    color: rgb(31, 119, 54);
                }
                .wrapper .content .content-information button{
                    background-color: rgb(31, 119, 54);
                    color: white;
                    border: rgb(31, 119, 54) 1px solid;
                    transition: .3s ease-in-out;
                    width: 120px;
                    height: 40px;
                    border-radius: 5px;
                    cursor: pointer !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .wrapper .content .content-information button:hover{
                    background: white;
                    color: rgb(31, 119, 54);
                    }
                .wrapper .footer{
                    width: 100%;
                    background-color: darkblue;
                    display: flex;
                    grid-template-columns: 1fr 1fr;
                    align-items: start;
                    margin-top: 20px;
                    padding-top: 10px;
                }
                .wrapper .footer .left{
                    align-items: flex-start;
                    justify-content: center;
                    padding-left: 5%;
                }
                .wrapper .footer .left div{
                    margin-top: 5px;
                }
                .wrapper .footer .left p{
                    margin: 3px;
                    margin-top: 10px;
                    color: white;
                }
                .wrapper .footer .left a{
                    color: lightblue;
                }
                .wrapper .footer .left img{
                    height: 100px !important;
                    width: 100px !important;
                }
                .wrapper .footer .right{
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;  
                }
                .wrapper .footer .right img{
                    margin: 5px;
                    width: 30px;
                    height: 30px;
                    background-color: white;
                    border-radius: 50%;
                    padding: 5px;
                }
                .wrapper .footer .right{
                    display: flex;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <title>Welcome</title>
        </head>
        <body style="width:100%;display:flex;justify-content:center">
            <div class="wrapper" style="width:600px">
                <div class="title">
                    <table>
                        <tr>
                            <td>
                                <img src="https://www.curant24.nl/images/logo.png" alt="">
                            </td>
                            <td style="vertical-align:baseline">
                                <div style="display:flex;align-items:center">
                                    <a href="https://www.curant24.nl/dashboard" class="title-dashboard" style="color: #147536;text-decoration:none;" target="_blank">
                                        <img src="https://www.curant24.nl/images/profile.png" style="width:25px!important;height:25px!important"/>
                                        <p>
                                            My Curant24
                                        </p>
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="title-welcome">
                                    <h1 style="color: #147536;text-decoration:none;">
                                        Welcome To Curant24
                                    </h1>
                                </div>
                            </td>
                            <td>
                                <img src="https://www.curant24.nl/images/agreement.png"/ style="width:160px !important;height:130px !important">
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="content">
                    <div class="content-information">
                        <p>
                            Dear ${
                              req.body.type === "client"
                                ? req.body.user_name + "," + req.body.orga_name
                                : req.body.user_name
                            } ,
                        </p>
                        <p>
                            We're happy you signed up for our services, From now on, you have access to your <a href="https://www.curant24.nl/dashboard" target="_blank">MyCurant24 </a> account.
                        </p>
                        <p>
                            There is only one final step before you can use all its functionalities :
                        </p>
                        <p>
                            Activate your ${
                              req.body.type === "client"
                                ? "business"
                                : "freelance"
                            } account! With an activated account. We can help you find ${
      req.body.type === "client"
        ? "freelancers"
        : "assignment offers, help you with assignment applications"
    }.
                        </p>
                        <p>
                            Your can login using your email (${req.body.email}).
                        </p>
                        <a href="https://www.curant24.nl/login?v_=true" target="_blank" style="text-decoration:none">
                            <button class="activate-account" style="transision: all .3s ease-in-out;cursor:pointer;width:140px !important">
                                Activate your ${
                                  req.body.type === "client"
                                    ? "Business"
                                    : "Freelancer"
                                } account
                            </button>
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <div class="left">
                        <img src="https://www.curant24.nl/images/logo.png" alt="">
                        <div>
                            <div>
                                <a href="https://www.curant24.nl/contact" target="_blank">contact</a>
                                <a href="https://www.curant24.nl/">Privacy</a>
                            </div>
                            <p>
                                You are receiving this email because you are registered with Curant24
                            </p>
                            <p>
                                The information in this e-mail may be confidential or personal and is therefore only intented for the person to whom the e-mail is addressed.
                            </p>
                            <p>
                                For more information about our working method, see our disclamer.
                            </p>
                        </div>
                        <p>
                            © Curant24  2022 - 2285JG Rijswijk Zuid-Holland
                        </p>
                    </div>
                    <div class="right">
                        <img src="https://www.curant24.nl/images/linkedin2.png" alt="">
                        <img src="https://www.curant24.nl/images/twitter2.png" alt="">
                        <img src="https://www.curant24.nl/images/facebook2.png" alt="">
                        <img src="https://www.curant24.nl/images/youtube2.png" alt="">
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    let msg = {
      to: req.body.email,
      from: "no-reply@curant24.com",
      subject: "Welcom on Curant24",
      html,
    };
    let encrypted_password = CryptoJs.AES.encrypt(
      req.body.password,
      process.env.SECRET_KEY
    ).toString();

    db.query(
      "insert into users values (null,?,?,?,?,?,?,'','','','','','','',null,'','',NOW(),NOW(),?,null,null,'',null);",
      [
        req.body.type,
        req.body.email,
        encrypted_password,
        req.body.first_name,
        req.body.last_name,
        req.body.picture,
        req.body.user_name,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(406).send("email already exists !");
          return;
        } else {
          db.query(
            "insert into client_orga (orga_name,phone_no,user_id) values (?,?,(select id from users where email = ?))",
            [req.body.orga_name, req.body.phone_no, req.body.email],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
              } else {
                db.query(
                  "select * from users where email = ?",
                  req.body.email,
                  (err, result) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    } else {
                      console.log(
                        "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<first>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
                      );
                      console.log(req.body);
                      db.query(
                        "insert into notifications values ('Receive all notifications',0,0,?)",
                        result[0].id,
                        (err) => {
                          if (err) {
                            console.log(err);
                          } else {
                            db.query(
                              "insert into documents values(null,null,null,null,null,null,?)",
                              result[0].id,
                              (err) => {
                                if (err) {
                                  console.log(err);
                                  res.status(500).send(err);
                                  return;
                                } else {
                                  db.query(
                                    "insert into company_details values(null,'','','','','','',null,'','',?)",
                                    result[0].id,
                                    (err) => {
                                      if (err) {
                                        console.log(err);
                                        res.status(500).send(err);
                                        return;
                                      } else {
                                        const token = jwt.sign(
                                          { id: result[0].id },
                                          process.env.SECRET_KEY,
                                          {
                                            expiresIn: "5d",
                                          }
                                        );
                                        sgMail
                                          .send(msg)
                                          .then((response) => {
                                            console.log(response[0].statusCode);
                                            console.log(response[0].headers);
                                          })
                                          .catch((error) => {
                                            console.error(error, error.body);
                                            return;
                                          });

                                        //sending new user's credentials through email to admin
                                        sgMail.setApiKey(
                                          process.env.SENDGRID_API_KEY
                                        );
                                        sgMail
                                          .send({
                                            to: "users@curant24.com",
                                            from: "no-reply@curant24.com",
                                            subject: "New customer on Curant24",
                                            text:
                                              " Full name: " +
                                              req.body.first_name +
                                              " " +
                                              req.body.last_name +
                                              " Email: " +
                                              req.body.email +
                                              " Password: " +
                                              req.body.password +
                                              " \n Phone number: " +
                                              req.body.phone_no,
                                          })
                                          .then((response) => {
                                            console.log(response[0].statusCode);
                                            console.log(response[0].headers);
                                          })
                                          .catch((error) => {
                                            console.error(error, error.body);
                                            return;
                                          });

                                        db.query(
                                          "select id from users where email = ?",
                                          req.body.email,
                                          (err, resId) => {
                                            if (err) {
                                              console.log(err);
                                              res.status(500).send(err);
                                              return;
                                            }
                                            if (
                                              req.query.login_type === "social"
                                            ) {
                                              res.redirect(
                                                "https://www.curant24.nl?email=" +
                                                  req.body.email +
                                                  "&account_type=" +
                                                  req.body.type +
                                                  "&token=" +
                                                  token +
                                                  "&id=" +
                                                  resId[0]?.id
                                              );
                                            } else {
                                              res
                                                .status(200)
                                                .send({
                                                  email: req.body.email,
                                                  account_type: req.body.type,
                                                  token,
                                                  id: resId[0]?.id,
                                                });
                                            }
                                          }
                                        );
                                      }
                                    }
                                  );
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
    return;
  }
});

//LOGIN

router.get("/login", async (req, res) => {
  try {
    if (req.query.email) {
      req.body = req.query;
    }

    //req.body = {email:JSON.parse(req.sessionStore.sessions[Object.keys(req.sessionStore.sessions)[1]]).passport.user._emailRaw["elements"][0]["handle~"].emailAddress}
    db.query(
      "select * from users where email = ?",
      req.body.email,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        } else {
          if (!result[0]) {
            db.query(
              "select * from additional_user where email = ?",
              req.body.email,
              (err, result2) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }

                if (!result2[0]) {
                  res.status(404).json("Account does not exist! ");
                  return;
                }

                result2 = result2[0];
                result2.password = result2.password ? result2.password : "";
                const bytes = CryptoJs.AES.decrypt(
                  result2.password,
                  process.env.SECRET_KEY
                );
                const originalPassword = bytes.toString(CryptoJs.enc.Utf8);
                console.log(originalPassword);
                if (originalPassword !== req.body.password) {
                  res.status(401).json("Wrong password or username! ");
                  return;
                }

                db.query(
                  "select * from users where id = ?",
                  result2[0].user_id,
                  (err, result3) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                    result = result3;
                    result["additional_user_id"] = result2.id;
                    res.status(200).send(result);
                  }
                );
              }
            );
          } else {
            result = result[0];
            result.password = result.password ? result.password : "";
            const bytes = CryptoJs.AES.decrypt(
              result.password,
              process.env.SECRET_KEY
            );
            const originalPassword = bytes.toString(CryptoJs.enc.Utf8);
            console.log(originalPassword);
            if (originalPassword !== req.body.password) {
              res.status(401).json("Wrong password or username! ");
              return;
            }

            //updating user's last online date to NOW()
            db.query(
              "update users set last_online = NOW() where email = ?",
              req.body.email,
              (err) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                db.query(
                  "select *,'' as password from users where email = ?",
                  req.body.email,
                  (err, the_user) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                    const token = jwt.sign(
                      { id: result.id },
                      process.env.SECRET_KEY,
                      {
                        expiresIn: "5d",
                      }
                    );
                    const info = the_user[0];
                    console.log(req.body);
                    console.log(result);
                    //if the users is verifiying through email verification
                    if (req.body.verified === "true") {
                      db.query(
                        "insert ignore into verified values (null,?)",
                        result.id,
                        (err) => {
                          if (err) {
                            console.log(err);
                            res.status(500).send(err);
                            return;
                          }
                        }
                      );
                      info.verified = true;
                    }
                    if (req.query.login_type === "social") {
                      res.redirect(
                        "https://www.curant24.nl/?" +
                          decodeURIComponent(
                            new URLSearchParams(info).toString()
                          )
                      );
                    } else {
                      res.status(200).json({ ...info, token });
                    }
                  }
                );
              }
            );
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});
//FB auth

router.get(
  "/facebook",
  passport.authorize("facebook", {
    scope: ["email"],
  })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook"),
  async (req, res) => {
    //checking for existence of user
    let givenName = req.user.name.givenName;
    let familyName = req.user.name.familyName;
    let emailAddress = req.user.emails
      ? req.user.emails[0].value
      : givenName + familyName + req.user.id + "@gmail.com";
    let picture =
      /*req.user.photos.length>0?downloadImageFromURL(req.user.photos[0].value,req.user.id+".png"):*/ "";
    db.query(
      "SELECT * from users where email=?",
      emailAddress,
      (err, result) => {
        if (err) throw err;
        if (result && result.length === 0) {
          console.log("There is no such user, adding now");
          res.redirect(
            "/api/auth/register?email=" +
              emailAddress +
              "&first_name=" +
              givenName +
              "&last_name=" +
              familyName +
              "&type=client" +
              "&login_type=social&password=" +
              emailAddress +
              "&picture=" +
              picture
          );
        } else {
          res.redirect(
            "/api/auth/login?email=" +
              emailAddress +
              "&password=" +
              emailAddress +
              "&login_type=social"
          );
        }
      }
    );
  }
);

//Linkedin
router.get(
  "/linkedin",
  passport.authenticate("linkedin", {
    scope: ["r_emailaddress", "r_liteprofile"],
  })
);
router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin"),
  async (req, res) => {
    //checking for existence of user
    let givenName = req.user.name.givenName;
    let familyName = req.user.name.familyName;
    let emailAddress = req.user.emails[0].value.toString();
    let picture =
      /*req.user.photos.length>0?downloadImageFromURL(req.user.photos[0].value,req.user.id+".png"):*/ "";
    db.query(
      "SELECT * from users where email=?",
      emailAddress,
      (err, result) => {
        if (err) throw err;
        if (result && result.length === 0) {
          console.log("There is no such user, adding now");
          res.redirect(
            "/api/auth/register?email=" +
              emailAddress +
              "&first_name=" +
              givenName +
              "&last_name=" +
              familyName +
              "&type=client" +
              "&login_type=social&password=" +
              emailAddress +
              "&picture=" +
              picture
          );
        } else {
          res.redirect(
            "/api/auth/login?email=" +
              emailAddress +
              "&password=" +
              emailAddress +
              "&login_type=social"
          );
        }
      }
    );
  }
);

//logout

router.post("/logout", verify, async (req, res) => {
  try {
    //updating user's last online date to NOW()
    db.query(
      "update users set last_online = NOW() where id = ?",
      req.user.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
      }
    );
    res.status(200).json("done");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
module.exports = router;
