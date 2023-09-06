
const sgMail = require('@sendgrid/mail');

const sendEmail = (target,subject,html)=>{
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    sgMail
    .send({
        to: target, 
        from: "no-reply@curant24.com", 
        subject: subject,
        html:html
      })
    .then((response) => {
      console.log(response[0].statusCode)
      console.log(response[0].headers)
    })
    .catch((error) => {
      console.error(error,error.body);
      return;
    })

}

module.exports = sendEmail;