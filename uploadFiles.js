const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
const app = express();


// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(morgan('dev'));



//upload function

const upload_file = (file,directory,type,field = "")=>{
    try {
        if(!file) {
            return(
            {
                status: false,
                message: 'No file uploaded'
            }
            );
        } else {
            if(file.mimetype.indexOf(file.mimetype.split("/")[1])!==-1){
                //file.name = new Date().getTime()+"."+file.mimetype.split("/")[1];
                let dirname = __dirname.replace("server","");
                //file.name = file.name.split(/.jpg|.png|.jpeg/gi)[0].replace(/[^\w]/gi,"")+file.name.split(/.jpg|.png|.jpeg/gi)[1];
                file.name = file.name.replace(/\s+/g,"");
                const path = dirname+'client/public/images/'+directory+'/' + file.name;
                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                file.mv(path);
    
                //upload success
                return{
                    status: true,
                    message: 'File is uploaded',
                    field,
                    data: {
                        name: file.name,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: path.replace(dirname+"client/public","")
                        //path: path.replace("../client/public","")
                    }
                };
            }else{
                return {
                    status:false,
                    message:"file type required is:  "+type.join(" , ")+"  and not:  "+file.mimetype.split("/")[1]
                }
            }
        }
    } catch (err) {
        //upload failed
        console.log(err)
        return {status:false,message:"an error has occured!"};
    }
}

module.exports =  upload_file;
