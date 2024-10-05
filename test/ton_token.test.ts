import { getJettonBalance, getTonBalance } from '../src/ton_token.js';

describe('jetton token balance', () => {
  // 使用实际的钱包地址
  const walletAddress = 'UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ';
  // 代币地址
  const tokenAddress = 'EQD8svLInZtuL_Ck5m8aU-q0xL8Y5KYrHw79kY57RJI1R_FE';

  it('should return balance', async () => {
    const result = await getJettonBalance(walletAddress, tokenAddress);

    expect(result).toHaveProperty('rawBalance');
    expect(result).toHaveProperty('balance');
    expect(typeof result.rawBalance).toBe('string');
    expect(typeof result.balance).toBe('number');
  }, 30000); // 增加超时时间到30秒，因为实际的网络调用可能需要更长时间

  it('should handle invalid wallet address', async () => {
    const invalidWalletAddress = '';

    await expect(getJettonBalance(invalidWalletAddress, tokenAddress)).rejects.toThrow();
  });

  it('should handle invalid token address', async () => {
    const invalidTokenAddress = '';

    await expect(getJettonBalance(walletAddress, invalidTokenAddress)).rejects.toThrow();
  });
});

describe('getTonBalance', () => {
  it('should return balance', async () => {
    const walletAddress = 'UQCLPz9X6eR3RbuJr9ShjTE0QTG0sJrrFBCQ9ZJ7qSNDt0qJ';
    const balance = await getTonBalance(walletAddress);
    expect(typeof balance).toBe('number');
  }, 30000);
});
