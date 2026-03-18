import type { CandidateRecord } from '../types.js';

const PRESIDENTIAL_2024: CandidateRecord[] = [
  { name: '柯文哲', party: '台灣民眾黨', number: 1, votes: 3690466, voteRate: 26.46, elected: false, electionName: '第16屆總統副總統選舉', constituency: '全國' },
  { name: '賴清德', party: '民主進步黨', number: 2, votes: 5586019, voteRate: 40.05, elected: true, electionName: '第16屆總統副總統選舉', constituency: '全國' },
  { name: '侯友宜', party: '中國國民黨', number: 3, votes: 4671021, voteRate: 33.49, elected: false, electionName: '第16屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2020: CandidateRecord[] = [
  { name: '宋楚瑜', party: '親民黨', number: 1, votes: 608590, voteRate: 4.26, elected: false, electionName: '第15屆總統副總統選舉', constituency: '全國' },
  { name: '韓國瑜', party: '中國國民黨', number: 2, votes: 5522119, voteRate: 38.61, elected: false, electionName: '第15屆總統副總統選舉', constituency: '全國' },
  { name: '蔡英文', party: '民主進步黨', number: 3, votes: 8170231, voteRate: 57.13, elected: true, electionName: '第15屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2016: CandidateRecord[] = [
  { name: '朱立倫', party: '中國國民黨', number: 1, votes: 3813365, voteRate: 31.04, elected: false, electionName: '第14屆總統副總統選舉', constituency: '全國' },
  { name: '蔡英文', party: '民主進步黨', number: 2, votes: 6894744, voteRate: 56.12, elected: true, electionName: '第14屆總統副總統選舉', constituency: '全國' },
  { name: '宋楚瑜', party: '親民黨', number: 3, votes: 1576861, voteRate: 12.84, elected: false, electionName: '第14屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2012: CandidateRecord[] = [
  { name: '蔡英文', party: '民主進步黨', number: 1, votes: 6093578, voteRate: 45.63, elected: false, electionName: '第13屆總統副總統選舉', constituency: '全國' },
  { name: '馬英九', party: '中國國民黨', number: 2, votes: 6891139, voteRate: 51.60, elected: true, electionName: '第13屆總統副總統選舉', constituency: '全國' },
  { name: '宋楚瑜', party: '親民黨', number: 3, votes: 369588, voteRate: 2.77, elected: false, electionName: '第13屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2008: CandidateRecord[] = [
  { name: '謝長廷', party: '民主進步黨', number: 1, votes: 5444949, voteRate: 41.55, elected: false, electionName: '第12屆總統副總統選舉', constituency: '全國' },
  { name: '馬英九', party: '中國國民黨', number: 2, votes: 7659014, voteRate: 58.45, elected: true, electionName: '第12屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2004: CandidateRecord[] = [
  { name: '陳水扁', party: '民主進步黨', number: 1, votes: 6471970, voteRate: 50.11, elected: true, electionName: '第11屆總統副總統選舉', constituency: '全國' },
  { name: '連戰', party: '中國國民黨', number: 2, votes: 6442452, voteRate: 49.89, elected: false, electionName: '第11屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_2000: CandidateRecord[] = [
  { name: '宋楚瑜', party: '無黨籍', number: 1, votes: 4664972, voteRate: 36.84, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '連戰', party: '中國國民黨', number: 2, votes: 2925513, voteRate: 23.10, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '陳水扁', party: '民主進步黨', number: 3, votes: 4977697, voteRate: 39.30, elected: true, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '許信良', party: '無黨籍', number: 4, votes: 79429, voteRate: 0.63, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
  { name: '李敖', party: '新黨', number: 5, votes: 16782, voteRate: 0.13, elected: false, electionName: '第10屆總統副總統選舉', constituency: '全國' },
];

const PRESIDENTIAL_1996: CandidateRecord[] = [
  { name: '陳履安', party: '無黨籍', number: 1, votes: 1074044, voteRate: 9.98, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '林洋港', party: '無黨籍', number: 2, votes: 1603790, voteRate: 14.90, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '彭明敏', party: '民主進步黨', number: 3, votes: 2274586, voteRate: 21.13, elected: false, electionName: '第9屆總統副總統選舉', constituency: '全國' },
  { name: '李登輝', party: '中國國民黨', number: 4, votes: 5813699, voteRate: 54.00, elected: true, electionName: '第9屆總統副總統選舉', constituency: '全國' },
];

export const CANDIDATES_BY_ELECTION: Record<string, CandidateRecord[]> = {
  '第16屆總統副總統選舉': PRESIDENTIAL_2024,
  '第15屆總統副總統選舉': PRESIDENTIAL_2020,
  '第14屆總統副總統選舉': PRESIDENTIAL_2016,
  '第13屆總統副總統選舉': PRESIDENTIAL_2012,
  '第12屆總統副總統選舉': PRESIDENTIAL_2008,
  '第11屆總統副總統選舉': PRESIDENTIAL_2004,
  '第10屆總統副總統選舉': PRESIDENTIAL_2000,
  '第9屆總統副總統選舉': PRESIDENTIAL_1996,
};
