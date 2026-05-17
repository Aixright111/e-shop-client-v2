/**
 * AI 工具：语义搜索
 * 遍历商品列表取出后端预存的 embedding，与用户查询向量比对，过滤相似度 > 0.7 的商品
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

const SIMILARITY_THRESHOLD = 0.3;
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

// 获取文本的 embedding 向量（1024 维，与后端保持一致）
async function getEmbedding(text) {
  const res = await getDashscope().embeddings.create({
    model: 'text-embedding-v4',
    input: text,
    dimensions: 1024,
  });
  return res.data[0].embedding;
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
 * 电商查询优化：为自然语言查询添加上下文关键词，提升语义匹配效果
 */
function optimizeQuery(rawQuery) {
  const q = rawQuery.trim();

  const patterns = [
    { match: /修|坏|维修|故障|服务|安装|售后/i, append: '维修服务 修理 安装' },
    { match: /吃|食|零食|水果|饮料|食品|奶茶|咖啡|面包/i, append: '食品 零食 饮料 美食' },
    { match: /手机|电脑|电子|数码|充电|耳机|手表|智能|笔记本|平板/i, append: '电子产品 数码 智能设备' },
    { match: /衣服|穿|服装|鞋|裤|外套|裙子|帽子|袜子|穿搭/i, append: '服装 服饰 穿戴' },
    { match: /家具|家居|床|桌|椅|沙发|柜|灯|装饰/i, append: '家具 家居用品' },
    { match: /日用|生活|厨房|餐具|洗漱|毛巾|收纳/i, append: '日用百货 生活用品' },
    { match: /便宜|优惠|打折|促销|特价|划算/i, append: '优惠 特价 性价比 折扣' },
  ];

  const matched = patterns.filter((p) => p.match.test(q)).map((p) => p.append);

  if (matched.length === 0) {
    return `${q} 商品 产品 购物`;
  }

  return `${q} ${matched.join(' ')}`;
}

/**
 * 语义搜索入口
 * @param {Object} args - { query: string } 用户输入的查询文本
 * @returns {Array} 相似度 > 0.7 的商品列表，按相似度降序
 */
export async function executeSearchProducts(args) {
  const { query } = args;
  if (!query || !query.trim()) return [];

  // 1. 获取全部商品（后端已预存 embedding）
  const allProducts = await fetchAllProducts();
  if (allProducts.length === 0) return [];

  // 2. 优化查询文本（添加上下文关键词）
  const optimizedQuery = optimizeQuery(query.trim());
  console.log('[AI选商品] 原始查询:', query.trim(), '| 优化查询:', optimizedQuery);

  // 3. 获取优化后查询的 embedding
  const queryEmb = await getEmbedding(optimizedQuery);
  console.log('[AI选商品] 查询向量维度:', queryEmb.length);

  // 4. 遍历商品，用商品预存的 embedding 计算余弦相似度
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

  // 5. 按相似度降序
  matched.sort((a, b) => b.similarity - a.similarity);
  console.log(`[AI选商品] 查询 "${query.trim()}" 共 ${allProducts.length} 个, 命中 ${matched.length} 个 (阈值 ${SIMILARITY_THRESHOLD})`);

  // 6. 用匹配到的商品信息重新获取商品列表
  const matchedIds = new Set(matched.map((p) => p.id));
  const reFetched = [];
  let page = 0;
  while (true) {
    const res = await getProductsApi(page, PAGE_SIZE);
    if (res.code !== 0 || !res.data) break;
    const items = (res.data.items || []).filter((p) => p.show !== false && matchedIds.has(p.id));
    if (items.length === 0 && page > 0) break;
    reFetched.push(...items);
    // 如果本页已经没有更多匹配项，提前结束
    const allInPage = (res.data.items || []).filter((p) => p.show !== false);
    if (allInPage.length < PAGE_SIZE) break;
    page++;
  }

  // 按原始相似度顺序返回
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
