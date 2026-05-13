# 스테이션(Raspberry Pi) · 배포 · 백엔드 연동 정리

웹 앱(Next.js)과 **라즈베리 파이 스테이션**이 같은 계약을 쓰도록 정리한 문서입니다. Pi 쪽 저장소에 복사해 두거나, 환경 변수·HTTP 스펙만 참고해도 됩니다.

---

## 1. 전체 데이터 흐름

```
[ESP32 / Echo 펌웨어]  ──(유닛 코드 + 근접 로그 등)──▶  [Raspberry Pi 스테이션]
                                                          │
                                                          ├─ POST /api/ingest/encounters
                                                          ├─ POST /api/ingest/evolutions
                                                          ├─ POST /api/ingest/echo-state
                                                          ▼ HTTPS
                                              [PostgreSQL]  ←──  Vercel 등에서 돌아가는 Next 앱(Prisma)
```

- **웹 앱**: 사용자 가입·온보딩·오늘/아카이브/프로필 UI, 세션 쿠키 인증.
- **스테이션**: `INGEST_SECRET`으로 보호된 인제스트 API만 호출하면 됨. **사용자 JWT는 필요 없음.**

---

## 2. Echo “유닛 코드”와 DB 매칭

| 개념 | DB / API |
|------|-----------|
| 사용자가 가입 시 입력하는 코드 | `EchoDevice.id` (= PK), 새 가입 시 `serialNumber`도 동일 문자열 |
| ESP에 박힌 문자열 | 위와 **동일한 문자열**을 스테이션이 ingest의 `deviceId`로내면 됨 |
| 서버 정규화 | 대문자·공백 제거 (`normalizeEchoUnitCode`와 동일 규칙을 맞추는 것이 안전) |

**형식 (서버 검증과 맞출 것):** 길이 3–64, 정규식은 코드 기준으로  
`^[A-Z0-9][A-Z0-9_-]{2,63}$` (정규화 후).

**인제스트 시 `deviceId` 해석:**

- `EchoDevice.id`와 같거나
- `EchoDevice.serialNumber`와 같으면  
  내부적으로 **`EchoDevice.id`로 치환**한 뒤 `Encounter`에 저장합니다.

따라서 스테이션은 **펌웨어와 동일한 스티커/유닛 문자열**을 `deviceId`에 넣으면 됩니다. (등록되지 않은 값은 400 + `missing` 배열.)

---

## 3. 인제스트 API (스테이션에서 호출)

### 공통 요청 헤더

- **`Authorization: Bearer <INGEST_SECRET>`** — 세 인제스트 엔드포인트 모두 동일. 값은 서버의 **`INGEST_SECRET`**과 바이트 단위로 동일해야 합니다. 잘못된 토큰은 **401**입니다.
- **`Content-Type: application/json`**, **`Accept: application/json`** (권장).
- Pi는 **`ECHO_APP_URL`**에 경로를 붙여 POST합니다 (URL 끝 슬래시 없음).

### 3.1 `POST …/api/ingest/encounters`

- **Method / URL:** `POST https://<배포도메인>/api/ingest/encounters`
- **Body:** JSON **배열**. 각 원소는 encounter 객체 하나. **빈 배열 `[]`이면 처리 생략**으로 `{ ok: true, count: 0 }`을 돌려줍니다.

### Encounter 객체 필드 (필수·타입)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | encounter 고유 ID (클라이언트 생성 UUID 등, upsert 키) |
| `deviceId` | string | 위 절의 유닛 코드 또는 DB `id` / `serialNumber` |
| `otherEchoHash` | string | 상대 Echo 식별용 해시/문자열 |
| `otherEchoType` | string | `"shy"` \| `"messy"` \| `"bounce"` |
| `startedAt` | string | ISO 8601 날짜 문자열 |
| `endedAt` | string | ISO 8601 |
| `durationSec` | number | 초 |
| `rssiAvg` | number | RSSI 평균 |
| `rssiMin`, `rssiMax` | int | RSSI 최소·최대 (정수; 소수가 오면 반올림) |
| `closenessAvg` | number | 근접 평균 등 |
| `proximityZone` | string | `"far"` \| `"near"` \| `"close"` \| `"very_close"` (Pi 규칙: closeness 평균이 0.33 미만이면 far, 0.66 미만이면 near, 0.85 미만이면 close, 그 외 very_close) |
| `soundProfileId` | string | 사운드 프로필 ID (시드 예: `ambient3_meditation_v1`) |

