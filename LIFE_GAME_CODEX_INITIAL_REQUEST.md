# LIFE GAME Codex 1차 개발 지시서

## 0. 응답 언어 규칙

Codex는 사용자에게 하는 모든 답변을 반드시 **한국어**로 작성한다.

- 설명, 진행 상황, 질문, 오류 보고, 완료 보고 모두 한국어로 작성한다.
- 코드, 파일명, 타입명, 함수명, 커밋 타입(`feat`, `fix`, `chore`, `docs`, `refactor`)은 영어를 사용해도 된다.
- 사용자가 별도로 요청하지 않는 한 영어 설명을 하지 않는다.
- 사용자가 이해하기 쉽도록 실무적인 표현으로 간결하게 설명한다.

---

## 1. Git 작업 규칙

이 프로젝트는 GitHub 저장소와 연결하여 관리한다.

Codex는 의미 있는 작업 단위가 완료될 때마다 다음 절차를 수행한다.

```bash
git status
git add .
git commit -m "<type>: <한글 커밋 메시지>"
```

### 커밋 메시지 규칙

커밋 메시지는 아래 형식을 사용한다.

```text
<type>: <한글 설명>
```

예시:

```bash
git commit -m "chore: LIFE GAME 초기 프로젝트 구조 생성"
git commit -m "feat: 핵심 도메인 스키마 추가"
git commit -m "docs: LIFE GAME WIKI 기본 문서 추가"
git commit -m "feat: 초기 사용자 행동 처리기 추가"
git commit -m "feat: 이벤트 로그 및 뉴스 피드 기본 구조 추가"
```

### 커밋 타입

- `chore`: 프로젝트 설정, 빌드 설정, 환경 구성
- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 추가 또는 수정
- `refactor`: 기능 변경 없는 코드 구조 개선
- `test`: 테스트 추가 또는 수정
- `style`: 포맷팅, 스타일 변경

### Git 주의사항

- `.env`, API Key, 토큰, 비밀번호, 인증키, 개인키, 민감한 원본자료는 절대 커밋하지 않는다.
- 커밋 전 반드시 `git status`를 확인한다.
- 커밋 전 변경 내용이 작업 목적과 일치하는지 확인한다.
- 대규모 변경은 기능 단위로 나누어 커밋한다.
- `git push`는 사용자가 명시적으로 요청할 때만 수행한다.
- GitHub 원격 저장소 연결이 안 되어 있으면 사용자에게 연결 명령어를 한국어로 안내한다.
- Codex 실행 환경에서 Git 명령 실행 승인이 필요한 경우, 사용자에게 한국어로 승인 요청한다.

---

## 2. 프로젝트 개요

LIFE GAME은 가상의 군도 국가인 **아라공화국**을 배경으로 하는 웹 기반 정치/경제 시뮬레이션 게임이다.

사용자는 개인 경제 주체로 시작하며, 기업을 설립하거나 기존 기업에 지분 투자하거나 취업하거나 개인 자산을 매입할 수 있다.

사용자는 반드시 기업을 소유해야 하는 것은 아니다.

게임의 핵심은 다음과 같다.

- 개인 자산과 기업 자산의 완전한 분리
- 기업 설립과 업종 선택
- 기업 운영, 지분 투자, 상장, 합병, 이사회, 주주총회
- 개인의 취업, 월급, 배당, 투자수익, 자산관리
- NPC AI의 자율 행동
- Event Log 기반 뉴스 생성
- LIFE GAME WIKI 기반 세계관/기관/법령/NPC 행동 규칙 관리

---

## 3. LIFE GAME WIKI의 역할

LIFE GAME WIKI는 런타임 게임 DB가 아니다.

LIFE GAME WIKI는 다음 정보를 관리하는 내부 지식 저장소다.

- 아라공화국 세계관
- 지리 정보
- 국가기관
- 공공기관
- 기업 정보
- 법령 정보
- NPC AI 행동 규칙
- 업종별 규칙
- 게임 시스템 설명
- JSON seed data
- TypeScript schema
- 밸런싱 노트

### WIKI와 게임 DB의 구분

```text
LIFE GAME 데이터 DB
→ 현재 게임 상태 저장

LIFE GAME 사용자 DB
→ 사용자 계정, 권한, 로그인 정보 저장

LIFE GAME WIKI DB
→ 세계관, 기관, 법령, NPC AI 규칙, seed data 저장

Event Log
→ 사용자/NPC/시스템 행동의 원본 사건 기록

News DB
→ 사용자에게 보여줄 가공된 뉴스 저장
```

