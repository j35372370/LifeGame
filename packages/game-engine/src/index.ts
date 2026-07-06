import { basicNpcCorporations, initialIndustries } from "@life-game/game-data";
import {
  INITIAL_PERSONAL_CAPITAL_KRW,
  type GameActionType,
  type IAdminActionLog,
  type ICorporation,
  type IEmploymentContract,
  type IGameAction,
  type IGameEventLog,
  type IGameNewsArticle,
  type INpcAgent,
  type IPersonalAccount,
  type IPersonalAsset,
  type IPerson,
  type IShareholding,
  type IUser
} from "@life-game/schemas";

export interface GameState {
  users: IUser[];
  persons: IPerson[];
  personalAccounts: IPersonalAccount[];
  corporations: ICorporation[];
  shareholdings: IShareholding[];
  employmentContracts: IEmploymentContract[];
  personalAssets: IPersonalAsset[];
  npcAgents: INpcAgent[];
  eventLogs: IGameEventLog[];
  newsArticles: IGameNewsArticle[];
  adminActionLogs: IAdminActionLog[];
}

export interface ActionResult {
  ok: boolean;
  message: string;
  state: GameState;
  eventLog?: IGameEventLog;
  newsArticle?: IGameNewsArticle;
  adminActionLog?: IAdminActionLog;
}

type Handler = (state: GameState, action: IGameAction<Record<string, unknown>>) => ActionResult;

export function createInitialGameState(now = new Date().toISOString()): GameState {
  const user: IUser = {
    id: "user-player-1",
    displayName: "플레이어",
    personId: "person-player-1",
    role: "PLAYER",
    createdAt: now
  };

  const person: IPerson = {
    id: "person-player-1",
    userId: user.id,
    name: "플레이어",
    accountId: "personal-account-player-1",
    familyMemberIds: [],
    employmentContractIds: [],
    createdAt: now
  };

  const account: IPersonalAccount = {
    id: "personal-account-player-1",
    ownerPersonId: person.id,
    cashBalance: INITIAL_PERSONAL_CAPITAL_KRW,
    currency: "KRW",
    assetIds: [],
    liabilityTotal: 0
  };

  return {
    users: [user],
    persons: [person],
    personalAccounts: [account],
    corporations: [...basicNpcCorporations],
    shareholdings: [],
    employmentContracts: [],
    personalAssets: [],
    npcAgents: [
      {
        id: "npc-agent-ara-heavy-industries",
        name: "아라중공업 경영 AI",
        corporationId: "corp-ara-heavy-industries",
        controlMode: "AUTO",
        traits: { riskTolerance: 0.45, growthPreference: 0.6 },
        goals: ["방산 수주 확대", "제조 설비 안정화"]
      }
    ],
    eventLogs: [],
    newsArticles: [],
    adminActionLogs: []
  };
}

export function processGameAction(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const handler = handlers[action.type];
  if (!handler) {
    return { ok: false, message: `지원하지 않는 action type입니다: ${action.type}`, state };
  }

  return handler(state, action);
}

export function createEventLog(params: Omit<IGameEventLog, "id" | "occurredAt"> & { occurredAt?: string }): IGameEventLog {
  return {
    id: createId("event"),
    occurredAt: params.occurredAt ?? new Date().toISOString(),
    ...params
  };
}

export function createNewsArticleFromEvent(eventLog: IGameEventLog, category = "CORPORATE"): IGameNewsArticle {
  return {
    id: createId("news"),
    sourceEventLogId: eventLog.id,
    category,
    headline: eventLog.title,
    body: eventLog.summary,
    visibility: "PUBLIC",
    publishedAt: new Date().toISOString()
  };
}

export function runDailySettlementPlaceholder(state: GameState): ActionResult {
  const eventLog = createEventLog({
    type: "DAILY_SETTLEMENT",
    origin: "SYSTEM",
    title: "일일 정산 placeholder 실행",
    summary: "자산 재평가, 리스크 정산, NPC 행동, 뉴스 생성은 추후 상세 공식으로 확장합니다.",
    entityRefs: []
  });

  return {
    ok: true,
    message: "일일 정산 placeholder가 실행되었습니다.",
    state: appendEvent(state, eventLog),
    eventLog
  };
}

const handlers: Record<GameActionType, Handler> = {
  CREATE_CORPORATION: handleCreateCorporation,
  INVEST_IN_CORPORATION: handleInvestInCorporation,
  APPLY_EMPLOYMENT: handleApplyEmployment,
  BUY_PERSONAL_ASSET: handleBuyPersonalAsset,
  TRANSFER_FUNDS: handleTransferFunds,
  ADMIN_SET_NPC_CONTROL_MODE: handleAdminSetNpcControlMode,
  ADMIN_FORCE_NPC_ACTION: handleAdminForceNpcAction
};

