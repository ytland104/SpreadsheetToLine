class SheetWriter {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.initializeSheets();
  }

  initializeSheets() {
    this.summarySheet = this.ss.getSheetByName(Constants.SHEET_NAMES.SUMMARY);
    if (!this.summarySheet) {
      this.summarySheet = this.ss.insertSheet(Constants.SHEET_NAMES.SUMMARY);
      this._setupSummaryHeaders();
    } else {
      // 既存シートのヘッダーを確認
      const headers = this.summarySheet.getRange(1, 1, 1, 12).getValues()[0];
      const expectedHeaders = [
        Constants.SHEET_HEADERS.TITLE,
        Constants.SHEET_HEADERS.DATE,
        Constants.SHEET_HEADERS.POINTS,
        Constants.SHEET_HEADERS.DELIVERY_TIME,
        Constants.SHEET_HEADERS.DELIVERY_HOUR,
        Constants.SHEET_HEADERS.SUMMARY,
        Constants.SHEET_HEADERS.TREND_WORDS,
        Constants.SHEET_HEADERS.TRIGGER_ID,
        Constants.SHEET_HEADERS.DELIVERY_STATUS,
        Constants.SHEET_HEADERS.FILE_ID,
        Constants.SHEET_HEADERS.FILE_NAME,
        Constants.SHEET_HEADERS.FILE_LINK
      ];

      // ヘッダーが一致しない場合は更新
      if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
        Logger.log('Updating sheet headers to match current schema');
        this._setupSummaryHeaders();
      }
    }
  }

  _setupSummaryHeaders() {
    const headers = [
      Constants.SHEET_HEADERS.TITLE,          // A列: タイトル
      Constants.SHEET_HEADERS.DATE,           // B列: 日付
      Constants.SHEET_HEADERS.POINTS,         // C列: 注目ポイント
      Constants.SHEET_HEADERS.DELIVERY_TIME,  // D列: 配信日時
      Constants.SHEET_HEADERS.DELIVERY_HOUR,  // E列: 配信時刻
      Constants.SHEET_HEADERS.SUMMARY,        // F列: 要約
      Constants.SHEET_HEADERS.TREND_WORDS,    // G列: トレンドワード
      Constants.SHEET_HEADERS.TRIGGER_ID,     // H列: トリガーID
      Constants.SHEET_HEADERS.DELIVERY_STATUS,// I列: 配信状態
      Constants.SHEET_HEADERS.FILE_ID,        // J列: ファイルID
      Constants.SHEET_HEADERS.FILE_NAME,      // K列: ファイル名
      Constants.SHEET_HEADERS.FILE_LINK       // L列: ファイルリンク
    ];

    this.summarySheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#f3f3f3');
    
    // 列幅の設定
    this.summarySheet.setColumnWidths(1, headers.length, 150);
    this.summarySheet.setColumnWidth(6, 300); // 要約列は幅広く

    // 日付列のフォーマット
    this.summarySheet.getRange(2, 4, this.summarySheet.getMaxRows() - 1)
      .setNumberFormat('yyyy-MM-dd');

    // 配信時刻列のデータ検証
    const timeValidation = SpreadsheetApp.newDataValidation()
      .requireFormula('=REGEXMATCH(E2, "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")')
      .setAllowInvalid(false)
      .setHelpText('00:00～23:59の形式で入力してください')
      .build();

    this.summarySheet.getRange(2, 5, this.summarySheet.getMaxRows() - 1)
      .setDataValidation(timeValidation);
  }

  async writeSummary(summary, fileId, fileName) {
    try {
      const lastRow = Math.max(1, this.summarySheet.getLastRow());
      const extractedData = this._extractSummaryComponents(summary);
      
      Logger.log('Extracted Data:', JSON.stringify(extractedData));

      // ファイルリンクの作成
      const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
      const fileLink = `=HYPERLINK("${fileUrl}", "開く")`;

      // 配信日時の設定（2週間前の日曜日）
      const targetDate = new Date(extractedData.date);
      const deliveryDate = this._getPreviousSunday(targetDate, 2);
      Logger.log('Target Date:', targetDate);
      Logger.log('Delivery Date:', deliveryDate);
      
      const [hours, minutes] = Constants.DEFAULT_DELIVERY_HOUR.split(':');
      deliveryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      Logger.log('Final Delivery DateTime:', deliveryDate);

      const newRow = [
        extractedData.title,
        extractedData.date,
        extractedData.points,
        deliveryDate,  // 配信日時（2週間前の日曜日）
        Constants.DEFAULT_DELIVERY_HOUR,
        extractedData.summary,
        extractedData.trend_words,
        '', // トリガーID
        '未配信', // 配信状態
        fileId,
        fileName,
        fileLink
      ];
      
      Logger.log('New Row Data:', JSON.stringify(newRow));
      
      this.summarySheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);

      // 配信時刻列のフォーマット設定
      const deliveryHourCell = this.summarySheet.getRange(lastRow + 1, 5);
      deliveryHourCell.setNumberFormat('@');  // テキストとして扱う
      
      // データ検証の設定
      const timeValidation = SpreadsheetApp.newDataValidation()
        .requireFormula('=REGEXMATCH(E' + (lastRow + 1) + ', "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")')
        .setAllowInvalid(false)
        .setHelpText('00:00～23:59の形式で入力してください')
        .build();

      deliveryHourCell.setDataValidation(timeValidation);

      // 日付フォーマットの設定
      const deliveryDateCell = this.summarySheet.getRange(lastRow + 1, 4);
      deliveryDateCell.setNumberFormat('yyyy-MM-dd');

      return true;
    } catch (error) {
      Logger.log('Error in writeSummary:', error.message);
      Logger.log('Error stack:', error.stack);
      ErrorHandler.record(fileId, `Summary write error: ${error.message}`);
      return false;
    }
  }

  _extractSummaryComponents(summary) {
    Logger.log('Original summary:', summary);
    
    const titleMatch = summary.match(/🗻.*?([^\n]+)/);
    const dateMatch = summary.match(/🕒\s重要日付：(\d{4}-\d{2}-\d{2})/);
    const pointsMatch = summary.match(/📍\s注目ポイント：(.+)/);
    const summaryMatch = summary.match(/要約：\s*([\s\S]+?)(?=\s*#|$)/);
    const trendWordsMatch = summary.match(/#.+/g);

    Logger.log('Regex matches:', {
      titleMatch,
      dateMatch,
      pointsMatch,
      summaryMatch,
      trendWordsMatch
    });

    // 日付の処理を追加
    let formattedDate = '';
    const today = new Date();
    const currentYear = today.getFullYear();

    if (dateMatch && dateMatch[1]) {
      try {
        let date = new Date(dateMatch[1]);
        
        // 日付が過去のものである場合、来年の同じ日付として扱う
        if (date < today) {
          // 月と日を保持したまま、年を調整
          const month = date.getMonth();
          const day = date.getDate();
          date = new Date(currentYear, month, day);
          
          // それでも過去日付の場合は来年に設定
          if (date < today) {
            date.setFullYear(currentYear + 1);
          }
        }

        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
          Logger.log('Adjusted date:', formattedDate);
        }
      } catch (e) {
        Logger.log('Date parsing error:', e);
      }
    }

    if (!formattedDate) {
      // デフォルトは本日の日付
      formattedDate = today.toISOString().split('T')[0];
      Logger.log('Using today as fallback date:', formattedDate);
    }

    const result = {
      title: titleMatch ? titleMatch[0].trim() : '',
      date: formattedDate,
      points: pointsMatch ? `📍 ${pointsMatch[1].trim()}` : '',
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      trend_words: trendWordsMatch ? trendWordsMatch.join(' ').trim() : ''
    };

    Logger.log('Extracted components:', result);
    return result;
  }

  /**
   * 指定された日付から指定週数前の日曜日を取得
   * @param {Date} date - 基準となる日付
   * @param {number} weeks - 何週前の日曜日を取得するか
   * @returns {Date} 指定週数前の日曜日
   */
  _getPreviousSunday(date, weeks = 2) {
    const result = new Date(date);
    
    // まず指定週数分戻す
    result.setDate(result.getDate() - (weeks * 7));
    
    // その週の日曜日まで戻る
    const day = result.getDay();
    if (day !== 0) { // 0が日曜日
      result.setDate(result.getDate() - day);
    }
    
    Logger.log(`Getting Sunday ${weeks} weeks before ${date.toISOString()}: ${result.toISOString()}`);
    return result;
  }
} 