const express = require('express');
const cors = require('cors');
const MongoUtil = require('./MongoUtil.js');
const TextValidation = require('./TextValidation.js')
const UrlValidation = require('./UrlValidation.js')
const EmailValidation = require('./EmailValidation.js')
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;
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

        if (req.query.osCompatibility) {
            if (Array.isArray(req.query.osCompatibility)) {
                criteria['osCompatibility'] = { '$in': [req.query.osCompatibility] };
            } else {
                criteria['osCompatibility'] = { '$in': [req.query.osCompatibility] };
            }
        };
        if (req.query.hotSwappable) {
            criteria['hotSwappable'] = { '$eq': req.query.hotSwappable.toString() };
        };
        if (req.query.keyboardSize) {
            let keyboardSize = req.query.keyboardSize
            if (keyboardSize.includes(',')) {
                keyboardSize = keyboardSize.split(',')
                criteria['keyboard.keyboardSize'] = { '$in': keyboardSize };
            } else {
                criteria['keyboard.keyboardSize'] = { '$in': [req.query.keyboardSize] };
            }
        };
        if (req.query.keyboardBrand) {
            let keyboardBrand = req.query.keyboardBrand
            if (keyboardBrand.includes(',')) {
                keyboardBrand = keyboardBrand.split(',')
                criteria['keyboard.keyboardBrand'] = { '$exists': true, '$in': keyboardBrand };
            } else {
                criteria['keyboard.keyboardBrand'] = { '$exists': true, '$in': [keyboardBrand] };
            }
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

        let result = await db.collection('mechanical_keyboards').find(criteria);
        let resultCount = await db.collection('mechanical_keyboards').find(criteria).count();
        let result1 = await db.collection('mechanical_keyboards').find({});
        let resultCount1 = await db.collection('mechanical_keyboards').find({}).count();

        // let result2 = await db.collection('mechanical_keyboards').find({
        //     'osCompatibility': { '$in': ["Windows"] },
        //     'keyboard.keyboardSize': { '$in': ["80", "100", "65"] },
        //     'hotSwappable': { '$eq': "false" },
        //     'keyboard.keyboardBrand': { '$exists': true, '$in': ['Glorious', 'Keychron', 'Durgod', 'KBDfans', 'Pizzakeyboard', 'Wuque Studios'] },
        //     '$text': { '$search': "tofu65", '$caseSensitive': false }
        // })

        // let resultCount2 = await db.collection('mechanical_keyboards').find({
        //     'osCompatibility': { '$in': ["Windows"] },
        //     'keyboard.keyboardSize': { '$in': ["80", "100", "65"] },
        //     'hotSwappable': { '$eq': "false" },
        //     'keyboard.keyboardBrand': { '$exists': true, '$in': ['Glorious', 'Keychron', 'Durgod', 'KBDfans', 'Pizzakeyboard', 'Wuque Studios'] },
        //     '$text': { '$search': "tofu65", '$caseSensitive': false }
        // }).count()

        let displayResponse = {
            data: await result.toArray(),
            count: await resultCount,
            data1: await result1.toArray(),
            count1: await resultCount1
        };
        console.log(req.query.osCompatibility, req.query.hotSwappable, req.query.keyboardSize)
        console.log(criteria)
        res.send(displayResponse);
    })

    //create mechanical_keyboards collection data via ARC in database tgc18_mechanical_keyboards
    app.post('/listings/create', async function (req, res) {
        let osCompatibility = req.body.osCompatibility; //checkbox
        if(osCompatibility==="Windows" || osCompatibility==="Mac" || osCompatibility==="Linux"){
            osCompatibility = req.body.osCompatibility;
        }else{
            osCompatibility = false;
        };
        let hotSwappable = req.body.hotSwappable; //radio button
        if (hotSwappable==="true" || hotSwappable ==="false"){
            hotSwappable = req.body.hotSwappable;
        }else {
            hotSwappable = false;
        };
        let switches = TextValidation.connect(req.body.switches,5); 
        let keyboardBrand = TextValidation.connect(req.body.keyboard.keyboardBrand,5);
        let keyboardModel = TextValidation.connect(req.body.keyboard.keyboardModel,3);
        let keyboardSize = req.body.keyboard.keyboardSize;
        if(keyboardSize==="60" || keyboardSize==="65" || keyboardSize==="75" || keyboardSize==="80" || keyboardSize==="100"){
            keyboardSize = req.body.keyboard.keyboardSize;
        }else{
            keyboardSize = false
        }
        let keyboardProductLink = UrlValidation.connect(req.body.keyboard.keyboardProductLink); 
        let keyboardImage = UrlValidation.connect(req.body.keyboard.keyboardImage); 
        let keycapModel = TextValidation.connect(req.body.keycap.keycapModel,3); 
        let keycapMaterial = TextValidation.connect(req.body.keycap.keycapMaterial,3); 
        let keycapProfile = TextValidation.connect(req.body.keycap.keycapProfile,2); 
        let keycapManufacturer = TextValidation.connect(req.body.keycap.keycapManufacturer,3); 
        let username = TextValidation.connect(req.body.user.username,5);
        let email = EmailValidation.connect(req.body.user.email);
        
        validInput = (
            keyboardBrand == false ||
            keyboardModel == false ||
            keyboardProductLink == false ||
            keyboardImage == false ||
            keycapModel == false ||
            keycapManufacturer == false ||
            email == false 
        )

        let record= {
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
                email
            },
            'reviews':[null]
        }
        console.log(record)
        
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
                        email
                    },
                    'reviews':[]
                })
                let item = await db.collection('mechanical_keyboards').find({},{'_id':'1'}).sort({_id:-1}).toArray()
                item = item[0]
                result.insertedId = item._id;
                console.log("insertedId-------",item)
                console.log("insertedId-------",result.insertedId)

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

    //create review
    app.post('/listings/review/create/:id', async function (req, res) {
        let comments = req.body.comments;
        let username = req.body.username;
        let email = req.body.email;
        let resultCreateReview = await db.collection('mechanical_keyboards').updateOne(
            { '_id': ObjectId(req.params.id) },
            {
                '$push': {
                    'reviews': {
                        reviewId: new ObjectId(),
                        username,
                        email,
                        comments
                    }
                }
            }
        )
        let item = await db.collection('mechanical_keyboards').findOne(
            { '_id': ObjectId(req.params.id) }
        )
        resultCreateReview.insertedId = item.reviews.slice(-1)[0].reviewId;
        console.log(resultCreateReview.insertedId)
        res.status(200);
        res.json(resultCreateReview)
    })

    app.post('/listings/review/delete/:id', async function (req, res) {
        try {
            let resultDeleteReview = await db.collection('mechanical_keyboards').updateOne(
                { 'reviews.reviewId': ObjectId(req.params.id) },
                {
                    '$pull': {
                        'reviews':
                        {
                            'reviewId': ObjectId(req.params.id)
                        }
                    }
                }
            )
            res.status(200);
            res.json(resultDeleteReview)
        } catch (e) {
            res.status(500);
            res.send({
                error: "Internal server error, please contact administrator"
            })
            console.log(e)
        }
    })

    app.post('/listings/review/edit/:id', async function (req, res) {
        try {
            let comments = req.body.comments

            let resultsEditReview = await db.collection('mechanical_keyboards').updateOne({
                'reviews.reviewId': ObjectId(req.params.id),
            }, {
                '$set': {
                    'reviews.$.comments': comments
                }
            });
            res.status(200);
            res.json(resultsEditReview);
        } catch (e) {
            res.status(500);
            res.send({
                error: "Internal server error, please contact administrator"
            })
            console.log(e)
        }
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
        let resultsEditListingFind = await db.collection('mechanical_keyboards').findOne({
            '_id': ObjectId(req.params.id)
            },{

            }
        )
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
                    email
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
//         "email":"candice854@gmail.com"
//     }
//     'reviews':[
//         {'_id':'r_id1',reviewer:Avery},      
//         {'_id':'r_id2',reviewer:Steph}
//     ]
// }