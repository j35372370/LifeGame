export const INITIAL_PERSONAL_CAPITAL_KRW = 50_000_000;

export type CurrencyCode = "KRW";
export type Id = string;

export type ActionOrigin =
  | "PLAYER"
  | "NPC_AI"
  | "SYSTEM"
  | "ADMIN_OVERRIDE"
  | "ADMIN_FORCED";

export type NpcControlMode =
  | "AUTO"
  | "PAUSED"
  | "ADMIN_GUIDED"
  | "ADMIN_FORCED";

export type GameActionType =
  | "CREATE_CORPORATION"
  | "INVEST_IN_CORPORATION"
  | "APPLY_EMPLOYMENT"
  | "BUY_PERSONAL_ASSET"
  | "TRANSFER_FUNDS"
  | "ADMIN_SET_NPC_CONTROL_MODE"
  | "ADMIN_FORCE_NPC_ACTION";

export interface IUser {
  id: Id;
  displayName: string;
  personId: Id;
  role: "PLAYER" | "ADMIN";
  createdAt: string;
}

export interface IPerson {
  id: Id;
  userId?: Id;
  name: string;
  accountId: Id;
  familyMemberIds: Id[];
  employmentContractIds: Id[];
  createdAt: string;
}

export interface IPersonalAccount {
  id: Id;
  ownerPersonId: Id;
  cashBalance: number;
  currency: CurrencyCode;
  assetIds: Id[];
  liabilityTotal: number;
}

export interface ICorporateAccount {
  id: Id;
  corporationId: Id;
  cashBalance: number;
  currency: CurrencyCode;
  liabilityTotal: number;
}

export interface IIndustry {
  id: Id;
  name: string;
  description: string;
  revenueDrivers: string[];
  requiredLicenses?: string[];
}

export interface ICorporation {
  id: Id;
  name: string;
  industryIds: Id[];
  accountId: Id;
  representativePersonId?: Id;
  foundedAt: string;
  shareCapital: number;
  totalShares: number;
  isPublic: boolean;
}

export interface IShareholding {
  id: Id;
  shareholderPersonId?: Id;
  shareholderCorporationId?: Id;
  corporationId: Id;
  shares: number;
  acquiredPricePerShare: number;
  acquiredAt: string;
}

export interface IEmploymentContract {
  id: Id;
  personId: Id;
  corporationId: Id;
  title: string;
  monthlySalary: number;
  startedAt: string;
  endedAt?: string;
}

export interface IPersonalAsset {
  id: Id;
  ownerPersonId: Id;
  assetTypeId: Id;
  name: string;
  purchasePrice: number;
  currentValue: number;
  acquiredAt: string;
}

export interface IGameAction<TPayload = Record<string, unknown>> {
  id: Id;
  type: GameActionType;
  actorUserId?: Id;
  actorPersonId?: Id;
  origin: ActionOrigin;
  payload: TPayload;
  requestedAt: string;
}

export interface IGameEventLog {
  id: Id;
  actionId?: Id;
  type: string;
  origin: ActionOrigin;
  title: string;
  summary: string;
  entityRefs: Array<{ kind: string; id: Id }>;
  amount?: number;
  currency?: CurrencyCode;
  occurredAt: string;
}

export interface IGameNewsArticle {
  id: Id;
  sourceEventLogId?: Id;
  category: string;
  headline: string;
  body: string;
  visibility: "PUBLIC" | "PRIVATE_REPORT" | "LEAKED";
  publishedAt: string;
}

export interface INpcAgent {
  id: Id;
  name: string;
  personId?: Id;
  corporationId?: Id;
  controlMode: NpcControlMode;
  traits: Record<string, number>;
  goals: string[];
}

export interface INpcControlSetting {
  id: Id;
  npcAgentId: Id;
  mode: NpcControlMode;
  autoRunEnabled: boolean;
  adminGuidance?: string;
  updatedByUserId: Id;
  updatedAt: string;
}

export interface IAdminActionLog {
  id: Id;
  adminUserId: Id;
  targetNpcAgentId?: Id;
  actionType: string;
  reason: string;
  linkedEventLogId?: Id;
  createdAt: string;
}

export interface ISettlementJob {
  id: Id;
  type: "DAILY" | "MONTHLY";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  scheduledFor: string;
  completedAt?: string;
}

export interface IFamilyMember {
  id: Id;
  personId: Id;
  relatedPersonId: Id;
  relation: "SPOUSE" | "PARENT" | "CHILD" | "SIBLING" | "HEIR";
}

export interface IInheritancePlan {
  id: Id;
  ownerPersonId: Id;
  heirPersonIds: Id[];
  notes: string;
  updatedAt: string;
}

export interface IShareholderMeeting {
  id: Id;
  corporationId: Id;
  type: "REGULAR" | "EXTRAORDINARY";
  requestedBy: "USER" | "NPC_MAJOR_SHAREHOLDER" | "INSTITUTIONAL_INVESTOR" | "MINORITY_COALITION" | "BOARD" | "AUDITOR";
  agenda: string[];
  scheduledAt: string;
  status: "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELED";
}

export interface IBoardMeeting {
  id: Id;
  corporationId: Id;
  agenda: string[];
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
}

export interface IWorldSignal {
  id: Id;
  type: "POLITICAL" | "ECONOMIC" | "INDUSTRY" | "REGIONAL" | "RISK";
  title: string;
  intensity: number;
  affectedIndustryIds: Id[];
  startsAt: string;
  endsAt?: string;
}
