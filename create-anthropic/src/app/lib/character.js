const CHARACTER_DATA = {
  ages: [
    '20대 후반', '30대 초반', '30대 중반', '30대 후반',
    '40대 초반', '40대 중반', '40대 후반', '50대 초반', '50대 후반',
  ],
  occupations: [
    '직장인', '자영업자', '프리랜서', '공무원', '교육자',
    '사업가', '은퇴자', '회사원', '디자이너', '엔지니어',
    '마케터', '상담사', '컨설턴트', '학생', '개발자',
  ],
  personalities: [
    '꼼꼼한', '신중한', '분석적인', '실용적인', '호기심 많은',
    '적극적인', '차분한', '합리적인', '논리적인', '직관적인',
    '보수적인', '진보적인', '현실적인', '도전적인', '계획적인', '결단력 있는',
  ],
  motivations: [
    '새로운 사업 기회를 찾던', '부업을 고민하던', '창업 아이템을 물색하던',
    '투자처를 알아보던', '경제적 자유를 꿈꾸던', '인생 2막을 준비하던',
    '안정적인 수익을 원하던', '자기만의 사업을 하고 싶던', '퇴직 후 계획을 세우던',
    '부가 수입을 고민하던', '사업 확장을 고려하던', '새로운 도전을 원하던',
    '경제적 독립을 추구하던', '가족의 미래를 위해', '현실적인 대안을 찾던',
  ],
};

export const generateCharacter = () => {
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  return {
    age: getRandom(CHARACTER_DATA.ages),
    occupation: getRandom(CHARACTER_DATA.occupations),
    personality: getRandom(CHARACTER_DATA.personalities),
    motivation: getRandom(CHARACTER_DATA.motivations),
  };
};

export const getCharacterString = (character) => {
  return `${character.motivation} ${character.personality} ${character.age} ${character.occupation}`;
};