function handleCreateCorporation(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const actor = requireActorPerson(state, action);
  if (!actor.ok) return actor.result;

  const name = asString(action.payload.name);
  const industryId = asString(action.payload.industryId);
  const initialCapital = asNumber(action.payload.initialCapital);

  if (!name || !industryId || !initialCapital || initialCapital <= 0) {
    return fail(state, "기업명, 업종, 초기 자본금을 확인해야 합니다.");
  }
  if (!initialIndustries.some((industry) => industry.id === industryId)) {
    return fail(state, "존재하지 않는 업종입니다.");
  }

  const account = findPersonalAccount(state, actor.person.accountId);
  if (!account || account.cashBalance < initialCapital) {
    return fail(state, "개인 계좌 잔액이 부족합니다.");
  }

  const corporationId = createId("corp");
  const corporation: ICorporation = {
    id: corporationId,
    name,
    industryIds: [industryId],
    accountId: createId("corp-account"),
    representativePersonId: actor.person.id,
    foundedAt: action.requestedAt,
    shareCapital: initialCapital,
    totalShares: 10_000,
    isPublic: false
  };

  const shareholding: IShareholding = {
    id: createId("shareholding"),
    shareholderPersonId: actor.person.id,
    corporationId,
    shares: corporation.totalShares,
    acquiredPricePerShare: initialCapital / corporation.totalShares,
    acquiredAt: action.requestedAt
  };

  const eventLog = createEventLog({
    actionId: action.id,
    type: "CORPORATION_CREATED",
    origin: action.origin,
    title: `${name} 설립`,
    summary: `${actor.person.name}이(가) ${name}을(를) 설립하고 초기 자본금 ${initialCapital.toLocaleString("ko-KR")}원을 출자했습니다.`,
    entityRefs: [{ kind: "person", id: actor.person.id }, { kind: "corporation", id: corporationId }],
    amount: initialCapital,
    currency: "KRW",
    occurredAt: action.requestedAt
  });
  const newsArticle = createNewsArticleFromEvent(eventLog, "CORPORATE");

  return {
    ok: true,
    message: "기업 설립이 처리되었습니다.",
    state: {
      ...appendEventAndNews(state, eventLog, newsArticle),
      personalAccounts: state.personalAccounts.map((item) =>
        item.id === account.id ? { ...item, cashBalance: item.cashBalance - initialCapital } : item
      ),
      corporations: [...state.corporations, corporation],
      shareholdings: [...state.shareholdings, shareholding]
    },
    eventLog,
    newsArticle
  };
}

function handleInvestInCorporation(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const actor = requireActorPerson(state, action);
  if (!actor.ok) return actor.result;

  const corporationId = asString(action.payload.corporationId);
  const amount = asNumber(action.payload.amount);
  if (!corporationId || !amount || amount <= 0) return fail(state, "투자 대상과 금액을 확인해야 합니다.");

  const corporation = state.corporations.find((item) => item.id === corporationId);
  const account = findPersonalAccount(state, actor.person.accountId);
  if (!corporation || !account) return fail(state, "투자 대상 또는 개인 계좌를 찾을 수 없습니다.");
  if (account.cashBalance < amount) return fail(state, "개인 계좌 잔액이 부족합니다.");

  const shares = Math.max(1, Math.floor(amount / 10_000));
  const shareholding: IShareholding = {
    id: createId("shareholding"),
    shareholderPersonId: actor.person.id,
    corporationId,
    shares,
    acquiredPricePerShare: amount / shares,
    acquiredAt: action.requestedAt
  };

  const eventLog = createEventLog({
    actionId: action.id,
    type: "CORPORATION_INVESTED",
    origin: action.origin,
    title: `${corporation.name} 지분 투자`,
    summary: `${actor.person.name}이(가) ${corporation.name}에 ${amount.toLocaleString("ko-KR")}원을 투자했습니다. 상세 주가 산정은 TODO로 남깁니다.`,
    entityRefs: [{ kind: "person", id: actor.person.id }, { kind: "corporation", id: corporationId }],
    amount,
    currency: "KRW",
    occurredAt: action.requestedAt
  });

  return {
    ok: true,
    message: "지분 투자가 처리되었습니다.",
    state: {
      ...appendEvent(state, eventLog),
      personalAccounts: state.personalAccounts.map((item) =>
        item.id === account.id ? { ...item, cashBalance: item.cashBalance - amount } : item
      ),
      shareholdings: [...state.shareholdings, shareholding]
    },
    eventLog
  };
}