---

## 4. 확정된 핵심 게임 규칙

### 4.1 사용자 시작 조건

- 사용자는 개인으로 시작한다.
- 모든 사용자의 초기 개인 자본금은 **50,000,000원**이다.
- 시작 배경은 선택하지 않는다.
- 첫 행동은 다음 네 가지 모두 허용한다.
  - 기업 설립
  - 기존 기업 지분 투자
  - 취업
  - 개인 자산 매입
- 기업을 설립하지 않아도 게임을 진행할 수 있다.
- 기업을 설립하지 않은 사용자는 취업, 지분 투자, 자산 매입을 통해 수익을 얻을 수 있다.

### 4.2 개인 자산과 기업 자산

- 개인 자산과 기업 자산은 완전히 분리한다.
- 사용자가 기업의 최대주주 또는 대표이사라 해도 기업 자산은 개인 자산이 아니다.
- 기업 자금을 개인이 가져오는 방식은 다음으로 구분한다.
  - 월급
  - 배당
  - 주식 매각
  - 합법적 자산거래
  - 불법 유용
- 모든 자금 이동은 Event Log에 기록한다.
- 불법 유용은 게임 내 가상 리스크 시스템으로만 다룬다.
- 현실 절차나 실제 범죄 방법을 구체적으로 안내하지 않는다.

### 4.3 기업 업종

기업 설립 시 업종 선택이 가능해야 한다.

초기 업종 예시는 다음과 같다.

1. 제조업
2. 물류/운송업
3. 건설/부동산업
4. 에너지/자원업
5. 금융업
6. 첨단기술/R&D업
7. 방산/조선업
8. 미디어/통신업
9. 유통/서비스업
10. 농수산/식품업

기업은 이후 다음 행동을 통해 업종을 추가하거나 변경할 수 있어야 한다.

- 신규 사업부 설립
- 타 기업 인수
- 합병
- 자회사 설립
- 사업부 매각
- 정부 인허가 획득
- 연구소 투자
- 공공기관 계약 수주

### 4.4 업종별 매출 증가 개념

업종별로 매출에 영향을 주는 핵심 자산이 달라야 한다.

예시:

- 제조업: 공장, 생산설비, 직원, 원자재, 기술 수준
- 물류업: 택배차량, 물류센터, 배송망
- 운송업: 트럭, 선박, 항공기, 노선권
- 건설업: 건설장비, 인력, 수주 계약
- 부동산업: 토지, 건물, 임대시설
- 에너지업: 발전소, 유전, 가스시설, 송전망
- 금융업: 자기자본, 대출 포트폴리오, 투자자산
- 첨단기술업: 연구소, 특허, 연구인력
- 방산업: 방산공장, 설계기술, 정부계약
- 미디어업: 방송국, 플랫폼, 콘텐츠 스튜디오
- 통신업: 통신망, 데이터센터, 주파수 라이선스
- 유통업: 매장, 창고, 브랜드, 공급망
- 농수산/식품업: 농장, 어장, 가공공장, 유통망

1차 개발에서는 정교한 매출 공식은 구현하지 말고, schema와 seed data, TODO 주석으로 남긴다.

### 4.5 주주총회

정기주주총회와 임시주주총회를 모두 고려한다.

- 정기주주총회는 회사에서 일정 주기로 개최한다.
- 임시주주총회는 사용자 또는 NPC AI가 조건을 만족하면 요구할 수 있다.

임시주주총회 요구 가능 주체:

- 사용자
- NPC 대주주
- 기관투자자
- 소액주주연합
- 이사회
- 감사

1차 개발에서는 상세 투표 로직을 구현하지 말고, schema와 placeholder만 만든다.

### 4.6 가족/상속 시스템

가족 구성원과 상속 시스템은 장기 콘텐츠로 포함한다.

예상 기능:

- 가족 구성원
- 후계자 지정
- 지분 증여
- 상속세
- 경영권 승계
- 가족 간 지분 분쟁
- 가족 구성원의 독자적 NPC 행동

1차 개발에서는 상세 로직을 구현하지 말고, schema placeholder와 wiki 문서 stub만 만든다.

### 4.7 정산 주기

