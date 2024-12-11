class MessageTrigger {
  static processMessages() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      // ヘッダーのインデックスを定数で管理
      const HEADERS = {
        STATUS: '配信状態',
        SUMMARY: '要約',
        SCHEDULED_TIME: '配信予定時刻'
      };
      
      const statusIndex = headers.indexOf(HEADERS.STATUS);
      const messageIndex = headers.indexOf(HEADERS.SUMMARY);
      const scheduledTimeIndex = headers.indexOf(HEADERS.SCHEDULED_TIME);
      
      if (statusIndex === -1 || messageIndex === -1 || scheduledTimeIndex === -1) {
        throw new Error('必要なヘッダーが見つかりません');
      }
      
      // 現在時刻
      const now = new Date();
      
      // 2行目から処理（1行目はヘッダー）
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const status = row[statusIndex];
        const scheduledTime = row[scheduledTimeIndex];
        
        // 未配信かつ配信予定時刻を過ぎているものを処理
        if (status !== '配信済' && scheduledTime && scheduledTime <= now) {
          const message = row[messageIndex];
          if (message) {
            this.sendLineMessage(message);
            // 配信状態を更新
            sheet.getRange(i + 1, statusIndex + 1).setValue('配信済');
          }
        }
      }
    } catch (error) {
      Logger.log(`Error in processMessages: ${error.message}`);
    }
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

// トリガーから呼び出される関数
function processMessages() {
  MessageTrigger.processMessages();
} 