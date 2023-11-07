type Side = {
  name: string;
  score: number;
  shots: number;
};

export type Match = {
  id?: number;
  home: Side;
  away: Side;
};
