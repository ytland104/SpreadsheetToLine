class MessageTrigger {
  static async processMessages() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(Constants.SHEET_NAMES.SUMMARY);
      
      if (!sheet) {
        throw new Error('要約データシートが見つかりません');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const dateIndex = headers.indexOf(Constants.SHEET_HEADERS.DELIVERY_TIME);
      const hourIndex = headers.indexOf(Constants.SHEET_HEADERS.DELIVERY_HOUR);
      const triggerIndex = headers.indexOf(Constants.SHEET_HEADERS.TRIGGER_ID);
      const statusIndex = headers.indexOf(Constants.SHEET_HEADERS.DELIVERY_STATUS);
      const messageIndex = headers.indexOf(Constants.SHEET_HEADERS.SUMMARY);

      if (dateIndex === -1) {
        throw new Error(`${Constants.SHEET_HEADERS.DELIVERY_TIME}列が見つかりません`);
      }
      if (hourIndex === -1) {
        throw new Error(`${Constants.SHEET_HEADERS.DELIVERY_HOUR}列が見つかりません`);
      }
      if (triggerIndex === -1) {
        throw new Error(`${Constants.SHEET_HEADERS.TRIGGER_ID}列が見つかりません`);
      }
      if (statusIndex === -1) {
        throw new Error(`${Constants.SHEET_HEADERS.DELIVERY_STATUS}列が見つかりません`);
      }
      if (messageIndex === -1) {
        throw new Error(`${Constants.SHEET_HEADERS.SUMMARY}列が見つかりません`);
      }

      const now = new Date();
      let processedCount = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const title = row[headers.indexOf(Constants.SHEET_HEADERS.TITLE)];
        const date = row[headers.indexOf(Constants.SHEET_HEADERS.DATE)];
        const points = row[headers.indexOf(Constants.SHEET_HEADERS.POINTS)];
        const summary = row[messageIndex];
        const trendWords = row[headers.indexOf(Constants.SHEET_HEADERS.TREND_WORDS)];
        const deliveryDate = row[dateIndex];
        const deliveryHour = row[hourIndex];
        const triggerId = row[triggerIndex];
        const status = row[statusIndex];
        
        if (triggerId && status === '未配信' && deliveryDate <= now) {
          // メッセージを構造化された形式で作成
          const formattedDate = this._formatDate(deliveryDate);
          const message = this._createLineMessage({
            title,
            date: formattedDate,
            points,
            summary,
            trendWords
          });

          if (message) {
            await this.sendLineMessage(message);
            sheet.getRange(i + 1, statusIndex + 1).setValue('配信済');
            processedCount++;
          }
          
          // トリガーを削除
          const triggers = ScriptApp.getProjectTriggers();
          triggers.forEach(trigger => {
            if (trigger.getUniqueId() === triggerId) {
              ScriptApp.deleteTrigger(trigger);
            }
          });
          
          // トリガーIDをクリア
          sheet.getRange(i + 1, triggerIndex + 1).setValue('');
        }
      }

      if (processedCount > 0) {
        Logger.log(`${processedCount}件のメッセージを配信しました`);
      }

    } catch (error) {
      ErrorHandler.record('MESSAGE_TRIGGER', error);
      throw error;
    }
  }

  static _formatDate(date) {
    const d = new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  static _createLineMessage({ title, date, points, summary, trendWords }) {
    // LINE配信用のメッセージを整形
    return [
      title,
      '━   ━   ━',
      `📅 ${date}`,
      ` ${points}`,
      '',
      '【要約】',
      summary,
      '',
      trendWords
    ].join('\n');
  }

  static sendLineMessage(message) {
    const lineToken = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
    if (!lineToken) {
      throw new Error('LINE_ACCESS_TOKEN not found in script properties');
    }

    const url = 'https://api.line.me/v2/bot/message/broadcast';
    const payload = {
      messages: [{
        type: 'text',
        text: message
      }]
    };

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`
      },
      payload: JSON.stringify(payload)
    };

    try {
      UrlFetchApp.fetch(url, options);
    } catch (error) {
      Logger.log(`Error sending LINE message: ${error.message}`);
      throw error;
    }
  }
}

// グローバル関数として定義（トリガーから呼び出し可能）
function processMessages() {
  MessageTrigger.processMessages();
} 