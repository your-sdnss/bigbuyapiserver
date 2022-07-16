const axios = require('axios').default;
require('dotenv').config();
const token = process.env.API_TOKEN;
const fs = require("fs");
const cronJob = require('cron').CronJob;
const path = require("path");

const job = new cronJob('0 */1 * * * *', getOnce);

job.start();


const instance = axios.create({
    baseURL: 'https://api.bigbuy.eu/rest',
    headers: {'Authorization': 'Bearer ' + token}
});


function getOnce(){
    instance.get('/catalog/productsvariationsstock').then(response => {

        let { data } = response;

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace( /\s/gm , "").split(":")[0];

        let checkingArr = [];

        for(let id1 of data){
            let obj = {
                sku : "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

        console.log(checkingArr);

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(checkingArr), function(err) {
                if (err) throw err;
                console.log('complete');
            }
        );
    }).catch(function (error) {
        console.log(error);
    });
    instance.get('/catalog/productsstock').then(response => {

        let { data } = response;

        console.log(data);

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace( /\s/gm , "").split(":")[0];

        let checkingArr = [];


        for(let id1 of data){
            let obj = {
                sku : "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

        console.log(checkingArr);

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}.json`, JSON.stringify(checkingArr), function(err) {
                if (err) throw err;
                console.log('complete');
            }
        );
    }).catch(function (error) {
        console.log(error);
    });
}


function getData() {
    instance.get('/catalog/productsstock').then(response => {

        let {data} = response;

        console.log(data);

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace( /\s/gm , "").split(":")[0];

        let checkingArr = [];


        for (let id1 of data) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

        console.log(checkingArr);

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}.json`, JSON.stringify(checkingArr), function (err) {
                if (err) throw err;
                console.log('complete');
            }
        );

        let rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourNow - 1}.json`);
        let baseArr = JSON.parse(rawBase);

        console.log("base array " + baseArr);

        console.log("checking array" + checkingArr);
        console.log("started filtering");
        var biggestKey;

        if (baseArr.length > checkingArr.length) {
            biggestKey = baseArr.length;
        } else {
            biggestKey = checkingArr.length;
        }

        function getDifference(array1, array2) {
            return array1.filter(object1 => {
                return !array2.some(object2 => {
                    return object1.sku === object2.sku;
                });
            });
        }

        let difference = getDifference(baseArr, checkingArr);
        let newItems = getDifference(checkingArr, baseArr);

        for (let i = 0; i < baseArr.length; i++) {
            for (let j = 0; j < difference.length; j++) {
                if (baseArr[i].sku === difference[j].sku) {
                    baseArr.splice(i, 1);
                }
            }
        }
        let newObject;
        for (let i = 0; i < checkingArr.length; i++) {
            for (let j = 0; j < newItems.length; j++) {
                if (checkingArr[i].sku === newItems[j].sku) {
                    newObject = checkingArr[i];
                    checkingArr.splice(i, 1);
                    checkingArr.push(newObject);
                }
            }
        }


        let reqArray = []


        for (let j = 0; j < biggestKey; j++) {
            let reqObject = {
                sku: "",
                diff: 0,
                quantity: 0
            }
            if (baseArr[j] !== undefined && checkingArr[j] !== undefined) {
                if (baseArr[j].quantity > checkingArr[j].quantity) {
                    console.log("they bought - " + checkingArr[j]);
                    reqObject.sku = checkingArr[j].sku;
                    reqObject.quantity = checkingArr[j].quantity;
                    reqObject.diff = baseArr[j].quantity - checkingArr[j].quantity;
                    reqArray.push(reqObject);
                } else if (baseArr[j].quantity === checkingArr[j].quantity) {
                    console.log("stable");
                }
            }
        }

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, JSON.stringify(reqArray), function (err) {
            if (err) throw err;
            console.log('complete');
        });

        fs.readFile('dateArr.json', function (err, data) {
            var json = JSON.parse(data)
            json.push(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`)

            fs.writeFile(`dateArr.json`, JSON.stringify(json), function (err) {
                if (err) throw err;
                console.log('Append');
            });
        })

        getVariables();

    }).catch(function (error) {
        console.log(error);
    });
}

