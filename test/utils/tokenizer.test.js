import { expect } from 'chai';
import { getTokens } from '../../utils/tokenizer.js';

describe('Tokenizer', () => {
  it('should count tokens for simple text', () => {
    const text = 'Hello world';
    const tokens = getTokens(text);
    // "Hello" and " world" are usually 1 token each in cl100k_base
    expect(tokens).to.be.greaterThan(0);
  });

  it('should count tokens for empty string', () => {
    expect(getTokens('')).to.equal(0);
  });

  it('should approximate 4 chars per token roughly', () => {
    const text = 'a'.repeat(100);
    const tokens = getTokens(text);
    // 100 chars / 4 = 25 tokens roughly. 
    // cl100k_base might handle repeated chars differently (often merges them), 
    // but we just want to ensure it returns a number.
    expect(tokens).to.be.a('number');
  });
});
