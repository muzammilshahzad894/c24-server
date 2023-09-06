const router = require("express").Router();
const CryptoJs = require("crypto-js");
const db = require("../database");
const verify = require("../verifyToken");
const upload_file = require("../uploadFiles");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");
const sendEmail = require("../sendEmail");
const unlink = require("fs").unlink;
const { response, query } = require("express");
const { result, sumBy } = require("lodash");
const https = require("node:https");
dotenv.config();
router.use(
  fileUpload({
    createParentPath: true,
  })
);

//gets name of variable into string
const varToString = (varObj) => Object.keys(varObj)[0];
function generatePassword() {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

//delete account
router.delete("/delete-account", verify, async (req, res) => {
  try {
    let user_id = req.user.id;
    db.query("delete from users where id = ?", user_id, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else {
        res.status(200).json("Account deleted successfully !");
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

// change password
router.post("/update-password", verify, async (req, res) => {
  try {
    let oldPassword = req.body.old_password;
    let newPassword = req.body.new_password;
    let Originalpassword;
    db.query(
      "select password from users where id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          Originalpassword = result[0].password;
          const bytes = CryptoJs.AES.decrypt(
            Originalpassword,
            process.env.SECRET_KEY
          );
          Originalpassword = bytes.toString(CryptoJs.enc.Utf8);
          newPassword = CryptoJs.AES.encrypt(
            newPassword,
            process.env.SECRET_KEY
          ).toString();
          if (oldPassword === Originalpassword) {
            db.query(
              "update users set password = ? where id = ?",
              [newPassword, req.user.id],
              (err) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                } else {
                  res.status(200).json("Password updated successfully !");
                }
              }
            );
          } else {
            res.status(501).json("password incorrect !");
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

//reset password email
router.post("/reset-password-email", async (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  //key to be inserted on database when reseting password it will be verified
  let key = generatePassword();
  console.log(req.body);
  let msg = {
    to: req.body.email,
    from: "no-reply@curant24.com",
    subject: "Reset Password",
    html:
      "<!DOCTYPE html>" +
      '  <html lang="en">' +
      "  <head>" +
      '      <meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '      <meta name="theme-color" content="#000000" />' +
      "      <style>" +
      "          body{" +
      "             color:black !important;" +
      "          }" +
      "          body td{" +
      "              margin:auto;" +
      "          }" +
      "          body .wrapper{" +
      "              width:700px;" +
      "              border-radius: 4px;" +
      "              border: #ccc 1px solid;" +
      "              display:flex;" +
      "              flex-direction:column !important;" +
      "              color:black;" +
      "          }" +
      "  " +
      "          .wrapper, .content{" +
      "              display: flex;" +
      "              flex-direction: column;" +
      "              align-items: center;" +
      "              justify-content: center;" +
      "          }" +
      "          .wrapper .title{" +
      "              width: 100%;" +
      "              background-color: #147536;" +
      "              margin-bottom: 30px;" +
      "          }" +
      "          .wrapper .title td{" +
      "              padding:25px;" +
      "          }" +
      "          .wrapper .title img{" +
      "              width: 60px;" +
      "              height: 88px;" +
      "          }" +
      "          .wrapper .content .title h2{" +
      "              font-weight: 900;" +
      "          }" +
      "          .wrapper .content .title p{" +
      "              font-weight: 500;" +
      "          }" +
      "          .wrapper .content .content-information{" +
      "              padding: 0 5%;" +
      "          }" +
      "          .wrapper .footer{" +
      "              width: 100%;" +
      "              background-color: #147536;" +
      "              display: flex;" +
      "              justify-content: space-between;" +
      "              align-items: center;" +
      "          }" +
      "          .wrapper .footer .left{" +
      "              display: flex;" +
      "              flex-direction: column;" +
      "              align-items: center;" +
      "              justify-content: center;" +
      "          }" +
      "          .wrapper .footer .left p{" +
      "              margin: 3px;" +
      "              color: white;" +
      "          }" +
      "      </style>" +
      "      <title>Welcome</title>" +
      "  </head>" +
      '  <body style="width:100%;display:flex;justify-content:center"> ' +
      '      <table class="wrapper" style="width:500px;width:100%;border-collapse:separate;">' +
      "        <tbody>" +
      '          <tr class="title">' +
      '              <td style="width:100vw">' +
      '                  <img src="https://www.curant24.nl/images/logo.png" alt="">' +
      "              </td>" +
      "          </tr>" +
      '          <tr class="content">' +
      '              <div class="content-title">' +
      "                  <h2>" +
      "                      Reset Password" +
      "                  </h2>" +
      "              </div>" +
      '              <div class="content-information">' +
      "                  <p>" +
      "                      Hello " +
      "                  </p>" +
      "                  <p>" +
      "                      You have requested to reset your password on Curant24." +
      "                  </p>" +
      "                  <p>" +
      "                      Your verification code is the following: " +
      key +
      "" +
      "                  </p>" +
      "                  <p>" +
      "                      Sincerely," +
      "                  </p>" +
      "                  <p>" +
      "                      Team Curant24." +
      "                  </p>" +
      "              </div>" +
      "          </tr>" +
      '          <tr class="footer">' +
      "              <td>" +
      "                    <table>" +
      '                          <tr style="color:#fff;">' +
      "                              ® Curant24  2022 " +
      "                          </tr>" +
      '                          <tr style="color:#fff;">' +
      "                              Telephone : 020-7702280" +
      '                          </tr style="color:#fff;">' +
      '                          <tr style="color:#fff;">' +
      "                              Email: info@Curant24.nl" +
      "                          </tr>" +
      "                     </table>" +
      "                </td>" +
      '                <td align="right">' +
      "                    <table>" +
      '                        <img src="https://www.curant24.nl/images/facebook.png" alt=""/>' +
      '                        <img src="https://www.curant24.nl/images/linkedin.png" alt=""/>' +
      "                    </table>" +
      "                </td>" +
      "          </tr>" +
      "        </tbody>" +
      "      </table>" +
      "  </body>" +
      "  </html>",
  };
  db.query(
    "update users set user_key = ? where email = ?",
    [key, req.body.email],
    (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      sgMail
        .send(msg)
        .then((response) => {
          console.log(response[0].statusCode);
          console.log(response[0].headers);
          res.status(200).send("reset password email send successfully");
        })
        .catch((error) => {
          console.log("error");
          console.error(error, error.body);
          return;
        });
    }
  );
});
//reset password
router.post("/reset-password", async (req, res) => {
  try {
    db.query(
      "update users set password = ?,user_key = ? where user_key = ?",
      [
        CryptoJs.AES.encrypt(
          req.body.password,
          process.env.SECRET_KEY
        ).toString(),
        CryptoJs.AES.encrypt(
          generatePassword(),
          process.env.SECRET_KEY
        ).toString(),
        req.body.key,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("Password reset successfully! ");
      }
    );
  } catch (error) {
    if (error) {
      console.log(error);
      res.status(500).send(error);
    }
  }
});

//get personal data

router.get("/personal", verify, async (req, res) => {
  try {
    //update user last online attr on get info just to double check
    if (!req.query.id) {
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
    }
    db.query(
      "select *,'' as password, '' as email from users where id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          db.query(
            "select * from verified where user_id = ?",
            req.query.id || req.user.id,
            (err, result2) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
              if (result[0]?.verified !== undefined) {
                result[0].verified = result2[0]?.user_id !== undefined;
              }
              res.status(200).json(result[0]);
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json(error);
  }
});

//set personal data
router.post("/set-personal-data", verify, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      address,
      postcode,
      city,
      phone_no,
      max_travel_distance,
      work_experience,
      birthday,
      about,
      bsn,
      email,
    } = JSON.parse(req.body.info);
    let picture;
    let query = "update users set ";
    let values = [];
    console.log("set personal data body ");
    console.log(req.body);
    console.log(req.files);
    if (req.files) {
      picture = upload_file(
        req.files.picture,
        "users",
        ["jpg", "jpeg", "png"],
        "picture"
      );
      db.query(
        "update users set picture = ? where id = ?",
        [picture.data?.path || "/images/profile-freelancer.png", req.user.id],
        (err) => {
          if (err) {
            console.log(err);
            res.status(502).send(err);
          }
        }
      );
    } else if (req.body.picture) {
      db.query(
        "update users set picture = ? where id = ?",
        [
          !req.body.picture || req.body.picture === "undefined"
            ? "/images/profile-freelancer.png"
            : req.body.picture,
          req.user.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(502).send(err);
          }
        }
      );
    }
    //query generation
    for (const [key, value] of Object.entries(JSON.parse(req.body.info))) {
      if (
        key !== "password" &&
        key !== "verified" &&
        key !== "id" &&
        key !== "created_at" &&
        key !== "last_online" &&
        key !== "confirm_password" &&
        key !== "agreeTerms" &&
        key !== "sent" &&
        key !== "picture" &&
        key !== "checked_comp" &&
        key !== "orga_name" &&
        key !== "how_did_you_know_us" &&
        key !== "video"
      ) {
        query += key + " =?,";
        values.push(value);
      }
    }
    query = query.replace(/,$/g, "") + "  where id = ?";
    values.push(req.user.id);
    console.log(query);
    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        if (err.errno === 1062) {
          res.status(501).json("email already in use!");
        } else {
          res.status(502).json("incorrect information! ");
        }
        return;
      } else {
        res.status(200).json("personal information updated successfully !");
        return;
      }
    });
  } catch (error) {
    console.log(error);
    res.status(501).json(error);
  }
});
// get company details
router.get("/company", verify, async (req, res) => {
  try {
    db.query(
      "select * from company_details where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        } else {
          db.query(
            "select * from added_industry where user_id = ?",
            req.user.id,
            (err, res2) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
              if (result[0]?.added_industry !== undefined) {
                result[0].added_industry = res2;
              }
              res.status(200).json(result[0]);
            }
          );
        }
      }
    );
  } catch (error) {}
});

//set company details
router.post("/set-company-details", verify, async (req, res) => {
  try {
    const {
      company_name,
      cc_number,
      account_number,
      vat_number,
      hourly_rate,
      hourly_rate_inclusive,
      currency,
      profession,
      branch,
      new_ind,
    } = req.body;
    console.log(req.body);
    db.query(
      "update company_details set company_name = ?,cc_number = ?,account_number = ?,vat_number = ?, hourly_rate = ?, hourly_rate_inclusive = ?,currency = ?, profession = ?,branch = ? where user_id = ?",
      [
        company_name,
        cc_number,
        account_number,
        vat_number,
        hourly_rate,
        hourly_rate_inclusive,
        currency,
        profession,
        new_ind || branch,
        req.user.id,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).json("company details updated successfully !");
        }
      }
    );
  } catch (error) {
    res.status(501).json(error);
  }
});

