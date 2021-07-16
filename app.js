const MongoClient = require('Mongodb').MongoClient;

const circulationRepo = require('./repos/circulationRepo');
const assert = require('assert');
const data = require('./circulation.json');

const url = 'mongodb://localhost:27017';
const dbname = 'circulation';

async function main(){
    const client = new MongoClient(url);
    await client.connect();

    try {
        const results = await circulationRepo.loadData(data);
        assert.strictEqual(data.length, results.insertedCount);
    
        const getData = await circulationRepo.get();
        assert.strictEqual(data.length, getData.length);

        const filterdata = await circulationRepo.get({Newspaper: getData[4].Newspaper});
        assert.deepStrictEqual(filterdata[0], getData[4]);

        // == Get with querry and limiter
        const limitData = await circulationRepo.get({}, 3)
        assert.equal(limitData.length, 3);

        // == getById
        let id = getData[4]._id.toString();
        item = await circulationRepo.getById(id);
        assert.deepStrictEqual(item, getData[4]);

        // == Add item
        let newItem = {
            "Newspaper": "Gyllinsträdgård Journal",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 2,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        },
        
        addedItem = await circulationRepo.add(newItem);
        // if the item was added it will recieve an id
        assert(addedItem._id);
        // lets check the deepEqual

        const addedItemQuerry = await circulationRepo.getById(addedItem._id);
        assert.deepStrictEqual(addedItemQuerry, newItem);

        //== Update item
        const updatedItem = await circulationRepo.update(addedItem._id, {
                "Newspaper": "Updated Gyllinsträdgård Journal",
                "Daily Circulation, 2004": 1,
                "Daily Circulation, 2013": 2,
                "Change in Daily Circulation, 2004-2013": 100,
                "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
                "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
                "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        } );
        assert.strictEqual(updatedItem.Newspaper, "Updated Gyllinsträdgård Journal");

        const newAddedItemQuerry = await circulationRepo.getById(addedItem._id);
        assert.strictEqual(newAddedItemQuerry.Newspaper, "Updated Gyllinsträdgård Journal");

        // ==Remove Item
        const removed = await circulationRepo.remove(addedItem._id);
        assert(removed);

        const removedItemQuerry = await circulationRepo.getById(addedItem._id);
        assert.strictEqual(removedItemQuerry, null);

        // Avarge Finalists - Easy
        const avrFinalists = await circulationRepo.averageFinalists();
        console.log("Avarage finalists: " + avrFinalists);

        // Averge Finalist by CirculationChange
        const avrFinalistByChange = await circulationRepo.averageFinalistsByChange();
        console.log(avrFinalistByChange);

    } catch (error) {
        console.log(error);
    } finally {
        const admin = client.db(dbname).admin();

        client.db(dbname).dropDatabase();
        console.log(await admin.listDatabases());

        client.close();
    }
}

main();
