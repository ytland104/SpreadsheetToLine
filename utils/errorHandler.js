class ErrorHandler {
  static record(fileId, error) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let errorSheet = ss.getSheetByName("エラーログ");
      
      // エラーログシートが存在しない場合は作成
      if (!errorSheet) {
        errorSheet = ss.insertSheet("エラーログ");
        errorSheet.getRange('A1:E1')
          .setValues([["タイムスタンプ", "ファイルID", "エラーメッセージ", "スタック", "ステータス"]])
          .setFontWeight('bold')
          .setBackground('#f3f3f3');
        
        // 列幅の設定
        errorSheet.setColumnWidth(1, 180); // タイムスタンプ
        errorSheet.setColumnWidth(2, 250); // ファイルID
        errorSheet.setColumnWidth(3, 400); // エラーメッセージ
        errorSheet.setColumnWidth(4, 400); // スタック
        errorSheet.setColumnWidth(5, 100); // ステータス
      }

      // エラー情報の追加
      const errorInfo = [
        new Date(),                    // タイムスタンプ
        fileId,                        // ファイルID
        error.message || String(error), // エラーメッセージ
        error.stack || '',             // スタックトレース
        "未対応"                       // 初期ステータス
      ];

      errorSheet.appendRow(errorInfo);

      // ログにも出力
      Logger.log(`Error recorded for file ${fileId}: ${error.message || error}`);
      
      return true;
    } catch (e) {
      // エラーログの記録自体が失敗した場合
      Logger.log(`Failed to record error: ${e.message}`);
      Logger.log(`Original error for file ${fileId}: ${error.message || error}`);
      return false;
    }
  }

  static getErrors(fileId = null) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const errorSheet = ss.getSheetByName("エラーログ");
      
      if (!errorSheet) return [];

      const data = errorSheet.getDataRange().getValues();
      const headers = data.shift(); // ヘッダー行を除外

      if (!fileId) {
        return data;
      }

      // 特定のファイルIDに関するエラーのみをフィルタリング
      return data.filter(row => row[1] === fileId);
    } catch (e) {
      Logger.log(`Failed to get errors: ${e.message}`);
      return [];
    }
  }

  static updateErrorStatus(row, status) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const errorSheet = ss.getSheetByName("エラーログ");
      
      if (!errorSheet) return false;

      errorSheet.getRange(row, 5).setValue(status);
      return true;
    } catch (e) {
      Logger.log(`Failed to update error status: ${e.message}`);
      return false;
    }
  }
} 