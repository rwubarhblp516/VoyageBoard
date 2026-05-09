import { useMemo, useState } from 'react';

type Tab = 'Dashboard' | 'Itinerary' | 'Expenses' | 'Settlement' | 'Stats';

const tabs: Tab[] = ['Dashboard', 'Itinerary', 'Expenses', 'Settlement', 'Stats'];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');

  const content = useMemo(() => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Itinerary':
        return <Itinerary />;
      case 'Expenses':
        return <Expenses />;
      case 'Settlement':
        return <Settlement />;
      case 'Stats':
        return <Stats />;
    }
  }, [activeTab]);

  return (
    <div className="app-shell">
      <header className="glass panel top-bar">
        <div>
          <p className="subtle">VoyageBoard · Team Trip</p>
          <h1>海南环岛 · Day 3</h1>
        </div>
        <p className="mono">Sanya · 2026-05-08</p>
      </header>

      <main className="content">{content}</main>

      <nav className="bottom-nav glass panel">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Dashboard() {
  return (
    <section className="grid">
      <article className="glass panel">
        <h2>今日行程</h2>
        <p>蜈支洲岛 · 后海 · 免税城</p>
      </article>
      <article className="glass panel stat-row">
        <Metric label="今日消费" value="¥1,826" tone="primary" />
        <Metric label="当前人均" value="¥608" tone="mint" />
        <Metric label="待结算" value="¥412" tone="warning" />
      </article>
      <button className="cta">+ 添加支出</button>
    </section>
  );
}

function Itinerary() {
  return (
    <section className="grid">
      <article className="glass panel">
        <h2>DAY 3 · 万宁</h2>
        <ul>
          <li>08:30 酒店出发</li>
          <li>10:00 石梅湾冲浪</li>
          <li>13:00 海鲜午餐</li>
          <li>16:00 神州半岛日落</li>
        </ul>
      </article>
    </section>
  );
}

function Expenses() {
  return (
    <section className="grid">
      <article className="glass panel expense-card">
        <p className="amount mono">¥328</p>
        <p>海鲜晚餐</p>
        <p className="subtle">张三支付 · 参与: 全员</p>
      </article>
    </section>
  );
}

function Settlement() {
  return (
    <section className="grid">
      <article className="glass panel">
        <h2>结算流</h2>
        <p className="flow">李四 → 张三 <span className="mono">¥182</span></p>
        <p className="flow">王五 → 张三 <span className="mono">¥341</span></p>
        <p className="flow done">赵六 → 李四 <span className="mono">¥72</span></p>
      </article>
    </section>
  );
}

function Stats() {
  return (
    <section className="grid">
      <article className="glass panel stat-row">
        <Metric label="总花费" value="¥8,912" tone="primary" />
        <Metric label="人均消费" value="¥2,228" tone="mint" />
        <Metric label="油费成本/km" value="¥0.94" tone="warning" />
      </article>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'mint' | 'warning' }) {
  return (
    <div>
      <p className="subtle">{label}</p>
      <p className={`metric mono ${tone}`}>{value}</p>
    </div>
  );
}
