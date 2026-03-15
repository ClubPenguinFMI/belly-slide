stocks=("NVDA" "TSMC34.SA" "005930.KS" "QCOM" "HNHPF" "000660.KS" "MU" "AAPL" "AMD" "UMC" "AVGO" "INTC" "MSFT" "ORCL" "HP")
for item in "${stocks[@]}"; do
    curl -s "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=$item&apikey=$1" -o "$item".json
    sleep 10
done