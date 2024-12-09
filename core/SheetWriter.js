class SheetWriter {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.initializeSheets();
  }

  initializeSheets() {
    this.summarySheet = this.ss.getSheetByName('要約データ');
    if (!this.summarySheet) {
      this.summarySheet = this.ss.insertSheet('要約データ');
      this.setupSummaryHeaders();
    }
  }

  _setupSummaryHeaders() {
    this.summarySheet.getRange('A1:K1')
      .setValues([['タイトル', '日付', '注目ポイント', '配信日時', '要約', 
                  'トレンドワード', 'トリガーID', '送信状態', 'ファイルID', 
                  'ファイル名', 'ファイルリンク']])
      .setFontWeight('bold')
      .setBackground('#f3f3f3');
    
    // 列幅の設定
    this.summarySheet.setColumnWidths(1, 11, 150);
    this.summarySheet.setColumnWidth(5, 300); // 要約列は幅広く
  }

  async writeSummary(summary, fileId, fileName) {
    try {
      const lastRow = Math.max(1, this.summarySheet.getLastRow());
      const extractedData = this._extractSummaryComponents(summary);
      
      // ファイルリンクの作成
      const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
      const fileLink = `=HYPERLINK("${fileUrl}", "開く")`;

      const newRow = [
        extractedData.title,
        extractedData.date,
        extractedData.points,
        extractedData.broadcast,
        extractedData.summary,
        extractedData.trend_words,
        '', // トリガーID
        '', // 送信状態
        fileId,
        fileName,
        fileLink
      ];
      
      this.summarySheet.getRange(lastRow + 1, 1, 1, 11).setValues([newRow]);
      this.summarySheet.autoResizeRows(lastRow + 1, 1);
      
      return true;
    } catch (error) {
      ErrorHandler.record(fileId, `Summary write error: ${error.message}`);
      return false;
    }
  }

  _extractSummaryComponents(summary) {
    const titleMatch = summary.match(/🗻.*?([^\n]+)/);
    const dateMatch = summary.match(/🕒\s重要日付：(.+)/);
    const pointsMatch = summary.match(/📍\s注目ポイント：(.+)/);
    const broadcastMatch = summary.match(/📅\s配信日時：(.+)/);
    const summaryMatch = summary.match(/要約：\s*([\s\S]+?)(?=\s*#|$)/);
    const trendWordsMatch = summary.match(/#.+/g);

    return {
      title: titleMatch ? titleMatch[0].trim() : '',
      date: dateMatch ? `🕒 ${dateMatch[1].trim()}` : '',
      points: pointsMatch ? `📍 ${pointsMatch[1].trim()}` : '',
      broadcast: broadcastMatch ? broadcastMatch[1].trim() : '',
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      trend_words: trendWordsMatch ? trendWordsMatch.join(' ').trim() : ''
    };
  }
} 