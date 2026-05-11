import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function CalorieRing({ consumed = 0, budget = 2000 }) {
  const pct = Math.min(100, Math.round((consumed / budget) * 100));
  const remaining = Math.max(0, budget - consumed);
  const over = consumed > budget;

  const data = [
    { value: Math.min(consumed, budget) },
    { value: over ? 0 : remaining },
  ];
  if (over) data[0].value = budget;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={88}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={over ? '#ef4444' : '#22c55e'} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Poppins', color: over ? '#ef4444' : '#111827' }}>{pct}%</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{consumed} kcal</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>of {budget}</div>
      </div>
    </div>
  );
}
