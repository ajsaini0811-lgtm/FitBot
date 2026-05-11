import './ChatBubble.css';

function formatContent(text) {
  // Convert **bold** to <strong> and \n to <br>
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBubble({ role, content, time }) {
  const isBot = role === 'bot';
  return (
    <div className={`chat-bubble-wrap ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className="bot-avatar">💪</div>
      )}
      <div className={`bubble ${isBot ? 'bubble-bot' : 'bubble-user'}`}>
        <span dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
      </div>
    </div>
  );
}