성공 시 예: `{ "ok": true, "count": N }`  
실패 시: `401`(비밀 불일치), `400`(검증 실패·Zod 메시지), 미등록 기기 등.

### 3.2 `POST …/api/ingest/evolutions`

- **Body:** evolution 객체의 JSON **배열**. 빈 배열은 `{ ok: true, count: 0 }`.
- **멱등:** `id` 기준 upsert. Pi가 실패 후 재POST해도 같은 `id`면 갱신됩니다.
- **`deviceId`:** encounters와 동일 규칙(등록된 `EchoDevice.id` 또는 `serialNumber`).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 고유 ID (ESP에 없으면 Pi가 UUID v5 등으로 채움) |
| `deviceId` | string | 유닛 코드 |
| `mutationType` | string | 기본 `"melody_fragment_exchange"` (생략 시 서버 기본값) |
| `sourceEchoHash` | string | encounters의 `otherEchoHash`와 동일 규칙 (`echo:` + BLE 이름 SHA256 hex 앞 8자) |
| `trigger`, `beforeState`, `afterState` | object | 임의 JSON 객체 |
| `createdAt` | string | ISO 8601 UTC (`Z`) |
| `borrowedFragment` | object \| null | 선택 (재전송 시 생략하면 DB의 기존 값 유지) |
| `dailyMemoryId` | string \| null | 선택 |
| `sourceEchoType` | `"shy"` \| `"messy"` \| `"bounce"` | 선택 |

### 3.3 `POST …/api/ingest/echo-state`

- **Body:** **단일 JSON 객체**(배열 아님).
- 해당 Echo의 **마지막 동기화 프로필/상태**를 `EchoDevice`에 반영합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `deviceId` | string | 유닛 코드 |
| `soundProfileId` | string | `currentSoundProfileId`에 저장 |
| `profileSnapshot` | object | `EchoDevice.currentState`(JSON)에 저장 |
| `lastSyncedAt` | string | ISO UTC — `EchoDevice.lastSyncedAt` |
| `echoModelType` | string | 선택 |
| `uniqueDeviceName` | string | 선택 |

### curl 예시 (Pi / 개발 PC에서 테스트)

```bash
export APP_URL="https://your-app.vercel.app"
export INGEST_SECRET="your-ingest-secret"

curl -sS -X POST "$APP_URL/api/ingest/encounters" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '[{
    "id": "enc-test-001",
    "deviceId": "ECHO-UNIT-CODE-REGISTERED-AT-SIGNUP",
    "otherEchoHash": "peer-abc",
    "otherEchoType": "shy",
    "startedAt": "2026-05-12T10:00:00.000Z",
    "endedAt": "2026-05-12T10:05:00.000Z",
    "durationSec": 300,
    "rssiAvg": -65,
    "rssiMin": -70,
    "rssiMax": -60,
    "closenessAvg": 0.5,
    "proximityZone": "near",
    "soundProfileId": "ambient3_meditation_v1"
  }]'
```

`deviceId`는 **해당 계정으로 이미 등록된** `EchoDevice`와 맞아야 합니다.

**evolutions (배열 예시):**

```bash
curl -sS -X POST "$APP_URL/api/ingest/evolutions" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '[{
    "id": "evo-test-001",
    "deviceId": "ECHO-UNIT-CODE-REGISTERED-AT-SIGNUP",
    "mutationType": "melody_fragment_exchange",
    "sourceEchoHash": "echo:deadbeef",
    "trigger": { "proximityZone": "very_close", "durationSec": 12, "closenessAvg": 0.9 },
    "beforeState": { "melody": ["C4","D4"], "brightness": 0.5, "calmness": 0.5, "densityBias": 0.5 },
    "afterState": { "melody": ["C4","E4"], "brightness": 0.55, "calmness": 0.52, "densityBias": 0.48 },
    "createdAt": "2026-05-12T12:00:00.000Z",
    "borrowedFragment": { "original": ["E4"], "transposed": ["F4"], "insertedAt": 2 }
  }]'
```