function handleApplyEmployment(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const actor = requireActorPerson(state, action);
  if (!actor.ok) return actor.result;

  const corporationId = asString(action.payload.corporationId);
  const title = asString(action.payload.title) ?? "사원";
  const monthlySalary = asNumber(action.payload.monthlySalary) ?? 3_000_000;
  const corporation = state.corporations.find((item) => item.id === corporationId);
  if (!corporation) return fail(state, "취업 대상 기업을 찾을 수 없습니다.");

  const contract: IEmploymentContract = {
    id: createId("employment"),
    personId: actor.person.id,
    corporationId: corporation.id,
    title,
    monthlySalary,
    startedAt: action.requestedAt
  };

  const eventLog = createEventLog({
    actionId: action.id,
    type: "EMPLOYMENT_APPLIED",
    origin: action.origin,
    title: `${corporation.name} 취업`,
    summary: `${actor.person.name}이(가) ${corporation.name}에 ${title} 직무로 취업했습니다.`,
    entityRefs: [{ kind: "person", id: actor.person.id }, { kind: "corporation", id: corporation.id }],
    occurredAt: action.requestedAt
  });

  return {
    ok: true,
    message: "취업 action이 처리되었습니다.",
    state: {
      ...appendEvent(state, eventLog),
      employmentContracts: [...state.employmentContracts, contract],
      persons: state.persons.map((item) =>
        item.id === actor.person.id ? { ...item, employmentContractIds: [...item.employmentContractIds, contract.id] } : item
      )
    },
    eventLog
  };
}

function handleBuyPersonalAsset(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const actor = requireActorPerson(state, action);
  if (!actor.ok) return actor.result;

  const assetTypeId = asString(action.payload.assetTypeId);
  const name = asString(action.payload.name) ?? "개인 자산";
  const price = asNumber(action.payload.price);
  const account = findPersonalAccount(state, actor.person.accountId);
  if (!assetTypeId || !price || price <= 0 || !account) return fail(state, "자산 종류와 가격을 확인해야 합니다.");
  if (account.cashBalance < price) return fail(state, "개인 계좌 잔액이 부족합니다.");

  const asset: IPersonalAsset = {
    id: createId("personal-asset"),
    ownerPersonId: actor.person.id,
    assetTypeId,
    name,
    purchasePrice: price,
    currentValue: price,
    acquiredAt: action.requestedAt
  };

  const eventLog = createEventLog({
    actionId: action.id,
    type: "PERSONAL_ASSET_BOUGHT",
    origin: action.origin,
    title: `${name} 매입`,
    summary: `${actor.person.name}이(가) 개인 자산 ${name}을(를) ${price.toLocaleString("ko-KR")}원에 매입했습니다.`,
    entityRefs: [{ kind: "person", id: actor.person.id }, { kind: "personalAsset", id: asset.id }],
    amount: price,
    currency: "KRW",
    occurredAt: action.requestedAt
  });

  return {
    ok: true,
    message: "개인 자산 매입이 처리되었습니다.",
    state: {
      ...appendEvent(state, eventLog),
      personalAccounts: state.personalAccounts.map((item) =>
        item.id === account.id ? { ...item, cashBalance: item.cashBalance - price, assetIds: [...item.assetIds, asset.id] } : item
      ),
      personalAssets: [...state.personalAssets, asset]
    },
    eventLog
  };
}

function handleTransferFunds(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const amount = asNumber(action.payload.amount);
  if (!amount || amount <= 0) return fail(state, "이체 금액을 확인해야 합니다.");

  // TODO: 계좌 종류별 합법적 자산거래, 배당, 월급, 주식 매각, 불법 유용 리스크를 세분화한다.
  const eventLog = createEventLog({
    actionId: action.id,
    type: "FUNDS_TRANSFERRED",
    origin: action.origin,
    title: "자금 이동 기록",
    summary: `${amount.toLocaleString("ko-KR")}원의 자금 이동이 기록되었습니다. 실제 계좌 반영 로직은 TODO입니다.`,
    entityRefs: [],
    amount,
    currency: "KRW",
    occurredAt: action.requestedAt
  });

  return {
    ok: true,
    message: "자금 이동 placeholder가 처리되었습니다.",
    state: appendEvent(state, eventLog),
    eventLog
  };
}

