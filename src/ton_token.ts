import {AssetsSDK, TonClientApi} from '@ton-community/assets-sdk'
import _ from 'lodash'
import {TonClient4, TonClient, Address} from "@ton/ton";
import {getHttpV4Endpoint, getHttpEndpoint} from "@orbs-network/ton-access";


export class TonWalletBalance {
  private clientV4: TonClient4;
  private client: TonClient;
  private decimalsCache: Map<string, number>;

  constructor () {
    this.decimalsCache = new Map<string, number>();
    this.decimalsCache.set('EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE', 9)
    this.init().then().catch(console.error)
  }

  async init () {
    const endpoint = await getHttpEndpoint()
    const endpoint4 = await getHttpV4Endpoint()
    this.clientV4 = new TonClient4({endpoint: endpoint4, timeout: 15000})
    this.client = new TonClient({endpoint: endpoint, timeout: 15000})
  }

  async getTonBalance (walletAddress: string): Promise<number> {
    if (!this.client) {
      await this.init()
    }
    try {
      const address = Address.parseFriendly(walletAddress).address;
      const balance = await this.client.getBalance(address);
      const tonBalance = Number(balance) / 1e9;
      console.log(`钱包地址 ${walletAddress} 的余额为: ${tonBalance} TON`);
      return tonBalance;
    } catch (error) {
      console.error('获取余额失败:', error);
      return 0
    }
  }

  async getJettonBalance (walletAddress: string, tokenAddress: string) {
    console.time('getJettonBalance');
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

    console.time('init');
    if (!this.clientV4) {
      await this.init()
    }
    console.timeEnd('init');

    console.time('createSDK');
    const sdk = AssetsSDK.create({api: this.clientV4})
    console.timeEnd('createSDK');

    console.time('openJetton');
    const master = sdk.openJetton(Address.parse(tokenAddress))
    console.timeEnd('openJetton');

    let decimals: number;
    console.time('getDecimals');
    if (this.decimalsCache.has(tokenAddress)) {
      decimals = this.decimalsCache.get(tokenAddress)!;
      console.log('使用缓存的小数位数');
    } else {
      const content = await master.getContent();
      decimals = _.get(content, 'decimals', 9);
      this.decimalsCache.set(tokenAddress, decimals);
      console.log('获取并缓存新的小数位数');
    }
    console.timeEnd('getDecimals');

    console.time('getWallet');
    const userWallet = await master.getWallet(Address.parse(walletAddress))
    console.timeEnd('getWallet');

    console.time('getData');
    const userWalletData = await userWallet.getData()
    console.timeEnd('getData');

    const balance = userWalletData.balance

    const res = {
      rawBalance: balance.toString(),
      balance: Number(balance) / Math.pow(10, decimals) // convert to human readable format, maybe lose precision
    }
    console.log('查询结果:', res);
    console.timeEnd('getJettonBalance');
    return res
  }


}

