# PDF Processing and LINE Distribution System

## 概要

Google ドライブの PDF ファイルを自動で処理し、要約を LINE で配信するシステム

## セットアップ

1. スクリプトプロパティの設定

   - `SCRIPT_ID`: Google Apps Script の ID
   - `CLIENT_ID`: OAuth クライアント ID
   - `CLIENT_SECRET`: OAuth クライアントシークレット
   - `LINE_ACCESS_TOKEN`: LINE Messaging API のアクセストークン
   - `FOLDER_ID`: 監視対象の Google ドライブフォルダ ID
   - `BUCKET_NAME`: Google Cloud Storage のバケット名

2. 必要な API 有効化

   - Google Cloud Vision API
   - Google Cloud Storage API
   - Gemini API
   - LINE Messaging API

3. 初期設定
   - OAuth 認証の実行（メニュー「PDF 処理」→「OAuth 認証設定」）
   - フォルダ ID の設定（メニュー「PDF 処理」→「フォルダ ID 設定」）
   - LINE 配信トリガーの設定（メニュー「PDF 処理」→「LINE 配信トリガー設定」）

## 機能

- PDF ファイルの自動監視
  - 1 時間ごとの自動チェック
  - 手動実行オプション
- テキスト抽出（Vision API）
- PDF から高精度なテキスト抽出
- 複数ページ対応
- 要約生成（Gemini API）
  - 抽出テキストの自動要約
  - カスタマイズ可能な要約フォーマット
- LINE 配信スケジュール管理
  - 配信日時の自動計算
  - 柔軟なトリガー設定

## 使用方法

1. スプレッドシートを開く
2. メニュー「PDF 処理」から必要な操作を選択
3. 初回実行時は認証を行う
4. フォルダ監視を開始し、自動処理を待つ

## 注意事項

- GCP プロジェクトの設定が必要
- 適切な API 権限の設定が必要
- バケット名は事前に GCS で作成が必要
