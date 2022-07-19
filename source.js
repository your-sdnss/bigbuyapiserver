const path = require("path");
const fs = require("fs");
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

	console.log("get dates");

    res.json(dates);
}));

app.post('/new-items', ((req, res) => {
    let {name} = req.body

    console.log(req.body);


    let data = postData(name);

	console.log("new item")


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
