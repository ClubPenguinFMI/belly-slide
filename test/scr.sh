jq -c '.[]' relations.json | while read line; do
  curl -X POST http://localhost:8000/company-relations \
    -H "Content-Type: application/json" \
    -d "$line"
done