const express = require('express');
const cors = require('cors');
const MongoUtil = require('./MongoUtil.js');
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI
const { ObjectId } = require('mongodb');

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

        let criteria = {};
        //add criteria selected by user to criteria object

        console.log("comp ", req.query.osCompatibility)
        if (req.query.osCompatibility) {
            if (Array.isArray(req.query.osCompatibility)) {
                criteria['osCompatibility'] = { '$in': req.query.osCompatibility };
            } else {
                criteria['osCompatibility'] = { '$in': [req.query.osCompatibility] };
            }
        };
        console.log(req.query.hotSwappable)
        if (req.query.keyboardSize) {
            criteria['keyboard.keyboardSize'] = { '$in': [parseInt(req.query.keyboardSize)] };
        };
        if (req.query.hotSwappable) {
            criteria['hotSwappable'] = { '$eq': [req.query.hotSwappable.toString()] };
        };
        if (req.query.keyboardBrand) {
            criteria['keyboard.keyboardBrand'] = { '$exists': true, '$in': [req.query.keyboardBrand.toString()] };
        };
        if (req.query.textSearch) {
            criteria['text'] = { '$search': [req.query.textSearch], '$caseSensitive': false }
        };
        // create text index for text search
        db.collection('mechanical_keyboards').createIndex({
            'switches': "text",
            'keyboard.keyboardBrand': "text",
            'keyboard.keyboardModel': "text",
            'keycap.keycapModel': "text",
            'keycap.keycapMaterial': "text",
            'keycap.keycapProfile': "text",
            'keycap.keycapManufacturer': "text",
        })

        let result = await db.collection('mechanical_keyboards').find( criteria );
        let resultCount = await db.collection('mechanical_keyboards').find( criteria ).count();

        let result1 = await db.collection('mechanical_keyboards').find({
            'osCompatibility': { '$in': ["Windows"] },
            'keyboard.keyboardSize': { '$in': ["80","100","65"] },
            'hotSwappable': { '$eq': "false" },
            'keyboard.keyboardBrand': { '$exists': true, '$in': ['Glorious', 'Keychron', 'Durgod', 'KBDfans', 'Pizzakeyboard', 'Wuque Studios'] },
            '$text': { '$search': "tofu65", '$caseSensitive': false }
        })

        let resultCount1 = await db.collection('mechanical_keyboards').find({
            'osCompatibility': { '$in': ["Windows"] },
            'keyboard.keyboardSize': { '$in': ["80","100","65"] },
            'hotSwappable': { '$eq': "false" },
            'keyboard.keyboardBrand': { '$exists': true, '$in': ['Glorious', 'Keychron', 'Durgod', 'KBDfans', 'Pizzakeyboard', 'Wuque Studios'] },
            '$text': { '$search': "tofu65", '$caseSensitive': false }
        }).count()

        let displayResponse = {
            data: await result.toArray(),
            count: await resultCount,
            data1: await result1.toArray(),
            count1: await resultCount1
        };

        res.send(displayResponse);
    })

    // Validation functions
    function urlValidation(query) {
        if (query.includes("https://", 0)) {
            return query;
        } else {
            return false;
            // return errorMessage = "Not a valid link, must start with https://"
        }
    }
    function textValidation(query) {
        if (query.length >= 3) {
            return query;
        } else {
            return false;
            // return errorMessage = "Must be at least 3 characters long";
        };
    };
    function emailValidation(query) {
        if (query.includes("@") && query.length > 10) {
            return query;
        } else {
            return false;
            // return errorMessage = "Must be a valid email address that includes @ and be more than 10 characters long";
        };
    };
    function passwordValidation(query) {
        let condition1 = false;
        let condition2 = false;
        for (let i = 0; i < query.length; i++) {
            if (isNaN(query[i])) {
                condition1 = false;
            } else {
                condition1 = true;
                break;
            };
        };
        for (let i = 0; i < query.length; i++) {
            let specialCharacters = ["!", "@", "#", "$", "%"]
            for (let each of specialCharacters) {
                if (query[i] === each) {
                    condition2 = true;
                    break;
                } else {
                    condition2 = false;
                };
            };
        };
        console.log(condition1,condition2)
        let conditionMet = condition1 && condition2
        if (conditionMet) {
            return query;
        } else {
            return false;
            // return errorMessage = "Password must contain a number and one of these special characters: !,@,#,$ ";
        }
    }

    //create mechanical_keyboards collection data via ARC in database tgc18_mechanical_keyboards
    app.post('/listings/create', async function (req, res) {
        let osCompatibility = req.body.osCompatibility; //checkbox
        let hotSwappable = req.body.hotSwappable; //radio button
        let switches = req.body.switches; // text --> validation more than 3 characters
        let keyboardBrand = textValidation(req.body.keyboard.keyboardBrand); // dropdown with others option as text --> validation more than or equals to 3 characters
        let keyboardModel = textValidation(req.body.keyboard.keyboardModel); // text --> validation more than or equals to 3 characters
        let keyboardSize = req.body.keyboard.keyboardSize;// dropdown
        let keyboardProductLink = urlValidation(req.body.keyboard.keyboardProductLink); // text -->validation, starts with https://
        let keyboardImage = urlValidation(req.body.keyboard.keyboardImage); // text -->validation, starts with https://
        let keycapModel = textValidation(req.body.keycap.keycapModel); // text --> validation more than or equals to 3 characters
        let keycapMaterial = req.body.keycap.keycapMaterial; // radio button
        let keycapProfile = req.body.keycap.keycapProfile; // dropdown
        let keycapManufacturer = textValidation(req.body.keycap.keycapManufacturer); // text --> validation more than or equals to 3 characters
        let username = req.body.user.username;
        let email = emailValidation(req.body.user.email);
        let password = passwordValidation(req.body.user.password);

        let existUser = await db.collection('mechanical_keyboards').find(
            { 'user.username': { '$eq': req.body.user.username } },
            { 'user.username': 1 }
        )

        console.log(await existUser.toArray())
        // let displayResponseAllEmails = {
        //     data: await allEmails.toArray()
        // };
        // res.send(displayResponseAllEmails);
        validInput = (
            keyboardBrand == false ||
            keyboardModel == false ||
            keyboardProductLink == false ||
            keyboardImage == false ||
            keycapModel == false ||
            keycapManufacturer == false ||
            email == false ||
            password == false
        )
        
        if (validInput == false) {
            console.log("else--->" + validInput)
            console.log("Field Value Valid")
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
        } else {
            console.log("if--->" + validInput)
            res.status(400)
            res.send({
                error: "Field Value invalid"
            })
        };
        
        
    })

    app.put('/listings/review/:id', async function (req, res) {
        // let reviewId = Math.floor(Math.random()*9999+1);
        let comments = req.body.comments
        let username = req.body.username

        // let resultsEditReviews = await db.collection('mechanical_keyboards').find({
        //     'reviews.reviewId': ObjectId(req.params.id),
        // });

        // console.log(await resultsEditReviews.toArray());

        let resultsEditReviews = await db.collection('mechanical_keyboards').updateOne({
            'reviews.reviewId': ObjectId(req.params.id),
        }, {
            '$set': {
                "reviews.$.username": username,
                "reviews.$.comments": comments
            }
        });
        res.status(200);
        res.json(resultsEditReviews);
    });

    app.put('/listings/edit/:id', async function (req, res) {
        let osCompatibility = req.body.osCompatibility; //checkbox
        let hotSwappable = req.body.hotSwappable; //radio button
        let switches = req.body.switches; // text --> validation more than 3 characters
        let keyboardBrand = textValidation(req.body.keyboard.keyboardBrand); // dropdown with others option as text --> validation more than or equals to 3 characters
        let keyboardModel = textValidation(req.body.keyboard.keyboardModel); // text --> validation more than or equals to 3 characters
        let keyboardSize = req.body.keyboard.keyboardSize;// dropdown
        let keyboardProductLink = urlValidation(req.body.keyboard.keyboardProductLink); // text -->validation, starts with https://
        let keyboardImage = urlValidation(req.body.keyboard.keyboardImage); // text -->validation, starts with https://
        let keycapModel = textValidation(req.body.keycap.keycapModel); // text --> validation more than or equals to 3 characters
        let keycapMaterial = req.body.keycap.keycapMaterial; // radio button
        let keycapProfile = req.body.keycap.keycapProfile; // dropdown
        let keycapManufacturer = textValidation(req.body.keycap.keycapManufacturer); // text --> validation more than or equals to 3 characters
        let username = req.body.user.username;
        let email = emailValidation(req.body.user.email);
        let password = passwordValidation(req.body.user.password);
        
        let resultsEditListing = await db.collection('mechanical_keyboards').updateOne({
            '_id': ObjectId(req.params.id)
        }, {
            '$set': {
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
                }
            }
        });
        res.status(200);
        res.json(resultsEditListing);
    })


    app.delete('/listings/delete/:id', async function (req, res) {
        let results = await db.collection('mechanical_keyboards').deleteOne({
            '_id': ObjectId(req.params.id)
        });
        res.status(200);
        res.json({
            'status': 'Ok'
        })
    })

    app.listen(8000, () => {
        console.log("Server started")
    })
}

main();


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
//     'reviews':[
//         {'_id':'r_id1',reviewer:Avery},      
//         {'_id':'r_id2',reviewer:Steph}
//     ]
// }