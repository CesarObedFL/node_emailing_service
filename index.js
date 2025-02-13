require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const { GoogleAuth } = require('google-auth-library');

const email = process.env.EMAIL;
const email_password = process.env.EMAIL_PASSWORD;

const port = (process.env.PORT || 3000);

// settings
app.set('port', port);

/**
  * Crea una evaluación para analizar el riesgo de una acción de la IU.
  *
  * project_id: El ID del proyecto de Google Cloud.
  * recaptcha_site_key: La clave reCAPTCHA asociada con el sitio o la aplicación
  * token: El token generado obtenido del cliente.
  * recaptchaAction: El nombre de la acción que corresponde al token.
*/

async function createAssessment({
    // Reemplaza el token y las variables de acción de reCAPTCHA antes de ejecutar la muestra.
    project_id = process.env.PROJECT_ID,
    recaptcha_key = process.env.RECAPTCHA_KEY,
    token = "action-token",
    recaptchaAction = "send_email_form",
}) {

    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/recaptchaenterprise'],
    });

    const auth_client = await auth.getClient();

    // Crea el cliente de reCAPTCHA.
    // TODO: almacena en caché el código de generación de clientes (recomendado) o llama a client.close() antes de salir del método.
    const client = new RecaptchaEnterpriseServiceClient({auth: auth_client});
    const projectPath = client.projectPath(project_id);

    // Crea la solicitud de evaluación.
    const request = ({
        assessment: {
            event: {
                token: token,
                siteKey: recaptcha_key,
            },
        },
        parent: projectPath,
    });

    const [response] = await client.createAssessment(request);

    // Verifica si el token es válido.
    if (!response.tokenProperties.valid) {
        console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
        return null;
    }

    // Verifica si se ejecutó la acción esperada.
    // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
    if (response.tokenProperties.action === recaptchaAction) {
        // Obtén la puntuación de riesgo y los motivos.
        // Para obtener más información sobre cómo interpretar la evaluación, consulta:
        // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
        console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
        response.riskAnalysis.reasons.forEach((reason) => {
            console.log(reason);
        });

        return response.riskAnalysis.score;
    } else {
        console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
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
    const token = req.body;

    const score = await createAssessment({
        token,
        // ... otros parámetros
    });

    if (score && score >= 0.5) {

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
            }
            res.json({ "success": 'email received successfully!' });
        });

    } else {
        res.status(400).json({ error: 'invalid reCaptcha!...' });
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

