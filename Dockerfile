# 1. ベースイメージの指定 (軽量なAlpine Linux版Node.js)
FROM node:20-alpine AS builder

# 2. 作業ディレクトリの作成
WORKDIR /app

# 3. 依存関係のインストール
COPY package.json package-lock.json ./
RUN npm ci

# 4. ソースコードのコピーとビルド
COPY . .
RUN npm run build

# --- 実行用イメージの作成 (サイズ削減のため) ---
FROM node:20-alpine AS runner
WORKDIR /app

# 環境変数の設定 (本番モード)
ENV NODE_ENV production

# ビルド成果物だけをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ポートの公開
EXPOSE 4000

# 起動コマンド
CMD ["node", "server.js"]