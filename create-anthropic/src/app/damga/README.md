# Damga 원고 생성 시스템

## 실행

```bash
cd create-anthropic
npm run dev
```

접속: `http://localhost:3000/damga`

## 핵심 파일

- `create-anthropic/src/app/damga/page.js`
- `create-anthropic/src/app/damga/actions.js`
- `create-anthropic/src/app/damga/component/improved-page.js`
- `create-anthropic/src/app/damga/lib/system-prompt.js`
- `create-anthropic/src/app/damga/lib/user-prompts.js`
- `create-anthropic/src/app/damga/lib/check-prompt.js`
- `create-anthropic/src/app/damga/lib/rules.js`

## 참고

- `/` 와 `/new` 는 `middleware`에서 `/damga`로 리다이렉트됩니다.
- 프롬프트를 수정하려면 `create-anthropic/src/app/damga/lib/system-prompt.js`, `create-anthropic/src/app/damga/lib/user-prompts.js`, `create-anthropic/src/app/damga/lib/check-prompt.js` 를 수정하세요.
