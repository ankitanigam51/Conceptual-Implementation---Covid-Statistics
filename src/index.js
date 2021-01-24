const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')
const covidTallyModel = connection;

app.get("/totalRecovered", async (req, res) => {
    const doc = await covidTallyModel.aggregate([{
        $group: {
            _id: "total",
            recovered: { $sum: "$recovered" },
        }
    }]);
    const result = doc[0];
    res.send({ data: result });
});

app.get("/totalDeath", async (req, res) => {
    const doc = await covidTallyModel.aggregate([{
        $group: {
            _id: "total",
            death: { $sum: "$death" }
        }
    }]);
    const result = doc[0];
    res.send({ data: result });
});

app.get("/totalActive", async (req, res) => {
    const doc = await covidTallyModel.aggregate([{
        $group: {
            _id: "total",
            recovered: { $sum: "$recovered" },
            infected: { $sum: "$infected" }
        }
    }]);
    const result = doc[0];
    res.send({ data: { _id: "total", active: result.infected - result.recovered } });
});

app.get('/hotspotStates', async (req, res) => {
    const data = await covidTallyModel.aggregate([
        {
            $project: {
                state: "$state",
                rate: { $round: [{ $divide: [{ $subtract: ["$infected", "$recovered"]}, "$infected"]}, 5] }
            }
        },
        {
            $match: {
                rate: { $gt: 0.1 }
            }
        }
    ]);

    const result = data;
    res.send({ data: result });
})

app.get('/healthyStates', async (req,res)=>{
    const result= await covidTallyModel.aggregate([{
        $project : {
            state : "$state",
            mortality: {
                $round: [{
                    $divide: [
                        "$death", "$infected"
                    ]
                },5]
            }
        }
    },
    {
        $match: {
            mortality: { $lt : 0.005 }
        }
    }
]);
res.send({data : result});
})





app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;