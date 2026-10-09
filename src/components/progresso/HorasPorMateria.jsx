import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function HorasPorMateria({ dados = [] }) {
  const altura = Math.max(240, dados.length * 42);

  return (
    <div style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="hsl(199 45% 20%)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            stroke="hsl(210 18% 62%)"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            tickFormatter={(v) => `${v}h`}
          />
          <YAxis
            type="category"
            dataKey="materia"
            width={128}
            stroke="hsl(210 18% 62%)"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Tooltip
            cursor={{ fill: 'hsl(187 100% 55% / 0.06)' }}
            contentStyle={{
              backgroundColor: 'hsl(220 42% 7%)',
              border: '1px solid hsl(199 45% 20%)',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            formatter={(v) => [`${v}h`, 'Horas']}
          />
          <Bar dataKey="horas" fill="hsl(187 100% 55%)" radius={[0, 2, 2, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
