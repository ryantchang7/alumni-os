export interface TraditionAchievement {
  label: string
  value: string       // the big number shown first
  detail: string      // years or subcategory line
  description: string
  featured?: boolean  // first/primary card — Penn red number accent
}

export interface ProgramTradition {
  title: string
  subtitle: string
  achievements: TraditionAchievement[]
}

export const PENN_GOLF_TRADITION: ProgramTradition = {
  title: 'Penn Golf Tradition',
  subtitle: 'Championships, postseason appearances, tournament wins, and individual honors from the Penn Golf record book.',
  achievements: [
    {
      label: 'Ivy League Championships',
      value: '4',
      detail: '1998 · 2007 · 2012 · 2015',
      description: 'Four Ivy crowns, including the 2012 playoff win over Dartmouth.',
      featured: true,
    },
    {
      label: 'NCAA Championship Team Appearances',
      value: '5',
      detail: '1947 · 1958 · 1965 · 1973 · 1974',
      description: 'Penn teams have reached the national championship stage across five seasons.',
    },
    {
      label: 'NCAA Regional Appearances',
      value: '4',
      detail: '2007 · 2010 · 2012 · 2015',
      description: 'Modern postseason appearances, including team regionals in 2007, 2012, and 2015.',
    },
    {
      label: 'Team Tournament Titles',
      value: '27',
      detail: '1996–2024',
      description: 'Team wins across Ivy, Big 5, George Washington, Navy, Lehigh, and other tournament fields.',
    },
    {
      label: 'Individual Tournament Titles',
      value: '20',
      detail: '1996–2017',
      description: 'Individual wins from Adam Bradshaw through Josh Goldenberg across Ivy, Big 5, and invitational fields.',
    },
    {
      label: 'Individual Honors',
      value: '42',
      detail: 'All-America · Ivy · All-Region · Scholar',
      description: 'All-America honors, Ivy major awards, All-Region recognition, and All-America Scholar selections.',
    },
  ],
}
