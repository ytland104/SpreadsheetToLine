# システム初期設定手順

## 1. Google Cloud Platform (GCP) の設定

- [ ] 新規プロジェクト作成
- [ ] 以下の API を有効化：
  - Cloud Vision API
  - Cloud Storage API
  - Gemini API
- [ ] OAuth 同意画面の設定
  - アプリ名：PDF 自動要約配信
  - ユーザーサポートメール：管理者メール
  - 承認済みドメイン：script.google.com
- [ ] 認証情報の作成
  - OAuth 2.0 クライアント ID の作成
  - クライアント ID とシークレットの保存

## 2. Google Cloud Storage (GCS) の設定

- [ ] バケットの作成
  - 名前：一意の名前を設定
  - リージョン：asia-northeast1（東京）
  - アクセス制御：均一
- [ ] アクセス権限の設定
  - OAuth 認証ユーザーにバケットへのアクセス権限を付与
  - 必要な権限：Storage Object Viewer, Storage Object Creator

## 3. LINE Developers の設定

- [ ] プロバイダー作成
- [ ] Messaging API チャネルの作成
- [ ] チャネルアクセストークンの発行（長期）

## 4. Google Apps Script の設定

- [ ] .clasp.json の設定 `json
{
  "scriptId": "your_script_id",
  "rootDir": "./GooglefileCheck"
}  `
- [ ] 必要なスコープの承認
- [ ] デプロイの設定（ウェブアプリケーション）

## 5. 監視フォルダの設定

- [ ] Google ドライブにフォルダ作成
- [ ] フォルダ ID の取得
- [ ] アクセス権限の設定
  - スクリプトに対する閲覧権限
  - PDF アップロード用の共有設定
