import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BriefcaseBusiness, Building2, Coins, Home, Newspaper, Play, WalletCards } from "lucide-react";
import { initialIndustries, basicNpcCorporations, basicPersonalAssetTypes } from "@life-game/game-data";
import { createInitialGameState, processGameAction, runDailySettlementPlaceholder, type GameState } from "@life-game/game-engine";
import type { GameActionType, IGameAction } from "@life-game/schemas";
import "./styles.css";

const now = () => new Date().toISOString();

function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [selectedIndustryId, setSelectedIndustryId] = useState(initialIndustries[0]?.id ?? "");
  const [selectedCorporationId, setSelectedCorporationId] = useState(basicNpcCorporations[0]?.id ?? "");
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState(basicPersonalAssetTypes[0]?.id ?? "");

  const player = state.persons[0];
  const account = state.personalAccounts.find((item) => item.id === player.accountId);
  const playerCorporations = state.corporations.filter((corp) => corp.representativePersonId === player.id);
  const netWorth = useMemo(
    () => (account?.cashBalance ?? 0) + state.personalAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
    [account?.cashBalance, state.personalAssets]
  );

  function dispatch(type: GameActionType, payload: Record<string, unknown>) {
    const action: IGameAction<Record<string, unknown>> = {
      id: `action-${Date.now()}`,
      type,
      actorUserId: "user-player-1",
      actorPersonId: player.id,
      origin: "PLAYER",
      payload,
      requestedAt: now()
    };
    const result = processGameAction(state, action);
    setState(result.state);
  }

  function settle() {
    setState(runDailySettlementPlaceholder(state).state);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Republic of Ara</p>
          <h1>LIFE GAME</h1>
        </div>
        <div className="capital-strip">
          <Metric label="현금" value={formatKrw(account?.cashBalance ?? 0)} />
          <Metric label="순자산" value={formatKrw(netWorth)} />
          <Metric label="기업" value={`${playerCorporations.length}개`} />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel command-panel">
          <div className="panel-header">
            <h2>첫 행동</h2>
            <button className="icon-button" onClick={settle} title="일일 정산">
              <Play size={18} />
            </button>
          </div>

          <ActionBlock icon={<Building2 size={18} />} title="기업 설립">
            <select value={selectedIndustryId} onChange={(event) => setSelectedIndustryId(event.target.value)}>
              {initialIndustries.map((industry) => (
                <option key={industry.id} value={industry.id}>{industry.name}</option>
              ))}
            </select>
            <button onClick={() => dispatch("CREATE_CORPORATION", { name: "플레이어 홀딩스", industryId: selectedIndustryId, initialCapital: 12_000_000 })}>
              설립
            </button>
          </ActionBlock>

          <ActionBlock icon={<Coins size={18} />} title="지분 투자">
            <select value={selectedCorporationId} onChange={(event) => setSelectedCorporationId(event.target.value)}>
              {state.corporations.map((corporation) => (
                <option key={corporation.id} value={corporation.id}>{corporation.name}</option>
              ))}
            </select>
            <button onClick={() => dispatch("INVEST_IN_CORPORATION", { corporationId: selectedCorporationId, amount: 5_000_000 })}>
              투자
            </button>
          </ActionBlock>

          <ActionBlock icon={<BriefcaseBusiness size={18} />} title="취업">
            <select value={selectedCorporationId} onChange={(event) => setSelectedCorporationId(event.target.value)}>
              {state.corporations.map((corporation) => (
                <option key={corporation.id} value={corporation.id}>{corporation.name}</option>
              ))}
            </select>
            <button onClick={() => dispatch("APPLY_EMPLOYMENT", { corporationId: selectedCorporationId, title: "전략기획 매니저", monthlySalary: 4_200_000 })}>
              지원
            </button>
          </ActionBlock>

          <ActionBlock icon={<Home size={18} />} title="자산 매입">
            <select value={selectedAssetTypeId} onChange={(event) => setSelectedAssetTypeId(event.target.value)}>
              {basicPersonalAssetTypes.map((assetType) => (
                <option key={assetType.id} value={assetType.id}>{assetType.name}</option>
              ))}
            </select>
            <button onClick={() => dispatch("BUY_PERSONAL_ASSET", { assetTypeId: selectedAssetTypeId, name: "마린시티 오피스텔", price: 8_000_000 })}>
              매입
            </button>
          </ActionBlock>
        </div>

        <div className="panel ledger-panel">
          <div className="panel-header">
            <h2>개인 장부</h2>
            <WalletCards size={20} />
          </div>
          <DataRow label="초기 자본금" value={formatKrw(50_000_000)} />
          <DataRow label="보유 현금" value={formatKrw(account?.cashBalance ?? 0)} />
          <DataRow label="개인 자산" value={`${state.personalAssets.length}건`} />
          <DataRow label="지분 보유" value={`${state.shareholdings.length}건`} />
          <DataRow label="고용 계약" value={`${state.employmentContracts.length}건`} />
        </div>

        <div className="panel events-panel">
          <div className="panel-header">
            <h2>Event Log</h2>
            <Newspaper size={20} />
          </div>
          <Timeline items={state.eventLogs.map((event) => ({ id: event.id, title: event.title, body: event.summary }))} />
        </div>

        <div className="panel news-panel">
          <div className="panel-header">
            <h2>News</h2>
            <Newspaper size={20} />
          </div>
          <Timeline items={state.newsArticles.map((article) => ({ id: article.id, title: article.headline, body: article.body }))} />
        </div>
      </section>
    </main>
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

function ActionBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="action-block">
      <div className="action-title">{icon}<span>{title}</span></div>
      <div className="action-controls">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Timeline({ items }: { items: Array<{ id: string; title: string; body: string }> }) {
  if (items.length === 0) {
    return <p className="empty-state">기록 없음</p>;
  }

  return (
    <div className="timeline">
      {items.slice().reverse().map((item) => (
        <article key={item.id} className="timeline-item">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

function formatKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

createRoot(document.getElementById("root")!).render(<App />);
