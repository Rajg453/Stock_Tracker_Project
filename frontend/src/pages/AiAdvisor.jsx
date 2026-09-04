import React, { useState } from 'react';
// We no longer import @google/generative-ai because the AI logic has been securely moved to the backend.
import { API_URL } from '../config';

const AiAdvisor = () => {
  // 1. We create 'state' variables to remember what the user typed and the AI's response
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. This function runs when you click "Ask AI"
  const handleAskAi = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing when you submit the form
    if (!question) return; // If the question is empty, do nothing

    setIsLoading(true); // Tell the app we are loading so we can show a "Loading..." message
    setAnswer(''); // Clear any old answers

    try {
      // 3. Instead of initializing Google AI directly in the browser (which exposes keys),
      // we now send a POST request to our new secure backend route.
      
      const response = await fetch(`${API_URL}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 4. We send the user's question as a JSON payload to the backend.
        body: JSON.stringify({ question }),
      });

      // 5. Parse the JSON response from our backend server.
      const data = await response.json();

      // 6. Check if our backend explicitly returned an error status.
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI response from server.');
      }
      
      // 7. Save the answer returned by our backend so it renders on the screen.
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error talking to backend AI route:", error);
      // 8. Provide a graceful error message if the backend request fails (e.g., server offline).
      setAnswer(`Sorry, I had trouble thinking of an answer. Error: ${error.message || "Is the backend server running?"}`);
    } finally {
      // 10. Stop showing the "Loading..." message
      setIsLoading(false);
    }
  };

  // 11. What actually gets drawn on the screen (the HTML)
  return (
    <div className="card" style={{ maxWidth: '800px', margin: '40px auto', padding: '30px' }}>
      <h2 className="text-gradient" style={{ marginBottom: '20px' }}>AI Stock Advisor</h2>
      <p style={{ color: 'var(--text-color)', marginBottom: '30px' }}>
        Ask me anything about investing or specific stocks!
      </p>

      <form onSubmit={handleAskAi} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <textarea 
          className="input-field"
          rows="4"
          placeholder="e.g., Should a beginner invest in index funds or individual stocks?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Ask AI'}
        </button>
      </form>

      {answer && (
        <div style={{ marginTop: '30px', padding: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px', color: 'var(--accent-color)' }}>AI Response:</h3>
          {/* We use whiteSpace: 'pre-wrap' so the AI's paragraphs and line breaks look nice */}
          <div style={{ color: 'var(--text-color)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisor;
