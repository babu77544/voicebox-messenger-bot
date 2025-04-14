
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Webhook verification
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Incoming messages
app.post("/webhook", async (req, res) => {
    let body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderPsid = webhookEvent.sender.id;

            if (webhookEvent.message) {
                handleMessage(senderPsid, webhookEvent.message);
            }
        }
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

function handleMessage(senderPsid, receivedMessage) {
    if (receivedMessage.text || receivedMessage.attachments) {
        const isVoice = receivedMessage.attachments?.some(att => att.type === "audio");

        if (!isVoice) {
            sendMessage(senderPsid, {
                text: "Sorry! This group only allows voice messages. Please avoid sending text, images or videos."
            });
        }
    }
}

async function sendMessage(senderPsid, response) {
    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: senderPsid },
            message: response
        });
    } catch (err) {
        console.error("Error sending message: ", err.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
