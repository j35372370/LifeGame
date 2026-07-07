import { Children, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Landmark,
  Newspaper,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { createInitialGameState, type GameState } from "@life-game/game-engine";
import type { IShareholding } from "@life-game/schemas";
import "./styles.css";

type PageKey =
  | "company"
  | "stocks"
  | "news"
  | "personal-assets"
  | "asset-trading"
  | "event-log";

interface MenuItem {
  key: PageKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [activePage, setActivePage] = useState<PageKey | null>(null);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <GameShell state={state} activePage={activePage} onNavigate={setActivePage} onSellShares={setState} />;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-screen">
      <section className="login-panel">
        <p className="eyebrow">Republic of Ara</p>
        <h1>LIFE GAME</h1>
        <p className="login-copy">아라공화국 경제 활동 계정으로 접속합니다.</p>

        <div className="login-fields">
          <label>
            <span>계정</span>
            <input value="player@lifegame.local" readOnly />
          </label>
          <label>
            <span>비밀번호</span>
            <input value="********" type="password" readOnly />
          </label>
        </div>

        <button className="primary-button" onClick={onLogin}>
          로그인
        </button>
      </section>
    </main>
  );
}

function GameShell({
  state,
  activePage,
  onNavigate,
  onSellShares
}: {
  state: GameState;
  activePage: PageKey | null;
  onNavigate: (page: PageKey | null) => void;
  onSellShares: (updater: (state: GameState) => GameState) => void;
}) {
  const player = state.persons[0];
  const account = state.personalAccounts.find((item) => item.id === player.accountId);
  const operatingCompanies = state.corporations.filter((corp) => corp.representativePersonId === player.id);
  const hasOperatingCompany = operatingCompanies.length > 0;
  const netWorth = useMemo(
    () => (account?.cashBalance ?? 0) + state.personalAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
    [account?.cashBalance, state.personalAssets]
  );

  const menuItems = createMenuItems(hasOperatingCompany);
  const currentItem = menuItems.find((item) => item.key === activePage);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Republic of Ara</p>
          <h1>대시보드</h1>
        </div>
        <div className="capital-strip">
          <Metric label="현금" value={formatKrw(account?.cashBalance ?? 0)} />
          <Metric label="순자산" value={formatKrw(netWorth)} />
          <Metric label="운영 회사" value={`${operatingCompanies.length}개`} />
        </div>
      </section>

      {currentItem ? (
        <DetailPage item={currentItem} state={state} onBack={() => onNavigate(null)} onSellShares={onSellShares} />
      ) : (
        <Dashboard menuItems={menuItems} hasOperatingCompany={hasOperatingCompany} onNavigate={onNavigate} />
      )}
    </main>
  );
}

function Dashboard({
  menuItems,
  hasOperatingCompany,
  onNavigate
}: {
  menuItems: MenuItem[];
  hasOperatingCompany: boolean;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <section className={hasOperatingCompany ? "menu-grid" : "menu-grid no-company"}>
      {menuItems.map((item) => (
        <button key={item.key} className="menu-tile" onClick={() => onNavigate(item.key)}>
          <span className="tile-icon">{item.icon}</span>
          <strong>{item.title}</strong>
          <span>{item.description}</span>
        </button>
      ))}
    </section>
  );
}

function DetailPage({
  item,
  state,
  onBack,
  onSellShares
}: {
  item: MenuItem;
  state: GameState;
  onBack: () => void;
  onSellShares: (updater: (state: GameState) => GameState) => void;
}) {
  return (
    <section className="detail-layout">
      <div className="detail-header">
        <button className="ghost-button" onClick={onBack} title="뒤로">
          <ArrowLeft size={18} />
          <span>뒤로</span>
        </button>
        <div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>
      </div>

      <div className="detail-panel">{renderDetailContent(item.key, state, onSellShares)}</div>
    </section>
  );
}

function renderDetailContent(page: PageKey, state: GameState, onSellShares: (updater: (state: GameState) => GameState) => void) {
  switch (page) {
    case "company":
      return <CompanyDetail state={state} />;
    case "stocks":
      return <ListDetail items={state.shareholdings.map((item) => `${item.corporationId} ${item.shares.toLocaleString("ko-KR")}주`)} empty="보유 지분이 없습니다." />;
    case "news":
      return <ListDetail items={state.newsArticles.map((item) => item.headline)} empty="표시할 뉴스가 없습니다." />;
    case "personal-assets":
      return <PersonalStatusDetail state={state} onSellShares={onSellShares} />;
    case "asset-trading":
      return <EmptyDetail title="자산 거래" body="개인 자산 매입, 매각, 가치 평가 기능을 연결할 예정입니다." />;
    case "event-log":
      return <ListDetail items={state.eventLogs.map((item) => item.title)} empty="이벤트 로그가 없습니다." />;
  }
}

