class PDFProcessor {
  constructor() {
    this.accessToken = OAuthService.getAccessToken();
    this.visionAPI = new VisionAPI(this.accessToken);
    this.geminiAPI = new GeminiAPI(this.accessToken);
    this.sheetWriter = new SheetWriter();
  }

  async processFolder(folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      const files = this._getUpdatedPDFFiles(folder);
      
      Logger.log(`Found ${files.length} files to process`);
      
      for (const file of files) {
        await this.processFile(file);
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
    const cutoffTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    
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
    const sheet = this.sheetWriter.summarySheet;
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    return data.some(row => row[8] === fileId); // ファイルIDは9列目
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
} 