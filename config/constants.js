class Constants {
  static get SHEET_NAMES() {
    return {
      SUMMARY: '要約データ',
      ERROR_LOG: 'エラーログ'
    };
  }

  static get SHEET_HEADERS() {
    return {
      TITLE: 'タイトル',
      DATE: '日付',
      POINTS: '注目ポイント',
      DELIVERY_TIME: '配信日時',
      DELIVERY_HOUR: '配信時刻',
      SUMMARY: '要約',
      TREND_WORDS: 'トレンドワード',
      TRIGGER_ID: 'トリガーID',
      DELIVERY_STATUS: '配信状態',
      FILE_ID: 'ファイルID',
      FILE_NAME: 'ファイル名',
      FILE_LINK: 'ファイルリンク'
    };
  }

  static get TRIGGER_FUNCTIONS() {
    return {
      PDF_PROCESS: 'processPDFManually',
      MESSAGE_PROCESS: 'processMessages'
    };
  }

  static get INTERVALS() {
    return {
      PDF_CHECK: 60, // minutes
      MESSAGE_CHECK: 60 // minutes
    };
  }

  static get DEFAULT_DELIVERY_HOUR() {
    return '09:00';  // デフォルトの配信時刻
  }
} 