function CompanyDetail({ state }: { state: GameState }) {
  const player = state.persons[0];
  const operatingCompanies = state.corporations.filter((corporation) => corporation.representativePersonId === player.id);

  if (operatingCompanies.length === 0) {
    return <EmptyDetail title="운영 회사 없음" body="아직 플레이어가 대표로 운영하는 회사가 없습니다." />;
  }

  return (
    <div className="detail-list">
      {operatingCompanies.map((corporation) => (
        <div key={corporation.id} className="company-row">
          <div>
            <strong>{corporation.name}</strong>
            <span>비상장 회사 · 발행주식 {corporation.totalShares.toLocaleString("ko-KR")}주</span>
          </div>
          <em>{formatKrw(corporation.shareCapital)}</em>
        </div>
      ))}
    </div>
  );
}

function PersonalStatusDetail({
  state,
  onSellShares
}: {
  state: GameState;
  onSellShares: (updater: (state: GameState) => GameState) => void;
}) {
  const player = state.persons[0];
  const account = state.personalAccounts.find((item) => item.id === player.accountId);
  const realEstateAssets = state.personalAssets.filter((asset) => asset.assetTypeId.includes("apartment") || asset.assetTypeId.includes("office"));
  const otherAssets = state.personalAssets.filter((asset) => !realEstateAssets.includes(asset));
  const activeEmployments = state.employmentContracts.filter((contract) => contract.personId === player.id && !contract.endedAt);
  const ownedBonds = state.personalAssets.filter((asset) => asset.assetTypeId.includes("bond"));
  const monthlySalaryIncome = activeEmployments.reduce((sum, contract) => sum + contract.monthlySalary, 0);
  const estimatedDividendIncome = state.shareholdings.length * 120_000;
  const expectedIncome = monthlySalaryIncome + estimatedDividendIncome;
  const estimatedLivingCost = 1_200_000;
  const estimatedLoanInterest = Math.round((account?.liabilityTotal ?? 0) * 0.004);
  const expectedExpense = estimatedLivingCost + estimatedLoanInterest;

  return (
    <div className="asset-page">
      <section className="finance-summary-grid">
        <SummaryCard icon={<WalletCards size={20} />} label="보유 현금" value={formatKrw(account?.cashBalance ?? 0)} />
        <SummaryCard icon={<CreditCard size={20} />} label="상환해야 하는 대출금" value={formatKrw(account?.liabilityTotal ?? 0)} />
        <SummaryCard icon={<ReceiptText size={20} />} label="매달 지출 예정 이자" value={formatKrw(estimatedLoanInterest)} />
        <SummaryCard icon={<TrendingUp size={20} />} label="이번달 예상 수입" value={formatKrw(expectedIncome)} />
        <SummaryCard icon={<TrendingDown size={20} />} label="이번달 예상 지출" value={formatKrw(expectedExpense)} />
      </section>

      <section className="asset-section-grid">
        <AssetSection title="보유한 부동산 목록" empty="보유한 부동산이 없습니다.">
          {realEstateAssets.map((asset) => (
            <AssetRow key={asset.id} name={asset.name} meta={asset.assetTypeId} value={formatKrw(asset.currentValue)} />
          ))}
        </AssetSection>

        <AssetSection title="기타 자산 목록" empty="기타 자산이 없습니다.">
          {otherAssets.map((asset) => (
            <AssetRow key={asset.id} name={asset.name} meta={asset.assetTypeId} value={formatKrw(asset.currentValue)} />
          ))}
        </AssetSection>

        <AssetSection title="보유 채권" empty="보유 채권이 없습니다.">
          {ownedBonds.map((asset) => (
            <AssetRow key={asset.id} name={asset.name} meta="채권형 자산" value={formatKrw(asset.currentValue)} />
          ))}
        </AssetSection>

        <AssetSection title="소속회사와 직급" empty="현재 소속회사가 없습니다.">
          {activeEmployments.map((contract) => {
            const corporation = state.corporations.find((item) => item.id === contract.corporationId);
            return (
              <AssetRow
                key={contract.id}
                name={corporation?.name ?? contract.corporationId}
                meta={contract.title}
                value={`월급 ${formatKrw(contract.monthlySalary)}`}
              />
            );
          })}
        </AssetSection>

        <StockHoldingSection state={state} onSellShares={onSellShares} />
      </section>
    </div>
  );
}

