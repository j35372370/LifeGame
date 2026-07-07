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

type NotificationType =
  | "BOARD_VOTE"
  | "SHAREHOLDER_MEETING_VOTE"
  | "ASSET_TRADE_REQUEST"
  | "ASSET_TRADE_RESPONSE"
  | "SHARE_SALE_REQUEST";

interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "INFO";
  createdAt: string;
  saleRequest?: SellShareRequest;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [notifications, setNotifications] = useState<UserNotification[]>(() => createInitialNotifications());
  const [activePage, setActivePage] = useState<PageKey | null>(null);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <GameShell
      state={state}
      notifications={notifications}
      activePage={activePage}
      onNavigate={setActivePage}
      onSellShares={setState}
      onCreateNotification={(notification) => setNotifications((current) => [notification, ...current])}
      onUpdateNotification={setNotifications}
    />
  );
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
  notifications,
  activePage,
  onNavigate,
  onSellShares,
  onCreateNotification,
  onUpdateNotification
}: {
  state: GameState;
  notifications: UserNotification[];
  activePage: PageKey | null;
  onNavigate: (page: PageKey | null) => void;
  onSellShares: (updater: (state: GameState) => GameState) => void;
  onCreateNotification: (notification: UserNotification) => void;
  onUpdateNotification: (updater: (notifications: UserNotification[]) => UserNotification[]) => void;
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
        <DetailPage
          item={currentItem}
          state={state}
          notifications={notifications}
          onBack={() => onNavigate(null)}
          onSellShares={onSellShares}
          onCreateNotification={onCreateNotification}
          onUpdateNotification={onUpdateNotification}
        />
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
  notifications,
  onBack,
  onSellShares,
  onCreateNotification,
  onUpdateNotification
}: {
  item: MenuItem;
  state: GameState;
  notifications: UserNotification[];
  onBack: () => void;
  onSellShares: (updater: (state: GameState) => GameState) => void;
  onCreateNotification: (notification: UserNotification) => void;
  onUpdateNotification: (updater: (notifications: UserNotification[]) => UserNotification[]) => void;
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

      <div className="detail-panel">
        {renderDetailContent(item.key, state, notifications, onSellShares, onCreateNotification, onUpdateNotification)}
      </div>
    </section>
  );
}

function renderDetailContent(
  page: PageKey,
  state: GameState,
  notifications: UserNotification[],
  onSellShares: (updater: (state: GameState) => GameState) => void,
  onCreateNotification: (notification: UserNotification) => void,
  onUpdateNotification: (updater: (notifications: UserNotification[]) => UserNotification[]) => void
) {
  switch (page) {
    case "company":
      return <CompanyDetail state={state} />;
    case "stocks":
      return <ListDetail items={state.shareholdings.map((item) => `${item.corporationId} ${item.shares.toLocaleString("ko-KR")}주`)} empty="보유 지분이 없습니다." />;
    case "news":
      return <ListDetail items={state.newsArticles.map((item) => item.headline)} empty="표시할 뉴스가 없습니다." />;
    case "personal-assets":
      return (
        <PersonalStatusDetail
          state={state}
          notifications={notifications}
          onSellShares={onSellShares}
          onCreateNotification={onCreateNotification}
          onUpdateNotification={onUpdateNotification}
        />
      );
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
  notifications,
  onSellShares,
  onCreateNotification,
  onUpdateNotification
}: {
  state: GameState;
  notifications: UserNotification[];
  onSellShares: (updater: (state: GameState) => GameState) => void;
  onCreateNotification: (notification: UserNotification) => void;
  onUpdateNotification: (updater: (notifications: UserNotification[]) => UserNotification[]) => void;
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
        <NotificationSection
          notifications={notifications}
          onAccept={(notification) => {
            if (notification.saleRequest) {
              onSellShares((current) => sellShares(current, notification.saleRequest!));
            }
            onUpdateNotification((current) =>
              current.map((item) => (item.id === notification.id ? { ...item, status: "ACCEPTED" } : item))
            );
          }}
          onReject={(notification) =>
            onUpdateNotification((current) =>
              current.map((item) => (item.id === notification.id ? { ...item, status: "REJECTED" } : item))
            )
          }
        />

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

        <StockHoldingSection state={state} onSellShares={onSellShares} onCreateNotification={onCreateNotification} />
      </section>
    </div>
  );
}

