import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export default function ProfitChart({ data }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 10, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d8c64" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#4d8c64" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0e9" />
          <XAxis dataKey="season" tickLine={false} axisLine={false} tick={{ fill: '#898f85', fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: '#898f85', fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1000000)}jt`} />
          <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ borderRadius: 12, border: '1px solid #e9ece5', boxShadow: '0 8px 24px #263b2614' }} />
          <Area type="monotone" dataKey="profit" name="Laba bersih" stroke="#3e8058" strokeWidth={3} fill="url(#profitFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