**echo-state (단일 객체):**

```bash
curl -sS -X POST "$APP_URL/api/ingest/echo-state" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "deviceId": "ECHO-UNIT-CODE-REGISTERED-AT-SIGNUP",
    "soundProfileId": "ambient3_meditation_v1",
    "profileSnapshot": { "melody": ["E4","G4"], "brightness": 0.6, "calmness": 0.7, "densityBias": 0.4, "influences": { "shy": 0.5, "messy": 0.25, "bounce": 0.25 } },
    "lastSyncedAt": "2026-05-12T12:30:00.000Z"
  }'
```

---

## 4. 웹 앱 쪽과 맞춰야 할 환경 변수

배포 서버(Vercel 등)에 보통 다음이 필요합니다.

| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Railway Postgres |
| `AUTH_SECRET` | 세션 JWT (16자 이상) |
| `INGEST_SECRET` | 인제스트 Bearer (스테이션과 동일 값 공유) |

로컬은 `.env.local` + `yarn dotenv -e .env.local -- …` 패턴을 쓰고, **Pi에는 `DATABASE_URL`이 필요 없을 수 있음** (DB에 직접 붙지 않고 HTTPS로만 보내는 경우).

---

## 5. DB 스키마 반영 (배포 후)

마이그레이션은 앱 배포와 별도로 **프로덕션 DB에 한 번** 적용합니다.

```bash
DATABASE_URL="postgresql://…" yarn db:deploy
```

스키마가 바뀐 커밋을 올릴 때마다 필요합니다. (Vercel Build Command에 `prisma migrate deploy`를 넣으면 자동화 가능.)

---

## 6. Pi 쪽에서 “적용”할 때 체크리스트

1. **배포 URL** 고정 (`APP_URL`).
2. **`INGEST_SECRET`**을 서버와 동일하게 설정 (재시작 시 로드).
3. ESP → Pi로 넘기는 페이로드에서 **유닛 코드**를 꺼내, 위 encounter 스키마로 JSON 배열 구성.
4. **HTTPS POST** (리다이렉트·인증서 오류 시 `curl -v`로 확인).
5. **배치 전송**: 여러 encounter를 한 번의 JSON 배열로내도 됨 (서버가 배열 전체를 처리).
6. **재전송 / upsert**: 같은 `id`로 다시내면 update 경로(멱등에 가깝게 동작).

---

## 7. 관련 소스 파일 (웹 레포 기준)

| 영역 | 경로 |
|------|------|
| 인제스트 검증(Zod)·업서트 | `src/app/api/ingest/encounters/route.ts`, `evolutions/route.ts`, `echo-state/route.ts` |
| Zod 스키마 | `src/lib/ingestSchemas.ts` |
| `deviceId` → `EchoDevice.id` 정규화 | `src/lib/ingestDevices.ts` |
| Bearer 검증 | `src/lib/ingestAuth.ts` |
| 유닛 코드 규칙 | `src/lib/echoUnitCode.ts` |
| 가입 시 User + EchoDevice 생성 | `src/app/api/auth/register/route.ts` |
| 온보딩에서 기기 갱신/레거시 클레임 | `src/app/api/me/echo-device/route.ts` |
| Prisma 스키마 | `prisma/schema.prisma` |

Pi 전용 레포를 새로 만들 경우, **이 문서 §3 JSON 스펙 + §2 `deviceId` 규칙 + `INGEST_SECRET`**만 복사해도 연동에 충분합니다.

---

## 8. 보안 메모

- `INGEST_SECRET`이 유출되면 누구나 해당 계정에 encounter를 쌓을 수 있으므로, **Pi 파일 권한·비밀 저장소**에만 두세요.
- 장기적으로는 **기기별 토큰**이나 **mTLS** 같은 강한 모델을 검토할 수 있습니다.