function handleAdminSetNpcControlMode(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const admin = requireAdmin(state, action);
  if (!admin.ok) return admin.result;

  const npcAgentId = asString(action.payload.npcAgentId);
  const mode = asString(action.payload.mode) as INpcAgent["controlMode"] | undefined;
  if (!npcAgentId || !mode) return fail(state, "NPC와 제어 모드를 확인해야 합니다.");

  const npc = state.npcAgents.find((item) => item.id === npcAgentId);
  if (!npc) return fail(state, "NPC agent를 찾을 수 없습니다.");

  const eventLog = createEventLog({
    actionId: action.id,
    type: "ADMIN_NPC_CONTROL_MODE_SET",
    origin: "ADMIN_OVERRIDE",
    title: `${npc.name} 제어 모드 변경`,
    summary: `관리자가 ${npc.name}의 제어 모드를 ${mode}(으)로 변경했습니다.`,
    entityRefs: [{ kind: "npcAgent", id: npc.id }],
    occurredAt: action.requestedAt
  });
  const adminActionLog = createAdminActionLog(admin.user.id, npc.id, "ADMIN_SET_NPC_CONTROL_MODE", "NPC 제어 모드 변경", eventLog.id);

  return {
    ok: true,
    message: "NPC 제어 모드가 변경되었습니다.",
    state: {
      ...appendEvent(state, eventLog),
      npcAgents: state.npcAgents.map((item) => (item.id === npc.id ? { ...item, controlMode: mode } : item)),
      adminActionLogs: [...state.adminActionLogs, adminActionLog]
    },
    eventLog,
    adminActionLog
  };
}

function handleAdminForceNpcAction(state: GameState, action: IGameAction<Record<string, unknown>>): ActionResult {
  const admin = requireAdmin(state, action);
  if (!admin.ok) return admin.result;

  const npcAgentId = asString(action.payload.npcAgentId);
  const forcedAction = asString(action.payload.forcedAction);
  const npc = state.npcAgents.find((item) => item.id === npcAgentId);
  if (!npc || !forcedAction) return fail(state, "강제 지정할 NPC와 행동을 확인해야 합니다.");

  const eventLog = createEventLog({
    actionId: action.id,
    type: "ADMIN_NPC_ACTION_FORCED",
    origin: "ADMIN_FORCED",
    title: `${npc.name} 행동 강제 지정`,
    summary: `관리자가 ${npc.name}에게 "${forcedAction}" 행동을 강제 지정했습니다. 실제 실행 로직은 TODO입니다.`,
    entityRefs: [{ kind: "npcAgent", id: npc.id }],
    occurredAt: action.requestedAt
  });
  const adminActionLog = createAdminActionLog(admin.user.id, npc.id, "ADMIN_FORCE_NPC_ACTION", forcedAction, eventLog.id);
  const newsArticle = createNewsArticleFromEvent(eventLog, "PRIVATE_REPORT");

  return {
    ok: true,
    message: "NPC 행동 강제 지정이 기록되었습니다.",
    state: {
      ...appendEventAndNews(state, eventLog, newsArticle),
      npcAgents: state.npcAgents.map((item) => (item.id === npc.id ? { ...item, controlMode: "ADMIN_FORCED" } : item)),
      adminActionLogs: [...state.adminActionLogs, adminActionLog]
    },
    eventLog,
    newsArticle,
    adminActionLog
  };
}

function requireActorPerson(state: GameState, action: IGameAction<Record<string, unknown>>) {
  const person = state.persons.find((item) => item.id === action.actorPersonId);
  if (!person) return { ok: false as const, result: fail(state, "actor person을 찾을 수 없습니다.") };
  return { ok: true as const, person };
}

function requireAdmin(state: GameState, action: IGameAction<Record<string, unknown>>) {
  const user = state.users.find((item) => item.id === action.actorUserId);
  if (!user || user.role !== "ADMIN") return { ok: false as const, result: fail(state, "관리자 권한이 필요합니다.") };
  return { ok: true as const, user };
}

function appendEvent(state: GameState, eventLog: IGameEventLog): GameState {
  return { ...state, eventLogs: [...state.eventLogs, eventLog] };
}

function appendEventAndNews(state: GameState, eventLog: IGameEventLog, newsArticle: IGameNewsArticle): GameState {
  return { ...state, eventLogs: [...state.eventLogs, eventLog], newsArticles: [...state.newsArticles, newsArticle] };
}

function findPersonalAccount(state: GameState, accountId: string): IPersonalAccount | undefined {
  return state.personalAccounts.find((item) => item.id === accountId);
}

function createAdminActionLog(
  adminUserId: string,
  targetNpcAgentId: string,
  actionType: string,
  reason: string,
  linkedEventLogId: string
): IAdminActionLog {
  return {
    id: createId("admin-action"),
    adminUserId,
    targetNpcAgentId,
    actionType,
    reason,
    linkedEventLogId,
    createdAt: new Date().toISOString()
  };
}

function fail(state: GameState, message: string): ActionResult {
  return { ok: false, message, state };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
