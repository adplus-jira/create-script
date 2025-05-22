const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3012;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public'));

// 제외 항목
function shouldExclude(line, excludeList) {
  if (!line || !line.trim()) return true;
  if (/^\d+$/.test(line)) return true;
  if (/^\d+[\s\.]/.test(line)) return true;
  return excludeList.some(ex => line.includes(ex));
}

// 문장으로 변경
function splitIntoSentences(text) {
  return text
    .replace(/\r?\n/g, ' ') // 줄바꿈 제거
    .split(/(?<=[.?!])\s+/) // 온점, 물음표, 느낌표 기준
    .map(s => s.trim())
    .filter(Boolean);
}

app.post('/upload', upload.array('files'), (req, res) => {
  const excludeList = req.body.exclude?.split(',').map(v => v.trim()) || [];

  req.files.sort((a, b) => {
    const nameA = a.originalname.match(/\d+/);
    const nameB = b.originalname.match(/\d+/);

    const numA = nameA ? parseInt(nameA[0]) : 0;
    const numB = nameB ? parseInt(nameB[0]) : 0;

    return numA - numB;
  });

  const filesArray = req.files.map(file => {
    const content = file.buffer.toString('utf-8');
    const sentences = splitIntoSentences(content).filter(
      line => !shouldExclude(line, excludeList)
    );
    return {
      name: file.originalname,
      lines: sentences,
    };
  });

  const result = checkDuplicates(filesArray);
  res.json(result);
});

// 중복 검사
function checkDuplicates(filesArray) {
  const rows = [];
  const sentenceMap = new Map();

  filesArray.forEach(({ name, lines }) => {
    lines.forEach((line, lineNumber) => {
      if (!sentenceMap.has(line)) {
        sentenceMap.set(line, []);
      }
      sentenceMap.get(line).push({ fileName: name, lineNumber });
    });
  });

  const reported = new Set();

  for (const [line, occurrences] of sentenceMap.entries()) {
    if (occurrences.length <= 1) continue;

    const sorted = occurrences.sort((a, b) => a.fileName.localeCompare(b.fileName));
    const [first, ...others] = sorted;

    const uniqueKey = `${line}-${first.fileName}-${first.lineNumber}`;
    if (reported.has(uniqueKey)) continue;
    reported.add(uniqueKey);

    const othersStr = others.map(o => o.fileName).join(', ');

    rows.push({
      file: first.fileName,
      sentence: line.replace(/\s+/g, ' ').trim(),
      duplicates: othersStr,
    });
  }

  return rows;
}

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
