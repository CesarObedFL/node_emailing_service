const express = require('express');
const app = express();

app.use(express.json()); // for parsing application/json


app.post("/send-email", (req, res, next) => {
    const message = req.body.message;
    res.json({"receivedMessage": message});
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});

   