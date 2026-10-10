export type Game = {
  id: number;
  time: string;
  class: string;
  hometeam?: string;
  awayteam?: string;
  location: string;
  homescore?: number | null;
  awayscore?: number | null;
  scorer?: string;
  eventname?: string;
};

export type Standing = {
  id: number;
  position: string;
  team: string;
  wins: number;
  losses: number;
  diff: number;
  class: string;
};
