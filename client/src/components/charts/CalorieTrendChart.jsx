import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function CalorieTrendChart({ data = [], calorieBudget = 2000 }) {
  const chartData = data.map(d => ({
    day: format(new Date(d.date), 'EEE'),
    calories: d.calories,
    over: d.calories > calorieBudget,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="k" tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1) : v} width={38} />
        <Tooltip
          formatter={v => [`${v} kcal`, 'Calories']}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <ReferenceLine y={calorieBudget} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Goal', fontSize: 11, fill: '#f59e0b', position: 'insideTopRight' }} />
        <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.calories === 0 ? '#e5e7eb' : d.over ? '#ef4444' : '#22c55e'} fillOpacity={d.calories === 0 ? 0.4 : 0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
