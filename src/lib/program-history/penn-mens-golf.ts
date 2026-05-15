export interface TraditionAchievement {
  label: string
  value: string
  detail: string
  sourceLabel: string
}

export interface ProgramTradition {
  title: string
  subtitle: string
  achievements: TraditionAchievement[]
}

export const PENN_GOLF_TRADITION: ProgramTradition = {
  title: 'Penn Golf Tradition',
  subtitle: 'Championship history, postseason appearances, captains, and the legacy of Penn Golf.',
  achievements: [
    {
      label: 'Ivy League Champions',
      value: '4 titles',
      detail: '1998 · 2007 · 2012 · 2015',
      sourceLabel: 'Penn Golf Quick Facts',
    },
    {
      label: 'Big 5 Champions',
      value: '2024',
      detail: 'First among Philadelphia\'s six Division I programs at Aronimink Golf Club',
      sourceLabel: 'Penn Athletics',
    },
    {
      label: 'NCAA Postseason History',
      value: '1972 · 1973 · 1974',
      detail: 'Individual NCAA appearance in 1972; team appearances in 1973 and 1974',
      sourceLabel: 'Penn Athletics',
    },
    {
      label: 'Eastern Intercollegiate Champions',
      value: '1974',
      detail: 'Part of Penn\'s early-1970s postseason legacy',
      sourceLabel: 'Penn Athletics Hall of Fame',
    },
    {
      label: 'ECAC Fall Champions',
      value: '1972',
      detail: 'A landmark title in program history',
      sourceLabel: 'Penn Athletics Hall of Fame',
    },
    {
      label: 'Penn Golf History',
      value: 'Full Archive',
      detail: 'Captains, letterwinners, individual honors, and tournament titles on record at Penn Athletics',
      sourceLabel: 'Penn Athletics',
    },
  ],
}
