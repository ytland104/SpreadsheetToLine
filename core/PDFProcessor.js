class PDFProcessor {
  constructor() {
    this.accessToken = OAuthService.getAccessToken();
    this.visionAPI = new VisionAPI(this.accessToken);
    this.geminiAPI = new GeminiAPI(this.accessToken);
    this.sheetWriter = new SheetWriter();
    this.errorHandler = ErrorHandler;
  }

  async processFolder(folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      const files = this._getUpdatedPDFFiles(folder);
      
      Logger.log(`Found ${files.length} files to process`);
      
      for (const file of files) {
        await this.processFile(file);
      }

      // 新規/更新ファイルがあった場合、LINE配信トリガーを設定
      if (files.length > 0) {
        this._setupLineDeliveryTrigger();
      }
    } catch (error) {
      ErrorHandler.record('FOLDER', `Folder processing error: ${error.message}`);
    }
  }

  async processFile(file) {
    const fileId = file.getId();
    try {
      if (this._isProcessed(fileId)) {
        Logger.log(`File ${fileId} already processed`);
        return;
      }

      // ファイル名の更新チェック
      const fileName = this._updateFileName(file);
      
      // PDFコンテンツの取得
      const pdfContent = file.getBlob();
      if (!pdfContent) {
        throw new Error('Failed to get PDF content');
      }

      // テキスト抽出
      const extractedText = await this.visionAPI.extractText(fileId, pdfContent);
      if (!extractedText) {
        throw new Error('Text extraction failed');
      }

      // 要約生成
      const summary = await this.geminiAPI.summarize(extractedText);
      if (!summary) {
        throw new Error('Summary generation failed');
      }

      // 要約をシートに書き込み
      const writeResult = await this.sheetWriter.writeSummary(summary, fileId, fileName);
      if (!writeResult) {
        throw new Error('Failed to write summary to sheet');
      }

      Logger.log(`Successfully processed file: ${fileName}`);
      return true;

    } catch (error) {
      ErrorHandler.record(fileId, error);
      return false;
    }
  }

  _getUpdatedPDFFiles(folder) {
    const files = [];
    const cutoffTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 2);
    
    const fileIterator = folder.getFiles();
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      if (file.getMimeType() === 'application/pdf' && 
          file.getLastUpdated() >= cutoffTime) {
        files.push(file);
      }
    }
    return files;
  }

  _isProcessed(fileId) {
    try {
      const sheet = this.sheetWriter.summarySheet;
      if (!sheet) {
        Logger.log('Summary sheet not found');
        return false;
      }

      const data = sheet.getDataRange().getValues();
      Logger.log('Checking file ID:', fileId);
      Logger.log('Sheet data length:', data.length);
      
      // ファイルIDの列インデックスを取得
      const headers = data[0];
      const fileIdIndex = headers.indexOf(Constants.SHEET_HEADERS.FILE_ID);
      
      if (fileIdIndex === -1) {
        Logger.log('File ID column not found in headers:', headers);
        return false;
      }

      const isProcessed = data.some(row => row[fileIdIndex] === fileId);
      Logger.log('Is file processed:', isProcessed);
      
      return isProcessed;
    } catch (error) {
      Logger.log('Error in _isProcessed:', error.message);
      Logger.log('Error stack:', error.stack);
      return false;
    }
  }

  _updateFileName(file) {
    let fileName = file.getName();
    if (!/^\d{4}_/.test(fileName)) {
      const createdDate = file.getDateCreated();
      const yy = ('' + createdDate.getFullYear()).slice(-2);
      const mm = ('0' + (createdDate.getMonth() + 1)).slice(-2);
      const newFileName = `${yy}${mm}_${fileName}`;
      file.setName(newFileName);
      fileName = newFileName;
      Logger.log(`Updated filename: ${fileName}`);
    }
    return fileName;
  }

  async processPDFManually() {
    try {
      const folderId = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
      if (!folderId) {
        throw new Error('フォルダIDが設定されていません');
      }

      await this.processFolder(folderId);
      SpreadsheetApp.getActiveSpreadsheet().toast('PDF処理が完了しました', '処理完了');
    } catch (error) {
      Logger.log(`Error in processPDFManually: ${error.message}`);
      SpreadsheetApp.getActiveSpreadsheet().toast('エラーが発生しました: ' + error.message, 'エラー');
    }
  }

  async _setupLineDeliveryTrigger() {
    try {
      const triggers = ScriptApp.getProjectTriggers();
      const existingTrigger = triggers.find(trigger => 
        trigger.getHandlerFunction() === Constants.TRIGGER_FUNCTIONS.MESSAGE_PROCESS
      );

      if (!existingTrigger) {
        const now = new Date();
        ScriptApp.newTrigger(Constants.TRIGGER_FUNCTIONS.MESSAGE_PROCESS)
          .timeBased()
          .at(now)
          .create();
        
        Logger.log('LINE配信トリガーを設定しました');
      }
    } catch (error) {
      this.errorHandler.record('TRIGGER', `Error setting up LINE delivery trigger: ${error.message}`);
    }
  }
}

// トリガーから呼び出される関数
function processPDFManually() {
  const processor = new PDFProcessor();
  processor.processPDFManually();
} 