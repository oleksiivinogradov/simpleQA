import React, { useState, useEffect } from 'react';

interface QAItem {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

const QuestionAnswer: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<QAItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history. Please try again later.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      setAnswer(data.answer);
      
      // Refresh history
      fetchHistory();
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get answer. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="question-answer-container" style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input 
            type="text" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            style={styles.input}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </button>
        </div>
      </form>
      
      {error && <p style={styles.error}>{error}</p>}
      
      {answer && (
        <div style={styles.answerContainer}>
          <h3>Answer:</h3>
          <p style={styles.answerText}>{answer}</p>
        </div>
      )}
      
      <div style={styles.historySection}>
        <button 
          style={styles.historyButton}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
        
        {showHistory && (
          <div style={styles.historyContainer}>
            <h3>Question History</h3>
            {history.length === 0 ? (
              <p>No questions asked yet.</p>
            ) : (
              <ul style={styles.historyList}>
                {history.map((item) => (
                  <li key={item.id} style={styles.historyItem}>
                    <div style={styles.historyQuestion}>
                      <strong>Q:</strong> {item.question}
                    </div>
                    <div style={styles.historyAnswer}>
                      <strong>A:</strong> {item.answer}
                    </div>
                    <div style={styles.historyTimestamp}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Inline styles for simplicity
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  form: {
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: '1',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  answerContainer: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '20px',
  },
  answerText: {
    fontSize: '16px',
    lineHeight: '1.5',
  },
  error: {
    color: 'red',
    marginTop: '10px',
  },
  historySection: {
    marginTop: '30px',
  },
  historyButton: {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  historyContainer: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  historyList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  historyItem: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  historyQuestion: {
    marginBottom: '5px',
  },
  historyAnswer: {
    marginBottom: '5px',
  },
  historyTimestamp: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right' as 'right',
  }
};

export default QuestionAnswer;
