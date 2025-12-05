import { getEncoding } from 'js-tiktoken';

// Cache the encoder
let encoder;

export function getTokens(text) {
  if (!encoder) {
    encoder = getEncoding('cl100k_base'); // GPT-4/3.5 tokenizer
  }
  return encoder.encode(text).length;
}
