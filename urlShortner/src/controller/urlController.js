const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const validator = require("validator");
const redis = require("redis");
const { promisify } = require("util");


const isValidData = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

//=============== Connect to redis
const redisClient = redis.createClient(
  14458,
  "redis-14458.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("WjwKzngenEfQzzpvnqnge3gk8VhfmWzt", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//=============== Connection setup for redis

// const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


let createUrl = async function (req, res) {
  try {
    const data = req.body;

    if (Object.keys(data).length == 0) {
      return res.status(400).send({
        status: false,
        massage: "Add the URL...!! Which you wants to Short.",
      });
    }

    if (!isValidData(data.longUrl) || !validator.isURL(data.longUrl)) {
      return res.status(400).send({
        status: false,
        massage: `Hey....!Unable to shorten that link. It is not a valid url.`,
      });
    }

    if (!/^(http|https):/.test(data.longUrl)) {
      data.longUrl = "https://" + data.longUrl;
    }


    let alreadyCreated = await GET_ASYNC(`${data.longUrl}`);

    let createdCache = JSON.parse(alreadyCreated);

    // if short url is present in cache
    if (alreadyCreated) {
      return res
        .status(200)
        .send({ status: true, msg: "alredy from cache", data: createdCache });
    } else {
      
      let urlCheckInDB = await urlModel
        .findOne({ longUrl: data.longUrl })
        .select({ _id: 0, __v: 0 });

      if (urlCheckInDB) {
        await SETEX_ASYNC(`${data.longUrl}`, 600, JSON.stringify(sendData));

        return res
          .status(200)
          .send({ status: true, msg: "alredy from db", data: urlCheckInDB });
      }

      let urlCode = shortid.generate();

      const base = "http://localhost:3000";

      let shortUrl = base + "/" + urlCode;

      let alldata = {
        longUrl: data.longUrl,
        shortUrl: shortUrl,
        urlCode: urlCode,
      };

      let createInDb = await urlModel.create(alldata);

      const sendData = {
        longUrl: createInDb.longUrl,
        urlCode: createInDb.urlCode,
        shortUrl: createInDb.shortUrl,
      };
      //set in gind

      return res.status(201).send({ status: true, data: sendData });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

let getUrl = async function (req, res) {
  try {
    let urlCodee = req.params.urlCode;

    if (!/^[a-zA-Z0-9\-\_]{7,14}$/.test(urlCodee)) {
      return res.status(400).send({
        status: false,
        massage: `Oops....! ${urlCodee} This shortId is Not valid shortId.`,
      });
    }

    //get from cache memory
    let cacheUrlData = await GET_ASYNC(`${urlCodee}`);
    if (cacheUrlData) {
      return res.status(302).redirect(cacheUrlData);
    } else {
      
      let url = await urlModel
        .findOne({ urlCode: urlCodee })
        .select({ longUrl: 1, _id: 0 });
      if (!url) {
        return res.status(404).send({
          status: false,
          msg: `Oops....! This site can not  be reached. Check if there is a typeError in ${urlCodee}`,
        });
      }

      // set in cache
      await SETEX_ASYNC(`${urlCodee}`, 600, url.longUrl);

      return res.status(302).redirect(url.longUrl);
      // return res.status(302).send({msg:"from db", data:url.longUrl})
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;
