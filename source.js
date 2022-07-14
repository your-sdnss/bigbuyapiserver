const axios = require('axios').default;
require('dotenv').config();
const token = process.env.API_TOKEN;
const fs = require("fs");
const cronJob = require('cron').CronJob;


const job = new cronJob('0 */1 * * * *', getOnce);

job.start();


const instance = axios.create({
    baseURL: 'https://api.bigbuy.eu/rest',
    headers: {'Authorization': 'Bearer ' + token}
});


function getOnce(){
    instance.get('/catalog/productsvariationsstock').then(response => {

        let { data } = response;

        let nowTS = Date.now();
        let dateNow = new Date(nowTS);
        let yearNow = dateNow.getFullYear();
        let monthNow = dateNow.getMonth() + 1;
        let dayNow = dateNow.getDate();
        let hourNow = dateNow.getHours();


        if(monthNow < 10){
            monthNow = "0" + monthNow
        }

        if(dayNow < 10){
            dayNow = "0" + dayNow
        }

        let checkingArr = [];

// const JSONStream = require("JSONStream");

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

        console.log(response);

        let { data } = response;

        let nowTS = Date.now();
        let dateNow = new Date(nowTS);
        let yearNow = dateNow.getFullYear();
        let monthNow = dateNow.getMonth() + 1;
        let dayNow = dateNow.getDate();
        let hourNow = dateNow.getHours();


        if(monthNow < 10){
            monthNow = "0" + monthNow
        }

        if(dayNow < 10){
            dayNow = "0" + dayNow
        }

        let checkingArr = [];

// const JSONStream = require("JSONStream");

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

        console.log(response);

        let {data} = response;

        let nowTS = Date.now();
        let dateNow = new Date(nowTS);
        let yearNow = dateNow.getFullYear();
        let monthNow = dateNow.getMonth() + 1;
        let dayNow = dateNow.getDate();
        let hourNow = dateNow.getHours();


        if (monthNow < 10) {
            monthNow = "0" + monthNow
        }

        if (dayNow < 10) {
            dayNow = "0" + dayNow
        }

        let checkingArr = [];

// const JSONStream = require("JSONStream");

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

//
// let baseArr = testArrayy1;
// let checkingArr = testArrayy2;

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

        console.log(response);

        let {data} = response;

        let nowTS = Date.now();
        let dateNow = new Date(nowTS);
        let yearNow = dateNow.getFullYear();
        let monthNow = dateNow.getMonth() + 1;
        let dayNow = dateNow.getDate();
        let hourNow = dateNow.getHours();


        if (monthNow < 10) {
            monthNow = "0" + monthNow
        }

        if (dayNow < 10) {
            dayNow = "0" + dayNow
        }

        let checkingArr = [];

// const JSONStream = require("JSONStream");

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

//
// let baseArr = testArrayy1;
// let checkingArr = testArrayy2;

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


// let testArrayy1 = [
//     ["SFD1", "SFD2", "SFD3", "SFD4", "SFD5", "SFD6"],
//     [1, 2, 3, 4, 5, 6]
// ]
//
// let testArrayy2 = [
//     ["SFD1", "SFD2", "SFD3", "SFD4", "SFD5", "SFD6"],
//     [1, 2, 5, 4, 5, 2]
// ]

const express = require('express');
const cors = require('cors');
const events = require('events');
const bp = require('body-parser')

const PORT = 5000;

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


    // do {
    //     console.log(baseArr[0][b] + " and " + checkingArr[0][b]);
    //     console.log(baseArr[1][b] + " and " + checkingArr[1][b]);
    //     if (baseArr[1][b] > checkingArr[1][b]) {
    //         console.log("check")
    //         reqArray[0][b] = checkingArr[0][b];
    //         reqArray[1][b] = baseArr[1][b] - checkingArr[1][b];
    //         reqArray[2][b] = checkingArr[1][b];
    //         // console.log(reqArray)
    //     } else {
    //         // console.log(baseArr[1][b] + " = " + checkingArr[1][b]);
    //     }
    //     if (baseArr[0][b] === undefined) {
    //         // console.log(checkingArr[0][b] + " is new item");
    //     }
    //     b++;
    //     i++;
    //
    // } while (i < biggestKey);
    emitter.emit("newItem", data);
    res.sendStatus(200);
}))


