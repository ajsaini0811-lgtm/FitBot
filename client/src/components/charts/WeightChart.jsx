import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function WeightChart({ data = [], goalWeight }) {
  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 14 }}>No weight entries yet. Log your weight from the chat!</div>;
  }

  const chartData = data.map(d => ({
    date: d.loggedAt,
    weight: d.weightKg,
    label: format(new Date(d.loggedAt), 'MMM d'),
  }));

  const weights = data.map(d => d.weightKg);
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights) + 2;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} />
        <YAxis domain={[min, max]} tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="kg" width={48} />
        <Tooltip formatter={v => [`${v} kg`, 'Weight']} labelStyle={{ color: '#111827', fontWeight: 600 }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
        {goalWeight && (
          <ReferenceLine y={goalWeight} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `Goal ${goalWeight}kg`, fontSize: 11, fill: '#f59e0b', position: 'insideBottomRight' }} />
        )}
        <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
