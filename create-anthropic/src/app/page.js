import Anthropic from '@anthropic-ai/sdk';
import { MainPage } from './component/main-page';

const system = `
당신은 블로그 후기 원고 작성 전문가입니다.

핵심 원칙: 같은 정보를 매번 완전히 다른 표현과 구조로 재창조하여, 이전 원고와 중복되지 않는 독창적인 글을 작성합니다.

작성 방식:
1. 기본정보를 바탕으로 매번 다른 화자 성격과 관점으로 작성합니다.
2. 핵심내용의 의미는 유지하되, 반드시 완전히 다른 어휘와 문장 구조로 재구성합니다.
3. 표현변화 규칙과 중복방지 규칙을 엄격히 적용합니다.

<중복방지규칙>
- 핵심내용에 있는 표현을 그대로 사용하지 않습니다
- 같은 의미라도 완전히 다른 어휘로 대체합니다
- 예시:
  * "재방문할 때 지인들과" → "다시 찾을 때 아는 사람들과" / "두 번째 방문엔 친구들과" / "다음번엔 주변 사람들과"
  * "가격은 저렴하게 책정되어" → "부담 없는 가격으로" / "합리적인 금액에" / "주머니 사정에 맞춰"
  * "늦게까지 영업하지 않아도" → "일찍 문을 닫아도" / "영업시간이 짧아도" / "밤늦게 일하지 않고도"
- 동일한 접속사나 부사의 반복 사용을 피합니다
- 문장 패턴의 다양화를 필수로 합니다
</중복방지규칙>

<표현변화규칙>
- 문장 시작 방식을 매번 다르게 (직접적/목적우선/이유제시/주체강조)
- 감정 표현을 다양화 (설명적/감정적/객관적/발견적)
- 정보 제시 순서 변경 (방법→결과, 목적→방법 등)
- 어휘와 연결어를 다양하게 선택
- 같은 의미를 전달하는 다양한 표현법 활용
</표현변화규칙>

<형식 요구사항>
- 공백 포함 25자 내외로 줄바꿈
- 단락 번호 뒤에 점(.) 없이 작성 및 줄바꿈
- 문장 끝마다 줄바꿈
- 작은따옴표('), 큰따옴표(") 사용 불가
- 제목은 메인키워드가 맨 앞에 오도록 작성
- 각 단락 번호는 0부터 시작하며, 단락 번호는 최대단락수-1 까지 사용
- 전체 글자수에 맞춰 단락을 균등하게 분배
- 존댓말 사용, 과도한 구어체 지양
</형식 요구사항>

중요: 핵심내용의 정보는 반드시 포함하되, 표현은 완전히 새롭게 창조하세요.
`;

