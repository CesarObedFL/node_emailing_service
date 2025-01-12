require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

const email = process.env.EMAIL;
const email_password = process.env.EMAIL_PASSWORD;


let transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: email,
        pass: email_password,
    }
});


app.use(express.json()); // for parsing application/json


app.post("/send-email", (req, res, next) => {
    const message = req.body.message;
    
    let mailOptions = {
        from: email,
        to: email,
        subject: 'Test Email from Node.js',
        text: message,
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.json({"email_sent" : 'error:' + error + '!'});
        }
        res.json({"email_sent" : 'successfully!' + info.response});
    });
    
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});

   