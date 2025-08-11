# 매화유치원 책대장 📚🌸

매화유치원 아이들의 독서 기록을 관리하고 AI 추천을 제공하는 웹 서비스입니다.

## 주요 기능

- ✅ **독서 기록 관리**: 아이별 읽은 책 기록
- ✅ **통계 및 분석**: 주간/월간 독서 통계
- ✅ **뱃지 시스템**: 100권 단위 달성 뱃지
- ✅ **AI 책 추천**: Google Gemini API 활용
- ✅ **교사 관리**: 비밀번호 보호된 교사 페이지
- ✅ **CSV 내보내기**: 데이터 백업 기능

## 기술 스택

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 1.5 Flash
- **Deployment**: Vercel

## 환경변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# 교사 비밀번호 (기본값: 1234)
NEXT_PUBLIC_TEACHER_CODE=1234
```

## 데이터베이스 스키마

Supabase에서 다음 테이블들을 생성하세요:

### `readers` 테이블
```sql
create table readers (
  id bigint primary key generated always as identity,
  name text not null,
  class_name text,
  parent_phone text,
  age integer,
  created_at timestamp with time zone default now()
);
```

### `books` 테이블
```sql
create table books (
  id bigint primary key generated always as identity,
  title text not null,
  author text not null,
  age_min integer,
  age_max integer,
  created_at timestamp with time zone default now()
);
```

### `readings` 테이블
```sql
create table readings (
  id bigint primary key generated always as identity,
  read_date date not null,
  notes text,
  book_id bigint references books(id),
  reader_id bigint references readers(id),
  created_at timestamp with time zone default now()
);
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## AI 추천 기능

Google Gemini API를 활용한 개인화된 책 추천:

1. **상세 질문 플로우**: 단순히 "책 추천해줘"라고 하면 관심사와 선호도를 묻습니다
2. **개인화**: 아이의 읽기 기록과 나이를 고려한 추천
3. **대화형**: 자연스러운 대화를 통한 상호작용

## 배포

Vercel에 배포 시 환경변수를 설정해야 합니다:

1. Vercel 대시보드에서 프로젝트 설정
2. Environment Variables에 위의 환경변수들 추가
3. 재배포

## 교사 접근

- URL: `/teachers-login`
- 기본 비밀번호: `1234`
- 학생 관리, 통계 확인, CSV 내보내기 가능

---

💝 매화유치원 아이들의 즐거운 독서를 응원합니다! 🌸📖