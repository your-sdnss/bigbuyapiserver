const axios = require('axios').default;
require('dotenv').config();
const token = process.env.API_TOKEN;
const fs = require("fs");
const cronJob = require('cron').CronJob;

const job = new cronJob('0 0 */1 * * *', getData);

job.start();

const instance = axios.create({
    baseURL: 'https://api.bigbuy.eu/rest',
    headers: {'Authorization': 'Bearer ' + token}
});


function getOnce() {

    instance.get('/catalog/productsvariationsstock').then(response => {

        let { data } = response;
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
    }).catch(function(error){    
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


const stockData = instance.get('/catalog/productsstock');

const variableData = instance.get('/catalog/productsvariationsstock');

function getData() {
    axios.all([stockData, variableData]).then(axios.spread((...responses) => {

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

        let checkingArr = [];

        let firstNum = hourNow.split("")[0];
        let secondNum = hourNow.split("")[1];

        let hourMin;

        function getIntersection(array1, array2) {
            return array1.filter(object1 => {
                return array2.some(object2 => {
                    return object1.sku === object2.sku;
                });
            });
        }

        if (firstNum === "0") {
            secondNum -= 1;
            hourMin = firstNum.concat(secondNum);
        } else if (firstNum === "1" && secondNum === "0") {
            hourMin = "09";
        } else {
            hourMin = hourNow - 1;
        }
	    console.log(hourMin);

        const stockResponse = responses[0].data;
        const variableResponse = responses[1].data;

        for (let id1 of stockResponse) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}.json`, JSON.stringify(checkingArr));

        let rawBase;

        let yesterday = dateRaw.setDate(dateRaw.getDate() - 1);
        let dayYesterday = yesterday.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let dayY = dayYesterday.split("/")[0];


        if (hourNow.toString() === "00") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23.json`);
        } else if (hourNow.toString() === "01") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00.json`);
        } else {
            console.log(hourNow);
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}.json`);
        }

        let baseArr = JSON.parse(rawBase);

        var biggestKey;

        if (baseArr.length > checkingArr.length) {
            biggestKey = baseArr.length;
        } else {
            biggestKey = checkingArr.length;
        }

        console.log("Difference");

        baseArr = getIntersection(baseArr, checkingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0))
        checkingArr = getIntersection(checkingArr, baseArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0))


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
                    console.log(reqObject);
                }
            }
        }

        console.log(reqArray);


        //variables start


        console.log("variables");

        let varCheckingArr = [];

        for (let id1 of variableResponse) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            varCheckingArr.push(obj);
        }

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(varCheckingArr));

        console.log("variables-ready")

        let rawCheckBase;

        if (hourNow.toString() === "00") {
            rawCheckBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23-variables.json`)
        } else if (hourNow.toString() === "01") {
            rawCheckBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00-variables.json`);
        } else {
            rawCheckBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}-variables.json`);
        }
        let checkBaseArr = JSON.parse(rawCheckBase);

        console.log("difference")

        let varBaseInt = getIntersection(checkBaseArr, varCheckingArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        let varCheckInt = getIntersection(varCheckingArr, checkBaseArr).sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

        let varBiggestKey;

        if (varBaseInt.length > varCheckInt.length) {
            varBiggestKey = varBaseInt.length;
        } else {
            varBiggestKey = varCheckInt.length;
        }

        for (let j = 0; j < varBiggestKey; j++) {
            let varReqObject = {
                sku: "",
                diff: 0,
                quantity: 0
            }
            if (varBaseInt[j] !== undefined && varCheckInt[j] !== undefined) {
                if (varBaseInt[j].quantity > varCheckInt[j].quantity) {
                    varReqObject.sku = varCheckInt[j].sku;
                    varReqObject.quantity = varCheckInt[j].quantity;
                    varReqObject.diff = varBaseInt[j].quantity - varCheckInt[j].quantity;
                    reqArray.push(varReqObject);
                    console.log(varReqObject);
                }
            }
        }

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, JSON.stringify(reqArray));
        fs.readFile('dateArr.json', function (err, data) {
            var json = JSON.parse(data)
            json.push(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`)
            fs.writeFile(`dateArr.json`, JSON.stringify(json), function (err) {
                if (err) throw err;
                console.log('Append');
            });
        })
    })).catch(errors => {
        console.error(errors);
    })
}
