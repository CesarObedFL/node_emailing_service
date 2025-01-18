require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

const email = process.env.EMAIL;
const email_password = process.env.EMAIL_PASSWORD;

const port = (process.env.PORT || 3000);

// settings
app.set('port', port);


let transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: email,
        pass: email_password,
    }
});


app.use(express.json()); // for parsing application/json
app.use(cors({ origin: process.env.URL })); 

app.post("/send-email", (req, res, next) => {

    console.log('message received!...');

    const client_full_name = req.body.full_name;
    const client_email = req.body.email;
    const client_subject = req.body.subject;
    const client_message = req.body.message;

    const body_message = "Client: " + client_full_name + "  Email: " + client_email + "  Message: " + client_message;
    
    let mailOptions = {
        from: email,
        to: email,
        subject: 'Emailing from cesarobedfl.pro: ' + client_subject,
        text: body_message,
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.json({"error" : 'error:' + error + '!'});
        }
        res.json({"success" : 'email received successfully!'});
    });
    
});


app.listen(app.get('port'), () => {
    console.log(`running in port ${app.get('port')}`);
});

   