# R&D Lab Manager

소재 R&D 환경을 위한 개인용 통합 관리 데스크톱 앱입니다.
접착제, 잉크, 슬라임, 점토 등 배합형 소재 연구개발에 필요한 실험 기록, 업무 관리, 입출고 추적, 물성 비교를 하나의 앱에서 관리합니다.

## 기술 스택

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Desktop Shell**: Tauri 2
- **Database**: SQLite (rusqlite)
- **상태 관리**: TanStack React Query + React Hook Form

## 사전 요구사항

아래 도구가 설치되어 있어야 합니다.

| 도구 | 최소 버전 | 확인 명령 |
|------|-----------|-----------|
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| Rust | 1.77+ | `rustc --version` |
| Cargo | 1.77+ | `cargo --version` |

### 시스템 라이브러리 (Linux)

```bash
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### macOS

Xcode Command Line Tools가 설치되어 있으면 별도 라이브러리 없이 동작합니다.

### Windows

[Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)와 WebView2가 필요합니다 (Windows 10/11에는 기본 포함).

## 설치 및 실행

```bash
# 1. 프로젝트 디렉토리로 이동
cd rnd-lab-app

# 2. npm 의존성 설치
npm install

# 3. 개발 모드 실행 (Tauri 데스크톱 앱)
npx tauri dev
```

첫 실행 시 Rust 의존성 빌드로 수 분이 걸릴 수 있습니다. 이후 실행부터는 빠르게 시작됩니다.

## 프로덕션 빌드

```bash
npx tauri build
```

빌드 결과물은 `src-tauri/target/release/bundle/` 에 생성됩니다.

## 데이터 저장 위치

SQLite DB 파일(`rnd_lab.db`)은 OS별 앱 데이터 디렉토리에 자동 생성됩니다.

| OS | 경로 |
|----|------|
| Linux | `~/.local/share/com.tauri.dev/` |
| macOS | `~/Library/Application Support/com.tauri.dev/` |
| Windows | `%APPDATA%\com.tauri.dev\` |

## 사용 방법

### Dashboard

앱을 실행하면 Dashboard가 표시됩니다. 한눈에 다음 정보를 확인할 수 있습니다:

- **오늘 업무**: 오늘 날짜의 업무 목록
- **예정 업무**: 이번 주 남은 업무
- **최근 실험**: 최근 등록된 실험 (클릭하여 상세 이동)
- **최근 입출고**: 최근 입출고 기록

### 프로젝트 관리 (Projects)

1. 좌측 사이드바에서 **Projects** 클릭
2. **+ 새 프로젝트** 버튼으로 프로젝트 생성 (이름, 설명, 상태)
3. 프로젝트를 클릭하면 상세 페이지로 이동
4. 상세 페이지에서 4개 탭 제공:
   - **실험 목록**: 프로젝트 내 실험들. **+ 실험 추가**로 새 실험 생성
   - **물성 비교표**: 프로젝트 내 모든 실험의 물성치를 표로 비교
   - **관련 업무**: 프로젝트에 연결된 업무 목록
   - **입출고 기록**: 프로젝트에 연결된 입출고 로그

### 실험 기록 (Experiment Detail)

프로젝트 상세에서 실험을 클릭하면 실험 상세 페이지로 이동합니다.

- **배합비**: 원료명, 함량, 단위, 역할을 입력. 합계와 비율(%)이 자동 계산됨
- **공정 조건**: 온도, 교반시간, 교반속도, pH, 숙성시간, 메모 입력
- **관찰 메모**: Markdown 형식으로 실험 관찰 내용 기록. 편집/저장 토글
- **물성치**: 물성명, 측정값, 단위, 측정법, 메모 입력

### 입출고 기록 (Inventory)

1. 좌측 사이드바에서 **Inventory** 클릭
2. **+ 기록 추가** 버튼으로 입고(IN) 또는 출고(OUT) 기록
3. 상단 필터에서 **품목명 검색** 및 **프로젝트 필터** 가능

### 업무 관리 (Tasks)

1. 좌측 사이드바에서 **Tasks** 클릭
2. 현재 주간의 업무가 날짜별로 표시됨
3. **+ 업무 추가**: 날짜, 제목, 우선순위, 프로젝트 연결 설정
4. 좌측 체크 버튼 클릭으로 상태 순환: 예정 → 진행중 → 완료

### 데이터 내보내기 (Export)

| 기능 | 위치 | 설명 |
|------|------|------|
| **주간 요약 Markdown** | Tasks 페이지 → **주간 요약** 버튼 | 이번 주 업무/실험/입출고를 Markdown으로 생성 및 다운로드 |
| **프로젝트 CSV** | Project Detail → **CSV Export** 버튼 | 프로젝트 내 실험+물성 데이터를 CSV로 다운로드 |
| **전체 JSON 백업** | Tasks 페이지 → **JSON 백업** 버튼 | 모든 테이블 데이터를 JSON으로 백업 다운로드 |

## 샘플 데이터

첫 실행 시 다음 샘플 데이터가 자동 생성됩니다:

- **프로젝트**: UV 경화 접착제 개발, 수성 잉크 개선, 슬라임 신제품
- **실험**: UV 접착제 배합 A-3, 수성 잉크 점도 조절
- **배합비/공정/물성**: 각 실험에 대한 샘플 데이터
- **입출고**: 시약 입출고 샘플 기록
- **업무**: 샘플 업무 4건

DB를 초기화하려면 앱 데이터 디렉토리의 `rnd_lab.db` 파일을 삭제 후 재시작하면 됩니다.

## 프로젝트 구조

```
rnd-lab-app/
├── src/                          # React 프론트엔드
│   ├── components/               # 재사용 UI 컴포넌트
│   │   ├── layout/AppLayout.tsx  # 사이드바 + 메인 레이아웃
│   │   └── ui/                   # Button, Modal, StatusBadge 등
│   ├── hooks/                    # Tauri IPC 호출 React Query 훅
│   ├── pages/                    # 라우트별 페이지 컴포넌트
│   ├── types/models.ts           # TypeScript 도메인 모델 타입
│   └── lib/                      # 유틸리티 (날짜, invoke 래퍼)
├── src-tauri/                    # Rust 백엔드
│   └── src/
│       ├── commands/             # Tauri IPC 커맨드 핸들러
│       ├── db/                   # SQLite 스키마 및 초기화
│       └── models/               # Rust 구조체 정의
├── package.json
└── vite.config.ts
```
