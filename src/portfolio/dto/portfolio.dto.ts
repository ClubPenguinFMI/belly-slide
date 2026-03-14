export interface Portfolio {
  ticker: {
    shortName: string;
    longName: string | undefined;
  };
  valueInvested: number;
  percentage: number;
  quantity: number;
}