function NotificationSection({
  notifications,
  onAccept,
  onReject
}: {
  notifications: UserNotification[];
  onAccept: (notification: UserNotification) => void;
  onReject: (notification: UserNotification) => void;
}) {
  return (
    <section className="asset-section notification-section">
      <h3>알림</h3>
      {notifications.length === 0 ? (
        <p className="empty-state">확인할 알림이 없습니다.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div key={notification.id} className="notification-row">
              <div>
                <strong>{notification.title}</strong>
                <span>{notification.body}</span>
                <em>{notificationStatusLabel(notification.status)}</em>
              </div>
              {notification.status === "PENDING" ? (
                <div className="notification-actions">
                  <button onClick={() => onAccept(notification)}>승인</button>
                  <button className="secondary-button" onClick={() => onReject(notification)}>거절</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StockHoldingSection({
  state,
  onSellShares,
  onCreateNotification
}: {
  state: GameState;
  onSellShares: (updater: (state: GameState) => GameState) => void;
  onCreateNotification: (notification: UserNotification) => void;
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
              onSell={(request) => onSellShares((current) => sellShares(current, request))}
              onRequestConsent={onCreateNotification}
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
  onSell,
  onRequestConsent
}: {
  holding: IShareholding;
  state: GameState;
  onSell: (request: SellShareRequest) => void;
  onRequestConsent: (notification: UserNotification) => void;
}) {
  const [sellBasis, setSellBasis] = useState<"shares" | "ratio">("shares");
  const [sellAmount, setSellAmount] = useState("1");
  const [pricePerShare, setPricePerShare] = useState(String(Math.floor(holding.acquiredPricePerShare)));
  const [buyerName, setBuyerName] = useState("");
  const [message, setMessage] = useState("");
  const corporation = state.corporations.find((item) => item.id === holding.corporationId);
  const totalShares = corporation?.totalShares ?? holding.shares;
  const ownershipRatio = totalShares > 0 ? (holding.shares / totalShares) * 100 : 0;
  const holdingValue = holding.shares * holding.acquiredPricePerShare;
  const marketPrice = Math.round(holding.acquiredPricePerShare * (corporation?.isPublic ? 1.05 : 1));
  const expectedShares = calculateSellShareCount(holding.shares, sellBasis, Number(sellAmount));
  const expectedProceeds = expectedShares * Number(pricePerShare || 0);

  function submitSale() {
    const result = validateShareSale({
      holding,
      corporationIsPublic: corporation?.isPublic ?? false,
      sellSharesCount: expectedShares,
      pricePerShare: Number(pricePerShare),
      marketPrice,
      buyerName
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    const saleRequest = {
      shareholdingId: holding.id,
      sellSharesCount: expectedShares,
      pricePerShare: Number(pricePerShare)
    };

    if (!corporation?.isPublic) {
      onRequestConsent({
        id: createId("notification"),
        type: "SHARE_SALE_REQUEST",
        title: `${corporation?.name ?? holding.corporationId} 주식 매각 요청`,
        body: `${buyerName}에게 ${expectedShares.toLocaleString("ko-KR")}주를 1주당 ${formatKrw(Number(pricePerShare))}에 매각하는 동의 요청을 보냈습니다.`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        saleRequest
      });
      setMessage("비상장 주식 매각 동의 요청을 알림에 등록했습니다.");
      return;
    }

    onSell(saleRequest);
    setMessage(`${expectedShares.toLocaleString("ko-KR")}주를 ${formatKrw(expectedProceeds)}에 매각했습니다.`);
  }

  return (
    <div className="stock-row">
      <div className="stock-main">
        <strong>{corporation?.name ?? holding.corporationId}</strong>
        <span>{holding.shares.toLocaleString("ko-KR")}주 · 지분율 {ownershipRatio.toFixed(2)}% · {corporation?.isPublic ? "상장회사" : "비상장회사"}</span>
      </div>
      <div className="stock-value">
        <span>보유 가치</span>
        <strong>{formatKrw(holdingValue)}</strong>
      </div>
      <div className="stock-sale-form">
        <div className="sale-control-row">
          <select value={sellBasis} onChange={(event) => setSellBasis(event.target.value as "shares" | "ratio")}>
            <option value="shares">주식 수</option>
            <option value="ratio">지분율</option>
          </select>
          <input
            min="0"
            type="number"
            value={sellAmount}
            onChange={(event) => setSellAmount(event.target.value)}
            aria-label="매각 기준 값"
          />
          <input
            min="0"
            type="number"
            value={pricePerShare}
            onChange={(event) => setPricePerShare(event.target.value)}
            aria-label="1주당 매각가"
          />
        </div>

        {!corporation?.isPublic ? (
          <div className="private-sale-controls">
            <input
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              placeholder="매각 대상"
              aria-label="매각 대상"
            />
            <p className="sale-rule">상대방은 개인 현황 알림에서 승인하거나 거절합니다.</p>
          </div>
        ) : (
          <p className="sale-rule">상장회사는 시장가 {formatKrw(marketPrice)}보다 낮은 가격으로 일부 수량만 매각할 수 있습니다.</p>
        )}

        <div className="sale-preview">
          <span>예상 매각: {expectedShares.toLocaleString("ko-KR")}주</span>
          <strong>{formatKrw(Number.isFinite(expectedProceeds) ? expectedProceeds : 0)}</strong>
        </div>
        <button className="sell-button" onClick={submitSale}>
          매각
        </button>
        {message ? <p className="sale-message">{message}</p> : null}
      </div>
    </div>
  );
}

interface SellShareRequest {
  shareholdingId: string;
  sellSharesCount: number;
  pricePerShare: number;
}

function sellShares(state: GameState, request: SellShareRequest): GameState {
  const holding = state.shareholdings.find((item) => item.id === request.shareholdingId);
  if (!holding || !holding.shareholderPersonId || holding.shares <= 0) {
    return state;
  }

  const sellSharesCount = Math.min(holding.shares, request.sellSharesCount);
  const proceeds = Math.round(sellSharesCount * request.pricePerShare);
  const person = state.persons.find((item) => item.id === holding.shareholderPersonId);
  if (!person) return state;

  return {
    ...state,
    shareholdings: state.shareholdings
      .map((item) => (item.id === request.shareholdingId ? { ...item, shares: item.shares - sellSharesCount } : item))
      .filter((item) => item.shares > 0),
    personalAccounts: state.personalAccounts.map((account) =>
      account.id === person.accountId ? { ...account, cashBalance: account.cashBalance + proceeds } : account
    )
  };
}

function calculateSellShareCount(ownedShares: number, basis: "shares" | "ratio", amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (basis === "ratio") {
    return Math.min(ownedShares, Math.floor(ownedShares * (amount / 100)));
  }
  return Math.min(ownedShares, Math.floor(amount));
}

function validateShareSale({
  holding,
  corporationIsPublic,
  sellSharesCount,
  pricePerShare,
  marketPrice,
  buyerName
}: {
  holding: IShareholding;
  corporationIsPublic: boolean;
  sellSharesCount: number;
  pricePerShare: number;
  marketPrice: number;
  buyerName: string;
}): { ok: boolean; message: string } {
  if (!Number.isFinite(sellSharesCount) || sellSharesCount <= 0) {
    return { ok: false, message: "매각할 주식 수를 1주 이상 입력해야 합니다." };
  }
  if (sellSharesCount > holding.shares) {
    return { ok: false, message: "보유 주식 수보다 많이 매각할 수 없습니다." };
  }
  if (!Number.isFinite(pricePerShare) || pricePerShare <= 0) {
    return { ok: false, message: "1주당 매각가를 입력해야 합니다." };
  }
  if (corporationIsPublic) {
    if (sellSharesCount >= holding.shares) {
      return { ok: false, message: "상장회사 주식은 한 번에 전량 매각할 수 없습니다." };
    }
    if (pricePerShare >= marketPrice) {
      return { ok: false, message: "상장회사 주식은 현재 시장가보다 낮은 가격으로만 매각할 수 있습니다." };
    }
  } else {
    if (!buyerName.trim()) {
      return { ok: false, message: "비상장회사 주식은 매각 대상을 입력해야 합니다." };
    }
  }

  return { ok: true, message: "매각할 수 있습니다." };
}

function createInitialNotifications(): UserNotification[] {
  return [
    {
      id: "notification-board-vote-1",
      type: "BOARD_VOTE",
      title: "이사회 안건 찬반 확인",
      body: "블루하버 홀딩스 신규 물류센터 투자 안건에 대한 의견 확인이 필요합니다.",
      status: "PENDING",
      createdAt: new Date().toISOString()
    },
    {
      id: "notification-shareholder-meeting-1",
      type: "SHAREHOLDER_MEETING_VOTE",
      title: "주주총회 의결권 행사 요청",
      body: "아라중공업 정기주주총회 배당 정책 안건에 대한 찬반 선택이 필요합니다.",
      status: "PENDING",
      createdAt: new Date().toISOString()
    },
    {
      id: "notification-asset-trade-1",
      type: "ASSET_TRADE_REQUEST",
      title: "자산 거래 요청",
      body: "마린시티 오피스텔 매입 제안이 도착했습니다.",
      status: "INFO",
      createdAt: new Date().toISOString()
    }
  ];
}

function notificationStatusLabel(status: UserNotification["status"]): string {
  switch (status) {
    case "PENDING":
      return "대기 중";
    case "ACCEPTED":
      return "승인됨";
    case "REJECTED":
      return "거절됨";
    case "INFO":
      return "확인";
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
