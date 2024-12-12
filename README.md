# PDF Processing and LINE Distribution System

## フォルダ構造

GooglefileCheck/
├── api/
│ ├── geminiAPI.js # Gemini API による要約生成
│ └── visionAPI.js # Vision API による OCR 処理
│
├── auth/
│ └── Oauth.js # OAuth 認証処理
│
├── config/
│ └── constants.js # システム定数定義
│
├── core/
│ ├── PDFProcessor.js # PDF ファイル処理
│ └── SheetWriter.js # スプレッドシート操作
│
├── docs/
│ ├── manual.md # ユーザーマニュアル
│ └── setup.md # セットアップガイド
│
├── triggers/
│ ├── MessageTrigger.js # LINE 配信制御
│ └── onOpen.js # メニュー・トリガー初期化
│
├── utils/
│ └── errorHandler.js # エラー処理
│
├── .clasp.json # CLASP 設定
├── .gitignore # Git 除外設定
├── README.md # プロジェクト概要
├── appsscript.json # GAS 設定
└── sequence.puml # シーケンス図

## 主要コンポーネント説明

1. **API 連携 (api/)**

   - geminiAPI.js: テキスト要約生成
   - visionAPI.js: PDF 文書の OCR 処理

2. **認証処理 (auth/)**

   - OAuth.js: Google API 認証

3. **設定管理 (config/)**

   - constants.js: システム定数

4. **コア機能 (core/)**

   - PDFProcessor.js: PDF 処理メインロジック
   - SheetWriter.js: スプレッドシート操作

5. **トリガー管理 (triggers/)**

   - MessageTrigger.js: LINE 配信制御
   - onOpen.js: UI 初期化

6. **ユーティリティ (utils/)**

   - errorHandler.js: エラー処理・ログ管理

7. **設定ファイル（ルート）**
   - .clasp.json: GAS 開発設定
   - appsscript.json: スクリプト設定
   - sequence.puml: システム設計図
