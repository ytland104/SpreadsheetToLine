class MessageTrigger {
  constructor() {
    this.LINE_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
    this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("要約データ");
  }

  createTriggers() {
    if (!this.sheet) {
      Logger.log('要約データシートが見つかりません');
      return;
    }

    const lastRow = this.sheet.getLastRow();
    for (let row = 2; row <= lastRow; row++) {
      try {
        this._processRow(row);
      } catch (error) {
        ErrorHandler.record(`ROW_${row}`, error);
      }
    }
  }

  _processRow(row) {
    // トリガーIDが既に設定されている行はスキップ
    const triggerId = this.sheet.getRange(row, 7).getValue();
    if (triggerId) return;

    // 配信日時を取得
    const broadcastDate = this.sheet.getRange(row, 4).getValue();
    if (!broadcastDate) return;

    // 配信時刻を取得（デフォルト9:00）
    const time = this.sheet.getRange(row, 8).getDisplayValue() || "09:00";
    const [hours, minutes] = time.split(":").map(num => parseInt(num, 10));

    // トリガ��日時の設定
    const triggerDate = new Date(broadcastDate);
    triggerDate.setHours(hours);
    triggerDate.setMinutes(minutes);
    triggerDate.setSeconds(0);

    // 過去の日時の場合はスキップ
    if (triggerDate < new Date()) {
      Logger.log(`行 ${row} のトリガー日時が過去の時刻です: ${triggerDate}`);
      return;
    }

    // トリガーの作成
    const trigger = ScriptApp.newTrigger('sendMessage')
      .timeBased()
      .at(triggerDate)
      .create();

    // トリガーIDを保存
    this.sheet.getRange(row, 7).setValue(trigger.getUniqueId());
    Logger.log(`トリガーを設定しました。行: ${row}, 日時: ${triggerDate}`);
  }

  async sendMessage(e) {
    try {
      const row = this._findRowByTriggerId(e?.triggerUid);
      if (!row) {
        Logger.log('送信対象の行が見つかりません');
        return;
      }

      const message = this._createMessage(row);
      await this._sendLineMessage(message);

      // 送信完了後の処理
      this.sheet.getRange(row, 8).setValue('送信済み');
      if (e?.triggerUid) {
        this._deleteTrigger(e.triggerUid);
      }

    } catch (error) {
      ErrorHandler.record('SEND_MESSAGE', error);
    }
  }

  _findRowByTriggerId(triggerId) {
    if (!triggerId) {
      // トリガ���IDがない場合は未送信の最初の行を探す
      const data = this.sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][7]) return i + 1; // 送信状態が空の行
      }
      return null;
    }

    const data = this.sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][6] === triggerId) return i + 1;
    }
    return null;
  }

  _createMessage(row) {
    const title = this.sheet.getRange(row, 1).getValue();
    const summary = this.sheet.getRange(row, 5).getValue();
    const trendWords = this.sheet.getRange(row, 6).getValue();
    
    return {
      type: "text",
      text: `${title}\n\n${summary}\n\n${trendWords}`
    };
  }

  async _sendLineMessage(message) {
    const options = {
      method: "post",
      headers: {
        "Authorization": `Bearer ${this.LINE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        messages: [message]
      }),
      muteHttpExceptions: true
    };

    const response = await UrlFetchApp.fetch("https://api.line.me/v2/bot/message/broadcast", options);
    if (response.getResponseCode() !== 200) {
      throw new Error(`LINE API Error: ${response.getContentText()}`);
    }
  }

  _deleteTrigger(triggerId) {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(trigger);
        Logger.log(`トリガーを削除しました: ${triggerId}`);
        break;
      }
    }
  }
} 