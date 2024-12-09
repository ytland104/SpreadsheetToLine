function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PDF処理')
    .addItem('PDFフォルダ監視開始', 'startMonitoring')
    .addItem('手動でPDF処理実行', 'processManually')
    .addItem('OAuth認証設定', 'showAuthUrl')
    .addItem('フォルダID設定', 'setFolderID')
    .addToUi();
}

function startMonitoring() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const folderId = scriptProperties.getProperty('FOLDER_ID');
  
  if (!folderId) {
    SpreadsheetApp.getUi().alert('フォルダIDが設定されていません。\n「フォルダID設定」から設定してください。');
    return;
  }

  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processManually') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 新しいトリガーを作成（1時間ごとに実行）
  ScriptApp.newTrigger('processManually')
    .timeBased()
    .everyHours(1)
    .create();
  
  SpreadsheetApp.getUi().alert('フォルダの監視を開始しました。\n1時間ごとに新規PDFファイルをチェックします。');
}

function setFolderID() {
  const ui = SpreadsheetApp.getUi();
  const scriptProperties = PropertiesService.getScriptProperties();
  const currentFolderId = scriptProperties.getProperty('FOLDER_ID') || '';
  
  const result = ui.prompt(
    'フォルダID設定',
    '監視するフォルダのIDを入力してください：\n' +
    '(現在の設定: ' + currentFolderId + ')',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() == ui.Button.OK) {
    const folderId = result.getResponseText().trim();
    try {
      // フォルダIDの有効性チェックy
      DriveApp.getFolderById(folderId);
      scriptProperties.setProperty('FOLDER_ID', folderId);
      ui.alert('フォルダIDを保存しました。');
    } catch (e) {
      ui.alert('無効なフォルダIDです。正しいIDを入力してください。');
    }
  }
}

function processManually() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const folderId = scriptProperties.getProperty('FOLDER_ID');
  
  if (!folderId) {
    SpreadsheetApp.getUi().alert('フォルダIDが設定されていません。\n「フォルダID設定」から設定してください。');
    return;
  }

  const processor = new PDFProcessor();
  processor.processFolder(folderId);
} 