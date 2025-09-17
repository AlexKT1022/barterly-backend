import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.send("You are HERE");
}) 

app.listen(port, () => {
    console.log(`Running on Port ${port}`);
});
