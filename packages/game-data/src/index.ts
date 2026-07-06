import type { GameActionType, ICorporation, IIndustry, NpcControlMode } from "@life-game/schemas";

export const initialIndustries: IIndustry[] = [
  { id: "industry-manufacturing", name: "Manufacturing", description: "제조업", revenueDrivers: ["factory", "equipment", "employees", "materials", "technologyLevel"] },
  { id: "industry-logistics-transportation", name: "Logistics / Transportation", description: "물류/운송업", revenueDrivers: ["vehicles", "logisticsCenters", "deliveryNetwork", "routeRights"] },
  { id: "industry-construction-real-estate", name: "Construction / Real Estate", description: "건설/부동산업", revenueDrivers: ["equipment", "workers", "contracts", "land", "buildings"] },
  { id: "industry-energy-resources", name: "Energy / Resources", description: "에너지/자원업", revenueDrivers: ["powerPlants", "oilFields", "gasFacilities", "grid"] },
  { id: "industry-finance", name: "Finance", description: "금융업", revenueDrivers: ["capital", "loanPortfolio", "investmentAssets"] },
  { id: "industry-advanced-technology-rnd", name: "Advanced Technology / R&D", description: "첨단기술/R&D업", revenueDrivers: ["labs", "patents", "researchers"] },
  { id: "industry-defense-shipbuilding", name: "Defense / Shipbuilding", description: "방산/조선업", revenueDrivers: ["defenseFactories", "designTechnology", "governmentContracts"] },
  { id: "industry-media-telecommunications", name: "Media / Telecommunications", description: "미디어/통신업", revenueDrivers: ["platforms", "contentStudios", "networks", "dataCenters", "spectrumLicenses"] },
  { id: "industry-retail-services", name: "Retail / Services", description: "유통/서비스업", revenueDrivers: ["stores", "warehouses", "brand", "supplyChain"] },
  { id: "industry-agriculture-food", name: "Agriculture / Food", description: "농수산/식품업", revenueDrivers: ["farms", "fishingGrounds", "processingPlants", "distributionNetwork"] }
];

export const basicNpcCorporations: ICorporation[] = [
  {
    id: "corp-ara-heavy-industries",
    name: "아라중공업",
    industryIds: ["industry-defense-shipbuilding", "industry-manufacturing"],
    accountId: "corp-account-ara-heavy-industries",
    foundedAt: "2026-01-01T00:00:00.000Z",
    shareCapital: 10_000_000_000,
    totalShares: 1_000_000,
    isPublic: false
  },
  {
    id: "corp-blue-strait-logistics",
    name: "청해물류",
    industryIds: ["industry-logistics-transportation"],
    accountId: "corp-account-blue-strait-logistics",
    foundedAt: "2026-01-01T00:00:00.000Z",
    shareCapital: 3_000_000_000,
    totalShares: 300_000,
    isPublic: false
  }
];

export const basicPublicInstitutions = [
  { id: "institution-ara-central-bank", name: "아라중앙은행", role: "통화 정책과 금융 안정" },
  { id: "institution-financial-supervision", name: "금융감독청", role: "금융업 감독과 시장 감시" },
  { id: "institution-public-procurement", name: "공공조달청", role: "공공기관 계약과 조달 관리" }
];

export const basicGovernmentEntities = [
  { id: "gov-executive-office", name: "아라공화국 행정부", role: "국가 정책 집행" },
  { id: "gov-national-assembly", name: "국민의회", role: "입법과 예산 심의" },
  { id: "gov-tax-service", name: "국세청", role: "세금 부과와 징수" }
];

export const basicPersonalAssetTypes = [
  { id: "asset-type-apartment", name: "아파트", category: "REAL_ESTATE" },
  { id: "asset-type-office-tel", name: "오피스텔", category: "REAL_ESTATE" },
  { id: "asset-type-vehicle", name: "차량", category: "VEHICLE" },
  { id: "asset-type-bond-fund", name: "채권형 펀드", category: "FINANCIAL" }
];

export const initialNewsCategories = [
  "POLITICS",
  "ECONOMY",
  "CORPORATE",
  "INVESTIGATION",
  "REGIONAL",
  "DISASTER_EVENT",
  "RUMOR",
  "PRIVATE_REPORT",
  "LEAK"
];

export const initialNpcControlModes: NpcControlMode[] = [
  "AUTO",
  "PAUSED",
  "ADMIN_GUIDED",
  "ADMIN_FORCED"
];

export const initialActionTypes: GameActionType[] = [
  "CREATE_CORPORATION",
  "INVEST_IN_CORPORATION",
  "APPLY_EMPLOYMENT",
  "BUY_PERSONAL_ASSET",
  "TRANSFER_FUNDS",
  "ADMIN_SET_NPC_CONTROL_MODE",
  "ADMIN_FORCE_NPC_ACTION"
];
