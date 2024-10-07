const { AssetsSDK, TonClientApi } = require('@ton-community/assets-sdk');
const _ = require('lodash');
const { TonClient4, TonClient, Address } = require("@ton/ton");
const { getHttpV4Endpoint, getHttpEndpoint } = require("@orbs-network/ton-access");

class TonWalletBalance {
    constructor() {
        this.decimalsCache = new Map();
        this.decimalsCache.set('EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE', 9);
        this.decimalsCache.set('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', 6);
        this.decimalsCache.set('EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT', 9);
        this.init().then().catch(console.error);
    }

    async init() {
        const endpoint = await getHttpEndpoint();
        const endpoint4 = await getHttpV4Endpoint();
        this.clientV4 = new TonClient4({ endpoint: endpoint4, timeout: 15000 });
        this.client = new TonClient({ endpoint: endpoint, timeout: 15000 });
    }

    async getTonBalance(walletAddress) {
        if (!this.client) {
            await this.init();
        }
        try {
            const address = Address.parseFriendly(walletAddress).address;
            const balance = await this.client.getBalance(address);
            const tonBalance = Number(balance) / 1e9;
            console.log(`钱包地址 ${walletAddress} 的余额为: ${tonBalance} TON`);
            return tonBalance;
        } catch (error) {
            console.error('获取余额失败:', error);
            return 0;
        }
    }

    async getJettonBalance(walletAddress, tokenAddress) {
        console.log(`开始查询 Jetton 余额: 钱包地址 ${walletAddress}, 代币地址 ${tokenAddress}`);

        if (!walletAddress || !tokenAddress) {
            throw new Error('Both walletAddress and tokenAddress are required');
        }
        if (typeof walletAddress !== 'string' || typeof tokenAddress !== 'string') {
            throw new Error('walletAddress and tokenAddress must be strings');
        }
        if (walletAddress.trim() === '' || tokenAddress.trim() === '') {
            throw new Error('walletAddress and tokenAddress cannot be empty strings');
        }

        if (!this.clientV4) {
            await this.init();
        }

        const sdk = AssetsSDK.create({ api: this.clientV4 });

        const master = sdk.openJetton(Address.parse(tokenAddress));

        let decimals;
        if (this.decimalsCache.has(tokenAddress)) {
            decimals = this.decimalsCache.get(tokenAddress);
            console.log('使用缓存的小数位数');
        } else {
            const content = await master.getContent();
            decimals = _.get(content, 'decimals', 9);
            this.decimalsCache.set(tokenAddress, decimals);
            console.log('获取并缓存新的小数位数', decimals, tokenAddress);
        }

        const userWallet = await master.getWallet(Address.parse(walletAddress));

        try {
            const userWalletData = await userWallet.getData();
            const balance = userWalletData.balance;

            const res = {
                rawBalance: balance.toString(),
                balance: Number(balance) / Math.pow(10, decimals) // convert to human readable format, maybe lose precision
            };
            console.log('查询结果:', res);
            return res;
        } catch (error) {
            // console.error('获取用户钱包数据失败:', error);
            return {
                rawBalance: '0',
                balance: 0
            };
        }
    }
}

module.exports = { TonWalletBalance };