function getVariables() {

    instance.get('/catalog/productsvariationsstock').then(response => {

        let {data} = response;

        console.log(data);

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace( /\s/gm , "").split(":")[0];

        let checkingArr = [];


        for (let id1 of data) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

        console.log(checkingArr);

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(checkingArr), function (err) {
                if (err) throw err;
                console.log('complete');
            }
        );

        let rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourNow - 1}-variables.json`);
        let baseArr = JSON.parse(rawBase);


        console.log("base array " + baseArr);

        console.log("checking array" + checkingArr);
        console.log("started filtering");
        var biggestKey;

        if (baseArr.length > checkingArr.length) {
            biggestKey = baseArr.length;
        } else {
            biggestKey = checkingArr.length;
        }

        function getDifference(array1, array2) {
            return array1.filter(object1 => {
                return !array2.some(object2 => {
                    return object1.sku === object2.sku;
                });
            });
        }

        let difference = getDifference(baseArr, checkingArr);
        let newItems = getDifference(checkingArr, baseArr);

        for (let i = 0; i < baseArr.length; i++) {
            for (let j = 0; j < difference.length; j++) {
                if (baseArr[i].sku === difference[j].sku) {
                    baseArr.splice(i, 1);
                }
            }
        }
        let newObject;
        for (let i = 0; i < checkingArr.length; i++) {
            for (let j = 0; j < newItems.length; j++) {
                if (checkingArr[i].sku === newItems[j].sku) {
                    newObject = checkingArr[i];
                    checkingArr.splice(i, 1);
                    checkingArr.push(newObject);
                }
            }
        }


        let reqArray = []


        for (let j = 0; j < biggestKey; j++) {
            let reqObject = {
                sku: "",
                diff: 0,
                quantity: 0
            }
            if (baseArr[j] !== undefined && checkingArr[j] !== undefined) {
                if (baseArr[j].quantity > checkingArr[j].quantity) {
                    console.log("they bought - " + checkingArr[j]);
                    reqObject.sku = checkingArr[j].sku;
                    reqObject.quantity = checkingArr[j].quantity;
                    reqObject.diff = baseArr[j].quantity - checkingArr[j].quantity;
                    reqArray.push(reqObject);
                } else if (baseArr[j].quantity === checkingArr[j].quantity) {
                    console.log("stable");
                }
            }
        }
        fs.readFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, function (err, data) {
            var json = JSON.parse(data)
            for (let i = 0; i < reqArray.length; i++) {
                json.push(reqArray[i])
            }
            console.log(json)
            if (err) throw err;
            fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, JSON.stringify(json), function (err) {
                if (err) throw err;
                console.log('Append');
            });
        })


    }).catch(function (error) {
        console.log(error);
    });
}


const express = require('express');
const cors = require('cors');
const events = require('events');
const bp = require('body-parser')

const PORT = process.env.API_PORT;

const app = express();

const emitter = new events.EventEmitter();

app.use(cors());
app.use(bp.json())
app.use(bp.urlencoded({extended: true}))

app.get('/get-items', ((req, res) => {
    emitter.once("newItem", (data) => {
        console.log("get item");
        console.log(data);
        res.json(data)
    });
}))
app.get('/get-dates', ((req, res) => {
    let rawDates = fs.readFileSync('dateArr.json');
    let dates = JSON.parse(rawDates);

    res.json(dates);
}));

app.post('/new-items', ((req, res) => {
    let {name} = req.body

    console.log(req.body);


    let data = postData(name);


    emitter.emit("newItem", data);
    res.sendStatus(200);
}))


function postData(name) {
    let datesTempArr = [];

    let checkingArrPathRaw = name.split("and").pop();
    let checkingArrPath = checkingArrPathRaw.replace(/:\d\d/gm, '').replace(/T./gm, "T");

    let baseArrPathRaw = name.split("and").shift();
    let baseArrPath = baseArrPathRaw.replace(/:\d\d/gm, '').replace(/T./gm, "T");

    console.log(baseArrPath);
    console.log(checkingArrPath);

    let datesRaw = fs.readFileSync("dateArr.json");
    let dates = JSON.parse(datesRaw);

    console.log(dates);

    let lastDate = dates.indexOf(`./${checkingArrPath}-popular.json`);

    let firstDate = dates.indexOf(`./${baseArrPath}-popular.json`)

    console.log(lastDate);
    console.log(firstDate);

    for (firstDate; firstDate <= lastDate; firstDate++) {
        datesTempArr.push(dates[firstDate]);
    }


    console.log(datesTempArr);

    var readyToGoArray = [];

    for (let i = 0; i < datesTempArr.length; i++) {

        if(datesTempArr[i+1] === undefined){
            console.log(readyToGoArray);
            return readyToGoArray;
        }

        console.log(`${datesTempArr[i]}`)
        let baseArrRaw = fs.readFileSync(`${datesTempArr[i]}`);
        let baseArr = JSON.parse(baseArrRaw);
        console.log(`${datesTempArr[i+1]}`)
        let checkingArrRaw = fs.readFileSync(`${datesTempArr[i+1]}`);
        let checkingArr = JSON.parse(checkingArrRaw);

        baseArr.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        checkingArr.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        try {
            readyToGoArray.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        } catch (e) {
            console.log(e);
        }


        function getIntersection(array1, array2) {
            return array1.filter(object1 => {
                return array2.some(object2 => {
                    return object1.sku === object2.sku;
                });
            });
        }
        function getDifference(array1, array2) {
            return array1.filter(object1 => {
                return !array2.some(object2 => {
                    return object1.sku === object2.sku;
                });
            });
        }



        if (i === 0){
            let firstArray = getIntersection(baseArr, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            let secondArray = getIntersection(checkingArr, baseArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let baseDiff = getDifference(baseArr, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            let checkingDiff = getDifference(checkingArr, baseArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            for (let j = 0; j < firstArray.length; j++) {
                secondArray[j].diff += firstArray[j].diff;

                readyToGoArray.push(secondArray[j]);
            }

            baseDiff.forEach((element) => {
                readyToGoArray.push(element);
            })
            checkingDiff.forEach((element) => {
                readyToGoArray.push(element);
            })
        } else {
            let firstArray = getIntersection(readyToGoArray, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            let secondArray = getIntersection(checkingArr, readyToGoArray).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let checkingDiff = getDifference(checkingArr, readyToGoArray).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            for (let j = 0; j < firstArray.length; j++) {
                secondArray[j].diff += firstArray[j].diff;
                readyToGoArray.splice(j, 1);
                readyToGoArray.push(secondArray[j]);
            }

            checkingDiff.forEach((element) => {
                readyToGoArray.push(element);
            })
        }
    }
}

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.listen(PORT, () => console.log('server is started'));