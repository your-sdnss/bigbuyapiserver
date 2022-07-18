const axios = require('axios').default;
require('dotenv').config();
const token = process.env.API_TOKEN;
const fs = require("fs");
const cronJob = require('cron').CronJob;
const path = require("path");

const job = new cronJob('0 0 */1 * * *', getData);

job.start();

const instance = axios.create({
    baseURL: 'https://api.bigbuy.eu/rest',
    headers: {'Authorization': 'Bearer ' + token}
});


function getOnce() {
    instance.get('/catalog/productsvariationsstock').then(response => {

        let {data} = response;

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

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


        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(checkingArr), function (err) {
                if (err) throw err;
                console.log('complete');
            }
        );
    }).catch(function (error) {
        console.log(error);
    });
    instance.get('/catalog/productsstock').then(response => {

        let {data} = response;

        console.log(data);

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

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
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

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

        let rawBase;

        if (hourNow.toString() === "00") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow - 1}T23.json`);
        } else {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourNow - 1}.json`);
        }
        let baseArr = JSON.parse(rawBase);


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
                    reqObject.sku = checkingArr[j].sku;
                    reqObject.quantity = checkingArr[j].quantity;
                    reqObject.diff = baseArr[j].quantity - checkingArr[j].quantity;
                    reqArray.push(reqObject);
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
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

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

        let rawBase;

        if (hourNow.toString() === "00") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow - 1}T23-variables.json`);
        } else {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourNow - 1}-variables.json`);
        }
        let baseArr = JSON.parse(rawBase);


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
                    reqObject.sku = checkingArr[j].sku;
                    reqObject.quantity = checkingArr[j].quantity;
                    reqObject.diff = baseArr[j].quantity - checkingArr[j].quantity;
                    reqArray.push(reqObject);
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
    let checkingArrPath = checkingArrPathRaw.replace(/:\d\d/gm, '');

    let baseArrPathRaw = name.split("and").shift();
    let baseArrPath = baseArrPathRaw.replace(/:\d\d/gm, '');

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

        if (datesTempArr[i + 1] === undefined) {
            return readyToGoArray;
        }

        let baseArrRaw = fs.readFileSync(`${datesTempArr[i]}`);
        let baseArr = JSON.parse(baseArrRaw);
        let checkingArrRaw = fs.readFileSync(`${datesTempArr[i + 1]}`);
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

        if (i === 0) {

            const firstArray = baseArr.filter(item1 => checkingArr.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            const secondArray = checkingArr.filter(item1 => baseArr.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let baseDiff = getDifference(baseArr, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            let checkingDiff = getDifference(checkingArr, baseArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));


            fs.writeFile(`firstArray.json`, JSON.stringify(firstArray), function (err) {
                if (err) throw err;
            });

            fs.writeFile(`secondArray.json`, JSON.stringify(secondArray), function (err) {
                if (err) throw err;
            });
            fs.writeFile(`diff1Array${i}.json`, JSON.stringify(checkingDiff), function (err) {
                if (err) throw err;
            });

            fs.writeFile(`diff2Array${i}.json`, JSON.stringify(baseDiff), function (err) {
                if (err) throw err;
            });

            for (let j = 0; j < firstArray.length; j++) {
                    secondArray[j].diff = firstArray[j].diff + secondArray[j].diff;
                    readyToGoArray.push(secondArray[j]);
            }
            baseDiff.forEach((element) => {
                readyToGoArray.push(element);
            })
            checkingDiff.forEach((element) => {
                readyToGoArray.push(element);
            })
        } else {

            const firstArray = readyToGoArray.filter(item1 => checkingArr.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            const secondArray = checkingArr.filter(item1 => readyToGoArray.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));


            let checkingDiff = getDifference(checkingArr, readyToGoArray).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let baseDiff = getDifference(readyToGoArray, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));


            fs.writeFile(`firstArray${i}.json`, JSON.stringify(firstArray), function (err) {
                if (err) throw err;
            });

            fs.writeFile(`secondArray${i}.json`, JSON.stringify(secondArray), function (err) {
                if (err) throw err;
            });
            fs.writeFile(`diff1Array${i}.json`, JSON.stringify(checkingDiff), function (err) {
                if (err) throw err;
            });

            fs.writeFile(`diff2Array${i}.json`, JSON.stringify(baseDiff), function (err) {
                if (err) throw err;
            });

            for (let j = 0; j < firstArray.length; j++) {
                    secondArray[j].diff = firstArray[j].diff + secondArray[j].diff;
                    let skuData = secondArray[j].sku;
                    let pos = readyToGoArray.findIndex(x => x.sku === skuData);
                    readyToGoArray.splice(pos, 1);
                    readyToGoArray.push(secondArray[j]);
            }

            const firstDiffArray = checkingDiff.filter(item1 => baseDiff.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
            const secondDiffArray = baseDiff.filter(item1 => checkingDiff.some(item2 => item1.sku === item2.sku)).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let checkingDiffDiff = getDifference(checkingDiff, baseDiff).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            let baseDiffDiff = getDifference(baseDiff, checkingDiff).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

            for (let j = 0; j < firstDiffArray.length; j++) {
                secondDiffArray[j].diff = firstDiffArray[j].diff + secondDiffArray[j].diff;
                let skuData = secondDiffArray[j].sku;
                let pos = readyToGoArray.findIndex(x => x.sku === skuData);
                readyToGoArray.splice(pos, 1);
                readyToGoArray.push(secondDiffArray[j]);
            }

            baseDiffDiff.forEach((element) => {
                readyToGoArray.splice(readyToGoArray.indexOf(element), 1)
                readyToGoArray.push(element);
            })

            checkingDiffDiff.forEach((element) => {
                readyToGoArray.splice(readyToGoArray.indexOf(element), 1)
                readyToGoArray.push(element);
            })
        }
    }
}

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.listen(PORT, () => console.log('server is started'));
