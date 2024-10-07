import { MongoClient } from 'mongodb';
import { TonWalletBalance } from './ton_token';

// MongoDB connection URI and database/collection names
const uri = 'your_mongodb_uri';
const dbName = 'your_database_name';
const collectionName = 'user_wallet';
const resultCollectionName = 'wallet_balances';

// Token addresses
const USDT_TOKEN_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const NOT_TOKEN_ADDRESS = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';

// Batch size for processing
const BATCH_SIZE = 1;

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

            for (const wallet of wallets) {
                const { wallet_address } = wallet;

                // Check if the wallet has already been processed
                const existingRecord = await resultCollection.findOne({ wallet_address });
                if (existingRecord) {
                    console.log(`Skipping already processed wallet: ${wallet_address}`);
                    continue;
                }

                try {
                    // Query balances
                    const tonBalance = await tonWalletBalance.getTonBalance(wallet_address);
                    const usdtBalance = await tonWalletBalance.getJettonBalance(wallet_address, USDT_TOKEN_ADDRESS);
                    const notBalance = await tonWalletBalance.getJettonBalance(wallet_address, NOT_TOKEN_ADDRESS);

                    // Write results to the new collection
                    await resultCollection.updateOne(
                        { wallet_address },
                        { $set: { tonBalance, usdtBalance, notBalance } },
                        { upsert: true }
                    );
                } catch (error) {
                    console.error(`Error querying balances for wallet ${wallet_address}:`, error);
                }
            }

            processedCount += wallets.length;
            console.log(`Processed ${processedCount} / ${totalCount} wallets`);
        }
    } catch (error) {
        console.error('Error querying balances:', error);
    } finally {
        await client.close();
    }
}

queryBalances().catch(console.error);