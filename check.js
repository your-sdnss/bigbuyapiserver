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


        let firstNum = hourNow.split("")[0];
        let secondNum = hourNow.split("")[1];

        let hourMin;

        if (firstNum === "0") {
            secondNum -= 1;
            hourMin = firstNum.concat(secondNum);
        } else {
            hourMin = hourNow - 1;
        }



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

        let yesterday = dateRaw.setDate(dateRaw.getDate() - 1);
        let dayYesterday = yesterday.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let dayY = dayYesterday.split("/")[0];



        if (hourNow.toString() === "00") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23.json`);
        }
        if (hourNow.toString() === "01") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00.json`);
        }
        else {
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

        getVariables;

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

        let firstNum = hourNow.split("")[0];
        let secondNum = hourNow.split("")[1];
        let hourMin;if (firstNum === "0") {secondNum -= 1;hourMin = firstNum.concat(secondNum);}
        else {hourMin = hourNow - 1;}

        for (let id1 of data) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            checkingArr.push(obj);
        }

       //console.log(checkingArr);

        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(checkingArr), function (err) {
                if (err) throw err;
                console.log('complete');
            }
        );

        let rawBase;

        let yesterday = dateRaw.setDate(dateRaw.getDate() - 1);
        let dateYest = yesterday.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let dayY = dateYest.split("/")[0];

        if (hourNow.toString() === "00") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23-variables.json`);
        }
        if(hourNow.toString() === "01"){
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00.json`);
        } else {rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}.json`);                                                                                }
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

	    console.log("end");

        fs.readFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, function (err, data) {
            var json = JSON.parse(data)
            for (let i = 0; i < reqArray.length; i++) {
                json.push(reqArray[i])
            }
            console.log(json)
            if (err) throw err;
            fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, JSON.stringify(json), function (err) {
                if (err) throw err;
                console.log("Append");
            });
        })
	console.log("end2");
    }).catch(function (error) {
        console.log(error);
    });
}
