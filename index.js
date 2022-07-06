const express = require('express');
const cors = require('cors');
const MongoUtil = require('./MongoUtil.js')
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI

const app = express();
app.use(cors());
app.use(express.json());

async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "tgc18_mechanical_keyboards");
    console.log('database is connected');

    app.get('/', function (req, res) {
        res.send('hello world');
    });

    app.get('/listings', async function (req, res) {

        // let criteria = {};
        let hotSwappableQuery = req.query.hotSwappable;
        function hotSwappableValidation(query) {
            if (query === "yes") {
                return true;
            } else {
                return false;
            };
        }

        // if (req.query.hotSwappable) {
        //     criteria['hotSwappable'] = {'$eq':hotSwappableValidation ('yes').toString()};
        // };

        let result = await db.collection('mechanical_keyboards').find({
            'osCompatibility': { '$in': ['Windows'] },
            'keyboard.keyboardSize': { '$in': ['100'] },
            'hotSwappable': { '$eq': hotSwappableValidation('yes').toString() },
            // 'hotSwappable' : {'$eq':'true'},
            'keyboard.keyboardBrand': { '$exists': true, '$in': ['Glorious', 'Keychron'] },
            // 'keycap.keycapProfile':{}

            // 'osCompatibility': { '$in': [req.query.osCompatibility] }
            // 'keyboard.keyboardSize' : {'$in':[req.query.keyboardSize]}
            // 'hotSwappable' : {'$eq':[req.query.hotSwappable]}
            // 'keyboard.keyboardBrand' : {'$exists':true, '$in':[req.query.keyboardBrand]},
            // 'keycap.keycapManufacturer':{}
        })

        let resultCount = await db.collection('mechanical_keyboards').find({
            osCompatibility: { '$in': ['Windows'] }
            // osCompatibility: { '$in': [req.query.osCompatibility] }
        }).count
        res.send(await result.toArray());
        console.log(await result.toArray());
        // res.send(await resultCount);
    })

    //create mechanical_keyboards collection data via ARC in database tgc18_mechanical_keyboards
    app.post('/create', async function (req, res) {
        let osCompatibility = req.body.osCompatibility;
        let hotSwappable = req.body.hotSwappable;
        let switches = req.body.switches;
        let keyboardBrand = req.body.keyboard.keyboardBrand;
        let keyboardModel = req.body.keyboard.keyboardModel;
        let keyboardSize = req.body.keyboard.keyboardSize;
        let keyboardProductLink = req.body.keyboard.keyboardProductLink;
        let keyboardImage = req.body.keyboard.keyboardImage;
        let keycapModel = req.body.keycap.keycapModel;
        let keycapMaterial = req.body.keycap.keycapMaterial;
        let keycapProfile = req.body.keycap.keycapProfile;
        let keycapManufacturer = req.body.keycap.keycapManufacturer;
        let username = req.body.user.username
        let email = req.body.user.email
        let password = req.body.user.password
        try {
            let result = await db.collection("mechanical_keyboards").insertOne({
                osCompatibility,
                hotSwappable,
                switches,
                'keyboard': {
                    keyboardBrand,
                    keyboardModel,
                    keyboardSize,
                    keyboardProductLink,
                    keyboardImage
                },
                'keycap': {
                    keycapModel,
                    keycapMaterial,
                    keycapProfile,
                    keycapManufacturer
                },
                'user': {
                    username,
                    email,
                    password
                },
            })
            res.status(200);
            res.send(result)
        } catch (e) {
            res.status(500);
            res.send({
                error: "Internal server error, please contact administrator"
            })
            console.log(e)

        }
    })

    app.listen(8000, () => {
        console.log("Server started")
    })
}

main();


// state= {
//     keyboards:{
//       '_id':'id1',
//       'os-compatibility':['mac','windows','linux'],
//       'keyboard':{
//         'Brand':'ducky',
//         'Model':'One 2 Mini',
//         'size': 60, (60,65,75,80,full-size)
//         'Designed by':'Ai03',
//         'Product Link':'url1'
//       },
//       'keycap':{
//          model:name,
//          material:'ABS',
//          profile: cherry/sa/etc,
//          manufacturer:
//        } 
//       'switch': 'cherry',
//       'user':{
//          'name:'John',
//          'email':'j@123.com'
//          },
//       'reviews':[
//         {'_id':'r_id1',reviewer:Avery},      
//         {'_id':'r_id2',reviewer:Steph}
//       ]
//     }
//   }

// {
//     "osCompatibility":"Windows",
//     "hotSwappable":"true",
//     "switches":"Glorious Panda Tactile Switches",
//     "keyboard": {
//         "keyboardBrand":"Glorious",
//         "keyboardModel":"GMMK2",
//         "keyboardSize":"100",
//         "keyboardProductLink":"https://www.gloriousgaming.com/products/gmmk2",
//         "keyboardImage":""
//     },
//     "keycap": {
//         "keycapModel":"Black and Silver",
//         "keycapMaterial":"PBT double shot",
//         "keycapProfile":"ASA",
//         "keycapManufacturer":"Akko"
//     },
//     "user":{
//         "username":"candice854",
//         "email":"candice854@gmail.com",
//         "password:"Curry3gg!"
//     }
// }