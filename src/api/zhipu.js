/**
 * ZhipuAI 文件解析服务
 * - 图片文件：使用 GLM-5V-Turbo 视觉模型（base64 编码内联传输）
 * - 文档文件：使用文件解析 API（两步：创建任务 → 轮询结果）
 */
const API_BASE = 'https://open.bigmodel.cn/api';
const API_KEY = process.env.REACT_APP_ZHIPU_API_KEY;

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'gif'];

function getFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const map = {
    pdf: 'PDF', doc: 'DOC', docx: 'DOCX',
    xls: 'XLS', xlsx: 'XLSX',
    ppt: 'PPT', pptx: 'PPTX',
    csv: 'CSV', txt: 'TXT', md: 'MD',
    png: 'PNG', jpg: 'JPG', jpeg: 'JPEG',
  };
  return map[ext] || 'PNG';
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 使用 GLM-5V-Turbo 视觉模型理解图片（base64 内联）
 */
async function understandImage(file, prompt) {
  const base64 = await readFileAsBase64(file);

  const body = {
    model: 'glm-4.6v-flashx',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    stream: false,
  };

  const res = await fetch(`${API_BASE}/paas/v4/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 调用失败: ${res.status} ${text}`);
  }

  const result = await res.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型未返回内容: ' + JSON.stringify(result));
  return content;
}

/**
 * 使用文件解析 API 解析文档（两步：创建任务 → 轮询）
 */
async function parseDocument(file, prompt) {
  // 步骤 1: 创建解析任务
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tool_type', 'lite');
  formData.append('file_type', getFileType(file));

  const createRes = await fetch(`${API_BASE}/paas/v4/files/parser/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: formData,
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`创建任务失败: ${createRes.status} ${text}`);
  }

  const createResult = await createRes.json();
  const taskId = createResult.task_id;
  if (!taskId) throw new Error('未获取到 task_id: ' + JSON.stringify(createResult));

  // 步骤 2: 轮询结果
  for (let i = 0; i < 60; i++) {
    const pollRes = await fetch(
      `${API_BASE}/paas/v4/files/parser/result/${taskId}/text`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    if (!pollRes.ok) {
      const text = await pollRes.text();
      throw new Error(`获取结果失败: ${pollRes.status} ${text}`);
    }

    const result = await pollRes.json();
    if (result.status === 'succeeded') {
      return result.content || '';
    }
    if (result.status === 'failed') {
      throw new Error('解析失败: ' + (result.message || '未知错误'));
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('解析超时');
}

/**
 * 统一文件解析入口
 * @param {File} file - 文件
 * @param {string} prompt - 提问内容
 * @returns {Promise<string>} 解析结果文本
 */
export async function parseFile(file, prompt = '请详细描述这个文件的内容') {
  const ext = file.name.split('.').pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) {
    return await understandImage(file, prompt);
  }
  return await parseDocument(file, prompt);
}