Daily Settlement는 매일 1회 실행한다.

매일 정산 대상:

- 자산 가치 재평가
- 리스크 정산
- NPC AI 행동
- 뉴스 생성
- World Signal 반영
- 기업 주가/가치 변동
- 토지 가격 변동
- 산업 수요 변동
- 수사기관 관심도 변화
- 여론 변화

Monthly Settlement는 매월 1회 실행한다.

월간 정산 대상:

- 개인 생활비
- 월급 지급
- 직원 급여 지급
- 대출 이자
- 채권 이자
- 임대료 정산
- 세금 정산
- 배당 지급
- 보험료
- 유지보수비

1차 개발에서는 정산 스케줄러를 완성하지 말고, schema와 placeholder service만 만든다.

---

## 5. 관리자 NPC AI 제어 정책

관리자는 NPC AI의 행동을 수정하거나 직접 지정할 수 있어야 한다.

관리자 기능은 다음 목적을 가진다.

- NPC AI 테스트
- 밸런싱
- 시나리오 운영
- 이벤트 연출
- 비정상 NPC 행동 제어

관리자는 다음 작업을 수행할 수 있다.

1. NPC AI 행동 목표 수정
2. NPC AI 성향값 수정
3. NPC AI의 장기 계획 생성 또는 변경
4. 특정 NPC 행동 강제 지정
5. 특정 NPC 행동 중단
6. NPC 행동 자동 실행 여부 변경
7. NPC 행동 결과 확인
8. NPC 행동 로그 조회
9. 특정 이벤트 또는 뉴스 강제 생성
10. 특정 NPC의 사용자 대응 전략 변경

NPC 제어 모드는 다음으로 정의한다.

```ts
type NpcControlMode =
  | "AUTO"
  | "PAUSED"
  | "ADMIN_GUIDED"
  | "ADMIN_FORCED";
```

행동 출처는 다음으로 구분한다.

```ts
type ActionOrigin =
  | "PLAYER"
  | "NPC_AI"
  | "SYSTEM"
  | "ADMIN_OVERRIDE"
  | "ADMIN_FORCED";
```

관리자가 직접 지정한 NPC 행동은 반드시 Event Log와 Admin Action Log에 기록한다.

---

## 6. Event Log와 News

### Event Log

Event Log는 게임 세계에서 실제로 발생한 모든 사건의 원본 기록이다.

기록 대상:

- 사용자 행동
- NPC AI 행동
- 시스템 정산
- 관리자 개입
- 자금 이동
- 기업 설립
- 지분 투자
- 취업
- 자산 매입
- 뉴스 생성
- 리스크 변화

### News

News는 Event Log 중 사용자에게 보여줄 가치가 있는 사건을 가공한 것이다.

```text
Event Log = 원본 사건 기록
News = 사용자에게 보여줄 기사/속보/브리핑
```

News 종류:

- 정치 뉴스
- 경제 뉴스
- 기업 뉴스
- 수사/스캔들 뉴스
- 지역 뉴스
- 재난/이벤트 뉴스
- 루머
- 비공개 보고서
- 유출 뉴스

1차 개발에서는 News Feed 구조와 mock 생성 함수만 만든다.

---

## 7. 1차 개발 목표

1차 개발 목표는 전체 게임 완성이 아니라, LIFE GAME의 핵심 도메인 구조와 플레이 가능한 최소 흐름을 구현하는 것이다.

1차 완료 기준:

1. 프로젝트가 실행된다.
2. TypeScript 타입이 정리되어 있다.
3. 초기 seed data가 있다.
4. 사용자의 초기 자본금 5천만원 규칙이 있다.
5. 기업 설립 action handler가 있다.
6. 지분 투자 action handler가 있다.
7. 취업 action handler가 있다.
8. 개인 자산 매입 action handler가 있다.
9. Event Log 생성 함수가 있다.
10. News 생성 함수가 있다.
11. NPC 관리자 제어 타입이 있다.
12. Wiki 문서 기본 페이지가 있다.
13. 의미 있는 작업 단위별로 Git add와 commit이 수행된다.

---

## 8. 프로젝트 구조 요청

다음 monorepo 구조를 생성한다.

