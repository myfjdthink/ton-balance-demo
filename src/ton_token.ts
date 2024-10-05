import {AssetsSDK, TonClientApi} from '@ton-community/assets-sdk'
import _ from 'lodash'
import TonWeb from "tonweb";
import {TonClient4, TonClient, Address} from "@ton/ton";
import {getHttpV4Endpoint, getHttpEndpoint} from "@orbs-network/ton-access";

export async function createApi(): Promise<TonClientApi> {
  const endpoint = await getHttpV4Endpoint({host: 'https://toncenter.com/api/v2/jsonRPC'});
  return new TonClient4({ endpoint: endpoint, timeout: 15000 })
}

export async function getJettonBalance (walletAddress: string, tokenAddress: string) {
  if (!walletAddress || !tokenAddress) {
    throw new Error('Both walletAddress and tokenAddress are required');
  }
  if (typeof walletAddress !== 'string' || typeof tokenAddress !== 'string') {
    throw new Error('walletAddress and tokenAddress must be strings');
  }
  if (walletAddress.trim() === '' || tokenAddress.trim() === '') {
    throw new Error('walletAddress and tokenAddress cannot be empty strings');
  }

  const api = await createApi()
  const sdk = AssetsSDK.create({api: api})

  const master = sdk.openJetton(Address.parse(tokenAddress))

  const content = await master.getContent()
  console.log('content: ', content)
  const decimals = _.get(content, 'decimals', 9)

  const userWallet = await master.getWallet(Address.parse(walletAddress))
  const userWalletData = await userWallet.getData()
  const balance = userWalletData.balance

  const res = {
    rawBalance: balance.toString(),
    balance: Number(balance) / Math.pow(10, decimals) // convert to human readable format, maybe lose precision
  }
  console.log(res)
  return res
}


export async function getJettonBalance2 (walletAddress: string, tokenAddress: string) {
  if (!walletAddress || !tokenAddress) {
    throw new Error('Both walletAddress and tokenAddress are required');
  }

  if (typeof walletAddress !== 'string' || typeof tokenAddress !== 'string') {
    throw new Error('walletAddress and tokenAddress must be strings');
  }

  if (walletAddress.trim() === '' || tokenAddress.trim() === '') {
    throw new Error('walletAddress and tokenAddress cannot be empty strings');
  }
  // const { JettonWallet } = TonWeb.token.jetton;
  const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC')); // Replace with your node URL

  // const WalletContractV4R2 = tonweb.wallet.all.v4R2
  const wallet = tonweb.wallet.create({address: tokenAddress}); // if your know only address at this moment

  // const address = await wallet.getAddress();

  const balance = await wallet.methods.seqno().call();
  console.log(`Jetton balance for ${walletAddress}: ${balance}`)
  return 0
  // try {
  //   // Get Jetton wallet address from master contract
  //   const { value0: jettonWalletAddress } = await jettonMaster.call('get_wallet_address', [{ type: 'slice', value: walletAddress }]);
  //
  //   // Create JettonWallet instance
  //   const jettonWallet = new JettonWallet(tonweb.provider, { address: jettonWalletAddress });
  //
  //   // Get Jetton wallet data
  //   const walletData = await jettonWallet.getData();
  //
  //   // Access the balance (likely a BigInt)
  //   const jettonBalance = walletData.balance;
  //
  //   console.log(`Jetton balance for ${walletAddress}: ${jettonBalance}`);
  //   return jettonBalance;
  //
  // } catch (error) {
  //   console.error('Error getting Jetton balance:', error);
  //   return 0;
  // }

}

export async function getTonBalance2(walletAddress: string) {
  // const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));
  //
  // // 要查询余额的钱包地址
  // // const address = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'; // 将此替换为实际的钱包地址
  // try {
  //   const balance = await tonweb.getBalance(walletAddress);
  //   // 将 nano TON 转换为 TON:  balance / 1000000000
  //   const tonBalance = parseInt(balance) / 1000000000
  //   console.log(`钱包地址 ${walletAddress} 的余额为: ${tonBalance} TON`);
  //   return tonBalance
  // } catch (error) {
  //   console.error('获取余额失败:', error);
  // }
}

export async function getTonBalance(walletAddress: string) {
  const endpoint = await getHttpEndpoint(); // get the decentralized RPC endpoint
  const client = new TonClient({ endpoint }); // initialize ton library

  // make some query to mainnet
  const address = Address.parseFriendly(walletAddress).address;
  try {
    const balance = await client.getBalance(address);
    // bitint to number
    const tonBalance = Number(balance) / 1000000000
    // 将 nano TON 转换为 TON:  balance / 1000000000
    // const tonBalance = parseInt(balance) / 1000000000
    console.log(`钱包地址 ${walletAddress} 的余额为: ${tonBalance} TON`);
    return tonBalance
  } catch (error) {
    console.error('获取余额失败:', error);
  }
}

export async function main () {
  // const res = await getBalance('UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ', 'EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE')
  // console.log(res)

  // ton UQDUkrz1Bm7DeAhIIezdIeX4mHDw1lkdMUzs7g5JbCrS_Nod

  // Token  EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE
  // Address UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ
  getTonBalance('UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ')
}
