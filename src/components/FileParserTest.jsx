import { useState } from 'react';
import { parseFile } from '../api/zhipu';
import Navbar from './Navbar';
import './FileParserTest.css';

function FileParserTest() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult('');
    setError('');
    setLogs([]);
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult('');
    setLogs([]);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'gif'].includes(ext);
      addLog(`文件: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      addLog(`方式: ${isImage ? 'GLM-5V-Turbo 视觉模型 (base64)' : '文件解析 API (轮询)'}`);

      const content = await parseFile(file, '请详细描述这个文件的内容，提取所有文字信息');
      addLog('解析完成!');
      setResult(content);
    } catch (err) {
      const msg = err.message || '未知错误';
      setError(msg);
      addLog(`错误: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="parser-test-container">
      <Navbar />
      <div className="parser-test-content">
        <div className="parser-test-card">
          <h1>文件解析测试</h1>
          <p className="parser-test-desc">
            图片 → GLM-5V-Turbo 视觉模型&nbsp;&nbsp;|&nbsp;&nbsp;文档 → 文件解析 API
          </p>

          <div className="parser-file-area">
            <input
              type="file"
              id="parserFileInput"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.csv,.txt,.md"
              onChange={handleFileChange}
              hidden
            />
            <div
              className="parser-upload-box"
              onClick={() => document.getElementById('parserFileInput').click()}
            >
              {file ? (
                <div className="parser-file-info">
                  <span className="parser-file-name">{file.name}</span>
                  <span className="parser-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="parser-upload-hint">
                  <span className="parser-upload-icon">+</span>
                  <span>点击选择文件</span>
                </div>
              )}
            </div>
          </div>

          <button
            className="parser-btn"
            onClick={handleParse}
            disabled={!file || loading}
          >
            {loading ? '解析中...' : '开始解析'}
          </button>

          {error && <div className="parser-error">{error}</div>}

          {result && (
            <div className="parser-result">
              <h3>解析结果</h3>
              <div className="parser-content">{result}</div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="parser-logs">
              <h3>运行日志</h3>
              <pre className="parser-log-box">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileParserTest;
