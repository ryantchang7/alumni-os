export interface TraditionAchievement {
  label: string
  value: string
  detail: string
  description: string
}

export interface ProgramTradition {
  title: string
  subtitle: string
  achievements: TraditionAchievement[]
}

export const PENN_GOLF_TRADITION: ProgramTradition = {
  title: 'Penn Golf Tradition',
  subtitle: 'Championship history, postseason appearances, individual honors, and tournament titles from the Penn Golf record book.',
  achievements: [
    {
      label: 'Ivy League Champions',
      value: '4 Titles',
      detail: '1998 · 2007 · 2012 · 2015',
      description: 'Four Ivy crowns, including the 2012 playoff win over Dartmouth.',
    },
    {
      label: 'NCAA Championship History',
      value: 'National Stage',
      detail: '1947 · 1958 · 1965 · 1973 · 1974',
      description: 'Penn teams have appeared at the NCAA Championship across five seasons.',
    },
    {
      label: 'NCAA Regional Appearances',
      value: 'Regional Stage',
      detail: '2007 · 2010 · 2012 · 2015',
      description: 'Penn Golf returned to NCAA regional competition across four modern postseason appearances.',
    },
    {
      label: 'Team Tournament Titles',
      value: 'Team Titles',
      detail: '1996 – 2024',
      description: 'From Bucknell and Lehigh to Ivy titles and the 2024 Big 5 Championship at Aronimink.',
    },
    {
      label: 'Individual Tournament Titles',
      value: 'Individual Winners',
      detail: '1996 – 2017',
      description: 'Penn golfers have claimed individual titles across Ivy, Big 5, and invitational fields.',
    },
    {
      label: 'Individual Honors',
      value: 'All-America & Ivy Honors',
      detail: 'Norbury · Wecal · Powell · St. Maxens · Heintz',
      description: 'All-America honors, Ivy major awards, All-Region recognition, and scholar honors.',
    },
  ],
}
