function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF処理')
    .addItem('OAuth認証設定', 'showAuthUrl')
    .addItem('フォルダID設定', 'showFolderIdDialog')
    .addSeparator()
    .addItem('PDF処理実行（手動）', 'processPDFManually')
    .addItem('PDF処理トリガー設定', 'setupPDFProcessingTrigger')
    .addSeparator()
    .addItem('LINE配信トリガー設定', 'setupMessageTrigger')
    .addToUi();
}

function setupPDFProcessingTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processPDFManually') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 1時間ごとのトリガーを設定
  ScriptApp.newTrigger('processPDFManually')
    .timeBased()
    .everyHours(1)
    .create();
  
  SpreadsheetApp.getActiveSpreadsheet().toast('PDF処理の定期実行トリガーを設定しました', '設定完了');
}

function setupMessageTrigger() {
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

    Logger.log('Found column indices:', {
      dateIndex,
      hourIndex,
      triggerIndex,
      statusIndex
    });

    if (dateIndex === -1 || hourIndex === -1 || triggerIndex === -1 || statusIndex === -1) {
      throw new Error('必要な列が見つかりません');
    }

    let triggersSet = 0;
    Logger.log('Total rows to process:', data.length - 1);  // ヘッダーを除く

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const deliveryDate = row[dateIndex];
      const deliveryHour = row[hourIndex];
      const triggerId = row[triggerIndex];
      const status = row[statusIndex];

      Logger.log(`Row ${i + 1} data types:`, {
        deliveryDate: typeof deliveryDate,
        deliveryHour: typeof deliveryHour,
        deliveryHourValue: deliveryHour,
        triggerId: typeof triggerId,
        status: typeof status
      });

      if (status === '未配信' && deliveryDate && deliveryHour) {
        try {
          // 日付と時刻を組み合わせて配信時刻を設定
          const scheduledTime = new Date(deliveryDate);
          
          // deliveryHourの型チェックと変換
          let timeString = String(deliveryHour).trim();
          if (!timeString.includes(':')) {
            // Excelの時刻形式の場合の処理
            const totalMinutes = Math.round(Number(deliveryHour) * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }

          Logger.log(`Converted time string: ${timeString}`);
          const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
          
          if (isNaN(hours) || isNaN(minutes)) {
            Logger.log(`行 ${i + 1}: 無効な時刻形式 - ${timeString} (元の値: ${deliveryHour})`);
            continue;
          }

          scheduledTime.setHours(hours, minutes, 0, 0);
          Logger.log(`Scheduled time for row ${i + 1}:`, scheduledTime);

          // 過去の時刻の場合はスキップ
          if (scheduledTime <= new Date()) {
            Logger.log(`行 ${i + 1}: 過去の時刻のためスキップ - ${scheduledTime}`);
            continue;
          }

          const trigger = ScriptApp.newTrigger(Constants.TRIGGER_FUNCTIONS.MESSAGE_PROCESS)
            .timeBased()
            .at(scheduledTime)
            .create();
          
          sheet.getRange(i + 1, triggerIndex + 1).setValue(trigger.getUniqueId());
          triggersSet++;
          Logger.log(`Trigger set for row ${i + 1} with ID: ${trigger.getUniqueId()}`);
          
        } catch (e) {
          Logger.log(`行 ${i + 1} の処理中にエラー: ${e.message}`);
          Logger.log('Error stack:', e.stack);
        }
      } else {
        Logger.log(`行 ${i + 1} はスキップ: status=${status}, date=${!!deliveryDate}, hour=${!!deliveryHour}`);
      }
    }
    
    if (triggersSet > 0) {
      SpreadsheetApp.getActiveSpreadsheet()
        .toast(`${triggersSet}件の配信トリガーを設定しました`, '設定完了');
    } else {
      SpreadsheetApp.getActiveSpreadsheet()
        .toast('設定可能な配信予定が見つかりませんでした', '通知');
    }
      
  } catch (error) {
    ErrorHandler.record('TRIGGER_SETUP', error);
    SpreadsheetApp.getActiveSpreadsheet()
      .toast('トリガー設定中にエラーが発生しました: ' + error.message, 'エラー');
  }
}

function showFolderIdDialog() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'フォルダID設定',
    'PDFファイルを監視するフォルダのIDを入力してください：',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() == ui.Button.OK) {
    const folderId = result.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('FOLDER_ID', folderId);
    ui.alert('フォルダIDを設定しました');
  }
} 