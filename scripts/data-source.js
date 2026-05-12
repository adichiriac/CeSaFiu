const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');

const DATA_FILES = {
  questions: 'questions.json',
  personality: 'personality.json',
  ipipNeo60: 'ipip-neo-60.json',
  vocational: 'vocational.json',
  vocationalDeep: 'vocational-deep.json',
  careers: 'careers.json',
  paths: 'paths.json',
  universities: 'institutions.json',
  programs: 'programs.json',
};

const CANDIDATE_FILE = 'career-candidates.json';

function readJson(fileName) {
  const filePath = path.join(dataDir, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCanonicalData() {
  return Object.fromEntries(
    Object.entries(DATA_FILES).map(([key, fileName]) => [key, readJson(fileName)])
  );
}

function loadCandidateData() {
  const filePath = path.join(dataDir, CANDIDATE_FILE);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return readJson(CANDIDATE_FILE);
}

module.exports = {
  CANDIDATE_FILE,
  DATA_FILES,
  dataDir,
  loadCandidateData,
  loadCanonicalData,
  repoRoot,
};
