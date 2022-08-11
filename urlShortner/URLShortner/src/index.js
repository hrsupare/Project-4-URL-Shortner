const express = require("express");
const bodyParser = express.json();
const mongoose = require("mongoose");
const router = express.Router();
const app = express();
const route = require("./route/route");

app.use(bodyParser);

mongoose
  .connect(
    "mongodb+srv://hsupare:2kZE1zdHBT5kzVVm@cluster0.5drhi.mongodb.net/himanshu-DB",
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDb is connected"))
  .catch((err) => console.log(err));

router.all("/*", function (req, res) {
  res.status(404).send({
    status: false,
    msg: "The api you request is not available",
  });
});

app.use("/", route);

app.listen(process.env.PORT || 3000, function () {
  console.log("Express is running on port " + (process.env.PORT || 3000));
});
