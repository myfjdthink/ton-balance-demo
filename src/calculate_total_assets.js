const { MongoClient } = require('mongodb');

// MongoDB connection URI and database/collection names
const uri = 'mongodb://localhost:57017';
const dbName = 'ton';
const collectionName = 'wallet_balances';

// Prices for each token
const NOT_PRICE = 0.008097;
const USDT_PRICE = 1;
const TON_PRICE = 5.29;

async function calculateTotalAssets() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Find all documents that do not have a totalAsset field
        const cursor = collection.find({ totalAsset: { $exists: false } });

        while (await cursor.hasNext()) {
            const document = await cursor.next();
            const { wallet_address, notBalance, tonBalance, usdtBalance } = document;

            // Handle null values by defaulting to 0
            const notBalanceValue = notBalance !== null ? notBalance : 0;
            const usdtBalanceValue = usdtBalance !== null ? usdtBalance : 0;

            // Calculate total assets
            const totalAsset = (notBalanceValue * NOT_PRICE) + (tonBalance * TON_PRICE) + (usdtBalanceValue * USDT_PRICE);

            // Update the document with the total asset value
            await collection.updateOne(
                { wallet_address },
                { $set: { totalAsset } }
            );

            console.log(`Updated total assets for wallet: ${wallet_address} - Total Asset: ${totalAsset}`);
        }
    } catch (error) {
        console.error('Error calculating total assets:', error);
    } finally {
        await client.close();
    }
}

calculateTotalAssets().catch(console.error);