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

type VoteChoice = "APPROVE" | "REJECT" | "ABSTAIN";
type VoteBasis = "MEMBER" | "SHARE";

interface UserNotification {
  id: string;
  type: NotificationType;
  categoryLabel: string;
  title: string;
  body: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED" | "INFO";
  createdAt: string;
  requestedAt: string;
  responseDueAt: string;
  submitter: string;
  agendaContent: string;
  voteBasis?: VoteBasis;
  voteCorporationId?: string;
  voteStats?: {
    approveCount: number;
    rejectCount: number;
    abstainCount: number;
  };
  userVote?: VoteChoice;
  saleRequest?: SellShareRequest;
  assetTradeRequest?: AssetTradeRequest;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [notifications, setNotifications] = useState<UserNotification[]>(() => createInitialNotifications(state));
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
          state={state}
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
          onVote={(notification, vote) =>
            onUpdateNotification((current) =>
              current.map((item) => (item.id === notification.id ? applyVoteChoice(item, vote, state) : item))
            )
          }
          onCounterAssetTrade={(notification, counterPrice, message) =>
            onUpdateNotification((current) =>
              current.map((item) =>
                item.id === notification.id ? applyAssetTradeCounter(item, counterPrice, message) : item
              )
            )
          }
          onDelete={(notification) =>
            onUpdateNotification((current) => current.filter((item) => item.id !== notification.id))
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
  state,
  notifications,
  onAccept,
  onReject,
  onVote,
  onCounterAssetTrade,
  onDelete
}: {
  state: GameState;
  notifications: UserNotification[];
  onAccept: (notification: UserNotification) => void;
  onReject: (notification: UserNotification) => void;
  onVote: (notification: UserNotification, vote: VoteChoice) => void;
  onCounterAssetTrade: (notification: UserNotification, counterPrice: number, message: string) => void;
  onDelete: (notification: UserNotification) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(notifications[0]?.id ?? null);
  const [isOpen, setIsOpen] = useState(true);
  const [counterDrafts, setCounterDrafts] = useState<Record<string, { price: string; message: string }>>({});

  return (
    <section className="asset-section notification-section">
      <div className="section-heading">
        <h3>알림</h3>
        <div className="section-heading-actions">
          <span>{notifications.filter((item) => item.status === "PENDING").length}건 대기</span>
          <button className="secondary-button" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? "닫기" : "열기"}
          </button>
        </div>
      </div>
      {!isOpen ? null : notifications.length === 0 ? (
        <p className="empty-state">확인할 알림이 없습니다.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => {
            const isExpanded = expandedId === notification.id;
            const canRespond = canRespondToNotification(notification);
            const actionLabels = notificationActionLabels(notification.type);
            const isVoting = isVotingNotification(notification);
            const voteWeight = getUserVoteWeight(notification, state);
            const isAssetTradeRequest = notification.type === "ASSET_TRADE_REQUEST" && Boolean(notification.assetTradeRequest);
            const counterDraft = counterDrafts[notification.id] ?? { price: "", message: "" };

            return (
              <article key={notification.id} className={isExpanded ? "notification-row expanded" : "notification-row"}>
                <div className="notification-summary">
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                  </div>
                  <div className="notification-meta">
                    <em>{notification.categoryLabel}</em>
                    <em>{notificationStatusLabel(notification.status)}</em>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="notification-detail">
                    <DetailPair label="안건 종류" value={notification.categoryLabel} />
                    <DetailPair label="안건 제출자" value={notification.submitter} />
                    <DetailPair label="의견 확인 요청일" value={formatDateTime(notification.requestedAt)} />
                    <DetailPair label="의견 표명 가능일" value={formatDateTime(notification.responseDueAt)} />
                    <DetailPair label="상태" value={notificationStatusLabel(notification.status)} />
                    {isVoting ? <DetailPair label="내 선택" value={voteChoiceLabel(notification.userVote)} /> : null}
                    {isVoting ? <DetailPair label="내 의결권" value={formatVoteWeight(voteWeight, notification.voteBasis)} /> : null}
                    <div className="agenda-content">
                      <span>안건 내용</span>
                      <p>{notification.agendaContent}</p>
                    </div>
                    {notification.voteStats ? <VoteStats stats={notification.voteStats} basis={notification.voteBasis} /> : null}
                    {notification.assetTradeRequest ? (
                      <>
                        <DetailPair label="거래 자산" value={notification.assetTradeRequest.assetName} />
                        <DetailPair label="상대 제안가" value={formatKrw(notification.assetTradeRequest.proposedPrice)} />
                        {notification.assetTradeRequest.counterPrice ? (
                          <DetailPair label="내 대안가" value={formatKrw(notification.assetTradeRequest.counterPrice)} />
                        ) : null}
                        {notification.assetTradeRequest.counterMessage ? (
                          <div className="agenda-content">
                            <span>대안 내용</span>
                            <p>{notification.assetTradeRequest.counterMessage}</p>
                          </div>
                        ) : null}
                        {canRespond ? (
                          <div className="counter-offer-form">
                            <label>
                              대안 금액
                              <div className="amount-input-row">
                                <input
                                  inputMode="numeric"
                                  value={counterDraft.price}
                                  onChange={(event) => {
                                    const formattedPrice = formatNumberInput(event.target.value);
                                    setCounterDrafts((current) => ({
                                      ...current,
                                      [notification.id]: { ...counterDraft, price: formattedPrice }
                                    }));
                                  }}
                                  placeholder="예: 7,600,000"
                                />
                                <strong>{formatCompactKrwEstimate(parseFormattedNumber(counterDraft.price))}</strong>
                              </div>
                            </label>
                            <label>
                              대안 설명
                              <textarea
                                value={counterDraft.message}
                                onChange={(event) =>
                                  setCounterDrafts((current) => ({
                                    ...current,
                                    [notification.id]: { ...counterDraft, message: event.target.value }
                                  }))
                                }
                                placeholder="조건이나 결제 일정을 입력하세요"
                              />
                            </label>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                    {notification.saleRequest ? (
                      <>
                        <DetailPair label="매각 주식 수" value={`${notification.saleRequest.sellSharesCount.toLocaleString("ko-KR")}주`} />
                        <DetailPair label="1주당 매각가" value={formatKrw(notification.saleRequest.pricePerShare)} />
                        <DetailPair
                          label="총 매각 예정가"
                          value={formatKrw(notification.saleRequest.sellSharesCount * notification.saleRequest.pricePerShare)}
                        />
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="notification-actions">
                  <button className="secondary-button" onClick={() => setExpandedId(isExpanded ? null : notification.id)}>
                    {isExpanded ? "접기" : "자세히"}
                  </button>
                  {canRespond && isVoting ? (
                    <>
                      <button
                        className={notification.userVote === "APPROVE" ? "selected-button" : undefined}
                        onClick={() => onVote(notification, "APPROVE")}
                      >
                        찬성
                      </button>
                      <button
                        className={notification.userVote === "REJECT" ? "secondary-button selected-button" : "secondary-button"}
                        onClick={() => onVote(notification, "REJECT")}
                      >
                        반대
                      </button>
                      <button
                        className={notification.userVote === "ABSTAIN" ? "secondary-button selected-button" : "secondary-button"}
                        onClick={() => onVote(notification, "ABSTAIN")}
                      >
                        기권
                      </button>
                    </>
                  ) : null}
                  {canRespond && isAssetTradeRequest ? (
                    <>
                      <button onClick={() => onAccept(notification)}>수락</button>
                      <button className="secondary-button" onClick={() => onReject(notification)}>거절</button>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          const counterPrice = parseFormattedNumber(counterDraft.price);
                          if (!Number.isFinite(counterPrice) || counterPrice <= 0) return;
                          onCounterAssetTrade(notification, counterPrice, counterDraft.message.trim());
                        }}
                      >
                        대안 제시
                      </button>
                    </>
                  ) : null}
                  {canRespond && !isVoting && !isAssetTradeRequest ? (
                    <>
                      <button onClick={() => onAccept(notification)}>{actionLabels.accept}</button>
                      <button className="secondary-button" onClick={() => onReject(notification)}>{actionLabels.reject}</button>
                    </>
                  ) : null}
                  {notification.status === "PENDING" && !canRespond ? (
                    <span className="notification-expired">의견 표명 기간 종료</span>
                  ) : null}
                  <button className="danger-button" onClick={() => onDelete(notification)}>
                    삭제
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function isVotingNotification(notification: UserNotification): boolean {
  return notification.type === "BOARD_VOTE" || notification.type === "SHAREHOLDER_MEETING_VOTE";
}

function canRespondToNotification(notification: UserNotification): boolean {
  return notification.status === "PENDING" && Date.now() <= new Date(notification.responseDueAt).getTime();
}

function notificationActionLabels(type: NotificationType): { accept: string; reject: string } {
  if (type === "BOARD_VOTE" || type === "SHAREHOLDER_MEETING_VOTE") {
    return { accept: "찬성", reject: "반대" };
  }

  return { accept: "승인", reject: "거절" };
}

function voteChoiceLabel(vote?: VoteChoice): string {
  switch (vote) {
    case "APPROVE":
      return "찬성";
    case "REJECT":
      return "반대";
    case "ABSTAIN":
      return "기권";
    default:
      return "미표명";
  }
}

function applyVoteChoice(notification: UserNotification, nextVote: VoteChoice, state: GameState): UserNotification {
  if (!notification.voteStats || !isVotingNotification(notification)) {
    return notification;
  }

  const voteStats = { ...notification.voteStats };
  const voteWeight = getUserVoteWeight(notification, state);
  const adjust = (vote: VoteChoice, amount: number) => {
    if (vote === "APPROVE") {
      voteStats.approveCount = Math.max(0, voteStats.approveCount + amount);
    }
    if (vote === "REJECT") {
      voteStats.rejectCount = Math.max(0, voteStats.rejectCount + amount);
    }
    if (vote === "ABSTAIN") {
      voteStats.abstainCount = Math.max(0, voteStats.abstainCount + amount);
    }
  };

  adjust(notification.userVote ?? "ABSTAIN", -voteWeight);
  adjust(nextVote, voteWeight);

  return {
    ...notification,
    userVote: nextVote,
    voteStats
  };
}

function applyAssetTradeCounter(notification: UserNotification, counterPrice: number, message: string): UserNotification {
  if (!notification.assetTradeRequest) {
    return notification;
  }

  return {
    ...notification,
    body: `${notification.assetTradeRequest.assetName} 거래 요청에 ${formatKrw(counterPrice)} 대안을 제시했습니다.`,
    status: "COUNTERED",
    assetTradeRequest: {
      ...notification.assetTradeRequest,
      counterPrice,
      counterMessage: message || "대안 금액으로 거래를 다시 제안했습니다."
    }
  };
}

function getUserVoteWeight(notification: UserNotification, state: GameState): number {
  if (notification.voteBasis !== "SHARE") {
    return 1;
  }

  const playerPersonId = state.users[0]?.personId;
  if (!playerPersonId || !notification.voteCorporationId) {
    return 0;
  }

  return state.shareholdings
    .filter((holding) => holding.shareholderPersonId === playerPersonId && holding.corporationId === notification.voteCorporationId)
    .reduce((sum, holding) => sum + holding.shares, 0);
}

function formatVoteWeight(weight: number, basis?: VoteBasis): string {
  const unit = basis === "SHARE" ? "주" : "표";
  return `${weight.toLocaleString("ko-KR")}${unit}`;
}

function VoteStats({ stats, basis }: { stats: NonNullable<UserNotification["voteStats"]>; basis?: VoteBasis }) {
  const total = stats.approveCount + stats.rejectCount + stats.abstainCount;
  const percent = (count: number) => (total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0.0%");
  const unit = basis === "SHARE" ? "주" : "명";

  return (
    <div className="vote-stats">
      <DetailPair label="찬성" value={`${stats.approveCount.toLocaleString("ko-KR")}${unit} · ${percent(stats.approveCount)}`} />
      <DetailPair label="반대" value={`${stats.rejectCount.toLocaleString("ko-KR")}${unit} · ${percent(stats.rejectCount)}`} />
      <DetailPair label="기권/미표명" value={`${stats.abstainCount.toLocaleString("ko-KR")}${unit} · ${percent(stats.abstainCount)}`} />
    </div>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
        categoryLabel: "지분 매각",
        title: `${corporation?.name ?? holding.corporationId} 주식 매각 요청`,
        body: `${buyerName}에게 ${expectedShares.toLocaleString("ko-KR")}주를 1주당 ${formatKrw(Number(pricePerShare))}에 매각하는 동의 요청을 보냈습니다.`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
        responseDueAt: addDaysIso(7),
        submitter: "플레이어",
        agendaContent: `${corporation?.name ?? holding.corporationId} 비상장 주식 ${expectedShares.toLocaleString("ko-KR")}주를 ${buyerName}에게 매각하는 안건입니다. 상대방이 알림에서 승인하면 거래가 체결됩니다.`,
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

interface AssetTradeRequest {
  assetName: string;
  proposedPrice: number;
  counterPrice?: number;
  counterMessage?: string;
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

function createInitialNotifications(state: GameState): UserNotification[] {
  const now = new Date().toISOString();
  const playerCorporation = state.corporations.find((corporation) => corporation.representativePersonId === state.users[0]?.personId);
  const shareholderMeetingCorporationId = playerCorporation?.id ?? "corp-player-blue-harbor";
  const shareholderMeetingCorporationName = playerCorporation?.name ?? "블루하버 홀딩스";
  const playerShareVotes = state.shareholdings
    .filter((holding) => holding.shareholderPersonId === state.users[0]?.personId && holding.corporationId === shareholderMeetingCorporationId)
    .reduce((sum, holding) => sum + holding.shares, 0);

  return [
    {
      id: "notification-board-vote-1",
      type: "BOARD_VOTE",
      categoryLabel: "투자 안건",
      title: "이사회 안건 찬반 확인",
      body: "블루하버 홀딩스 신규 물류센터 투자 안건에 대한 의견 확인이 필요합니다.",
      status: "PENDING",
      createdAt: now,
      requestedAt: now,
      responseDueAt: addDaysIso(5),
      submitter: "김도윤 대표이사 / 한서연 사외이사",
      voteBasis: "MEMBER",
      agendaContent:
        "수도권 남부 물류센터 임차 및 자동화 설비 도입에 12,000,000원을 투자하는 안건입니다. 월 고정비는 증가하지만 유통/서비스 매출 기반 확장을 기대합니다.",
      voteStats: {
        approveCount: 3,
        rejectCount: 1,
        abstainCount: 1
      }
    },
    {
      id: "notification-shareholder-meeting-1",
      type: "SHAREHOLDER_MEETING_VOTE",
      categoryLabel: "배당 안건",
      title: "주주총회 의결권 행사 요청",
      body: `${shareholderMeetingCorporationName} 정기주주총회 배당 정책 안건에 대한 찬반 선택이 필요합니다.`,
      status: "PENDING",
      createdAt: now,
      requestedAt: now,
      responseDueAt: addDaysIso(10),
      submitter: `${shareholderMeetingCorporationName} 이사회`,
      voteBasis: "SHARE",
      voteCorporationId: shareholderMeetingCorporationId,
      agendaContent:
        "당기 순이익 중 일부를 배당으로 지급하고 나머지를 방산 설비 개선에 유보하는 안건입니다. 주주는 의결권 행사 가능일까지 찬반을 표명할 수 있습니다.",
      voteStats: {
        approveCount: 0,
        rejectCount: 0,
        abstainCount: playerShareVotes
      }
    },
    {
      id: "notification-asset-trade-1",
      type: "ASSET_TRADE_REQUEST",
      categoryLabel: "자산 매입",
      title: "자산 거래 요청",
      body: "마린시티 오피스텔 매입 제안이 도착했습니다.",
      status: "PENDING",
      createdAt: now,
      requestedAt: now,
      responseDueAt: addDaysIso(3),
      submitter: "청해부동산",
      agendaContent:
        "마린시티 오피스텔을 8,000,000원에 매입하는 제안입니다. 개인 현금 유동성은 낮아지지만 임대수익형 자산 확보가 가능합니다.",
      assetTradeRequest: {
        assetName: "마린시티 오피스텔",
        proposedPrice: 8_000_000
      }
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
    case "COUNTERED":
      return "대안 제시됨";
    case "INFO":
      return "확인";
  }
}

function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "BOARD_VOTE":
      return "이사회 찬반";
    case "SHAREHOLDER_MEETING_VOTE":
      return "주주총회 찬반";
    case "ASSET_TRADE_REQUEST":
      return "자산 거래 요청";
    case "ASSET_TRADE_RESPONSE":
      return "자산 거래 결과";
    case "SHARE_SALE_REQUEST":
      return "주식 매각 동의";
  }
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
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

function parseFormattedNumber(value: string): number {
  return Number(value.replaceAll(",", ""));
}

function formatNumberInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("ko-KR");
}

function formatCompactKrwEstimate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "(0만원)";
  if (value >= 1_000_000_000_000) {
    return `(${(value / 1_000_000_000_000).toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}조)`;
  }
  if (value >= 100_000_000) {
    return `(${(value / 100_000_000).toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}억)`;
  }
  if (value >= 10_000_000) {
    return `(${Math.floor(value / 10_000_000).toLocaleString("ko-KR")}천만원)`;
  }
  if (value >= 1_000_000) {
    return `(${Math.floor(value / 1_000_000).toLocaleString("ko-KR")}백만원)`;
  }
  if (value >= 100_000) {
    return `(${Math.floor(value / 100_000).toLocaleString("ko-KR")}십만원)`;
  }
  return `(${Math.floor(value / 10_000).toLocaleString("ko-KR")}만원)`;
}

createRoot(document.getElementById("root")!).render(<App />);