const mainKeyword = '고기집 소자본 창업';
const subKeyword = ['가격', '추천', '비용', '종류', '설명회', '정보', '성공사례', '아이템', '업종', '순위', '준비', '컨설팅', '업체', '브랜드', '프랜차이즈', '프렌차이즈', '식당'];
const marketName = '담가화로구이';
const keywordCount = 7;
const minLength = 1800;
const imageCount = 21;
const contentType = '정보성 원고';
const keyContent = `
- 프리미엄 소고기 전문점
- 누룩으로 7일 숙성 → 고기의 품질을 극대화
- 숙성 노하우로 타 브랜드와 차별화 → 따라 하기 어려워 진입장벽이 높음
- 숙성 고기의 장점: 컬러, 부드러움, 육즙, 육향
- 추가 주문은 무조건 반값
  : 고객 만족도 높음
  : 재방문 시 지인과 동반 방문 증가
  : 테이블당 단가 및 전체 매출 상승
- 담가 고기는 퀄리티는 높고 가격은 저렴함
- 늦게까지 영업하지 않아도 높은 수익 가능 → 점주의 삶의 질 향상
- 반값에 팔아도 순수익이 높음 → 성공 창업의 핵심은 수익성
- 별내점: 투자금 1억 5천, 월 순수익 4,000만 원
- 인천논현점: 주류 할인 이벤트 중에도 월 순수익 8,100만 원
- 인건비 평균 11% (외식업 평균 20% 이상 대비 낮음)
- 손질된 육류와 찬 제공 → 주방일 간편
- 100% 완제품 납품 → 전문 인력 없이도 운영 가능
- 직원 관리가 쉬움
- 공산품 본사 노마진, 전 품목 직거래 유통
- 석쇠, 숯, 티오더까지 100% 직거래
- 본사 노마진 구조 → 점주 수익률 극대화
- 윤양효 회장 직접 세미나 진행
  : 1990년대 대패 삼겹살 유행 주도
  : 와인 숙성 삼겹살 프랜차이즈 성공
  : ‘그램그램’ 덤 마케팅 경영자
  : 4번째 브랜드 ‘담가화로구이’ 오픈
- 창업 세미나 참가 시 매출/수익 구조 100% 공개
- 창업 모집 10개월 만에 120호점 계약
- 매주 목요일 오후 2시 본사에서 창업 세미나 진행
- 본사에서 점포 개발, 상권 및 입지 분석 지원
- 부서별 전문 인력 배치 → 운영 지원 체계 구축
- 소형 평수 창업 가능
- 다양한 창업 대출 상품 보유
- 2호점 이상 다점포 사례 16개점

<성공사례 (아래 성공사례 중 3~4개 선택하여 내용 구성)>
동탄목동점
- 4월 오픈, 3일 만에 최고매출 680만 원
-테이블 18개, 3.8회전
-30대 초반, 삼성 퇴사 후 창업

양천목동점
- 인테리어 공사 중 교육 수강
- 2호점 가계약 진행

잠실1호점
- 프랜차이즈 본사 출신 창업
- 업계 전문가가 선택한 브랜드

마석점
- 고매출 유지
- 2호점 가계약 완료

별내점
- 초보 창업자
- 고매출 유지
- 지인 3명 창업 연쇄 오픈
- (의정부고산점, 구리갈매점, 의정부신곡백병원점)

의왕포일점
- 치킨집 3개 운영 후 업종 전환
- 수익성에 만족

삼송점
- 본사 점포 개발
- 고매출 유지 중

탄현점
- 무한리필 운영하다 전환
- 120평 규모, 본사 점포개발 진행

인천논현점
- 무한리필 여러 매장 운영 → 브랜드 전환
- 운영 편함 + 수익성 만족
- 일산주엽점 2호점 운영, 3호점 준비 중

하남감일점
- 본인 건물 직접 창업
- 오픈 20일 매출 3.5억
- 예상 월 매출 5억 이상
- 마진률 25% 기준 순수익 약 1억 3,700만 원 예상
</성공사례>
`;

const additionalRequirements = `
창업 문의 네이버 폼 url 링크 삽입 필수 !

https://naver.me/Gn0RaYTQ

네이버 톡톡 상담 링크 : talk.naver.com/W5G0S8I
`;

const approaches = [
  // 정보 전달 방식별 접근  
  "결론부터 제시하고 근거를 차례로 설명하는 방식",
  "의문점부터 시작해서 해답을 찾아가는 과정으로 작성",
  "비교 분석을 통해 장단점을 따져보는 방식",
  "단계별로 차근차근 설명해나가는 방식",
  "핵심 포인트들을 먼저 나열하고 상세 설명하는 방식",
  "스토리텔링으로 몰입감 있게 전개하는 방식",

  // 감정 톤별 접근
  "놀라움과 감탄을 표현하며 흥미롭게 작성",
  "신중하고 분석적인 톤으로 차분하게 작성", 
  "확신에 찬 추천 톤으로 적극적으로 작성",
  "공감과 소통을 강조하며 친근하게 작성",
  "호기심과 탐구 정신으로 질문 중심으로 작성",

  // 구조적 접근
  "문제 제기 → 해결책 제시 → 효과 검증 순서로 작성",
  "현상 관찰 → 원인 분석 → 결론 도출 순서로 작성", 
  "가설 설정 → 근거 제시 → 결과 확인 순서로 작성",
  "경험 공유 → 교훈 도출 → 조언 제공 순서로 작성",

  // 특별한 관점별 접근
  "경제적 관점에서 투자 대비 수익을 중심으로 작성",
  "시간 관리 관점에서 효율성을 강조하며 작성",
  "품질 관리 관점에서 차별화 요소를 중심으로 작성", 
  "고객 만족 관점에서 서비스의 장점을 강조하며 작성",
  "리스크 관리 관점에서 안정성을 중심으로 작성"
];

