require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
//const { GoogleAuth } = require('google-auth-library');

const email = process.env.EMAIL;
const email_password = process.env.EMAIL_PASSWORD;

const port = (process.env.PORT || 3000);

// settings
app.set('port', port);

/**
* Create an assessment to analyze the risk of a UI action. Note that
* this example does set error boundaries and returns `null` for
* exceptions.
*
* projectID: Google Cloud project ID
* recaptchaKey: reCAPTCHA key obtained by registering a domain or an app to use the services of reCAPTCHA Enterprise.
* token: The token obtained from the client on passing the recaptchaKey.
* recaptchaAction: Action name corresponding to the token.
* userIpAddress: The IP address of the user sending a request to your backend is available in the HTTP request.
* userAgent: The user agent is included in the HTTP request in the request header.
* ja4: JA4 fingerprint associated with the request.
* ja3: JA3 fingerprint associated with the request.
*/
async function createAssessment({
    projectID = "your-project-id",
    recaptchaKey = "your-recaptcha-key",
    token = "action-token",
    recaptchaAction = "action-name",
    userIpAddress = "user-ip-address",
    userAgent = "user-agent",
    ja4 = "ja4",
    ja3 = "ja3"
}) {
    // Create the reCAPTCHA client & set the project path. There are multiple
    // ways to authenticate your client. For more information see:
    // https://cloud.google.com/docs/authentication
    // TODO: To avoid memory issues, move this client generation outside
    // of this example, and cache it (recommended) or call client.close()
    // before exiting this method.
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    // Build the assessment request.
    const request = ({
        assessment: {
            event: {
                token: token,
                siteKey: recaptchaKey,
                userIpAddress: userIpAddress,
                userAgent: userAgent,
                ja4: ja4,
                ja3: ja3,
            },
        },
        parent: projectPath,
    });

    // client.createAssessment() can return a Promise or take a Callback
    const [response] = await client.createAssessment(request);

    // Check if the token is valid.
    if (!response.tokenProperties.valid) {
        console.log("The CreateAssessment call failed because the token was: " +
            response.tokenProperties.invalidReason);

        return null;
    }

    // Check if the expected action was executed.
    // The `action` property is set by user client in the
    // grecaptcha.enterprise.execute() method.
    if (response.tokenProperties.action === recaptchaAction) {

        // Get the risk score and the reason(s).
        // For more information on interpreting the assessment,
        // see: https://cloud.google.com/recaptcha/docs/interpret-assessment
        console.log("The reCAPTCHA score is: " + response.riskAnalysis.score);

        response.riskAnalysis.reasons.forEach((reason) => {
            console.log(reason);
        });
        return response.riskAnalysis.score;
    } else {
        console.log("The action attribute in your reCAPTCHA tag " +
            "does not match the action you are expecting to score");
        return null;
    }
}

let transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: email,
        pass: email_password,
    }
});


app.use(express.json()); // for parsing application/json
app.use(cors({ origin: process.env.URL }));

app.post("/send-email", async (req, res, next) => {
    console.log('message received!...');

    const client_full_name = req.body.full_name;
    const client_email = req.body.email;
    const client_subject = req.body.subject;
    const client_message = req.body.message;
    const token = req.body.captcha_token; // Get the token from the request body

    console.log('token:' + token);

    const score = await createAssessment({
        projectID: process.env.PROJECT_ID,
        recaptchaKey: process.env.RECAPTCHA_KEY,
        token: token, // Pass the token to createAssessment
        recaptchaAction: "send_email_form",
        userIpAddress : "172.0.0.1",
        userAgent: "user-agent",
        ja4 : "ja4",
        ja3 : "ja3",
    });

    if (score && score >= 0.5) { // Adjust the threshold as needed
        const body_message = "Client: " + client_full_name + "  Email: " + client_email + "  Message: " + client_message;

        let mailOptions = {
            from: email,
            to: email,
            subject: 'Emailing from cesarobedfl.pro: ' + client_subject,
            text: body_message,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                res.json({ "error": 'error:' + error + '!' });
            } else {
                res.json({ "success": 'email received successfully!' });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid reCaptcha!...' });
    }
});

app.get("/config", (req, res, next) => {
    res.json({
        "port": app.get('port'),
        "sending email": email,
        "cors url": process.env.URL,
    });
});


app.listen(app.get('port'), () => {
    console.log(`running in port ${app.get('port')} and the cors url allowed is ${process.env.URL}`);
});