```text
life-game/
├─ apps/
│  ├─ game/
│  │  └─ React LIFE GAME
│  │
│  └─ wiki/
│     └─ Docusaurus LIFE GAME WIKI
│
├─ packages/
│  ├─ schemas/
│  │  └─ TypeScript interfaces
│  │
│  ├─ game-data/
│  │  └─ JSON seed data
│  │
│  └─ game-engine/
│     └─ core game logic
│
├─ raw/
│  └─ game-design/
│
├─ AGENTS.md
├─ README.md
└─ package.json
```

---

## 9. Required TypeScript Interfaces

다음 TypeScript interface를 생성한다.

- IUser
- IPerson
- IPersonalAccount
- ICorporation
- ICorporateAccount
- IIndustry
- IShareholding
- IEmploymentContract
- IPersonalAsset
- IGameAction
- IGameEventLog
- IGameNewsArticle
- INpcAgent
- INpcControlSetting
- IAdminActionLog
- ISettlementJob
- IFamilyMember
- IInheritancePlan
- IShareholderMeeting
- IBoardMeeting
- IWorldSignal

---

## 10. Required Game Actions

1차 개발에서 다음 action type과 placeholder handler를 구현한다.

- CREATE_CORPORATION
- INVEST_IN_CORPORATION
- APPLY_EMPLOYMENT
- BUY_PERSONAL_ASSET
- TRANSFER_FUNDS
- ADMIN_SET_NPC_CONTROL_MODE
- ADMIN_FORCE_NPC_ACTION

각 action handler는 다음 흐름을 가진다.

1. input 검증
2. actor 권한 확인
3. 관련 game state 업데이트
4. Event Log 생성
5. 필요 시 News Article 생성
6. structured result 반환

복잡한 비즈니스 로직은 TODO로 남겨도 된다.

---

## 11. Required Seed Data

초기 seed data를 생성한다.

필수 seed data:

- initial industries
- basic NPC corporations
- basic public institutions
- basic government entities
- basic personal asset types
- initial news categories
- initial NPC control modes
- initial action types

초기 업종:

1. Manufacturing
2. Logistics / Transportation
3. Construction / Real Estate
4. Energy / Resources
5. Finance
6. Advanced Technology / R&D
7. Defense / Shipbuilding
8. Media / Telecommunications
9. Retail / Services
10. Agriculture / Food

---

## 12. LIFE GAME WIKI 기본 문서

Docusaurus 기반 wiki 문서 stub을 생성한다.

필수 문서:

- Game Overview
- Republic of Ara
- User and Corporation Relationship
- Personal Finance
- Corporation System
- Industry System
- Shareholder Meeting System
- Family and Inheritance System
- Event Log and News System
- NPC AI System
- Admin Control System
- Settlement System
- Future Development Roadmap

모든 wiki 문서는 한국어로 작성한다.

---

## 13. 개발 제한사항

1차 개발에서는 다음 고급 기능을 완성하지 않는다.

- Full NPC AI decision engine
- Real-world international signal integration
- Full inheritance and family simulation
- Full shareholder meeting voting logic
- Full IPO and stock market mechanics
- Bond issuance mechanics
- Merger and acquisition mechanics
- Detailed tax system
- Detailed daily/monthly settlement formulas
- Full asset valuation formulas
- Full risk settlement formulas

대신 schema, placeholder service, TODO 주석, wiki 문서 stub을 만든다.

---

## 14. Codex 작업 방식

Codex는 다음 순서로 작업한다.

1. 현재 저장소 구조 확인
2. 필요한 package manager 확인
3. monorepo 구조 생성
4. schemas 패키지 작성
5. game-data seed 작성
6. game-engine action processor 작성
7. game 앱 기본 UI 작성
8. wiki 앱 기본 문서 작성
9. admin NPC control 기본 구조 작성
10. Event Log / News Feed 기본 연결
11. 타입 체크 또는 가능한 검증 실행
12. git status 확인
13. git add와 git commit 수행
14. 한국어로 완료 내역 보고

각 단계가 끝날 때마다 커밋한다.

단, `git push`는 사용자가 요청하기 전까지 수행하지 않는다.

---

## 15. 완료 보고 형식

Codex는 작업 완료 후 다음 형식으로 한국어 보고를 한다.

```text
완료한 작업:
- ...

생성/수정한 주요 파일:
- ...

실행한 검증:
- ...

생성한 커밋:
- ...

다음 추천 작업:
- ...
```

검증을 실행하지 못한 경우, 이유를 한국어로 명확하게 설명한다.
