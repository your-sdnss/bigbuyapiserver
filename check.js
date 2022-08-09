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

        const stockResponse = responses[0].data;
        const variableResponse = responses[1].data;

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let hour = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];

        let checkingArr = [];

            let hourNow = date.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];
        
            for (let id1 of variableResponse) {
                let obj = {
                    sku: "",
                    quantity: 0
                }
                obj.sku = id1.sku;
                obj.quantity = id1.stocks[0].quantity;
        
                checkingArr.push(obj);
            }
        
            fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variables.json`, JSON.stringify(checkingArr));
        
            let rawBase;
        
            const getYesterday = (dateOnly = false) => {
                let d = new Date();
                d.setDate(d.getDate() - 1);
                  d = d.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
                return dateOnly ? new Date(d.toDateString()) : d;
            };
        
            let dayY = getYesterday().split("/")[0];
        
            if (hourNow.toString() === "00") {
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23-variables.json`);
            } else if (hourNow.toString() === "01") {
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00-variables.json`);
            } else {
                console.log(hourNow);
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}-variables.json`);
            }
        
            let baseArr = JSON.parse(rawBase);
        
            let reqArray = []
        
            let intersectionBase = baseArr.filter(item1 => checkingArr.some(item2 => item1.sku === item2.sku));
            let intersectionCheck = checkingArr.filter(item1 => baseArr.some(item2 => item1.sku === item2.sku));
            
            biggestKey = intersectionBase.length > intersectionCheck.length ? intersectionBase.length : intersectionCheck.length;
        
            for (let i = 0; i < biggestKey; i++){
                if(intersectionBase.quantity > intersectionCheck.quantity && intersectionBase.sku === intersectionCheck.sku){
                    let reqObject = {
                        sku: intersectionCheck,
                        quantity: intersectionCheck,
                        diff: intersectionBase.quantity - intersectionCheck.quantity
                    }
                    reqArray.push(reqObject);
                }
            }

            checkingArr = [];

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

            rawBase = undefined;
        
            if (hourNow.toString() === "00") {
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23.json`);
            } else if (hourNow.toString() === "01") {
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00.json`);
            } else {
                console.log(hourNow);
                rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}.json`);
            }
        
            baseArr = JSON.parse(rawBase);        
            
            intersectionBase = baseArr.filter(item1 => checkingArr.some(item2 => item1.sku === item2.sku));
            intersectionCheck = checkingArr.filter(item1 => baseArr.some(item2 => item1.sku === item2.sku));
            
            let biggestKey = intersectionBase.length > intersectionCheck.length ? intersectionBase.length : intersectionCheck.length;
        
            for (let i = 0; i < biggestKey; i++){
                if(intersectionBase.quantity > intersectionCheck.quantity && intersectionBase.sku === intersectionCheck.sku){
                    let reqObject = {
                        sku: intersectionCheck,
                        quantity: intersectionCheck,
                        diff: intersectionBase.quantity - intersectionCheck.quantity
                    }
                    reqArray.push(reqObject);
                }
            }

        let firstNum = hour.split("")[0];
        let secondNum = hour.split("")[1];

        let hourMin;

        if (firstNum === "0") {
            secondNum -= 1;
            hourMin = firstNum.concat(secondNum);
        } else if (firstNum === "1" && secondNum === "0") {
            hourMin = "09";
        } else {
            hourMin = hour - 1;
        }
	    console.log(hourMin);

        const newAll = reqArray;

        newAll.sort((a,b) => a.diff - b.diff);

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, JSON.stringify(newAll));
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


