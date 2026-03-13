export interface Position {
  instrument: Instrument;
  createdAt: string;

  quantity: number;
  quantityAvailableForTrading: number;
  quantityInPies: number;

  currentPrice: number;
  averagePricePaid: number;

  walletImpact: WalletImpact;
}

export interface Instrument {
  ticker: string;
  name: string;
  isin: string;
  currency: string;
}

export interface WalletImpact {
  currency: string;
  totalCost: number;
  currentValue: number;
  unrealizedProfitLoss: number;
  fxImpact: number | null;
}
