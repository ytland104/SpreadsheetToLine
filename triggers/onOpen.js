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
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processMessages') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 5分ごとのトリガーを設定
  ScriptApp.newTrigger('processMessages')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  SpreadsheetApp.getActiveSpreadsheet().toast('LINE配信トリガーを設定しました', '設定完了');
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