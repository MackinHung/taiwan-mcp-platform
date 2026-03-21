import type { ElectionRecord } from '../types.js';

export const PRESIDENTIAL_ELECTIONS: ElectionRecord[] = [
  { electionName: '第9屆總統副總統選舉', electionYear: 1996, electionType: 'president', date: '1996-03-23' },
  { electionName: '第10屆總統副總統選舉', electionYear: 2000, electionType: 'president', date: '2000-03-18' },
  { electionName: '第11屆總統副總統選舉', electionYear: 2004, electionType: 'president', date: '2004-03-20' },
  { electionName: '第12屆總統副總統選舉', electionYear: 2008, electionType: 'president', date: '2008-03-22' },
  { electionName: '第13屆總統副總統選舉', electionYear: 2012, electionType: 'president', date: '2012-01-14' },
  { electionName: '第14屆總統副總統選舉', electionYear: 2016, electionType: 'president', date: '2016-01-16' },
  { electionName: '第15屆總統副總統選舉', electionYear: 2020, electionType: 'president', date: '2020-01-11' },
  { electionName: '第16屆總統副總統選舉', electionYear: 2024, electionType: 'president', date: '2024-01-13' },
];

const LEGISLATIVE_ELECTIONS: ElectionRecord[] = [
  { electionName: '第7屆立法委員選舉', electionYear: 2008, electionType: 'legislator', date: '2008-01-12' },
  { electionName: '第8屆立法委員選舉', electionYear: 2012, electionType: 'legislator', date: '2012-01-14' },
  { electionName: '第9屆立法委員選舉', electionYear: 2016, electionType: 'legislator', date: '2016-01-16' },
  { electionName: '第10屆立法委員選舉', electionYear: 2020, electionType: 'legislator', date: '2020-01-11' },
  { electionName: '第11屆立法委員選舉', electionYear: 2024, electionType: 'legislator', date: '2024-01-13' },
];

const MAYOR_ELECTIONS: ElectionRecord[] = [
  { electionName: '2014年直轄市長暨縣市長選舉', electionYear: 2014, electionType: 'mayor', date: '2014-11-29' },
  { electionName: '2018年直轄市長暨縣市長選舉', electionYear: 2018, electionType: 'mayor', date: '2018-11-24' },
  { electionName: '2022年直轄市長暨縣市長選舉', electionYear: 2022, electionType: 'mayor', date: '2022-11-26' },
];

const REFERENDUM_ELECTIONS: ElectionRecord[] = [
  { electionName: '2018年全國性公民投票', electionYear: 2018, electionType: 'referendum', date: '2018-11-24' },
  { electionName: '2021年全國性公民投票', electionYear: 2021, electionType: 'referendum', date: '2021-12-18' },
];

export const ALL_ELECTIONS: ElectionRecord[] = [
  ...PRESIDENTIAL_ELECTIONS,
  ...LEGISLATIVE_ELECTIONS,
  ...MAYOR_ELECTIONS,
  ...REFERENDUM_ELECTIONS,
];
