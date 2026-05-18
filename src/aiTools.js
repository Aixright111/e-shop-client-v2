/**
 * AI 工具：语义搜索
 * 用 LLM 优化用户提示词后，遍历商品列表比对 embedding，返回匹配结果
 */
import OpenAI from 'openai';
import { getProductsApi } from './api/product';

let dashscope = null;
function getDashscope() {
  if (!dashscope) {
    dashscope = new OpenAI({
      apiKey: process.env.REACT_APP_DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      dangerouslyAllowBrowser: true,
    });
  }
  return dashscope;
}

let deepseek = null;
function getDeepseek() {
  if (!deepseek) {
    deepseek = new OpenAI({
      apiKey: process.env.REACT_APP_DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true,
    });
  }
  return deepseek;
}

const SIMILARITY_THRESHOLD = 0.4;
const PAGE_SIZE = 100;

// 获取所有商品（分页拉取）
async function fetchAllProducts() {
  const allItems = [];
  let page = 0;

  while (true) {
    const res = await getProductsApi(page, PAGE_SIZE);
    if (res.code !== 0 || !res.data) break;
    const items = (res.data.items || []).filter((p) => p.show !== false);
    if (items.length === 0) break;
    allItems.push(...items);
    page++;
  }
  return allItems;
}

// 获取文本的 embedding 向量（1024 维）
async function getEmbedding(text) {
  const res = await getDashscope().embeddings.create({
    model: 'text-embedding-v4',
    input: text,
    dimensions: 1024,
  });
  return res.data[0].embedding;
}

// 用 LLM 将用户提示词优化为电商搜索词
async function optimizeQueryWithLLM(rawQuery) {
  const res = await getDeepseek().chat.completions.create({
    model: 'deepseek-v4-pro',
    messages: [
      { role: 'system', content: '你是一个电商搜索词优化助手。将用户的自然语言输入转换为精准的电商搜索关键词，只输出关键词本身，不要解释，不要多余内容。' },
      { role: 'user', content: rawQuery },
    ],
  });
  const optimized = res.choices[0]?.message?.content?.trim() || rawQuery;
  console.log('[AI选商品] 原始查询:', rawQuery, '| LLM优化后:', optimized);
  return optimized;
}

// 余弦相似度
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 语义搜索入口
 * @param {Object} args - { query: string } 用户输入的查询文本
 * @returns {Array} 匹配的商品列表，按相似度降序
 */
export async function executeSearchProducts(args) {
  const { query } = args;
  if (!query || !query.trim()) return [];

  // 1. 用 LLM 优化用户提示词
  const searchQuery = await optimizeQueryWithLLM(query.trim());

  // 2. 获取全部商品（后端已预存 embedding）
  const allProducts = await fetchAllProducts();
  if (allProducts.length === 0) return [];

  // 3. 获取优化后查询的 embedding
  const queryEmb = await getEmbedding(searchQuery);
  console.log('[AI选商品] 查询向量维度:', queryEmb.length);

  // 4. 遍历商品比对余弦相似度
  const matched = [];
  for (const product of allProducts) {
    if (!product.embedding) {
      console.log(`[AI选商品] "${product.name}" 跳过: 无 embedding`);
      continue;
    }
    const score = cosineSimilarity(queryEmb, product.embedding);
    console.log(`[AI选商品] "${product.name}" 相似度: ${Math.round(score * 10000) / 10000}`);
    if (score >= SIMILARITY_THRESHOLD) {
      matched.push({ ...product, similarity: Math.round(score * 100) / 100 });
    }
  }

  // 按相似度降序
  matched.sort((a, b) => b.similarity - a.similarity);
  console.log(`[AI选商品] 查询 "${query.trim()}" → "${searchQuery}" 共 ${allProducts.length} 个, 命中 ${matched.length} 个 (阈值 ${SIMILARITY_THRESHOLD})`);

  // 用匹配到的商品信息重新获取商品列表
  const matchedIds = new Set(matched.map((p) => p.id));
  const reFetched = [];
  let page = 0;
  while (true) {
    const res = await getProductsApi(page, PAGE_SIZE);
    if (res.code !== 0 || !res.data) break;
    const items = (res.data.items || []).filter((p) => p.show !== false && matchedIds.has(p.id));
    if (items.length === 0 && page > 0) break;
    reFetched.push(...items);
    const allInPage = (res.data.items || []).filter((p) => p.show !== false);
    if (allInPage.length < PAGE_SIZE) break;
    page++;
  }

  const resultMap = new Map(reFetched.map((p) => [p.id, p]));
  const matchedScoreMap = new Map(matched.map((p) => [p.id, p.similarity]));

  return [...matchedIds]
    .filter((id) => resultMap.has(id))
    .map((id) => ({
      id,
      name: resultMap.get(id).name,
      price: resultMap.get(id).price,
      description: resultMap.get(id).description || '',
      image: resultMap.get(id).image || resultMap.get(id).imageUrl || '',
      similarity: matchedScoreMap.get(id),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
