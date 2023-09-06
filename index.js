const express = require("express");
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
const dotenv = require("dotenv") 
const auth = require("./routes/auth")
const user = require("./routes/user")
dotenv.config();
app.listen(8800, ()=>{
    console.log("Backend Server is running!");
})
app.use(express.json());

app.use("/api/auth",auth);
app.use("/api/user",user);
