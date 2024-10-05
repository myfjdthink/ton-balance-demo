import {TonWalletBalance} from "../src/ton_token";

describe('test all', () => {
  let wallet: TonWalletBalance
  beforeAll(() => {
    wallet = new TonWalletBalance()
  })
  describe('jetton token balance', () => {
    // 使用实际的钱包地址
    const walletAddress = 'UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ';
    // 代币地址
    const tokenAddress = 'EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE';

    it('should return balance with performance logs', async () => {
      const result = await wallet.getJettonBalance(walletAddress, tokenAddress);
      // 其他断言...
    }, 30000);

    it('should handle invalid wallet address', async () => {
      const invalidWalletAddress = '';

      await expect(wallet.getJettonBalance(invalidWalletAddress, tokenAddress)).rejects.toThrow();
    });

    it('should handle invalid token address', async () => {
      const invalidTokenAddress = '';

      await expect(wallet.getJettonBalance(walletAddress, invalidTokenAddress)).rejects.toThrow();
    });
  });

  describe('getTonBalance', () => {
    it('should return balance', async () => {
      const walletAddress = 'UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ';
      const balance = await wallet.getTonBalance(walletAddress);
      expect(typeof balance).toBe('number');
    }, 30000);
  });
})