//add new industry for company_details
router.post("/add-new-ind", verify, async (req, res) => {
  try {
    db.query(
      "insert into added_industry values (null,?,?)",
      [req.body.industry, req.user.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("industry added successfully");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get all competencies
router.get("/all-competencies", async (req, res) => {
  try {
    db.query("select * from competencies order by id", (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else {
        res.status(200).json(result);
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
//get competencies of a user
router.get("/competencies", verify, async (req, res) => {
  try {
    db.query(
      "select competence_id from competent_of where user_id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          db.query(
            "select competency from user_added_competencies where user_id  = ?",
            req.query.id || req.user.id,
            (err, result2) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
              } else {
                console.log(req.query);
                console.log(
                  result.map((item) => item.competence_id).concat(result2)
                );
                res
                  .status(200)
                  .send(
                    result.map((item) => item.competence_id).concat(result2)
                  );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(501).json(error);
  }
});

//add competency of a skill
router.post("/add-competency", verify, async (req, res) => {
  try {
    let user_added_comp = [];
    let chosen_competencies = [];
    console.log(req.body);
    if (req.query.user_added) {
      chosen_competencies = req.body.chosen_competency;
      user_added_comp = req.body.user_added_comp;
    }
    console.log(user_added_comp);
    console.log(chosen_competencies);
    db.query(
      "delete from user_added_competencies where user_id = ?",
      req.user.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        db.query(
          "delete from competent_of where user_id = ?",
          req.user.id,
          (err) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            if (user_added_comp.length > 0) {
              db.query(
                "insert into user_added_competencies values ?",
                [user_added_comp.map((item) => [null, item, req.user.id])],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            }
            if (chosen_competencies.length > 0) {
              db.query(
                "insert ignore into competent_of values ?",
                [chosen_competencies.map((item) => [req.user.id, item])],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(501).json(err);
                    return;
                  }
                }
              );
            }
            res.status(200).json("competences added successfully!");
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(501).json(error);
  }
});

// remove competency of a skill
router.post("/remove-competency", verify, async (req, res) => {
  try {
    db.query(
      "delete from competent_of where (user_id,competence_id) in (?)",
      [req.body.map((item) => [req.user.id, item])],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        }
        res.status(200).json("competences removed successfully!");
      }
    );
  } catch (error) {
    res.status(501).json(error);
  }
});

//get work experience
router.get("/work-experience", verify, async (req, res) => {
  try {
    db.query(
      "select * from work_experience where user_id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else res.status(200).send(result);
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//delete work experience
router.post("/delete-work-experience", verify, async (req, res) => {
  try {
    db.query(
      "delete from work_experience where id = ?",
      [req.body.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
        } else {
          res.status(200).json("Work experience deleted successfully");
        }
      }
    );
  } catch (error) {
    res.status(501).send(error);
  }
});

//add work experience
router.post("/add-work-experience", verify, async (req, res) => {
  try {
    const { func, employer, start_date, end_date, description } = req.body;
    db.query(
      "insert into work_experience values (null,?,?,?,?,?,?)",
      [func, employer, start_date, end_date, description, req.user.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
        } else {
          res.status(200).json("information added successfully!");
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

// get notifications
router.get("/notifications", verify, async (req, res) => {
  try {
    db.query(
      "select * from notifications where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
        } else {
          res.status(200).send(result[0]);
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//set nofitications
router.post("/set-notifications", verify, async (req, res) => {
  try {
    const { amt_of_notif, email_notif, notif_via_app } = req.body;
    db.query(
      "update notifications set amt_of_notif = ? , email_notif = ?, notif_via_app = ? where user_id = ?",
      [amt_of_notif, email_notif, notif_via_app, req.user.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
        } else {
          res.status(200).json("notifications updated successfully! ");
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//get profile and ratings
router.get("/profile-ratings", verify, async (req, res) => {
  try {
    let info = {};
    if (isNaN(req.query.id)) {
      req.query.id = req.user.id;
    }
    db.query(
      "select * ,'' as password from users where id = ?",
      req.query.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
          return;
        }
        if (result[0]) {
          info["user"] = result[0];
          db.query(
            "select * from company_details where user_id = ?",
            req.query.id,
            (err, result) => {
              if (err) {
                console.log(err);
                res.status(501).send(err);
                return;
              }
              info["company_details"] = result[0];
              db.query(
                "select orga_name from client_orga where user_id = ?",
                req.query.id,
                (err, result) => {
                  if (err) {
                    console.log(err);
                    res.status(501).send(err);
                    return;
                  }
                  if (info["company_details"])
                    info["company_details"].orga_name = result[0].orga_name;
                  db.query(
                    "select * from diplomat_certificate where user_id = ? ",
                    req.query.id,
                    (err, result) => {
                      if (err) {
                        console.log(err);
                        res.status(501).send(err);
                        return;
                      }
                      info["diplomat_certificate"] = result;
                      db.query(
                        "select competence as competencies from competencies where (competencies.id in (select competence_id from competent_of where user_id = ?))",
                        req.query.id,
                        (err, result) => {
                          if (err) {
                            console.log(err);
                            res.status(501).send(err);
                            return;
                          }
                          info["competencies"] = result;
                          res.status(200).send(info);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        } else {
          res.status(404).send("no data found! ");
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get availability
router.get("/availability", verify, async (req, res) => {
  try {
    db.query(
      "select DATE_FORMAT(availability_date,'%d/%m/%Y') as availability_date,event,start_time,end_time,user_id from availability where user_id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).send(result);
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//add availability
router.post("/add-availability", verify, async (req, res) => {
  try {
    //setting date formula to YYYY/MM/DD because it is the one and only acceptable date formula in mysql
    req.body = req.body.map((item) => {
      item.availability_date =
        item.availability_date.year_num +
        "-" +
        item.availability_date.month_num +
        "-" +
        item.availability_date.day_num;
      return item;
    });

    console.log(req.body);
    //checking if the date alredy exists, if so. availability hours will be compared. And if they are different, we update availability hours of the date
    req.body.map((item) => {
      db.query(
        "select * from availability where availability_date = ? and user_id = ?",
        [item.availability_date, req.user.id],
        (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          //updating
          if (result[0]) {
            db.query(
              "update availability set start_time = ?,end_time = ? where (availability_date = ? and user_id = ?)",
              [
                item.start_time,
                item.end_time,
                item.availability_date,
                req.user.id,
              ],
              (err) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
              }
            );
          }
        }
      );
    });

    req.body.map((item) => {
      db.query(
        "insert ignore into availability  values (?,?,?,?,?)",
        [
          null,
          item.start_time,
          item.end_time,
          item.availability_date,
          req.user.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
        }
      );
    });
    res.status(200).send("data added successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//remove availability
router.post("/remove-availability", verify, async (req, res) => {
  try {
    req.body = req.body.map((item) => {
      let month = item.unavailable_date.split("/")[1];
      let day = item.unavailable_date.split("/")[0];
      let year = item.unavailable_date.split("/")[2];
      item.unavailable_date = year + "/" + month + "/" + day;
      return item;
    });
    if (req.body.length > 0) {
      req.body.map((item) => {
        db.query(
          "delete from availability where (availability_date,user_id) = (?,?)",
          [item.unavailable_date, req.user.id],
          (err) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
          }
        );
      });
      res.status(200).json("data removed successfully!");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add documents

router.post("/documents", verify, async (req, res) => {
  try {
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(req.files);
    let declaration_of_conduct = req.files?.declaration_of_conduct;
    let persons_register_childcare = req.files?.persons_register_childcare;
    let insurance_picture = req.files?.insurance_picture;
    let id_card = req.files?.id_card;
    let chamber_of_commerce_registration =
      req.files?.chamber_of_commerce_registration;
    //deleting old files
    if (id_card) {
      db.query(
        "select id_card from documents where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            if (result[0].length > 0) {
              unlink(result[0].id_card, (err) => {
                console.log(err);
                return;
              });
            }
          }
        }
      );
    }
    if (chamber_of_commerce_registration) {
      db.query(
        "select chamber_of_commerce_registration from documents where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            if (result[0].length > 0) {
              unlink(result[0].chamber_of_commerce_registration, (err) => {
                console.log(err);
                return;
              });
            }
          }
        }
      );
    }
    if (declaration_of_conduct) {
      db.query(
        "select declaration_of_conduct from documents where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            if (result[0].length > 0) {
              unlink(result[0].declaration_of_conduct, (err) => {
                console.log(err);
                return;
              });
            }
          }
        }
      );
    }
    if (persons_register_childcare) {
      db.query(
        "select persons_register_childcare from documents where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            if (result[0].length > 0) {
              unlink(result[0].persons_register_childcare, (err) => {
                console.log(err);
                return;
              });
            }
          }
        }
      );
    }
    if (insurance_picture) {
      db.query(
        "select insurance_picture from documents where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            if (result[0].length > 0) {
              unlink(result[0].insurance_picture, (err) => {
                console.log(err);
                return;
              });
            }
          }
        }
      );
    }

    declaration_of_conduct = upload_file(
      declaration_of_conduct,
      "documents",
      ["pdf"],
      varToString({ declaration_of_conduct })
    );
    persons_register_childcare = upload_file(
      persons_register_childcare,
      "documents",
      ["pdf"],
      varToString({ persons_register_childcare })
    );
    insurance_picture = upload_file(
      insurance_picture,
      "documents",
      ["jpg", "jpeg", "png"],
      varToString({ insurance_picture })
    );
    id_card = upload_file(
      id_card,
      "documents",
      ["jpg", "jpeg", "png"],
      varToString({ id_card })
    );
    chamber_of_commerce_registration = upload_file(
      chamber_of_commerce_registration,
      "documents",
      ["jpg", "jpeg", "png"],
      varToString({ chamber_of_commerce_registration })
    );

    let docs = [
      declaration_of_conduct,
      persons_register_childcare,
      insurance_picture,
      id_card,
      chamber_of_commerce_registration,
    ];
    let response = [];

    docs.map((item) => {
      if (item.status) {
        db.query(
          "update documents set " + item.field + " = ? where user_id = ?",
          [item.data.path, req.user.id],
          (err) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
          }
        );
        response.push({
          message: item.message,
          status: item.status,
        });
      } else if (!item.status) {
        response.push({
          message: item.message,
          status: item.status,
        });
      }
    });
    /*if(response.filter(item=>item.status===true).length!==5){
            res.status(401).json(response)
        }else*/
    res
      .status(200)
      .json({ response: { message: "files uploaded successfully!" } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error, response });
  }
});
//add diplomat

router.post("/diplomat", verify, async (req, res) => {
  try {
    req.body = JSON.parse(req.body["type-of-diplomat"]);
    if (req.files) {
      for (const [key, item] of Object.entries(req.files)) {
        let diplomat = upload_file(item, "documents", [
          "pdf",
          "jpg",
          "jpeg",
          "png",
        ]);
        if (diplomat.status) {
          db.query(
            "insert into  diplomat_certificate  values (null,?,?,?)",
            [diplomat.data.path, req.user.id, req.body.type],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
            }
          );
        }
      }
    }
    res.status(200).send({
      data: { message: "diplomat uploaded successfully !", status: true },
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: error, status: false });
  }
});

//delete diplomat

router.delete("/delete-diplomat", verify, async (req, res) => {
  try {
    db.query(
      "delete from diplomat_certificate where id = ?",
      req.query.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("diplomat deleted successfully! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//get documents
router.get("/get-documents", verify, async (req, res) => {
  try {
    let data = [];
    db.query(
      "select * from documents where  user_id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
        } else {
          data.push(result);
          db.query(
            "select id,diplomat_certificate,type from diplomat_certificate where user_id = ?",
            req.query.id || req.user.id,
            (err, result) => {
              if (err) {
                console.log(err);
                res.status(501).send(err);
              } else {
                data.push(result);
                res.status(200).send(data);
              }
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//sendgrid email inviting
router.post("/invite", verify, async (req, res) => {
  try {
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
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    padding: 5px 0;
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
                    min-width:250px;
                    margin-right:50px;
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
                    width:700px;
                    border-radius: 4px;
                    border: #ccc 1px solid;
                }
        
                .wrapper, .content{
                    align-items: center;
                    justify-content: center;
                }
                .wrapper .title{
                    width: 100%;
                }
                .wrapper .title img{
                    width: 60px;
                    height: 88px;
                }
        
                .wrapper .content .content-information p{
                    color: rgb(31, 119, 54);
                }
                button{
                    background-color: rgb(31, 119, 54);
                    color: white;
                    border: rgb(31, 119, 54) 1px solid;
                    transition: .3s ease-in-out;
                    width: 120px;
                    height: 40px;
                    border-radius: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                button:hover{
                    background: white;
                    color: rgb(31, 119, 54);
                }
                .activate-account{
                    display:flex;
                    align-items:center !important;
                    justify-content:center !important;
                }
                .wrapper .footer{
                    width: 100%;
                    background-color: darkblue;
                    display:flex;
                    align-items: start;
                    padding-top: 10px;
                    padding-bottom: 10px;
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
            <title>Invitation</title>
        </head>
        <body style="width:100%;display:flex;justify-content:center">
            <div class="wrapper" style="width:500px;background-color: #fff; ">
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
                                    <h1 style="color: #147536;" >
                                        You have received an invitation for Curant24  
                                    </h1>
                                </div>
                            </td>
                            <td>
                                <img src="https://www.curant24.nl/images/envelope3.png" alt="" style="height: 150px !important;width: 150px !important;">
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="content"style="width:100%" >
                    <div class="content-information" style="width: 100%;">
                        <div style="background-color: white;padding: 10px 10px;margin-top: 30px;">
                            <p>
                                Dear ${req.body.recipient_name},
                            </p>
                            <p>
                                You have been invited by ${req.body.sender} to participate in Curant24.
                            </p>
                            <p>
                                We are an intermidiary agency between freelancers and clients.
                            </p>
                            <p>
                                We have a large online network of Freelancers and Clients.
                            </p>
                            <p>
                                Click the button below to register directely
                            </p>
                            <p>
                                Sincerely.
                                <br>
                                Team Curant24.
                            </p>
                            <a href="https://www.curant24.nl/join" target="_blank" style="text-decoration:none !important;cursor:pointer!important">
                                <button class="activate-account" style="margin-top: 15px;padding-top:10px;padding-left:35px">
                                    Sign up
                                </button>
                            </a>
                        </div>
                    </div>
                    <div style="background-color: rgb(243, 68, 68);display: flex;width:100% ;min-height: 150px; padding-bottom: 10px;">
                        <div style="display: flex; align-items: center; justify-content: center;">
                            <img src="https://www.curant24.nl/images/binoculars.png" alt="" style="width:80%">
                        </div>
                        <div style="color: white;">
                            <h3>
                                Start looking for a suitable freelancer! 
                            </h3>
                            <div style="display: flex;">
                                <a href="https://www.curant24.nl/search" target="_blank" style="text-decoration:none !important;">
                                    <button class="activate-account" style="margin-top: 15px;margin-right: 15px;">
                                        Looking for freelancers
                                    </button>
                                </a>
                                <a href="https://www.curant24.nl/search" target="_blank" style="text-decoration:none !important;">
                                    <button class="activate-account" style="margin-top: 15px;margin-right:15px">
                                        Search assignements
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <div class="left">
                        <img src="https://www.curant24.nl/images/logo.png" alt="">
                        <div>
                            <div>
                                <a href="https://www.curant24.nl/contact">contact</a>
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

    const msg = {
      to: req.body.recipient,
      from: "no-reply@curant24.com",
      subject: "invitation",
      html,
    };

    sgMail
      .send(msg)
      .then((response) => {
        console.log(response[0].statusCode);
        console.log(response[0].headers);
        db.query(
          "insert into invite values (null,?,?,?,?,?) ",
          [
            req.body.recipient_name,
            req.body.recipient,
            req.body.user_type,
            req.body.status,
            req.user.id,
          ],
          (err) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.status(200).json("invitation sent!");
            }
          }
        );
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send(error);
      });
  } catch (error) {
    res.status(500).send(error);
  }
});
//get invited persons

router.get("/get-invited", verify, async (req, res) => {
  try {
    db.query(
      "select * from invite where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).send(result);
        }
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//add contract
router.post("/add-contract", verify, async (req, res) => {
  try {
    let info = JSON.parse(req.body?.info);
    let delete_files = JSON.parse(req.body?.delete_files);
    console.log(req.body);
    console.log(delete_files);
    if (info.id) {
      //update contract
      let query = "update contract set ";
      let values = [];
      for (const [key, value] of Object.entries(info)) {
        if (key !== "id" && value && value.length > 0) {
          query += key + " = ?,";
          values.push(value);
        }
      }

      query = query.replace(/,$/g, "") + " where id = ?";
      values.push(info.id);
      //console.log(query,values);

      db.query(query, values, (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
      });

      if (req.files) {
        for (const [key, value] of Object.entries(req.files)) {
          let file = upload_file(
            value,
            "documents",
            ["pdf", "jpeg", "png", "jpg"],
            "contract"
          );
          db.query(
            "insert into contract_" + key.split("-")[0] + " values(null,?,?)",
            [file.data.path, info.id],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
            }
          );
        }
      }
      for (const [key, value] of Object.entries(delete_files)) {
        value.map((item) => {
          unlink(
            __dirname.replace("/server/routes", "/client/public") + item,
            (err) => {
              if (err) {
                console.log(err);
              }
            }
          );
          db.query(
            "delete from contract_" + key.split("-")[0] + " where path = ?",
            [item],
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
            }
          );
        });
      }
      res.status(200).send("contract updated successfully! ");
    } else {
      db.query(
        "insert into contract values (null,?,?,?,?,?)",
        [
          info.name_freelancer,
          info.name_company,
          info.week,
          info.state,
          req.user.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          if (req.files) {
            db.query(
              "select id from contract order by id desc",
              (err, result) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                let id = result[0]?.id;
                for (const [key, value] of Object.entries(req.files)) {
                  let file = upload_file(
                    value,
                    "documents",
                    ["pdf", "jpeg", "png", "jpg"],
                    "contract"
                  );
                  db.query(
                    "insert into contract_" +
                      key.split("-")[0] +
                      " values(null,?,?)",
                    [file.data.path, id],
                    (err) => {
                      if (err) {
                        console.log(err);
                        res.status(500).send(err);
                        return;
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
      res.status(200).send("contract added successfully! ");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get contracts
router.get("/get-contracts", verify, async (req, res) => {
  try {
    db.query(
      "select contract.* from contract where  user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        db.query(
          "select contract_agreement_2_signatures.contract_id,contract_agreement_2_signatures.path as agreement_2_signatures from contract_agreement_2_signatures where contract_id in (?) ",
          [result.map((item) => item.id)],
          (err, resultAgreement2Signatures) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            db.query(
              "select contract_signed_agreement.contract_id,contract_signed_agreement.path as signed_agreement from contract_signed_agreement where contract_id in (?)",
              [result.map((item) => item.id)],
              (err, resultSigned) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                db.query(
                  "select contract_three_party_agreement.contract_id,contract_three_party_agreement.path as three_party_agreement from contract_three_party_agreement where contract_id in (?)",
                  [result.map((item) => item.id)],
                  (err, resultThreeParty) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                    res
                      .status(200)
                      .send([
                        result,
                        resultAgreement2Signatures,
                        resultSigned,
                        resultThreeParty,
                      ]);
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get organasations
router.get("/get-orga", verify, async (req, res) => {
  try {
    db.query(
      "select * from organasations where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//set organasations
router.post("/set-orga", verify, async (req, res) => {
  try {
    console.log(req.body);
    let values = [];
    for (let key in req.body) {
      if (key !== "nv" && key !== "id") {
        values.push(req.body[key]);
      }
    }
    if (req.body.nv) {
      db.query(
        "insert into organasations values(null,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          req.body.name,
          req.body.profile_name,
          req.body.selector_description,
          req.body.legal_form_description,
          req.body.trade_name,
          req.body_no_name,
          req.body.employees_class,
          req.body.short_name,
          req.body.is_branch_office,
          req.body.employees_class_description,
          req.body.orga_type,
          req.body.is_active_organasation,
          req.body.number_of_fte,
          req.body.KvK_main_number,
          req.body.KvK_sub_number,
          req.body.legal_entity_ID,
          req.body.number_of_employees,
          req.body.country_code,
          req.body.legal_form_start_date,
          req.body.termination_date,
          req.body.sector,
          req.body.website,
          req.body.email,
          req.body.phone,
          req.body.main_address,
          req.body.visit_address,
          req.body.report_address,
          req.body.postal_address,
          req.body.billing_address,
          req.body.work_address,
          req.body.reminder_address,
          req.body.delivery_date_general_term,
          req.body.working_hours,
          req.body.freelancer_name,
          req.body.bureau,
          req.user.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(503).send(err);
            return;
          }
          db.query(
            "insert into timecards values (null,?,'Pending','',0,'',?,?)",
            [req.body.name, req.body.freelancer_name, req.user.id],
            (err) => {
              if (err) {
                console.log(err);
                res.status(504).send(err);
                return;
              }
              res.status(200).json("Data has been saved successfully !");
            }
          );
        }
      );
    } else {
      let query = "update organasations set ";
      for (let key in req.body) {
        if (key !== "nv" && key !== "id") {
          query += " " + key + " = ? ,";
        }
      }
      query = query + "where id = ?";
      query = query.replace(",where", "where");
      db.query(query, [...values, req.body.id], (err) => {
        if (err) {
          console.log(err);
          res.status(501).send(err);
          return;
        }
        res.status(200).send("Data has been saved successfully !");
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//modify user's timecards

router.post("/set-timecard", verify, async (req, res) => {
  try {
    let timesheet = undefined;
    let signed_timesheet = undefined;
    let complete_invoice = undefined;
    let empty_invoice = undefined;
    req.body = JSON.parse(req.body.info);
    if (req.files) {
      timesheet =
        req.files.timesheet && req.files.timesheet.length > 0
          ? req.files.timesheet
          : [req.files.timesheet];
      signed_timesheet =
        req.files.signed_timesheet && req.files.signed_timesheet.length > 0
          ? req.files.signed_timesheet
          : [req.files.signed_timesheet];
      complete_invoice =
        req.files.complete_invoice && req.files.complete_invoice.length > 0
          ? req.files.complete_invoice
          : [req.files.complete_invoice];
      empty_invoice =
        req.files.empty_invoice && req.files.empty_invoice.length > 0
          ? req.files.empty_invoice
          : [req.files.empty_invoice];
    }

    timesheet && (timesheet = timesheet.filter((item) => item !== undefined));
    signed_timesheet &&
      (signed_timesheet = signed_timesheet.filter(
        (item) => item !== undefined
      ));
    complete_invoice &&
      (complete_invoice = complete_invoice.filter(
        (item) => item !== undefined
      ));
    empty_invoice &&
      (empty_invoice = empty_invoice.filter((item) => item !== undefined));

    if (timesheet) {
      timesheet = timesheet.map((item) => {
        item = upload_file(item, "documents", ["pdf"]);
        return item.data.path;
      });
    }
    if (signed_timesheet) {
      signed_timesheet = signed_timesheet.map((item) => {
        item = upload_file(item, "documents", ["pdf"]);
        return item.data.path;
      });
    }
    if (complete_invoice) {
      complete_invoice = complete_invoice.map((item) => {
        item = upload_file(item, "documents", ["pdf"]);
        return item.data.path;
      });
    }
    if (empty_invoice) {
      empty_invoice = empty_invoice.map((item) => {
        item = upload_file(item, "documents", ["pdf"]);
        return item.data.path;
      });
    }
    if (req.body.isAdmin) {
      db.query(
        "update timecards set employer = ?,freelancer_name=?,status = ?,attention_text = ?,attention = ?, week = ? where id = ?",
        [
          req.body.employer,
          req.body.freelancer_name,
          req.body.status,
          req.body.attention_text,
          req.body.attention,
          req.body.week,
          req.body.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          if (timesheet) {
            timesheet.map((item) => {
              db.query(
                "insert into timesheet values(null,?,?,?)",
                [req.user.id, item, req.body.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            });
          }
          if (signed_timesheet) {
            signed_timesheet.map((item) => {
              db.query(
                "insert into signed_timesheet values(null,?,?,?)",
                [req.user.id, item, req.body.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            });
          }
          if (complete_invoice) {
            complete_invoice.map((item) => {
              db.query(
                "insert into complete_invoice values (null,?,?,?)",
                [item, req.body.id, req.user.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            });
          }
          if (empty_invoice) {
            empty_invoice.map((item) => {
              db.query(
                "insert into empty_invoice values (null,?,?,?)",
                [item, req.body.id, req.user.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            });
          }
          res.status(200).json("timesheet updated successfully! ");
        }
      );
    } else {
      db.query(
        "update timecards set status = ?,attention_text = ?,attention = ? where id = ?",
        [
          req.body.status,
          req.body.attention_text,
          req.body.attention,
          req.body.id,
        ],
        (err) => {
          if (err) {
            throw err;
          } else {
            res.status(200).json("timesheet updated successfully! ");
          }
        }
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get user's timecards

router.get("/get-timecards", verify, async (req, res) => {
  try {
    db.query(
      "select * from timecards where user_id = ?",
      req.user.id,
      async (err, result_one) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        const promise_array = result_one.map((item) => {
          return new Promise((resolve, reject) => {
            db.query(
              "select id,link as timesheet from timesheet where timecard_id = ?",
              item.id,
              (err, result_two) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                item.timesheet = result_two;
                db.query(
                  "select id,link as signed_timesheet from signed_timesheet where timecard_id = ?",
                  item.id,
                  (err, result_three) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                    item.signed_timesheet = result_three;
                    db.query(
                      "select id,link as complete_invoice from complete_invoice where timecard_id = ?",
                      item.id,
                      (err, result_four) => {
                        if (err) {
                          console.log(err);
                          res.status(500).send(err);
                          return;
                        }
                        item.complete_invoice = result_four;
                        db.query(
                          "select id,link as empty_invoice from empty_invoice where timecard_id = ?",
                          item.id,
                          (err, result_five) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                            item.empty_invoice = result_five;
                            return resolve(item);
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        });
        Promise.all(promise_array).then((data) => {
          res.status(200).send(data);
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//delete user's timecard's file
router.delete("/delete-timcard-file", verify, async (req, res) => {
  try {
    db.query(
      "select link from " + req.headers.name + " where id = ?",
      req.headers.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        unlink(
          __dirname.replace("/server/routes", "/client/public") +
            result[0].link,
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        db.query(
          "delete from " + req.headers.name + " where id = ?",
          req.headers.id,
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            res.status(200).send("file deleted successfully! ");
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get client orga
router.get("/client-orga", verify, async (req, res) => {
  try {
    db.query(
      "select * from client_orga where user_id = ?",
      req.query.id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).send(result[0]);
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//set client orga
router.post("/set-client-orga", verify, async (req, res) => {
  try {
    let data = JSON.parse(req.body.info);
    let query = "update client_orga set ";
    let values = [];
    let picture;
    // removing old logo and adding new one if it exists
    if (req.files) {
      db.query(
        "select company_logo from client_orga where user_id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            res.status(404).send(err);
            return;
          }
          if (
            result[0].company_logo &&
            !result[0].company_logo.includes("profile-client") &&
            !result[0].company_logo.includes("profile-freelancer")
          ) {
            unlink(result[0].company_logo, (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        }
      );
      picture = upload_file(
        req.files.company_logo,
        "users",
        ["jpg", "jpeg", "png"],
        "company_logo"
      );
      console.log(picture, req.files);
      db.query(
        "update client_orga set company_logo = ? where user_id = ?",
        [picture.data.path, req.user.id],
        (err) => {
          if (err) {
            console.log(err);
            res.status(502).send(err);
            return;
          }
        }
      );
    }
    //generating long query for table attributes
    for (const [key, item] of Object.entries(data)) {
      query += key + "=?,";
      values.push(item);
    }
    //adding final ID values
    query = query.replace(/,$/g, "") + " where user_id = ?";
    values.push(req.user.id);

    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      } else {
        res.status(200).send("Data has been saved successfully! ");
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get locations
router.get("/get-locations", verify, async (req, res) => {
  try {
    db.query(
      "select * from locations where user_id = ?",
      req.user?.id || 0,
      (err, result) => {
        if (err) {
          console.log(err);
          throw err;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add locations
router.post("/add-location", verify, async (req, res) => {
  try {
    let query = "insert into locations values (null,";
    let values = [];
    for (const [key, item] of Object.entries(req.body)) {
      query += "?,";
      values.push(item);
    }
    query += "?)";
    values.push(req.user.id);
    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("locations added successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//update location
router.post("/update-location", verify, async (req, res) => {
  try {
    let query = "update locations set ";
    let values = [];
    for (const [key, item] of Object.entries(req.body)) {
      query += key + "=?,";
      values.push(item);
    }
    query = query.replace(/,$/g, "") + " where id = " + req.body.id;
    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("location updated successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.delete("/delete-location", verify, async (req, res) => {
  try {
    db.query("delete from locations where id = ?", req.query.id, (err) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.status(200).send("Location deleted successfully! ");
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
//get additional users
router.get("/get-additional-user", verify, async (req, res) => {
  try {
    db.query(
      "select *,'' as password from additional_user where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//add additional users
router.post("/add-additional-user", verify, async (req, res) => {
  try {
    db.query(
      "insert into additional_user values (null,?,?,?,?,?,?)",
      [
        req.body.user_name,
        CryptoJs.AES.encrypt(
          req.body.password,
          process.env.SECRET_KEY
        ).toString(),
        req.body.email,
        req.body.first_name,
        req.body.last_name,
        req.user.id,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("user added successfully! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//update additional users
router.post("/update-additional-user", verify, async (req, res) => {
  try {
    let query = "update additional_user set ";
    let values = [];
    for (const [key, item] of Object.entries(req.body)) {
      if (key !== "id") {
        query += key + "=?,";
        values.push(item);
      }
    }
    query = query.replace(/,$/g, "") + " where id = ?";
    values.push(req.body.id);

    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("user updated successfully! ");
    });
  } catch (error) {}
});

//add assignement
router.post("/add-assignement", verify, async (req, res) => {
  try {
    let info = JSON.parse(req.body.info);
    console.log(
      "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<info>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
    );
    console.log(info);
    let cols = [],
      values = [];
    let query = "insert into assignements (";

    for (const [key, item] of Object.entries(info)) {
      if (
        key !== "required_certificates" &&
        key !== "what_may_be_charged" &&
        key !== "skills" &&
        key !== "working_days" &&
        key !== "checked_comp"
      ) {
        cols.push(key);
        values.push(item);
      }
    }
    cols.map((item) => (query += item + ","));

    query += "user_id) values (";
    values.push(req.user.id);

    values.map((item) => (query += "?,"));
    query = query.replace(/,$/g, "") + ");";
    console.log(cols, values);
    await db.query(query, values, async (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
      } else {
        await db.query("select id from assignements order by(id) desc", async (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            } else if (result && result[0]) {
              let id = result[0].id;
              if (req.files) {
                console.log(req.files);
                let files_strings = [];
                for (const [key, file] of Object.entries(req.files)) {
                  files_strings.push(
                    upload_file(
                      file,
                      "users",
                      ["jpg", "jpeg", "png", "pdf"],
                      "assignement_files"
                    )
                  );
                }
                files_strings.map(async(item) => {
                  await db.query(
                    "insert into assignements_files values (null,?,?);",
                    [item.data.path, id],
                    (err) => {
                      if (err) {
                        console.log(err);
                        res.status(502).send(err);
                        return;
                      }
                    }
                  );
                });
              }
              info.what_may_be_charged?.map(async(item) => {
                await db.query(
                  "insert into what_may_be_charged_assignement values (null,?,?)",
                  [item, id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                  }
                );
              });
              info.working_days?.map(async(item) => {
                await db.query(
                  "insert into working_days values (null,?,?)",
                  [item, id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                  }
                );
              });
              info.required_certificates?.map(async(item) =>
                await db.query(
                  "insert into assignements_certificate values (null,?,?)",
                  [item, id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      throw err;
                    }
                  }
                )
              );
              info.checked_comp?.map(async(item) =>
                await db.query(
                  "insert into assignements_competencies values (null,?,?)",
                  [item, id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      throw err;
                    }
                  }
                )
              );
              info.skills?.map(async(item) =>
                await db.query(
                  "insert into assignement_skills values (null,?,?)",
                  [item, id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      throw err;
                    }
                  }
                )
              );

              await db.query(
                "select * from assignement_alert where profession like ? or keyword like ? or location like ? or section like ? ",
                [
                  "%" + info.industry + "%",
                  "%" + info.job_name + "%",
                  "%" + info.country + "%",
                  "%" + info.industry + "%",
                ],
                (err, result2) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                  //insert all found records in new table assignement_found_alerts (insert user_id,assignement_id)
                  console.log(result2);
                  result2.map( async(item) => {
                    await db.query("select user_name from users where id = ?",item.user_id,async(err, res3) => {
                        if (err) {
                          console.log(err);
                          res.status(500).send(err);
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
                                                display: grid;
                                                grid-template-columns: 1fr 1fr;
                                                padding: 5px 0;
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
                                                width:700px;
                                                border-radius: 4px;
                                                border: #ccc 1px solid;
                                            }
                                    
                                            .wrapper, .content{
                                                align-items: center;
                                                justify-content: center;
                                            }
                                            .wrapper .title{
                                                width: 100%;
                                            }
                                            .wrapper .title img{
                                                width: 60px;
                                                height: 88px;
                                            }
                                    
                                            .wrapper .content .content-information p{
                                                color: rgb(31, 119, 54);
                                            }
                                            button{
                                                background-color: rgb(31, 119, 54);
                                                color: white;
                                                border: rgb(31, 119, 54) 1px solid;
                                                transition: .3s ease-in-out;
                                                width: 120px;
                                                height: 40px;
                                                border-radius: 5px;
                                                cursor: pointer;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            }
                                            button:hover{
                                                background: white;
                                                color: rgb(31, 119, 54);
                                                }
                                            .wrapper .footer{
                                                width: 100%;
                                                background-color: darkblue;
                                                display:flex;
                                                align-items: start;
                                                padding-top: 10px;
                                                padding-bottom: 10px;
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
                                        <title>New assignment</title>
                                    </head>
                                    <body style="width:100%;display:flex;justify-content:center">
                                        <div class="wrapper" style="width:500px;background-color: #ccc; ">
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
                                                                    New Assignments for you! 
                                                                </h1>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <img src="https://www.curant24.nl/images/new_assignement.png" style="width:160px !important;height:130px !important">
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div class="content" >
                                                <div class="content-information">
                                                    <div style="background-color: white;padding: 10px 30px;">
                                                        <p>
                                                            Hi ${res3[0]?.user_name},
                                                        </p>
                                                        <p>
                                                            Good news, we have found new assignements for you based on your preferences. Ready to apply, view the assignments below.
                                                        </p>
                                                    </div>
                                                    <div class="content-info-additional" style="padding: 0 5%;">
                                                        <h1 style="font-family: Arial, Helvetica, sans-serif;">
                                                            Municipality of The Hague OCW
                                                        </h1>
                                                        <div style="border-radius: 4px ;background-color: white; padding: 10px;font-weight: 300;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;margin-bottom: 10px;">
                                                            <h2 style="color: rgb(36, 165, 207);">
                                                                Administrative assistance Youth Aid
                                                            </h2>
                                                            <div>
                                                                <div style="display: flex;align-items: center;margin-bottom: 10px;">
                                                                    <img src="https://www.curant24.nl/images/location.png" style="height:30px;width:30px"/>                    
                                                                    <span style="display: flex;justify-content: flex-start;">
                                                                        The Hague
                                                                    </span>
                                                                </div>
                                                                <div style="display: flex; ;align-items: baseline;">
                                                                    <img src="https://www.curant24.nl/images/briefcase.png"  style="height:30px;width:30px"/>
                                                                    <span style="display: flex;justify-content: flex-start;">
                                                                        Always wanted to contribute to the well-being of the youth of The hague? Are you good at working independantly? And are you used to working with privacy-sensitive data?
                                                                    </span>
                                                                    <br>
                                                                    <span style="display: flex;justify-content: flex-start;">
                                                                        Then become an Administrative Assistant youth aid for the municipality of The Hague
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <a href="https://www.curant24.nl/view-assignements?id=${result[0].id}" target="_blank" style="padding-top:10px;padding-left:50%;text-decoration:none">
                                                                <button class="activate-account" style="margin-top: 15px;padding-top:10px;padding-left:10px;">
                                                                    View Assignment
                                                                </button>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style="background-color: rgb(243, 68, 68);display: flex;width:100% ;padding-bottom: 10px;">
                                                    <div style="display: flex; align-items: center; justify-content: center;">
                                                        <img src="https://www.curant24.nl/images/binoculars.png" alt="" style="width:80%">
                                                    </div>
                                                    <div style="color: white;">
                                                        <h3>
                                                            Looking for something else
                                                        </h3>
                                                        <p style="color: white;">
                                                            We are happy to find the assignment for you.
                                                        </p>
                                                        <span>
                                                            So adjust your assignment email alert in My Curant24.
                                                        </span>
                                                        <a href="https://www.curant24.nl/" target="_blank" style="text-decoration:none">
                                                            <button class="activate-account" style="margin-top: 15px;padding-top:10px;padding-left:10px;">
                                                                To My curant24
                                                            </button>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="footer">
                                                <div class="left">
                                                    <img src="https://www.curant24.nl/images/logo.png" alt="">
                                                    <div>
                                                        <div>
                                                            <a href="https://www.curant24.nl/contact">contact</a>
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
                        sendEmail(
                          item.receive_email,
                          "new found assignements",
                          html
                        );
                        await db.query(
                          "insert into assignement_found_alerts values (null,?,?,?)",
                          [item.user_id, result[0].id, item.id],
                          (err) => {
                            if (err) {
                              console.log(err);
                              return;
                            }
                          }
                        );
                      }
                    );
                  });
                }
              );
              res.status(200).json(id);
            }
          }
        );
      }
    });

    //checking if the assignement matches one of the the assignement alert's filters
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//SET ASSIGNEMENT
router.post("/set-assignement", verify, async (req, res) => {
  try {
    let info = JSON.parse(req.body.info);
    let query = "update assignements set ";
    let values = [];
    console.log("set assignement info");
    console.log(info);
    let id = info.assignement_id || info.id || req.query.id;
    console.log(info);
    for (const [key, value] of Object.entries(info)) {
      if (
        key !== "required_certificates" &&
        key !== "what_may_be_charged" &&
        key !== "skill" &&
        key !== "id" &&
        key !== "working_days" &&
        key !== "checked_comp" &&
        key !== "files_to_delete" &&
        key !== "fav_lang" &&
        key !== "certificate" &&
        key !== "certificates" &&
        key !== "assignement_id" &&
        key !== "file" &&
        key !== "day" &&
        key !== "skills" &&
        key !== "user_id" &&
        key !== "days" &&
        key !== "files"
      ) {
        query += key + "=? , ";
        values.push(value);
      }
    }
    query = query.replace(/ , $/g, "") + " where id = ?";
    values.push(req.query.id);
    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      if (req.files !== null) {
        let files_strings = [];
        for (const [key, file] of Object.entries(req.files)) {
          files_strings.push(
            upload_file(
              file,
              "users",
              ["jpg", "jpeg", "png", "pdf"],
              "assignement_files"
            )
          );
        }
        files_strings?.map((item) => {
          db.query(
            "insert into assignements_files values (null,?,?);",
            [item.data.path, id],
            (err) => {
              if (err) {
                console.log(err);
                res.status(502).send(err);
                return;
              }
            }
          );
        });
      }
      info.files_to_delete?.map((item) => {
        db.query(
          "delete from assignements_files where file = ? and assignement_id = ?",
          [item.preview, id],
          (err) => {
            if (err) {
              console.log(err);
              res.status(502).send(err);
              return;
            }
            unlink(item.preview, (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        );
      });
      //deleting  old info elts
      db.query(
        "delete from what_may_be_charged_assignement where assignement_id = ?",
        id,
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          db.query(
            "delete from working_days where assignement_id = ?",
            id,
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
              db.query(
                "delete from assignements_competencies where assignement_id = ?",
                id,
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                  db.query(
                    "delete from assignements_certificate where assignement_id = ?",
                    id,
                    (err) => {
                      if (err) {
                        console.log(err);
                        res.status(500).send(err);
                        return;
                      }
                      info.required_certificates?.map((item) =>
                        db.query(
                          "insert into assignements_certificate values (null,?,?)",
                          [item, id],
                          (err) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              throw err;
                            }
                          }
                        )
                      );
                      info.checked_comp?.map((item) => {
                        db.query(
                          "insert into assignements_competencies values (null,?,?); ",
                          [item, id],
                          (err) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                          }
                        );
                      });
                      info.what_may_be_charged?.map((item) => {
                        console.log(item);
                        db.query(
                          "insert into what_may_be_charged_assignement values (null,?,?)",
                          [item, id],
                          (err) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                          }
                        );
                      });
                      info.working_days?.map((item) => {
                        db.query(
                          "insert ignore into working_days values (null,?,?)",
                          [item, id],
                          (err) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                          }
                        );
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
      res.status(200).send("assignement updated successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add second-image and video for user
router.post("/update-user-files", verify, async (req, res) => {
  try {
    //req.body.file stands for file type (second-image or video)
    req.body = JSON.parse(req.body.data);
    console.log(req.body);
    console.log(
      "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
    );
    console.log(req.files);
    if (req.files) {
      let file;
      //removing old video file
      db.query(
        "select " + req.body.file + " from users where id = ?",
        req.user.id,
        (err, result) => {
          if (err) {
            console.log(err);
            res.status(404).send(err);
            return;
          }
          if (
            result[0][req.body.file] &&
            !result[0][req.body.file].includes("profile-client") &&
            !result[0][req.body.file].includes("profile-freelancer")
          ) {
            unlink(
              __dirname.replace(
                __dirname.slice(__dirname.indexOf("server")),
                "client/public/" + result[0][req.body.file]
              ),
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          }
        }
      );
      if (req.files[req.body.file]) {
        req.files[req.body.file].name = new Date().getTime() + ".jpeg";
        console.log("new file name");
        console.log(req.files[req.body.file]);
      }
      file = upload_file(
        req.files[req.body.file],
        "users",
        ["jpg", "jpeg", "png"],
        req.body.file
      );
      db.query(
        "update users set " + req.body.file + "= ? where id = ?",
        [file.data.path, req.user.id],
        (err) => {
          if (err) {
            console.log(err);
            res.status(502).send(err);
            return;
          }
          res.status(200).send("file updated successfully");
        }
      );
    } else {
      res.status(404).send("no file uploaded");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//delete files of user
router.post("/delete-user-files", verify, async (req, res) => {
  try {
    //req.body.file stands for file type (second-image or video)
    req.body = JSON.parse(req.body.data);
    console.log(req.body);
    console.log(
      __dirname.replace(__dirname.slice(__dirname.indexOf("server")), "")
    );
    db.query(
      "select " +
        req.body.file +
        " from " +
        (req.body.table || "users") +
        " where " +
        (req.body.key || "id") +
        " = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(404).send(err);
          return;
        }
        if (
          result[0] &&
          result[0][req.body.file] &&
          !result[0][req.body.file].includes("profile-client") &&
          !result[0][req.body.file].includes("profile-freelancer")
        ) {
          unlink(
            __dirname.replace(
              __dirname.slice(__dirname.indexOf("server")),
              "client/public/" + result[0][req.body.file]
            ),
            (err) => {
              if (err) {
                console.log(err);
              }
              db.query(
                "update " +
                  (req.body.table || "users") +
                  " set " +
                  req.body.file +
                  "= null where " +
                  (req.body.key || "id") +
                  " = ?",
                [req.user.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(502).send(err);
                    return;
                  }
                  res.status(200).send("file deleted successfully");
                }
              );
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get reviews
router.get("/get-reviews", verify, async (req, res) => {
  try {
    db.query(
      "select review.id,review.review,users.user_name,users.picture,review.review_type from review, users where review.reviewed_user = ? and review.user_id = users.id and users.id in(select user_id from review where reviewed_user = ?) order by review.id desc;",
      [req.query.id || req.user.id, req.query.id || req.user.id],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        db.query(
          "select avg(rating) as avg_rating from review where reviewed_user = ?",
          [req.query.id || req.user.id],
          (err, resAvg) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            db.query(
              " select ((select count(*) from review where review_type='Excelent' and reviewed_user = ?)/(select count(*) from review where reviewed_user = ?))*100 as avg_excelent from review ; ",
              [req.query.id || req.user.id, req.query.id || req.user.id],
              (err, result2) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                db.query(
                  " select ((select count(*) from review where review_type='Good' and reviewed_user = ?)/(select count(*) from review where reviewed_user = ?))*100 as avg_good from review ; ",
                  [req.query.id || req.user.id, req.query.id || req.user.id],
                  (err, result3) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                    db.query(
                      " select ((select count(*) from review where review_type='Average' and reviewed_user = ?)/(select count(*) from review where reviewed_user = ?))*100 as avg_average from review ; ",
                      [
                        req.query.id || req.user.id,
                        req.query.id || req.user.id,
                      ],
                      (err, result4) => {
                        if (err) {
                          console.log(err);
                          res.status(500).send(err);
                          return;
                        }
                        db.query(
                          " select ((select count(*) from review where review_type='Bad' and reviewed_user = ?)/(select count(*) from review where reviewed_user = ?))*100 as avg_bad from review ; ",
                          [
                            req.query.id || req.user.id,
                            req.query.id || req.user.id,
                          ],
                          (err, result5) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                            db.query(
                              " select ((select count(*) from review where review_type='Very poor' and reviewed_user = ?)/(select count(*) from review where reviewed_user = ?))*100 as avg_poor from review ; ",
                              [
                                req.query.id || req.user.id,
                                req.query.id || req.user.id,
                              ],
                              (err, result6) => {
                                if (err) {
                                  console.log(err);
                                  res.status(500).send(err);
                                  return;
                                }
                                if (result[0]) {
                                  result[0].avg_rating = resAvg[0]?.avg_rating;
                                  result[0].avg_rating_excelent =
                                    result2[0]?.avg_excelent;
                                  result[0].avg_rating_good =
                                    result3[0]?.avg_good;
                                  result[0].avg_rating_average =
                                    result4[0]?.avg_average;
                                  result[0].avg_rating_bad =
                                    result5[0]?.avg_bad;
                                  result[0].avg_rating_poor =
                                    result6[0]?.avg_poor;
                                }
                                console.log(result[0], result2);
                                res.status(200).send(result);
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add review
router.post("/add-review", verify, async (req, res) => {
  try {
    console.log(req.body);
    db.query(
      "insert into review values (null,?,?,?,?,?)",
      [
        req.body.reviewed_user,
        req.body.review,
        req.body.rating,
        req.body.review_type,
        req.user.id,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("review added successfully! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//remove review
router.delete("/remove-review", verify, async (req, res) => {
  try {
    db.query("delete from review where id = ?", req.query.id, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("review deleted successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//get assignement
router.get("/get-assignement", verify, async (req, res) => {
  try {
    // what_may_be_charged_assignement.assignement_id = assignements_certificate.assignement_id and assignements_certificate.assignement_id = assignement_skills.assignement_id and assignement_skills.assignement_id = assignements_files.assignement_id and assignements_files.assignement_id = assignements.id and
    //,assignements_certificate,assignement_skills,assignements_files
    let info = {};
    db.query(
      "select * from assignements where id = ?",
      req.query.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          if (result[0]) {
            info = result[0];
            db.query(
              "select * from what_may_be_charged_assignement where what_may_be_charged_assignement.assignement_id = ?",
              req.query.id,
              (err, result_what_may_be_charged_assignement) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                info.what_may_be_charged =
                  result_what_may_be_charged_assignement;
                db.query(
                  "select * from working_days where assignement_id = ? ",
                  req.query.id,
                  (err, resE) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                    }
                    if (resE[0]) {
                      info["days"] = resE;
                    }
                    db.query(
                      "select * from assignements_certificate where assignements_certificate.assignement_id = ? ",
                      req.query.id,
                      (err, res2) => {
                        if (err) {
                          console.log(err);
                          res.status(500).send(err);
                        }
                        info["certificates"] = res2;
                        db.query(
                          "select * from assignement_skills where assignement_skills.assignement_id = ?",
                          req.query.id,
                          (err, res3) => {
                            if (err) {
                              console.log(err);
                              res.status(500).send(err);
                              return;
                            }
                            if (res3[0]) {
                              info["skills"] = res3;
                            }
                            db.query(
                              "select * from assignements_files where  assignements_files.assignement_id  = ?",
                              req.query.id,
                              (err, res4) => {
                                if (err) {
                                  console.log(err);
                                  res.status(500).send(err);
                                  return;
                                }
                                if (res4[0]) {
                                  info["files"] = res4;
                                }
                                db.query(
                                  "select competency_id from assignements_competencies where assignement_id = ?",
                                  req.query.id,
                                  (err, res5) => {
                                    if (err) {
                                      console.log(err);
                                      res.status(500).send(err);
                                      return;
                                    } else {
                                      info.checked_comp = res5?.map(
                                        (item) => item.competency_id
                                      );
                                      db.query(
                                        "select * from working_days where assignement_id = ?",
                                        req.query.id,
                                        (err, res6) => {
                                          if (err) {
                                            console.log(err);
                                            res.status(500).send(err);
                                            return;
                                          } else {
                                            info.working_days = res6;
                                            db.query(
                                              "select * from fav_lang where assignement_id = ?",
                                              req.query.id,
                                              (err, res7) => {
                                                if (err) {
                                                  console.log(err);
                                                  res.status(500).send(err);
                                                  return;
                                                }
                                                info.fav_lang = res7;
                                                res.status(200).send(info);
                                              }
                                            );
                                          }
                                        }
                                      );
                                    }
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
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
    res.status(500).send(error);
  }
});

//get all assignement
router.get("/get-all-assignements", verify, async (req, res) => {
  try {
    //db.query("select * from assignements,assignements_certificate,assignement_skills,assignements_files,what_may_be_charged_assignement,working_days where (working_days.assignement_id = what_may_be_charged_assignement.assignement_id and what_may_be_charged_assignement.assignement_id = assignements_certificate.assignement_id and assignements_certificate.assignement_id = assignement_skills.assignement_id and assignement_skills.assignement_id = assignements_files.assignement_id and assignements_files.assignement_id = assignements.id and assignements.id in (select id from assignements where user_id = ?))",req.query.id||req.user.id,(err,result)=>{
    //(working_days.assignement_id = what_may_be_charged_assignement.assignement_id and what_may_be_charged_assignement.assignement_id = assignements_certificate.assignement_id and assignements_certificate.assignement_id = assignements.id and assignements.id in (select id from assignements where user_id = ?))
    db.query(
      "select * from assignements where user_id = ?",
      req.query.id || req.user.id,
      async (err, assignement_result) => {
        let result_arr = [];
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        result_arr = assignement_result.map((item) => {
          return new Promise((resolve, reject) => {
            db.query(
              "select * from  assignements_certificate where assignement_id = ?",
              item.id,
              (err, assignement_certificate_result) => {
                if (err) {
                  return;
                }

                item.assignements_certificate =
                  assignement_certificate_result[0];

                db.query(
                  "select * from what_may_be_charged_assignement where  assignement_id = ?",
                  item.id,
                  (err, what_may_be_charged_result) => {
                    if (err) {
                      return;
                    }

                    item.what_may_be_charged_assignement =
                      what_may_be_charged_result[0];

                    db.query(
                      "select * from assignements_certificate where assignement_id = ?",
                      item.id,
                      (err, assignements_certificate_result) => {
                        if (err) {
                          return;
                        }

                        item.assignements_certificate =
                          assignements_certificate_result[0];

                        db.query(
                          "select * from assignement_skills where assignement_id = ?",
                          item.id,
                          (err, assignement_skills_result) => {
                            if (err) {
                              return;
                            }

                            item.assignement_skills =
                              assignement_skills_result[0];

                            db.query(
                              "select * from assignements_files where assignement_id = ?",
                              item.id,
                              (err, assignements_files_result) => {
                                if (err) {
                                  return;
                                }

                                item.assignements_files =
                                  assignements_files_result[0];

                                db.query(
                                  "select * from working_days where assignement_id = ?",
                                  item.id,
                                  (err, working_days_result) => {
                                    if (err) {
                                      return;
                                    }

                                    item.working_days = working_days_result[0];
                                    db.query(
                                      "select * from fav_lang where assignement_id = ?",
                                      item.id,
                                      (err, fav_lang) => {
                                        if (err) {
                                          console.log(err);
                                          res.status(500).send(err);
                                          return;
                                        }
                                        item.fav_lang = fav_lang;
                                        return resolve(item);
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        });
        Promise.all(result_arr).then((data) => {
          console.log(data);
          res.status(200).send(data);
        });
        //console.log([... new Set(result.map(item=>item.assignement_id))].map(item=>result.find(elt=>elt.assignement_id===item)));
        //result = [... new Set(result.map(item=>item.assignement_id))].map(item=>result.find(elt=>elt.assignement_id===item));
        //res.status(200).send(result_arr);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get geolocation
router.get("/geolocation", verify, async (req, res) => {
  try {
    let place = req.query.place;
    let address = req.query.address;
    let data = "";
    let geocoding_api =
      "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      place +
      "," +
      address +
      "&key=" +
      process.env.GEOCODING_API_KEY;
    https
      .get(geocoding_api, (response) => {
        response.on("data", (chunk) => {
          data = data + chunk.toString();
        });

        response.on("end", () => {
          const body = JSON.parse(data);
          res.status(200).send(body);
        });
      })
      .on("error", (e) => {
        console.error(e);
        res.status(500).send(e);
        return;
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//remove assignement
router.delete("/delete-assignement", verify, async (req, res) => {
  try {
    db.query("delete from assignements where id = ?", req.query.id, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("Assignement deleted successfully!");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//search for user / assignment
router.post("/search", async (req, res) => {
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<THE BODY >>>>>>>>>>>>>>>>>>>>>>>>>>");
  console.log(req.body);
  try {
    if (req.body?.table === "users") {
      req.body = {
        ...req.body,
        account_type: { operation: "like", values: "freelancer" },
      };
    }
    let query = "select *,'' as password from " + req.body.table + " where ",
      values = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== "table") {
        if (value.values === "flush") {
          res.status(200).send([]);
          return;
        } else if (
          typeof value.values !== "string" &&
          typeof value.values !== "number"
        ) {
          query += value?.values
            ?.map((item) => " " + key + " " + value.operation + " ? or ")
            .join(" ")
            .replace(/or $/g, "");
          values = [...values, ...(value.values || [])];
        } else if (key === "diplomat_certificate") {
          query +=
            " id in (select user_id from diplomat_certificate where type = ?)";
          values.push(value.values);
        } else if (key === "competency") {
          query +=
            " id in  (select user_id from competent_of where competence_id = ?)";
          values.push(value.values);
        } else if (key === "profession" && req.body?.table === "users") {
          query +=
            " id in (select user_id from company_details where profession like ?)";
          values.push(value.values);
          console.log("values:>" + value.values);
        } else if (key === "currency" && req.body?.table === "users") {
          query +=
            " id in (select user_id from company_details where currency = ?)";
          values.push(value.values);
          console.log("currency:>" + value.values);
        } else if (key === "hourly_rate") {
          //query+= " id in (select user_id from company_details where hourly_rate is not NULL and hourly_rate_inclusive is not NULL and ( hourly_rate <= ? or hourly_rate_inclusive <= ?))";
          query +=
            " id in (select user_id from company_details where hourly_rate  > 0 and hourly_rate <= ?  )";
          values.push(parseInt(value.values));
          //values.push(parseInt(value.values))
          console.log(value.values);
        } else {
          query += " " + key + " " + value.operation + "  ? ";
          values.push(value.values);
        }
        query += " and ";
      }
    }
    // add () when having multiple conditions and in working hours exactely
    query = query.replace(
      "working_hours like ? or   working_hours like ?",
      "(working_hours like ? or   working_hours like ?)"
    );
    //grouping pay type conditions
    query = query.replace(
      "pay_type like ? or   pay_type like ?",
      "(pay_type like ? or   pay_type like ?)"
    );

    //grouping job duration conditions
    query = query.replace("job_duration like ?", "(job_duration like ?");
    query = query.replace(
      "job_duration like ?  and",
      "job_duration like ?)  and"
    );
    if (req.body.table !== "users") {
      query += " status != ?";
      values.push("Paused");
    }
    if (query.endsWith("where")) {
      query = query.replace("where", " order by id desc");
    } else {
      query = query.replace(/ and $/g, "");
      query = query.replace(/or $/g, "");
      query += " order by id desc";
    }
    console.log(query);
    db.query(query, values, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      if (result.length > 0) {
        db.query(
          "select * from company_details where user_id in (?)",
          [result.map((item) => item.id)],
          (err, result_comp_details) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            result.push(result_comp_details);
            res.status(200).send(result);
          }
        );
      } else {
        res.status(200).send(result);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//like user / assignement
router.post("/like", verify, async (req, res) => {
  try {
    let table = "liked_" + req.body.table;
    let query = "insert into " + table + " values(null,?,?)";
    db.query(query, [req.body.id, req.user.id], (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send(req.body.table + " liked successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//remove like
router.delete("/remove-like", verify, async (req, res) => {
  try {
    let table = "liked_" + req.query.table;
    let query =
      "delete from  " +
      table +
      " where " +
      req.query.table.replace(/s$/g, "") +
      "_id = ?";
    db.query(query, [req.query.id], (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send(req.body.table + " like deleted successfully! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get liked
router.get("/get-liked", verify, async (req, res) => {
  try {
    console.log(req.query.table);
    console.log("helo");
    let table = req.query.table;
    let join_table =
      req.query.table === "freelancers" ? "users" : "assignements";
    let column_id =
      req.query.table === "freelancers" ? "freelancer_id" : "assignement_id";
    //let query = "select  * "+ (join_table==="users"?",'' as password":"") +" from liked_"+table+","+join_table+" where liked_"+table+"."+column_id+" = "+join_table+".id"+" and "+join_table+".id in (select "+column_id+" from liked_"+table+" where  user_id = ?) and liked_"+table+".id in (select id from liked_"+table+" where user_id = ?)";
    let query =
      "select  * " +
      (join_table === "users" ? ",'' as password" : "") +
      " from liked_" +
      table +
      "," +
      join_table +
      " where " +
      join_table +
      ".id" +
      " = " +
      "liked_" +
      table +
      "." +
      column_id +
      " and " +
      "liked_" +
      table +
      "." +
      column_id +
      " in (select " +
      column_id +
      " from liked_" +
      table +
      " where  user_id = ?) ";
    console.log(query);
    db.query(query, [req.user?.id, req.user?.id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      console.log(result);
      res.status(200).send(result);
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//delete all invitations
router.delete(
  "/delete-all-invitations-freelancer",
  verify,
  async (req, res) => {
    try {
      db.query(
        "delete from invite_freelancer where user_id = ?",
        req.user.id,
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          res.status(200).send("invitations deleted successfully! ");
        }
      );
    } catch (err) {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
    }
  }
);
//apply for assignement
router.post("/apply", verify, async (req, res) => {
  try {
    let query = "insert into apply values(null,?,?,?,?,?);";
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    let values = [
      req.body.id,
      req.user.id,
      req.body.phone_no,
      req.body.motivation,
      date + "-" + month + "-" + year,
    ];
    let assignement_name = "",
      user_email = "",
      user_password = "",
      user_name = "";
    db.query(query, values, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
    });
     db.query(
      "select job_name from assignements where id = ?",
      req.body.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        assignement_name = result[0]?.job_name;
      }
    );
    //selecting freelancer's data
    db.query("select * from users where id = ?", req.user.id, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      db.query(
        "select * from company_details where user_id = ?",
        req.user.id,
        (err, result_comp_details) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          console.log(result);
          user_email = result[0]?.email;
          const bytes = CryptoJs.AES.decrypt(
            result[0].password,
            process.env.SECRET_KEY
          );
          user_password = bytes.toString(CryptoJs.enc.Utf8);
          console.log(user_password);
          user_name = result[0]?.user_name;

          //selecting client's data
          db.query(
            "select * from users where id in (select user_id from assignements where id = ?)",
            req.body.id,
            (err, client_result) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
              db.query(
                "select * from company_details where user_id = ?",
                client_result[0]?.id,
                (err, client_company_details) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                  //pulling client's password
                  let client_password = client_result[0]?.email;
                  const bytes = CryptoJs.AES.decrypt(
                    client_result[0].password,
                    process.env.SECRET_KEY
                  );
                  client_password = bytes.toString(CryptoJs.enc.Utf8);

                  //generating and sending emails
                  //html email for company, sending user info
                  let html = `
                            <h1>
                                Application to ${assignement_name}
                            </h1>
                            <div>
                                <h3>
                                    <a href="https://www.curant24.nl/dashboard/view-assignement?id=${
                                      req.body.id
                                    } target="_blank">
                                        Link to assignment
                                    </a>
                                </h3>
                            </div>
                            <table>
                                <tr>
                                    <td>
                                        <div>
                                            <h2>
                                                <storng>
                                                   Freelancer data
                                                </strong>
                                            </h2>
                                        </div>
                                        <br/>
                                        <div>
                                            <h3>
                                                Full name : ${
                                                  result[0]?.first_name +
                                                  " " +
                                                  result[0]?.last_name
                                                }
                                            </h3>
                                            <h3>
                                                Company name : ${
                                                  result_comp_details[0]
                                                    ?.company_name ||
                                                  "not added!"
                                                }
                                            </h3>
                                            <h3>
                                                User Email: ${user_email}
                                            </h3>
                                            <h3>
                                                User Login: ${user_password} 
                                            </h3>
                                        </div>
                                        <br/>
                                        <br/>
                                        <div>
                                            <h3>
                                            Phone number : ${req.body.phone_no}
                                            </h3>
                                            <h3>
                                                Email: ${user_email}
                                            </h3>
                                        </div>
                                    </td>
                                    <td>
                                        <br/>
                                    </td>
                                    <td>
                                        <div>
                                            <h2>
                                                <storng>
                                                    Client data
                                                </strong>
                                            </h2>
                                        </div>
                                        <br/>
                                        <div>
                                            <h3>
                                                Full name : ${
                                                  client_result[0]?.first_name +
                                                  " " +
                                                  client_result[0]?.last_name
                                                }
                                            </h3>
                                            <h3>
                                                Company name : ${
                                                  client_company_details[0]
                                                    ?.company_name ||
                                                  "not added!"
                                                }
                                            </h3>
                                            <h3>
                                                User Email: ${
                                                  client_result[0]?.email
                                                }
                                            </h3>
                                            <h3>
                                                User Login: ${client_password} 
                                            </h3>
                                        </div>
                                        <br/>
                                        <br/>
                                        <div>
                                            <h3>
                                            Phone number : ${
                                              client_result[0]?.phone_no
                                            }
                                            </h3>
                                            <h3>
                                                Email: ${
                                                  client_result[0]?.email
                                                }
                                            </h3>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div>
                                <h3>
                                    Freelancer's motivation : ${
                                      req.body.motivation || "not added!"
                                    }
                                </h3>
                            </div>
                        `;
                  //html email for user (freelancer), we've received your application
                  let html2 = `
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
                                    display: grid;
                                    grid-template-columns: 1fr 1fr !important;
                                    padding: 5px 0;
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
                                    width: 350px;
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
                                    width:700px;
                                    border-radius: 4px;
                                    border: #ccc 1px solid;
                                }
                        
                                .wrapper, .content{
                                    align-items: center;
                                    justify-content: center;
                                }
                                .wrapper .title{
                                    width: 100%;
                                }
                                .wrapper .title img{
                                    width: 60px;
                                    height: 88px;
                                }
                        
                                .wrapper .content .content-information p{
                                    color: rgb(31, 119, 54);
                                }
                                button{
                                    background-color: rgb(31, 119, 54);
                                    color: white;
                                    border: rgb(31, 119, 54) 1px solid;
                                    transition: .3s ease-in-out;
                                    width: 120px;
                                    height: 40px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }
                                button:hover{
                                    background: white;
                                    color: rgb(31, 119, 54);
                                }
                                .wrapper .footer{
                                    width: 100%;
                                    background-color: darkblue;
                                    display:flex;
                                    align-items: start;
                                    padding-top: 10px;
                                    padding-bottom: 10px;
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
                            <title>Invitation</title>
                        </head>
                        <body>
                            <div style="width:100%;display:flex;justify-content:center !important;align-items:center !important;">
                                <div class="wrapper" style="background-color: #fff; ">
                                    <div class="title">
                                        <table>
                                            <tr>
                                                <td>
                                                    <img src="https://www.curant24.nl/images/logo.png" alt="" height="100px" width="90px">
                                                </td>
                                                <td style="vertical-align:baseline;display:flex;justify-content:center;padding-left:70%;padding-bottom:10%">
                                                    <div style="display:flex;align-items:center">
                                                        <td>
                                                            <td>
                                                                <a href="https://www.curant24.nl/dashboard" class="title-dashboard" style="color: #147536;text-decoration:none;" target="_blank">
                                                                    <img src="https://www.curant24.nl/images/profile.png" style="width:25px !important;height:25px !important" width="25px" height="25px" />
                                                                </a>
                                                            </td>
                                                            <td>
                                                                <a href="https://www.curant24.nl/dashboard" class="title-dashboard" style="color: #147536;text-decoration:none;" target="_blank">
                                                                    <p>
                                                                        My Curant24
                                                                    </p>
                                                                </a>
                                                            </td>
                                                        </td>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="title-welcome">
                                                        <h1 style="color: #147536;" >
                                                            Thank you. <br>
                                                            We have received your application.  
                                                        </h1>
                                                    </div>
                                                </td>
                                                <td style="display:flex;">
                                                    <img src="https://www.curant24.nl/images/like.png" width="60px" height="88px" style="width:60px;height:88px"  >
                                                </td>
                                                <td>
                                                    <img src="https://www.curant24.nl/images/handHoldingPhone.png" width="60px" height="88px"   alt="">
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="content"style="width:100%" >
                                        <div class="content-information" style="width: 100%;">
                                            <div style="background-color: white;padding: 10px 10px;margin-top: 30px;">
                                                <p>
                                                    Hi ${user_name},
                                                </p>
                                                <p>
                                                    Your application has arrived! We're glad you applied,<br>
                                                    we'll get back to you as soon as possible.
                                                </p>
                                                <p>
                                                    You can keep up to date with your application via  your <a href="https://www.curant24.nl/dashboard" target="_blank">My Curant24</a>
                                                </p>
                                                <p>
                                                    Do you want to increase your chances of a assignment? We have even more assignments for you!
                                                </p>
                                                <p>
                                                    Sincerely.
                                                    <br>
                                                    Team Curant24.
                                                </p>
                                                <div style="display: flex; align-items: center;">
                                                    <a href="https://www.curant24.nl/search" target="_blank" style="text-decoration:none">
                                                        <button class="activate-account" style="margin-top: 15px;">
                                                            View all assignments
                                                        </button>
                                                    </a>
                                                    <a href="www.curant24.nl/login" target="_blank" style="margin-left: 10px;color: #147536;margin-top:10px">Login ></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="footer">
                                        <div class="left">
                                            <img src="https://www.curant24.nl/images/logo.png"  alt="">
                                            <div>
                                                <div>
                                                    <a href="https://www.curant24.nl/contact">contact</a>
                                                    <a href="https://www.curant24.nl">Privacy</a>
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
                            </div>
                        </body>
                        </html>
                        `;
                  //html email for client (autor of assignement), there's interest in your project
                  let html3 = `
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
                                    display: grid;
                                    grid-template-columns: 1fr 1fr !important;
                                    padding: 5px 0;
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
                                    width:700px;
                                    border-radius: 4px;
                                    border: #ccc 1px solid;
                                }
                        
                                .wrapper, .content{
                                    align-items: center;
                                    justify-content: center;
                                }
                                .wrapper .title{
                                    width: 100%;
                                }
                                .wrapper .title img{
                                    width: 60px;
                                    height: 88px;
                                }
                        
                                .wrapper .content .content-information p{
                                    color: rgb(31, 119, 54);
                                }
                                button{
                                    background-color: rgb(31, 119, 54);
                                    color: white;
                                    border: rgb(31, 119, 54) 1px solid;
                                    transition: .3s ease-in-out;
                                    width: 120px;
                                    height: 40px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }
                                button:hover{
                                    background: white;
                                    color: rgb(31, 119, 54);
                                    }
                                .wrapper .footer{
                                    width: 100%;
                                    background-color: darkblue;
                                    display: flex;
                                    align-items: start;
                                    padding-top: 10px;
                                    padding-bottom: 10px;
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
                            <title>interest in assignment</title>
                        </head>
                        <body style="width:100%;display:flex;justify-content:center">
                            <div class="wrapper" style="background-color: #ccc; ">
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
                                                        Good news. There is interest in your assignment!
                                                    </h1>
                                                </div>
                                            </td>
                                            <td>
                                                <img src="https://www.curant24.nl/images/new_assignement.png"/ style="width:160px !important;height:130px !important">
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="content" >
                                    <div class="content-information">
                                        <div style="background-color: white;padding: 10px 30px;">
                                            <p>
                                                To KPN (Willem de Vries),
                                            </p>
                                            <p>
                                                One or more freelancers have shown interest in the assignment below.
                                            </p>
                                            <p>
                                                Take a quick look at the interested freelancers by pressing the button below.
                                            </p>
                                        </div>
                                        <div class="content-info-additional" style="padding: 0 5%;">
                                            <h1 style="font-family: Arial, Helvetica, sans-serif;">
                                                Municipality of The Hague OCW
                                            </h1>
                                            <div style="border-radius: 4px ;background-color: white; padding: 10px;font-weight: 300;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;margin-bottom: 10px;">
                                                <h2 style="color: rgb(36, 165, 207);">
                                                    Administrative assistance Youth Aid
                                                </h2>
                                                <div>
                                                    <div style="display: flex;align-items: center;margin-bottom: 10px;">
                                                        <img src="https://www.curant24.nl/images/location.png" style="height:30px;width:30px"/>
                                                        <span style="display: flex;justify-content: flex-start;">
                                                            The Hague
                                                        </span>
                                                    </div>
                                                    <div style="display: flex;align-items: baseline;">
                                                        <img src="https://www.curant24.nl/images/briefcase.png"  style="height:30px;width:30px"/>
                                                        <span style="display: flex;justify-content: flex-start;">
                                                            Always wanted to contribute to the well-being of the youth of The hague? Are you good at working independantly? And are you used to working with privacy-sensitive data?
                                                        </span>
                                                        <br>
                                                        <span style="display: flex;justify-content: flex-start;">
                                                            Then become an Administrative Assistant youth aid for the municipality of The Hague
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style="display: flex;">
                                                    <button class="activate-account" style="margin-top: 15px;margin-right: 10px;">
                                                        View Assignment
                                                    </button>
                                                    <button class="activate-account" style="margin-top: 15px;">
                                                        View interested freelancers
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="background-color: rgb(243, 68, 68);display: flex;width:100% ;min-height: 150px; padding-bottom: 10px;">
                                        <div style="display: flex; align-items: center; justify-content: center;">
                                            <img src="https://www.curant24.nl/images/binoculars.png" alt="" style="width:80%">
                                        </div>
                                        <div style="color: white;">
                                            <h3>
                                                Start looking for a suitable freelancer! 
                                            </h3>
                                            <button class="activate-account" style="margin-top: 15px;">
                                                Looking for freelancers
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="footer">
                                    <div class="left">
                                        <img src="https://www.curant24.nl/images/logo.png" alt="">
                                        <div>
                                            <div>
                                                <a href="https://www.curant24.nl/contact">contact</a>
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
                  //oussamaboujnan5@gmail.com
                  sendEmail(
                    "applicants@curant24.com",
                    "application to " + assignement_name,
                    html
                  );
                  sendEmail(
                    user_email,
                    "We've received your application ! ",
                    html2
                  );
                  sendEmail(
                    client_result[0]?.email,
                    "Someone has applied for your assignment!",
                    html3
                  );
                  res.status(200).send("apply added successfully");
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
    return;
  }
});

//select latest application to assignement
router.get("/latest-motivation", verify, async (req, res) => {
  try {
    db.query(
      "select apply.motivation,assignements.job_name  from apply,assignements where apply.assignement_id = assignements.id and apply.user_id  = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get applications for applications
router.get("/get-applications", verify, async (req, res) => {
  try {
    db.query(
      "select apply.*,apply.id as application_id,assignements.*,client_orga.orga_name from apply,client_orga,assignements where assignements.id in (select assignement_id from apply where user_id= ?) and client_orga.user_id in ( select user_id from assignements where id in (select assignement_id from apply where user_id  = ?));",
      [req.user.id, req.user.id],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//delete application
router.delete("/delete-applications", verify, async (req, res) => {
  console.log(req.query);
  try {
    db.query("delete from apply where id = ?", req.query.id, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("Application deleted successfully ! ");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//send invitation
router.post("/invite-freelancer", verify, async (req, res) => {
  try {
    let client_name,
      client_email,
      client_password,
      freelancer_name,
      freelancer_email,
      freelancer_password;
    db.query(
      "insert ignore into invite_freelancer values(null,?,?,?,?);",
      [
        req.body.freelancer_id,
        req.user.id,
        req.body.assignement_id,
        req.body.message,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        //collecting freelancer's id and client's id to send by email.
        db.query(
          "select user_name,email,password from users where id = ?",
          req.user.id,
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            console.log(result);
            client_email = result[0]?.email;
            client_name = result[0]?.user_name;
            const bytes = CryptoJs.AES.decrypt(
              result[0].password,
              process.env.SECRET_KEY
            );
            client_password = bytes.toString(CryptoJs.enc.Utf8);
            db.query(
              "select user_name,email,password from users where id = ?",
              req.body.freelancer_id,
              (err, result) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                console.log(result);
                freelancer_email = result[0]?.email;
                freelancer_name = result[0]?.user_name;
                const bytes = CryptoJs.AES.decrypt(
                  result[0].password,
                  process.env.SECRET_KEY
                );
                freelancer_password = bytes.toString(CryptoJs.enc.Utf8);
                let html = `
                        <h1>
                            Invition from ${client_name} to ${freelancer_name}
                        </h1>
                        <div>
                            <h3>
                                <a href="https://www.curant24.nl/dashboard/view-assignement?id=${req.body.assignement_id} target="_blank">
                                    Link to assignement
                                </a>
                            </h3>
                        </div>
                        <div>
                            <h3>
                                Client Name : ${client_name}
                            </h3>
                        </div>
                        <div>
                            <h3>
                                Cliend login info : ${client_email} , ${client_password}
                            </h3>
                        </div>
                        <div>
                            <h3>
                                Freelancer Name : ${freelancer_email}
                            </h3>
                        </div>
                        <div>
                            <h3>
                                Freelancer login info : ${freelancer_email} , ${freelancer_password}
                            </h3>
                        </div>
                    `;
                sendEmail(
                  "invitations@curant24.com",
                  "invitation to " + freelancer_name,
                  html
                );
                res.status(200).send("freelancer invited successfully");
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get invited freelancers
router.get("/get-invited-freelancers", verify, async (req, res) => {
  try {
    db.query(
      "select * from users where id in (select freelancer_id from invite_freelancer where user_id = ?)",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        console.log(result);
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add assignement alert
router.post("/add-assignement-alert", verify, async (req, res) => {
  try {
    db.query(
      "insert into assignement_alert values (null,?,?,?,?,?,?,?,?)",
      [
        req.body.section,
        req.body.profession,
        req.body.keyword,
        req.body.location,
        req.body.distance,
        req.body.receive_email,
        req.body.alert_duration,
        req.user.id,
      ],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("assignement alert added successfully! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get assignement alerts
router.get("/get-assignement-alerts", verify, async (req, res) => {
  try {
    //select  * from assignement_alert,assignement_found_alerts where assignement_found_alerts.assignement_alert_id = assignement_alert.id and assignement_alert.id in (select id from assignement_alert where user_id = ?)  and assignement_alert.user_id = ?
    db.query(
      "select *,count(assignement_found_alerts.assignement_alert_id) as found_assignements from assignement_found_alerts,assignement_alert where assignement_found_alerts.assignement_alert_id = assignement_alert.id and assignement_alert.id in (select id from assignement_alert where user_id = ?);",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        //console.log(result)
        db.query(
          "select * from assignement_alert where user_id = ?",
          req.user.id,
          (err, result2) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            res.status(200).send([...result, ...result2]);
          }
        );
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//delete assignement alert
router.delete("/delete-assignement-alert", verify, async (req, res) => {
  try {
    db.query(
      "delete from assignement_alert where id = ?",
      req.query.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("Assignement alert deleted successfully! ");
      }
    );
  } catch (error) {}
});

//login for management system
router.post("/management", verify, async (req, res) => {
  try {
    if (req.body.key === process.env.MANAGEMENT_SYSTEM_KEY) {
      res.status(200).send({ admin: true });
    } else {
      res.status(401).send("Wrong password! ");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//add invoices
router.post("/add-invoice", verify, async (req, res) => {
  try {
    req.body = JSON.parse(req.body.info);
    console.log(req.body);
    if (req.body.id) {
      //modify invoice
      let query = "update invoices set ",
        values = [];
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== "id") {
          query += key + " = ? , ";
          values.push(value);
        }
      }
      query = query.replace(/,\s+$/g, "") + " where user_id = ?";
      values.push(req.user.id);
      db.query(query, values, (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
      });
      if (req.files) {
        let complete_invoice;
        let signed_timesheet;
        if (req.files?.signed_timesheet && req.files?.signed_timesheet[0]) {
          req.files.signed_timesheet?.map((item) => {
            signed_timesheet = upload_file(
              item,
              "documents",
              ["pdf", "jpg", "jpeg", "png"],
              "invoice"
            );
            if (signed_timesheet.data?.path) {
              db.query(
                "insert into invoice_signed_timesheet values(null,?,?)",
                [signed_timesheet.data?.path, req.body?.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            }
          });
        } else {
          signed_timesheet = upload_file(
            req.files?.signed_timesheet,
            "documents",
            ["pdf", "jpg", "jpeg", "png"],
            "invoice"
          );
          if (signed_timesheet.data?.path) {
            db.query(
              "insert into invoice_signed_timesheet values(null,?,?)",
              [signed_timesheet.data?.path, req.body?.id],
              (err) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
              }
            );
          }
        }
        if (req.files?.complete_invoice && req.files?.complete_invoice[0]) {
          req.files.complete_invoice?.map((item) => {
            complete_invoice = upload_file(
              item,
              "documents",
              ["pdf", "jpg", "jpeg", "png"],
              "invoice"
            );
            if (complete_invoice.data?.path) {
              db.query(
                "insert into invoice_complete_invoice values(null,?,?)",
                [complete_invoice.data?.path, req.body?.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            }
          });
        } else {
          complete_invoice = upload_file(
            req.files.complete_invoice,
            "documents",
            ["pdf", "jpg", "jpeg", "png"],
            "invoice"
          );
          console.log(req.files);
          console.log(complete_invoice, req.body.id);
          if (complete_invoice.data?.path) {
            db.query(
              "insert into invoice_complete_invoice values(null,?,?)",
              [complete_invoice.data?.path, req.body?.id],
              (err) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
              }
            );
          }
        }
      }
    } else {
      db.query(
        "insert into invoices values(null,?,?,?,?,?)",
        [
          req.body.company_name,
          req.body.invoice_amount,
          req.body.week,
          req.body.status,
          req.user.id,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
        }
      );
      if (req.files) {
        let complete_invoice;
        let signed_timesheet;
        db.query("select id from invoices order by id desc", (err, id) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          req.body.id = id[0]?.id;
          if (req.files?.signed_timesheet && req.files?.signed_timesheet[0]) {
            req.files.signed_timesheet?.map((item) => {
              signed_timesheet = upload_file(
                item,
                "documents",
                ["pdf", "jpg", "jpeg", "png"],
                "invoice"
              );
              console.log(signed_timesheet);
              if (signed_timesheet.data?.path) {
                db.query(
                  "insert into invoice_signed_timesheet values(null,?,?)",
                  [signed_timesheet.data?.path, req.body?.id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                  }
                );
              }
            });
          } else {
            signed_timesheet = upload_file(
              req.files?.signed_timesheet,
              "documents",
              ["pdf", "jpg", "jpeg", "png"],
              "invoice"
            );
            if (signed_timesheet.data?.path) {
              db.query(
                "insert into invoice_signed_timesheet values(null,?,?)",
                [signed_timesheet.data?.path, req.body?.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            }
          }
          if (req.files?.complete_invoice && req.files?.complete_invoice[0]) {
            req.files.complete_invoice?.map((item) => {
              complete_invoice = upload_file(
                item,
                "documents",
                ["pdf", "jpg", "jpeg", "png"],
                "invoice"
              );
              console.log(complete_invoice);
              if (complete_invoice.data?.path) {
                db.query(
                  "insert into invoice_complete_invoice values(null,?,?)",
                  [complete_invoice.data?.path, req.body?.id],
                  (err) => {
                    if (err) {
                      console.log(err);
                      res.status(500).send(err);
                      return;
                    }
                  }
                );
              }
            });
          } else {
            complete_invoice = upload_file(
              req.files.complete_invoice,
              "documents",
              ["pdf", "jpg", "jpeg", "png"],
              "invoice"
            );
            console.log(complete_invoice);
            if (complete_invoice.data?.path) {
              db.query(
                "insert into invoice_complete_invoice values(null,?,?)",
                [complete_invoice.data?.path, req.body?.id],
                (err) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send(err);
                    return;
                  }
                }
              );
            }
          }
        });
      }
    }
    res.status(200).send("invoice added successfully! ");
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
    return;
  }
});

// delete invoice files

router.delete("/delete-invoice-files", verify, async (req, res) => {
  try {
    let query = "select path from " + req.query.name + " where id = ?";
    db.query(query, [req.query.id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      console.log(__dirname);
      unlink(
        __dirname.replace("/server/routes", "/client/public") +
          result[0]?.path || "",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
      query = "delete from " + req.query.name + " where id = ?";
      db.query(query, [req.query.id], (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
      });
    });
    res.status(200).send("invoice file deleted successfully! ");
  } catch (error) {
    res.status(500).send(error);
  }
});

//get invoices overview
router.get("/invoices", verify, async (req, res) => {
  try {
    db.query(
      "select invoices.* from invoices where  invoices.id in (select id from invoices where user_id  = ?) ",
      [req.user.id],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        db.query(
          "select invoice_signed_timesheet.id as invoice_signed_timesheet_id , invoice_signed_timesheet.path as invoice_signed_timesheet_path,invoice_signed_timesheet.invoice_id as invoice_signed_timesheet_invoice_id from invoice_signed_timesheet where invoice_id in (select id from invoices where user_id  = ?)",
          req.user.id,
          (err, invoice_signed_timesheet) => {
            if (err) {
              console.log(err);
              res.status(500).send(err);
              return;
            }
            db.query(
              "select invoice_complete_invoice.path as invoice_complete_invoice_path , invoice_complete_invoice.id as invoice_complete_invoice_id,invoice_complete_invoice.invoice_id as invoice_complete_invoice_invoice_id from invoice_complete_invoice where invoice_id in (select id from invoices where user_id = ?)",
              req.user.id,
              (err, invoice_complete_invoice) => {
                if (err) {
                  console.log(err);
                  res.status(500).send(err);
                  return;
                }
                res
                  .status(200)
                  .send([
                    result,
                    invoice_signed_timesheet,
                    invoice_complete_invoice,
                  ]);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//get reserve service
router.delete("/delete-invoice", verify, async (req, res) => {
  try {
    db.query("delete from invoices where id = ?", req.query.id, (err) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      res.status(200).send("invoice deleted successfully");
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add favorite user
router.post("/add-favorite", verify, async (req, res) => {
  try {
    db.query(
      "insert into favorite_freelancers values (null,?,?)",
      [req.body.id, req.user.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
      }
    );
    res.status(200).send("Professional added successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get favorite professionals users
router.get("/get-favorite", verify, async (req, res) => {
  try {
    db.query(
      "select *,''as password from users where id in (select favorite_freelancer_id from favorite_freelancers where user_id  = ?)",
      [req.user.id],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//remove favorite users
router.post("/remove-favorite", verify, async (req, res) => {
  try {
    db.query(
      "delete from favorite_freelancers where favorite_freelancer_id = ?",
      [req.body.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("Professional deleted successully!");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add reserve service  and update if found a record already
router.post("/add-reserve-service", verify, async (req, res) => {
  try {
    console.log("add-reserve-service: ");
    db.query(
      "select * from reserve_service where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        console.log("result of db");
        console.log(result);
        console.log("body: ");
        console.log(req.body);
        if (result[0]) {
          let query = "update reserve_service set";
          let values = [];
          for (const [key, value] of Object.entries(req.body)) {
            if ((value >= 0 || value.length > 0) && key !== "user_id") {
              query += " " + key + " = ? ,";
              values.push(value);
            }
          }
          query = query.replace(/,\s*$/, "") + " where user_id = ? ";
          values.push(req.user.id);
          console.log(values, query);

          if (values.length > 1) {
            db.query(query, values, (err) => {
              if (err) {
                console.log(err);
                //res.status(500).send(err);
                throw err;
              }
            });
          }
        } else {
          db.query(
            "insert into reserve_service values(null,?,?,?,?,?,?)",
            [
              req.body.description,
              req.body.project_name,
              req.body.status,
              req.user.id,
              req.body.web_link,
              req.body.sub,
            ],
            (err) => {
              if (err) {
                console.log(err);
                //res.status(500).send(err);
                throw err;
              }
            }
          );
        }
        res
          .status(200)
          .send("You Signed up for reserve service successfully! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//get reserve service
router.get("/get-reserve-service", verify, async (req, res) => {
  try {
    db.query(
      "select * from reserve_service where user_id = ?",
      req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//update reserve service
/*router.post("/set-reserve-service",verify,async (req,res)=>{
    try {
        db.query("update reserve_service set description = ?,project_name = ?, status = ? where user_id = ?",[req.body.description,req.body.project_name,req.body.status,req.user.id],(err)=>{
            if(err){
                console.log(err)
                res.status(500).send(err);
                return;
            }
            res.status(200).send("You Signed up for reserve service successfully! ");
        })
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
 */
//remove reserve service
router.delete("/remove-reserve-service", verify, async (req, res) => {
  try {
    db.query(
      "delete from reserve_service where user_id  = ?",
      req.user.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res
          .status(200)
          .send("You Unsubscribed from reserve service with success.");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//reset password email
router.post("/verify-email", async (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  //key to be inserted on database when reseting password it will be verified
  let key = generatePassword();
  console.log(req.body);
  let msg = {
    to: req.body.email,
    from: "no-reply@curant24.com",
    subject: "Verify email",
    html:
      "<!DOCTYPE html>" +
      '  <html lang="en">' +
      "  <head>" +
      '      <meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '      <meta name="theme-color" content="#000000" />' +
      "      <style>" +
      "          body{" +
      "             color:black !important;" +
      "          }" +
      "          body td{" +
      "              margin:auto;" +
      "          }" +
      "          body .wrapper{" +
      "            width:700px;" +
      "        " +
      "              border-radius: 4px;" +
      "              border: #ccc 1px solid;" +
      "              display:flex;" +
      "              flex-direction:column !important;" +
      "              color:black;" +
      "          }" +
      "  " +
      "          .wrapper, .content{" +
      "              display: flex;" +
      "              flex-direction: column;" +
      "              align-items: center;" +
      "              justify-content: center;" +
      "          }" +
      "          .wrapper .title{" +
      "              width: 100%;" +
      "              background-color: #147536;" +
      "              margin-bottom: 30px;" +
      "          }" +
      "          .wrapper .title td{" +
      "              padding:25px;" +
      "          }" +
      "          .wrapper .title img{" +
      "              width: 60px;" +
      "              height: 88px;" +
      "          }" +
      "          .wrapper .content .title h2{" +
      "              font-weight: 900;" +
      "          }" +
      "          .wrapper .content .title p{" +
      "              font-weight: 500;" +
      "          }" +
      "          .wrapper .content .content-information{" +
      "              padding: 0 5%;" +
      "          }" +
      "          .wrapper .footer{" +
      "              width: 100%;" +
      "              background-color: #147536;" +
      "              display: flex;" +
      "              justify-content: space-between;" +
      "              align-items: center;" +
      "          }" +
      "          .wrapper .footer .left{" +
      "              display: flex;" +
      "              flex-direction: column;" +
      "              align-items: center;" +
      "              justify-content: center;" +
      "          }" +
      "          .wrapper .footer .left p{" +
      "              margin: 3px;" +
      "              color: white;" +
      "          }" +
      "      </style>" +
      "      <title>Welcome</title>" +
      "  </head>" +
      '  <body style="width:100%;display:flex;justify-content:center">' +
      '      <table class="wrapper" style="width:500px;width:500px;border-collapse:separate;">' +
      "        <tbody>" +
      '          <tr class="title">' +
      '              <td style="width:100vw">' +
      '                  <img src="https://www.curant24.nl/images/logo.png" alt="">' +
      "              </td>" +
      "          </tr>" +
      '          <tr class="content">' +
      '              <div class="content-title">' +
      "                  <h2>" +
      "                      Verify email" +
      "                  </h2>" +
      "              </div>" +
      '              <div class="content-information">' +
      "                  <p>" +
      "                      Hello " +
      "                  </p>" +
      "                  <p>" +
      "                      You have requested to verify your email on Curant24." +
      "                  </p>" +
      "                  <p>" +
      "                      Your verification code is : " +
      key +
      "" +
      "                  </p>" +
      "                  <p>" +
      "                      Sincerely," +
      "                  </p>" +
      "                  <p>" +
      "                      Team Curant24." +
      "                  </p>" +
      "              </div>" +
      "          </tr>" +
      '          <tr class="footer">' +
      "              <td>" +
      "                    <table>" +
      '                          <tr style="color:#fff;">' +
      "                              ® Curant24  2022 " +
      "                          </tr>" +
      '                          <tr style="color:#fff;">' +
      "                              Telephone : 020-7702280" +
      '                          </tr style="color:#fff;">' +
      '                          <tr style="color:#fff;">' +
      "                              Email: info@Curant24.nl" +
      "                          </tr>" +
      "                     </table>" +
      "                </td>" +
      '                <td align="right">' +
      "                    <table>" +
      '                        <img src="https://www.curant24.nl/images/facebook.png" alt=""/>' +
      '                        <img src="https://www.curant24.nl/images/linkedin.png" alt=""/>' +
      "                    </table>" +
      "                </td>" +
      "          </tr>" +
      "        </tbody>" +
      "      </table>" +
      "  </body>" +
      "  </html>",
  };
  db.query("insert into verification_email values(null,?);", [key], (err) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
      return;
    }
    sgMail
      .send(msg)
      .then((response) => {
        console.log(response[0].statusCode);
        console.log(response[0].headers);
        res.status(200).send("Verify email send successfully");
      })
      .catch((error) => {
        console.log("error");
        console.error(error, error.body);
        return;
      });
  });
});

router.post("/verify-email-code", async (req, res) => {
  try {
    db.query(
      "select code from verification_email where code = ?",
      req.body.code,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        if (result[0]) {
          db.query(
            "delete from verification_email where code = ?",
            req.body.code,
            (err) => {
              if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
              }
            }
          );
          res
            .status(200)
            .send({ valid: true, message: "Email verified successfully!" });
        } else {
          res
            .status(200)
            .send({ valid: false, message: "The code is uncorrect." });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.delete("/delete-file", verify, async (req, res) => {
  try {
    const info = req.query;
    console.log(info);

    if (
      !info.includes("profile-client") &&
      !info.includes("profile-freelancer")
    ) {
      unlink(info.path, (err) => {
        console.log(err);
        return;
      });
    }
    db.query(
      "update " +
        info.table +
        " set " +
        info.column +
        " = null where " +
        info.whereId +
        " = ?",
      info.id,
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("File deleted successfully");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//get diplomat types
router.get("/get-diplomat-types", verify, async (req, res) => {
  try {
    db.query("select type from diplomat_types", (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send(err);
        return;
      }
      db.query(
        "select type from user_added_diplomat_types where user_id = ? ",
        req.user.id,
        (err, result_user_added_types) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
          res
            .status(200)
            .send([
              ...result?.map((item) => item.type),
              ...result_user_added_types?.map((item) => item.type),
            ]);
        }
      );
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//add diplomat type
router.post("/add-diplomat-type", verify, async (req, res) => {
  try {
    console.log(req.body);
    db.query(
      "insert into user_added_diplomat_types values (null,?,?) ",
      [req.body.type, req.user.id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        res.status(200).send("diplomat type added successfully ! ");
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//send contact us email
router.post("/contact-us-email", async (req, res) => {
  try {
    req.body = JSON.parse(req.body.info);
    console.log(req.body);
    if (req.files) {
      let img;
      req.body.message += `
                <h3>
                    Documents joined to the email: 
                </h3>
            `;
      for (const [key, value] of Object.entries(req.files)) {
        img = upload_file(
          value,
          "documents",
          ["jpg", "jpeg", "png", "pdf", "docx"],
          "contact form"
        );
        req.body.message += `
                    <img src="https://curant24.nl/${img.data.path}" download="true" style="cursor:pointer" alt="download"/> <br/>
                `;
      }
    }
    console.log(req.body.message);
    sendEmail("info@curant24.com", "New Contact us email", req.body.message);
    res.status(200).send("contact us email sent successfully");
  } catch (error) {
    console.log(error);
    res.status(200).send(error);
  }
});

//get prefered lang
router.get("/get-lang", verify, async (req, res) => {
  try {
    req.body.assignement_id = req.query?.assignement_id;
    console.log(req.body.assignement_id, req.query);
    console.log(
      "select * from fav_lang where " +
        (req.body.assignement_id
          ? " assignement_id = ?"
          : "user_id = ?" + (req.query.user_id || req.user.id))
    );
    db.query(
      "select * from fav_lang where " +
        (req.body.assignement_id ? " assignement_id = ?" : "user_id = ?"),
      req.body.assignement_id || req.query.user_id || req.user.id,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
          return;
        }
        console.log(result);
        res.status(200).send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//set prefered lang
router.post("/set-lang", verify, async (req, res) => {
  try {
    console.log(
      "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<first>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
    );
    console.log(req.body);
    if (req.body.update) {
      db.query(
        "delete from fav_lang where " +
          (req.body.assignement_id ? " assignement_id " : " user_id ") +
          " = ?",
        req.body.assignement_id || req.user.id,
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
        }
      );
    }
    req.body?.data?.map((item) => {
      db.query(
        "insert into fav_lang values (null,?,?,?,?,?)",
        [
          item.lang,
          item.level,
          req.user.id,
          req.body.assignement_id || null,
          req.body.other_langs,
        ],
        (err) => {
          if (err) {
            console.log(err);
            res.status(500).send(err);
            return;
          }
        }
      );
    });
    res.status(200).send("languages set successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
module.exports = router;
