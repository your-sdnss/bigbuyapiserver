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

        let reqArray = [];

        let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];
        let hourNow = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];

        let newArr = [];

        for (let id1 of stockResponse) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;

            newArr.push(obj);
        }

        console.log("new arr generated");
        
        fs.writeFile(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}.json`, JSON.stringify(newArr), function (err) {
                if (err) throw err;
                console.log('complete');
            }
        );
        

        let firstNum = hourNow.split("")[0];
        let secondNum = hourNow.split("")[1];

        let minusHour;


        const getYesterday = (dateOnly = false) => {
            let d = new Date();
            d.setDate(d.getDate() - 1);
              d = d.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
            return dateOnly ? new Date(d.toDateString()) : d;
        };
    
        let dayY = getYesterday().split("/")[0];

        if (firstNum === "0" && secondNum !== "0") {
            secondNum -= 1;
            minusHour = firstNum.concat(secondNum);
        } else if (firstNum === "0" && secondNum === "0"){
            minusHour = "23"
        }else if (firstNum === "1" && secondNum === "0") {
            minusHour = "09";
        } else {
            minusHour = hourNow - 1;
        }
	    console.log(minusHour);

        let rawBase;

        if (minusHour === "23") {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T${minusHour}.json`);
        } else {
            rawBase = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${minusHour}.json`);
        }

        let oldArr = JSON.parse(rawBase);
        
        const operation = (list1, list2, isUnion = false) =>
        list1.filter(
            (set => a => isUnion === set.has(a.sku))(new Set(list2.map(b => b.sku)))
        );

    const inBoth = (list1, list2) => operation(list1, list2, true);
        let inBothDefault1 = inBoth(newArr, oldArr);
        let inBothDefault2 = inBoth(oldArr, newArr);

        inBothDefault1.sort((a,b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        inBothDefault2.sort((a,b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        
        for (let i = 0; i < inBothDefault2.length; i++) {
            if(inBothDefault1[i].sku === inBothDefault2[i].sku && inBothDefault1[i].quantity < inBothDefault2[i].quantity){
                let reqObject = {
                    sku:  inBothDefault1[i].sku,
                    quantity: inBothDefault1[i].quantity,
                    diff: inBothDefault2[i].quantity - inBothDefault1[i].quantity
                }
                reqArray.push(reqObject);
            }
        }
        
        console.log(reqArray)

        let newVariable = [];

        for (let id1 of variableResponse) {
            let obj = {
                sku: "",
                quantity: 0
            }
            obj.sku = id1.sku;
            obj.quantity = id1.stocks[0].quantity;
    
            newVariable.push(obj);
        }

        console.log("new variable created");

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-variable.json`, JSON.stringify(newVariable));

        let rawVar;

        if (minusHour === "23") {
            rawVar = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T${minusHour}.json`);
        } else {
            rawVar = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${minusHour}.json`);
        }

        let oldVariable = JSON.parse(rawVar);

        let inBothDefault1Var = inBoth(newVariable, oldVariable);
        let inBothDefault2Var = inBoth(oldVariable, newVariable);

        inBothDefault1Var.sort((a,b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
        inBothDefault2Var.sort((a,b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));

        for (let i = 0; i < inBothDefault1Var.length; i++) {
            if(inBothDefault1Var[i].sku === inBothDefault2Var[i].sku && inBothDefault1Var[i].quantity < inBothDefault2Var[i].quantity){
                let reqObject = {
                    sku:  inBothDefault1Var[i].sku,
                    quantity: inBothDefault1Var[i].quantity,
                    diff: inBothDefault2Var[i].quantity - inBothDefault1Var[i].quantity
                }
                reqArray.push(reqObject);
            }
        }

        console.log(reqArray)

        reqArray = JSON.stringify(reqArray);
        console.log(typeof(reqArray))

        fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`, reqArray);
        fs.readFile('dateArr.json', function (err, data) {
            var json = JSON.parse(data)
            json.push(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}-popular.json`)
            fs.writeFile(`dateArr.json`, JSON.stringify(json), function (err) {
                if (err) throw err;
                console.log('Append');
            });
        })
        
        /*let dateRaw = new Date();
        let dateNow = dateRaw.toLocaleString('en-GB', {timeZone: 'Europe/Kiev'});
        let hour = dateNow.split("/")[2].split(",")[1].replace(/\s/gm, "").split(":")[0];
        let yearNow = dateNow.split("/")[2].split(",")[0];
        let monthNow = dateNow.split("/")[1];
        let dayNow = dateNow.split("/")[0];

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

            let checkingArrVar = [];

            for (let id1 of stockResponse) {
                let obj = {
                    sku: "",
                    quantity: 0
                }
                obj.sku = id1.sku;
                obj.quantity = id1.stocks[0].quantity;
        
                checkingArrVar.push(obj);
            }
        
            fs.writeFileSync(`./${yearNow}-${monthNow}-${dayNow}T${hourNow}.json`, JSON.stringify(checkingArrVar));

            let rawBaseArr;
        
            if (hourNow.toString() === "00") {
                rawBaseArr = fs.readFileSync(`${yearNow}-${monthNow}-${dayY}T23.json`);
            } else if (hourNow.toString() === "01") {
                rawBaseArr = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T00.json`);
            } else {
                console.log(hourNow);
                rawBaseArr = fs.readFileSync(`${yearNow}-${monthNow}-${dayNow}T${hourMin}.json`);
            }
        
            baseArrVar = JSON.parse(rawBaseArr);        
            
            intersectionBaseVar = baseArrVar.filter(item1 => checkingArrVar.some(item2 => item1.sku === item2.sku));
            intersectionCheckVar = checkingArrVar.filter(item1 => baseArrVar.some(item2 => item1.sku === item2.sku));
            
            let biggestKeyVar = intersectionBaseVar.length > intersectionCheckVar.length ? intersectionBaseVar.length : intersectionCheckVar.length;
        
            for (let i = 0; i < biggestKeyVar; i++){
                if(intersectionBaseVar.quantity > intersectionCheckVar.quantity && intersectionBaseVar.sku === intersectionCheckVar.sku){
                    let reqObject = {
                        sku: intersectionCheckVar,
                        quantity: intersectionCheckVar,
                        diff: intersectionBaseVar.quantity - intersectionCheckVar.quantity
                    }
                    reqArray.push(reqObject);
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
        */
    })).catch(errors => {
        console.error(errors);
    })
}


