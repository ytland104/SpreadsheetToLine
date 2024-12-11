# PDF Processing and LINE Distribution System

## 概要

Google ドライブの PDF ファイルを自動で処理し、要約を LINE で配信するシステム

## フォルダ構造

├── api/
│ ├── geminiAPI.js # Gemini API クライアント
│ └── visionAPI.js # Vision API クライアント
├── auth/
│ └── Oauth.js # OAuth 認証処理
├── core/
│ ├── PDFProcessor.js # PDF メイン処理
│ └── SheetWriter.js # スプレッドシート書き込み
├── triggers/
│ ├── MessageTrigger.js # LINE 配信トリガー
│ └── onOpen.js # メニュー初期化
├── utils/
│ └── errorHandler.js # エラー処理
├── .gitignore # Git 除外設定
├── README.md # 本ドキュメント
├── appsscript.json # Apps Script 設定
└── secuence.puml # シーケンス図

## セットアップ手順

1. GCP プロジェクトの設定

   - 新規プロジェクト作成
   - 必要な API の有効化
   - OAuth 同意画面の設定
   - 認証情報の作成

2. スクリプトプロパティの設定

   - `SCRIPT_ID`: Google Apps Script の ID
   - `CLIENT_ID`: OAuth クライアント ID
   - `CLIENT_SECRET`: OAuth クライアントシークレット
   - `LINE_ACCESS_TOKEN`: LINE Messaging API のアクセストークン
   - `FOLDER_ID`: 監視対象の Google ドライブフォルダ ID
   - `BUCKET_NAME`: Google Cloud Storage のバケット名

3. Google Cloud Storage

   - バケットの作成
   - 適切なアクセス権限の設定
   - PDF ファイル一時保存用の設定

4. LINE Messaging API
   - チャネルの作成
   - アクセストークンの取得
   - Webhook URL の設定

## 必要な API

- Google Cloud Vision API
  - PDF からのテキスト抽出
  - OCR 処理
- Google Cloud Storage API
  - PDF ファイルの一時保存
  - 処理結果の保存
- Gemini API
  - テキスト要約生成
  - コンテキスト理解
- LINE Messaging API
  - メッセージ配信
  - 通知管理

## 初期設定手順

1. OAuth 認証設定

   - メニュー「PDF 処理」を開く
   - 「OAuth 認証設定」を選択
   - 認証画面で承認

2. フォルダ ID 設定

   - 監視対象フォルダを作成
   - フォルダ ID をコピー
   - メニューから設定

3. LINE 配信設定
   - トリガー時間の設定
   - 配信テンプレートの確認
   - テスト配信の実行

## エラーハンドリング

- Vision API エラー
  - 再試行処理
  - エラーログ記録
- GCS 操作エラー
  - タイムアウト処理
  - 権限エラー対応
- LINE 配信エラー
  - 配信リトライ
  - エラー通知

## 制限事項

- PDF ファイルサイズ: 最大 10MB
- 処理時間: 1 ファイルあたり最大 6 分
- 同時処理数: 最大 5 ファイル
- LINE 配信: 1 日 1000 メッセージまで

## トラブルシューティング

1. 認証エラー

   - OAuth 認証をやり直す
   - スクリプトプロパティを確認

2. PDF 処理エラー

   - ファイルサイズを確認
   - PDF 形式を確認
   - アクセス権限を確認

3. LINE 配信エラー
   - アクセストークンの有効性確認
   - メッセージ形式の確認
   - 配信制限の確認

## 開発者向け情報

- デプロイメント

  - `clasp push` 前の環境変数確認
  - テスト実行の推奨
  - エラーログの確認方法

- コード貢献
  - プルリクエストのガイドライン
  - コーディング規約
  - テスト要件

## ライセンス

MIT License

## 作者

ytland104

## バージョン履歴

- v1.0.0: 初期リリース
- v1.0.1: バグ修正