function StockHoldingSection({
  state,
  onSellShares
}: {
  state: GameState;
  onSellShares: (updater: (state: GameState) => GameState) => void;
}) {
  const player = state.persons[0];
  const holdings = state.shareholdings.filter((holding) => holding.shareholderPersonId === player.id && holding.shares > 0);

  return (
    <section className="asset-section stock-section">
      <h3>보유 주식 현황</h3>
      {holdings.length === 0 ? (
        <p className="empty-state">보유 주식이 없습니다.</p>
      ) : (
        <div className="stock-list">
          {holdings.map((holding) => (
            <StockHoldingRow
              key={holding.id}
              holding={holding}
              state={state}
              onSell={() => onSellShares((current) => sellShares(current, holding.id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StockHoldingRow({
  holding,
  state,
  onSell
}: {
  holding: IShareholding;
  state: GameState;
  onSell: () => void;
}) {
  const corporation = state.corporations.find((item) => item.id === holding.corporationId);
  const totalShares = corporation?.totalShares ?? holding.shares;
  const ownershipRatio = totalShares > 0 ? (holding.shares / totalShares) * 100 : 0;
  const holdingValue = holding.shares * holding.acquiredPricePerShare;

  return (
    <div className="stock-row">
      <div className="stock-main">
        <strong>{corporation?.name ?? holding.corporationId}</strong>
        <span>{holding.shares.toLocaleString("ko-KR")}주 · 지분율 {ownershipRatio.toFixed(2)}%</span>
      </div>
      <div className="stock-value">
        <span>보유 가치</span>
        <strong>{formatKrw(holdingValue)}</strong>
      </div>
      <button className="sell-button" onClick={onSell}>
        매각
      </button>
    </div>
  );
}

function sellShares(state: GameState, shareholdingId: string): GameState {
  const holding = state.shareholdings.find((item) => item.id === shareholdingId);
  if (!holding || !holding.shareholderPersonId || holding.shares <= 0) {
    return state;
  }

  const sellSharesCount = Math.max(1, Math.ceil(holding.shares * 0.1));
  const proceeds = Math.round(sellSharesCount * holding.acquiredPricePerShare);
  const person = state.persons.find((item) => item.id === holding.shareholderPersonId);
  if (!person) return state;

  return {
    ...state,
    shareholdings: state.shareholdings
      .map((item) => (item.id === shareholdingId ? { ...item, shares: item.shares - sellSharesCount } : item))
      .filter((item) => item.shares > 0),
    personalAccounts: state.personalAccounts.map((account) =>
      account.id === person.accountId ? { ...account, cashBalance: account.cashBalance + proceeds } : account
    )
  };
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="summary-card">
      <span className="summary-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AssetSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const childArray = Children.toArray(children);

  return (
    <section className="asset-section">
      <h3>{title}</h3>
      {childArray.length > 0 ? <div className="asset-list">{childArray}</div> : <p className="empty-state">{empty}</p>}
    </section>
  );
}

function AssetRow({ name, meta, value }: { name: string; meta: string; value: string }) {
  return (
    <div className="asset-row">
      <div>
        <strong>{name}</strong>
        <span>{meta}</span>
      </div>
      <em>{value}</em>
    </div>
  );
}

function EmptyDetail({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-detail">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function ListDetail({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="empty-state">{empty}</p>;
  }

  return (
    <div className="detail-list">
      {items.map((item) => (
        <div key={item} className="detail-row">
          {item}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function createMenuItems(hasOperatingCompany: boolean): MenuItem[] {
  if (hasOperatingCompany) {
    return [
      { key: "company", title: "회사 운영", description: "운영 회사와 경영 상태", icon: <Building2 size={24} /> },
      { key: "stocks", title: "주식 거래", description: "지분과 투자 내역", icon: <BarChart3 size={24} /> },
      { key: "news", title: "뉴스", description: "공개 기사와 브리핑", icon: <Newspaper size={24} /> },
      { key: "personal-assets", title: "개인 현황", description: "현금, 자산, 소속회사, 수입과 지출", icon: <WalletCards size={24} /> },
      { key: "asset-trading", title: "자산 거래", description: "개인 자산 매입과 매각", icon: <Landmark size={24} /> },
      { key: "event-log", title: "이벤트 로그", description: "원본 사건 기록", icon: <FileText size={24} /> }
    ];
  }

  return [
    { key: "personal-assets", title: "개인 현황", description: "회사 운영 대신 개인 현황을 관리합니다.", icon: <WalletCards size={24} /> },
    { key: "stocks", title: "주식 거래", description: "지분과 투자 내역", icon: <BarChart3 size={24} /> },
    { key: "news", title: "뉴스", description: "공개 기사와 브리핑", icon: <Newspaper size={24} /> },
    { key: "asset-trading", title: "자산 거래", description: "개인 자산 매입과 매각", icon: <Landmark size={24} /> },
    { key: "event-log", title: "이벤트 로그", description: "원본 사건 기록", icon: <FileText size={24} /> }
  ];
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

createRoot(document.getElementById("root")!).render(<App />);