const meatRestaurantCharacterBuilder = {
  ages: [
    "20대 후반", "30대 초반", "30대 중반", "30대 후반", 
    "40대 초반", "40대 중반", "40대 후반", "50대 초반", "50대 후반"
  ],
  
  occupations: [
    "직장인", "자영업자", "프리랜서", "공무원", 
    "교육자", "사업가", "은퇴자", "회사원",
    "디자이너", "엔지니어", "마케터", "상담사", "컨설턴트", 
    "학생", "개발자"
  ],
  
  personalities: [
    "꼼꼼한", "신중한", "분석적인", "실용적인", "호기심 많은", "적극적인",
    "차분한", "합리적인", "논리적인", "직관적인", "보수적인", "진보적인",
    "현실적인", "도전적인", "계획적인", "결단력 있는"
  ],
  
  motivations: [
    "새로운 사업 기회를 찾던", "부업을 고민하던", "창업 아이템을 물색하던",
    "투자처를 알아보던", "경제적 자유를 꿈꾸던", "인생 2막을 준비하던",
    "안정적인 수익을 원하던", "자기만의 사업을 하고 싶던", "퇴직 후 계획을 세우던",
    "부가 수입을 고민하던", "사업 확장을 고려하던", "새로운 도전을 원하던",
    "경제적 독립을 추구하던", "가족의 미래를 위해", "현실적인 대안을 찾던"
  ]
};

const setCharacter = () => {
  const age = meatRestaurantCharacterBuilder.ages[Math.floor(Math.random() * meatRestaurantCharacterBuilder.ages.length)];
  const occupation = meatRestaurantCharacterBuilder.occupations[Math.floor(Math.random() * meatRestaurantCharacterBuilder.occupations.length)];
  const personality = meatRestaurantCharacterBuilder.personalities[Math.floor(Math.random() * meatRestaurantCharacterBuilder.personalities.length)];
  const motivation = meatRestaurantCharacterBuilder.motivations[Math.floor(Math.random() * meatRestaurantCharacterBuilder.motivations.length)];
  
  return `${motivation} ${personality} ${age} ${occupation}`;
};

{/* <writing_approach>
접근 방식: ${selectedApproach}
화자: ${selectedCharacteristic}
발견계기: ${mainKeyword}에 대한 관심과 경험을 바탕으로 작성
</writing_approach> */}

export default function Home() {
  const getMessage = async ({ temperature, top_p }) => {
    'use server';
    const selectedCharacteristic = setCharacter();
    const selectedApproach = approaches[Math.floor(Math.random() * approaches.length)];

    const userMsg = `
<request>
블로그 원고를 작성해주세요.

<기본정보>
- 제목: ${mainKeyword}, 서브키워드, ${marketName} 포함하여 자연스럽게 작성
- 메인키워드: ${mainKeyword} (${keywordCount}회 자연스럽게 포함)
- 서브키워드: ${subKeyword[Math.floor(Math.random() * subKeyword.length)]}
- 최소글자수: 공백을 제외한 ${minLength}자 이상
- 최대단락수: ${imageCount}개
- 글 성격: ${contentType}
- 화자 : ${selectedCharacteristic}
- 접근 방식: ${selectedApproach}
</기본정보>

<핵심내용>
아래 정보들의 의미를 담되, 반드시 완전히 다른 표현으로 재창조하여 작성하세요:
${keyContent}
</핵심내용>

<표현전환예시 (그대로 따라하기 금지)>
- "프리미엄 소고기 전문점" → 최상급 한우 맛집 / 고급 육류 식당 / 특별한 소고기 요리점
- "누룩으로 7일 숙성" → 일주일간 누룩 발효 / 7일의 누룩 에이징 / 특별한 발효 과정을 거친
- "고객 만족도 높음" → 손님들이 매우 좋아함 / 방문객들의 호평이 자자함 / 이용자들의 평가가 우수함
- "월 순수익 4,000만 원" → 한 달에 4천만 원의 순이익 / 매월 4천의 실수익 / 30일 기준 4,000만원의 실질 수익
</표현전환예시>

<additional_info>
마무리 정보:
${additionalRequirements}
</additional_info>

중요: 
1. 핵심내용의 표현을 그대로 사용하지 마세요
2. 화자의 성격과 접근 방식에 맞춰 자연스럽게 변형하세요
3. 글자 수(공백 미포함)와 표현규칙을 엄격히 지켜주세요
</request>
`;

    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const msg = await anthropic.messages.create({
        system,
        model: 'claude-sonnet-4-20250514',
        // thinking: {
        //   type: 'enabled',
        //   budget_tokens: 3000  // 사고에 할당할 토큰
        // },
        // temperature: parseInt(temperature),
        top_p: parseInt(top_p) || 0.9,
        // top_k: 40,
        max_tokens: 20000,
        messages: [{ role: 'user', content: userMsg }],
      });
      console.log(msg);
      const content = msg.content[0].text;
      console.log(content);
      return { content, status: 'success' };
    } catch (e) {
      return { content: e.message, status: 'error' };
    }
  };

  return (
    <div className="p-10 relative">
      <h1 className="text-3xl font-bold underline mb-8">Anthropic AI Example</h1>
      <MainPage getMessage={getMessage} />
    </div>
  );
}