function postData(name) {
    let datesTempArr = [];

    let checkingArrPathRaw = name.split("and").pop();
    let checkingArrPath = checkingArrPathRaw.replace(/:\d\d/gm, '');

    let baseArrPathRaw = name.split("and").shift();
    let baseArrPath = baseArrPathRaw.replace(/:\d\d/gm, '');

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


// function firstCheck(objArrayBase, objArrayCheck, readyToGoArray){
//     switch (objArrayBase.length > objArrayCheck.length) {
//         case true:
//             console.log("true")
//             console.log("true")
//             console.log("true")
//
//             console.log(objArrayCheck);
//             console.log(objArrayBase);
//
//             for (let i = 0; i < objArrayBase.length; i++) {
//                 for (let j = 0; j < objArrayCheck.length; j++) {
//                     console.log(objArrayCheck[j]);
//                     if (objArrayCheck[j] === undefined) {
//                         readyToGoArray.push(objArrayBase[i]);
//                         break;
//                     }
//                      else {
//                         console.log("test1");
//                         if (objArrayBase[i].quantity > objArrayCheck[j].quantity && objArrayCheck[j].sku === objArrayBase.sku) {
//                             console.log("test2");
//                             console.log("test2");
//                             console.log("test2");
//                             let reqObject = {
//                                 sku: "",
//                                 diff: 0,
//                                 quantity: 0
//                             };
//                             reqObject.sku = objArrayCheck[j].sku;
//                             reqObject.quantity = objArrayCheck[j].quantity;
//                             reqObject.diff = objArrayBase[i].diff + objArrayCheck[j].diff;
//                             console.log("req obj" + reqObject.sku);
//                             readyToGoArray.push(reqObject);
//                             console.log(readyToGoArray + "readyToGoArr");
//                         } else if(objArrayBase[i].quantity === objArrayCheck[j].quantity && objArrayCheck[j].sku === objArrayBase.sku) {
//                             readyToGoArray.push(objArrayBase[i]);
//                         }
//                     }
//                 }
//             }
//             break;
//         case false:
//             console.log("false")
//             console.log("false")
//             console.log("false")
//             for (let i = 0; i < objArrayCheck.length; i++) {
//                 for (let j = 0; j < objArrayBase.length; j++) {
//                     if (objArrayBase[j] !== undefined) {
//                         readyToGoArray.push(objArrayCheck[i]);
//                         break;
//                     } else {
//                         if (objArrayBase[j].quantity > objArrayCheck[i].quantity && objArrayCheck[i].sku === objArrayBase.sku) {
//
//                             let reqObject = {
//                                 sku: "",
//                                 diff: 0,
//                                 quantity: 0
//                             }
//
//                             reqObject.sku = objArrayCheck[i].sku;
//                             reqObject.quantity = objArrayCheck[i].quantity;
//                             reqObject.diff = objArrayBase[j].diff + objArrayCheck[i].diff;
//                             console.log("req obj" + reqObject.sku);
//                             readyToGoArray.push(reqObject);
//                             console.log(readyToGoArray + "readyToGoArr");
//                         } else if(objArrayBase[j].quantity === objArrayCheck[i].quantity && objArrayCheck[i].sku === objArrayBase.sku){
//                             readyToGoArray.push(objArrayCheck[i])
//                         }
//                     }
//                 }
//             }
//             break;
//         default:
//             console.log("default");
//             break;
//     }
// }

// for (let i = 0; i < datesTempArr.length; i++) {
//     if (datesTempArr[i + 1] === undefined) {
//         console.log("end")
//         return readyToGoArray;
//     } else {
//         //
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//
//         let baseArrRaw = fs.readFileSync(`${datesTempArr[i]}`);
//         let baseArr = JSON.parse(baseArrRaw);
//         let checkingArrRaw = fs.readFileSync(`${datesTempArr[i + 1]}`);
//         let checkingArr = JSON.parse(checkingArrRaw);
//
//
//         objArrayBase.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
//         objArrayCheck.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
//         try {
//             readyToGoArray.sort((a, b) => (a.sku > b.sku) ? 1 : ((b.sku > a.sku) ? -1 : 0));
//         } catch (e) {
//             console.log(e);
//         }
//
//         function getDifference(array1, array2) {
//             return array1.filter(object1 => {
//                 return !array2.some(object2 => {
//                     return object1.sku === object2.sku;
//                 });
//             });
//         }
//
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//         // console.log("I" + i);
//
//         let differenceBase = getDifference(objArrayBase, objArrayCheck);
//         let differenceCheck = getDifference(objArrayCheck, objArrayBase);
//
//         // // console.log("differenceCheck");
//         // // console.log("differenceCheck");
//         // console.log(differenceCheck);
//         // // console.log("differenceBase");
//         // // console.log("differenceBase");
//         // console.log(differenceBase);
//
//         objArrayCheck = checkingArr;
//         objArrayBase = baseArr;
//
//         // console.log("objArrayBase");
//         // console.log("objArrayBase");
//         // console.log("objArrayBase");
//         // console.log("objArrayBase");
//         // console.log(objArrayBase);
//         //
//         // console.log("objArrayCheck");
//         // console.log("objArrayCheck");
//         // console.log("objArrayCheck");
//         // console.log("objArrayCheck");
//         // console.log(objArrayCheck);
//
//         //
//         // differenceBase.forEach((element) => {
//         //     objArrayBase.forEach((object) => {
//         //         if (object.sku === element.sku) {
//         //             something = objArrayBase.splice(objArrayBase.indexOf(object), 1);
//         //             objArrayBase.push(something);
//         //         }
//         //     })
//         // })
//         //
//         // differenceCheck.forEach((element) => {
//         //     objArrayCheck.forEach((object) => {
//         //         if (object.sku === element.sku) {
//         //             something = objArrayCheck.splice(objArrayCheck.indexOf(object), 1);
//         //             objArrayCheck.push(something);
//         //         }
//         //     })
//         // })
//
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//
//         for (let it = 0; it < objArrayBase.length; it++) {
//             for (let jt = 0; jt < differenceBase.length; jt++) {
//                 if (objArrayBase[it].sku === differenceBase[jt].sku) {
//                     let newObj = {};
//                     newObj = objArrayBase[it];
//                     objArrayBase.splice(it, 1);
//                     objArrayBase.push(newObj);
//                 }
//             }
//         }
//
//         for (let it = 0; it < objArrayCheck.length; it++) {
//             for (let jt = 0; jt < differenceCheck.length; jt++) {
//                 if (objArrayCheck[it].sku === differenceCheck[jt].sku) {
//                     let newObj = {};
//                     newObj = objArrayCheck[it];
//                     objArrayCheck.splice(it, 1);
//                     objArrayCheck.push(newObj);
//                 }
//             }
//         }
//
//         // for (let i = 0; i < baseArr[0].length; i++) {
//         //     for (let j = 0; j < difference.length; j++) {
//         //         if (baseArr[0][i] === difference[j]) {
//         //             baseArr[0].splice(i, 1);
//         //             baseArr[1].splice(i, 1);
//         //         }
//         //     }
//         // }
//         // let newSku, newQuant;
//         // for (let i = 0; i < checkingArr[0].length; i++) {
//         //     for (let j = 0; j < newItems.length; j++) {
//         //         if (checkingArr[0][i] === newItems[j]) {
//         //             newSku = checkingArr[0][i];
//         //             newQuant = checkingArr[1][i];
//         //             checkingArr[0].splice(i, 1);
//         //             checkingArr[1].splice(i, 1);
//         //             checkingArr[0].push(newSku);
//         //             checkingArr[1].push(newQuant);
//         //         }
//         //     }
//         // }
//
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//         console.log("I" + i);
//
//         if (i === 0) {
//             console.log("TEST")
//             console.log("TEST")
//             console.log("TEST")
//             console.log(objArrayBase)
//
//             firstCheck(objArrayBase, objArrayCheck, readyToGoArray);
//
//         } else {
//             console.log(i)
//             console.log(i)
//             console.log(i)
//             console.log(i)
//             console.log(readyToGoArray);
//             console.log(objArrayCheck);
//             elseChecks(readyToGoArray, objArrayCheck);
//         }
//     }
// }

// function elseChecks(readyToGoArray, objArrayCheck){
//     let readyToDifference = readyToGoArray.filter(function (obj) {
//         return !objArrayCheck.some(function (obj2) {
//             return obj.sku === obj2.sku;
//         });
//     });
//
//     for (let it = 0; it < readyToGoArray.length; it++) {
//         for (let jt = 0; jt < readyToDifference.length; jt++) {
//             if (readyToGoArray[it].sku === readyToDifference[jt].sku) {
//                 let newObj = {};
//                 newObj = readyToGoArray[it];
//                 readyToGoArray.splice(it, 1);
//                 readyToGoArray.push(newObj);
//             }
//         }
//     }
//
//     let arrCheckDiff = objArrayCheck.filter(function (obj) {
//         return !readyToGoArray.some(function (obj2) {
//             return obj.sku === obj2.sku;
//         });
//     });
//
//     for (let it = 0; it < objArrayCheck.length; it++) {
//         for (let jt = 0; jt < arrCheckDiff.length; jt++) {
//             if (objArrayCheck[it].sku === arrCheckDiff[jt].sku) {
//                 let newObj = {};
//                 newObj = objArrayCheck[it];
//                 objArrayCheck.splice(it, 1);
//                 objArrayCheck.push(newObj);
//             }
//         }
//     }
//
//     if (readyToGoArray.length > objArrayCheck.length) {
//         for (let i = 0; i < readyToGoArray.length; i++) {
//             for (let j = 0; j < objArrayCheck.length; j++) {
//                 if (objArrayCheck[j] !== undefined) {
//                     if (readyToGoArray[i].quantity > objArrayCheck[j].quantity && objArrayCheck[j].sku === readyToGoArray.sku) {
//                         let reqObject = {
//                             sku: "",
//                             diff: 0,
//                             quantity: 0
//                         }
//                         reqObject.sku = objArrayCheck[j].sku;
//                         reqObject.quantity = objArrayCheck[j].quantity;
//                         reqObject.diff = readyToGoArray[i].diff + objArrayCheck[j].diff;
//                         readyToGoArray.splice(i, 1);
//                         readyToGoArray.push(reqObject);
//                     }
//                 } else {
//                     break;
//                 }
//             }
//         }
//     } else {
//         for (let i = 0; i < objArrayCheck.length; i++) {
//             for (let j = 0; j < readyToGoArray.length; j++) {
//                 if (readyToGoArray[j] !== undefined) {
//                     if (readyToGoArray[j].quantity > objArrayCheck[i].quantity && objArrayCheck[i].sku === readyToGoArray.sku) {
//
//                         let reqObject = {
//                             sku: "",
//                             diff: 0,
//                             quantity: 0
//                         }
//
//                         reqObject.sku = objArrayCheck[i].sku;
//                         reqObject.quantity = objArrayCheck[i].quantity;
//                         reqObject.diff = readyToGoArray[j].diff + objArrayCheck[i].diff;
//                         readyToGoArray.splice(j, 1);
//                         readyToGoArray.push(reqObject);
//                     }
//                 } else {
//                     readyToGoArray.push(objArrayCheck[i]);
//                     break;
//                 }
//             }
//         }
//     }
// }

app.listen(PORT, () => console.log('server is started'));