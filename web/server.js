const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3012;
const iconv = require('iconv-lite');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    file.originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf-8');
    cb(null, true);
  },
});

app.use(cors());
app.use(express.static('public'));

function shouldExclude(line, excludeList) {
  if (!line || !line.trim()) return true;
  if (/^\d+$/.test(line)) return true; // 숫자만 있는 줄
  if (/^\d+[\s\.]/.test(line)) return true; // 숫자 + 공백 또는 점으로 시작하는 줄 (예: "14 ", "14.")
  return excludeList.some(ex => line.includes(ex));
}

// 문장 단위로 분리할 때 사용
function splitIntoSentences(text) {
  return text
    .replace(/\r?\n/g, ' ') // 줄바꿈 제거
    .split(/(?<=[.?!])\s+/) // 온점, 물음표, 느낌표 기준
    .map(s => s.trim())
    .filter(Boolean);
}

app.post('/upload', upload.array('files'), (req, res) => {
  const excludeList = req.body.exclude?.split(',').map(v => v.trim()) || [];

  // req.files.sort((a, b) => {
  //   const nameA = a.originalname.match(/\d+/);
  //   const nameB = b.originalname.match(/\d+/);

  //   const numA = nameA ? parseInt(nameA[0]) : 0;
  //   const numB = nameB ? parseInt(nameB[0]) : 0;

  //   return numA - numB;
  // });

  // const filesArray = req.files.map(file => {
  //   const content = file.buffer.toString('utf-8');
  //   const sentences = splitIntoSentences(content).filter(
  //     line => !shouldExclude(line, excludeList)
  //   );
  //   return {
  //     name: file.originalname,
  //     lines: sentences,
  //   };
  // });

  const filesArray = req.files.map(file => {
    const content = file.buffer.toString('utf-8');
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => !shouldExclude(line, excludeList));

    return {
      name: file.originalname,
      lines,
    };
  });

  const result = checkDuplicates(filesArray);
  res.json(result);
});

// 중복 검사
// function checkDuplicates(filesArray) {
//   const rows = [];
//   const reported = new Set();

//   for (let i = 0; i < filesArray.length - 1; i++) {
//     const fileA = filesArray[i];
//     for (let j = i + 1; j < filesArray.length; j++) {
//       const fileB = filesArray[j];

//       const linesASet = new Set(fileA.lines); // 빠른 비교를 위한 Set

//       fileB.lines.forEach((line, lineNumberB) => {
//         if (!line.trim() || !linesASet.has(line)) return;

//         // 파일A에서의 line 번호도 찾아야 함
//         // const lineNumberA = fileA.lines.findIndex(l => l === line);

//         const uniqueKey = `${line}-${fileA.name}-${fileB.name}`;
//         if (reported.has(uniqueKey)) return;
//         reported.add(uniqueKey);

//         rows.push({
//           file: fileA.name,
//           sentence: line.replace(/\s+/g, ' ').trim(),
//           duplicates: `${fileB.name}`,
//         });
//       });
//     }
//   }

//   return rows;
// }

function checkDuplicates(filesArray) {
  const rows = [];
  const sentenceMap = new Map();

  // 각 문장별로 등장한 파일명을 저장
  filesArray.forEach(({ name, lines }) => {
    lines.forEach(line => {
      if (!sentenceMap.has(line)) {
        sentenceMap.set(line, new Set());
      }
      sentenceMap.get(line).add(name);
    });
  });

  for (const [line, fileSet] of sentenceMap.entries()) {
    if (fileSet.size <= 1) continue; // 2개 이상의 파일에서만 중복

    const sortedFiles = Array.from(fileSet).sort();
    // const [...duplicates] = sortedFiles;

    rows.push({
      sentence: line.replace(/\s+/g, ' ').trim(),
      duplicates: sortedFiles.join(', '), // 중복 파일 목록만 표시
    });
  }

  return rows;
}

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
