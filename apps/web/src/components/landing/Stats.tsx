const stats = [
  {
    value: "500+",
    label: "Enterprise Customers",
  },
  {
    value: "1,000+",
    label: "Software Products",
  },
  {
    value: "50,000+",
    label: "Verified Reviews",
  },
  {
    value: "25+",
    label: "Analyst Reports",
  },
  {
    value: "99.9%",
    label: "Data Accuracy",
  },
];

export default function Stats() {
  return (
    <section className="bg-white px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_20px_70px_-40px_rgba(79,70,229,0.35)] md:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl px-5 py-4 text-center transition hover:bg-indigo-50"
          >
            <div className="text-3xl font-semibold tracking-tight text-indigo-600">
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}