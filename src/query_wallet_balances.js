const { MongoClient } = require('mongodb');
const { TonWalletBalance } = require('./ton_token');

// MongoDB connection URI and database/collection names
const uri = 'mongodb://localhost:57017';
const dbName = 'ton';
const collectionName = 'user_wallet';
const resultCollectionName = 'wallet_balances';

// Token addresses
const USDT_TOKEN_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const NOT_TOKEN_ADDRESS = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';

// Batch size for processing
const BATCH_SIZE = 20;

async function queryBalances() {
    const client = new MongoClient(uri);
    const tonWalletBalance = new TonWalletBalance();
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const resultCollection = db.collection(resultCollectionName);

        // Get total count of documents
        const totalCount = await collection.countDocuments();
        let processedCount = 0;

        while (processedCount < totalCount) {
            // Fetch a batch of wallet addresses
            const wallets = await collection.find().skip(processedCount).limit(BATCH_SIZE).toArray();

            // Process each wallet concurrently
            const promises = wallets.map(async (wallet) => {
                const { wallet_address } = wallet;

                // Check if the wallet has already been processed
                const existingRecord = await resultCollection.findOne({ wallet_address });
                if (existingRecord) {
                    console.log(`Skipping already processed wallet: ${wallet_address}`);
                    return;
                }

                try {
                    // Query TON balance
                    const tonBalance = await tonWalletBalance.getTonBalance(wallet_address);

                    let usdtBalance = null;
                    let notBalance = null;

                    // Only query USDT and NOT balances if TON balance is greater than 0
                    if (tonBalance > 0) {
                        usdtBalance = await tonWalletBalance.getJettonBalance(wallet_address, USDT_TOKEN_ADDRESS);
                        notBalance = await tonWalletBalance.getJettonBalance(wallet_address, NOT_TOKEN_ADDRESS);
                    }

                    // Write results to the new collection
                    await resultCollection.updateOne(
                        { wallet_address },
                        { $set: { tonBalance, usdtBalance: usdtBalance ? usdtBalance.balance : null, notBalance: notBalance ? notBalance.balance : null } },
                        { upsert: true }
                    );
                } catch (error) {
                    console.error(`Error querying balances for wallet ${wallet_address}:`, error);
                }
            });

            // Wait for all promises to resolve
            await Promise.all(promises);

            processedCount += wallets.length;
            const progress = ((processedCount / totalCount) * 100).toFixed(2);
            console.log(`Total Processed ${processedCount} / ${totalCount} wallets (${progress}%)`);
        }
    } catch (error) {
        console.error('Error querying balances:', error);
    } finally {
        await client.close();
    }
}

queryBalances().catch(console.error);
