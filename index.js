const { Datastore } = require("@google-cloud/datastore");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const datastore = new Datastore();
const date = new Date();

const authenticationURL = "https://wedding-planner-project-caalim.ue.r.appspot.com/staff";

app.get("/messages", async (req, res) => {
    const sender = req.query.sender;
    const receiver = req.query.receiver;
    if (sender !== undefined && receiver !== undefined) {
        const query = datastore.createQuery("Messages").filter("sender", "=", sender).filter("receiver", "=", receiver);
        const [data, metaInfo] = await datastore.runQuery(query);
        res.send(data);
    } else if (sender === undefined && receiver !== undefined) {
        const query = datastore.createQuery("Messages").filter("receiver", "=", receiver);
        const [data, metaInfo] = await datastore.runQuery(query);
        res.send(data);
    } else if (sender !== undefined && receiver === undefined) {
        const query = datastore.createQuery("Messages").filter("sender", "=", sender);
        const [data, metaInfo] = await datastore.runQuery(query);
        res.send(data);
    } else {
        const query = datastore.createQuery("Messages");
        const [data, metaInfo] = await datastore.runQuery(query);
        res.send(data);
    }
});

app.get("/messages/:mid", async (req, res) => {
    const key = datastore.key(["Messages", Number(req.params.mid)]);
    const response = await datastore.get(key);
    console.log("for MID", response);
    res.send(response);
});

app.post("/messages", async (req, res) => {
    try {
        const body = req.body;
        const senderResponse = await axios.get(`${authenticationURL}/${body.sender}/verify`);
        const receiverResponse = await axios.get(`${authenticationURL}/${body.sender}/verify`);
        const sender = senderResponse.data;
        const receiver = receiverResponse.data;
        console.log("sender", sender);
        console.log("receiver", receiver);
        if (sender === receiver) {
            const datastoreObject = {
                message: body.message,
                sender: body.sender,
                receiver: body.receiver,
                timestamp: date.toISOString,
            };
            const key = datastore.key("Messages");
            const response = await datastore.save({ key: key, data: datastoreObject });
            res.status(201);
            res.send("New Messages");
        }
    } catch (error) {
        res.status(404);
        res.send(error);
    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Wedding Planner Messaging APP started on PORT ${PORT}`);
});