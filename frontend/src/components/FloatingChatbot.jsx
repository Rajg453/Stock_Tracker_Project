import React, { useState, useContext } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hi! Ask me about your portfolio or the stock market.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useContext(AuthContext);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      let url = 'http://localhost:5000/api/ai';
      let config = {};
      
      // If user is logged in, use the RAG endpoint to get personalized answers
      if (user) {
        url = 'http://localhost:5000/api/ai/rag';
        config = { headers: { Authorization: `Bearer ${user.token}` } };
      }

      const { data } = await axios.post(url, { question: userMessage }, config);
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting to my brain right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {isOpen ? (
        <div className="glass-panel animate-fade-in" style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.2)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', fontWeight: 'bold' }}>
              <MessageCircle size={20} color="var(--accent-color)" /> AI Advisor
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? 'var(--accent-color)' : 'var(--input-bg)',
                color: msg.sender === 'user' ? 'white' : 'var(--text-color)',
                padding: '10px 14px',
                borderRadius: '16px',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                maxWidth: '85%',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
          </div>
          
          {/* Input */}
          <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..." 
              className="input-field" 
              style={{ margin: 0, padding: '10px', flex: 1, borderRadius: '20px' }} 
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading} style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.4)',
            transition: 'transform 0.2s ease'
          }}
          className="animate-fade-in"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default FloatingChatbot;
