import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import TryCatch from '../utils/trycatch.js';

const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của ứng dụng Quản Lý Chi Tiêu Smart Finance. 
Bạn hỗ trợ người dùng về:
- Quản lý tài chính cá nhân: lập kế hoạch chi tiêu, tiết kiệm, đầu tư
- Giải thích các thuật ngữ tài chính: lạm phát, lãi suất kép, quỹ dự phòng...
- Tư vấn cách cắt giảm chi tiêu không cần thiết
- Hướng dẫn sử dụng các tính năng của app: tạo ví, ghi chép giao dịch, đặt mục tiêu tiết kiệm
- Phân tích xu hướng chi tiêu và đưa ra lời khuyên hữu ích

Quy tắc trả lời:
- Luôn trả lời bằng tiếng Việt, chuyên nghiệp nhưng thân thiện, nhiệt tình
- Giữ câu trả lời ngắn gọn, súc tích (tối đa 3-4 câu trừ khi người dùng cần chi tiết)
- Xưng hô: "mình" và "bạn"
- Nếu không biết thông tin về tài khoản cụ thể của người dùng, hãy nhắc họ kiểm tra trong các mục tương ứng của app
- Không trả lời các chủ đề không liên quan đến tài chính hoặc ứng dụng`;

export const geminiChat = TryCatch(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Tin nhắn không được để trống' });
  }

  // Attempt 1: Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      let chatHistory = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const firstUserIndex = chatHistory.findIndex((msg) => msg.role === 'user');
      if (firstUserIndex !== -1) {
        chatHistory = chatHistory.slice(firstUserIndex);
      } else {
        chatHistory = [];
      }

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message.trim());
      const responseText = result.response.text();
      
      return res.json({ success: true, reply: responseText, provider: 'Gemini' });
    }
  } catch (error) {
    console.warn('⚠️ Gemini fallback triggered:', error.message);
  }

  // Attempt 2: Groq
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: message },
          ],
          max_tokens: 500,
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      return res.json({ success: true, reply: response.data.choices[0].message.content, provider: 'Groq' });
    }
  } catch (error) {
    console.warn('⚠️ Groq fallback triggered:', error.response?.data || error.message);
  }

  // Attempt 3: OpenRouter
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: message },
          ],
        },
        { headers: { Authorization: `Bearer ${openRouterKey}` } }
      );
      return res.json({ success: true, reply: response.data.choices[0].message.content, provider: 'OpenRouter' });
    }
  } catch (error) {
    console.warn('⚠️ OpenRouter fallback triggered:', error.response?.data || error.message);
  }

  return res.status(500).json({
    success: false,
    message: 'Tất cả các dịch vụ AI đang bận. Vui lòng thử lại sau giây lát!',
  });
});
