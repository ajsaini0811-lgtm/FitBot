import './QuickReplies.css';

export default function QuickReplies({ options, onSelect, disabled }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="quick-replies">
      {options.map((opt, i) => (
        <button
          key={i}
          className="qr-chip"
          onClick={() => onSelect(opt)}
          disabled={disabled}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
