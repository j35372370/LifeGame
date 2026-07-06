# LIFE GAME

LIFE GAME은 가상의 군도 국가인 아라공화국을 배경으로 하는 웹 기반 정치/경제 시뮬레이션 게임입니다.

## 1차 개발 범위

- npm workspaces 기반 모노레포
- TypeScript 도메인 스키마
- 초기 seed data
- 핵심 action handler placeholder
- Event Log와 News 생성 기본 구조
- React 게임 앱 기본 화면
- Docusaurus wiki 문서 stub

## 실행

```bash
npm install
npm run dev:game
```

Wiki는 의존성 설치 후 다음 명령으로 실행합니다.

```bash
npm run dev:wiki
```

`git push`는 사용자가 명시적으로 요청할 때만 수행합니다.
