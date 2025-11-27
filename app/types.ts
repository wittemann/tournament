export type Game = {
  id: number;
  time: string;
  class: string;
  hometeam?: string;
  awayteam?: string;
  location: string;
  homescore?: number;
  awayscore?: number;
  scorer?: string;
  eventname?: string;
};
