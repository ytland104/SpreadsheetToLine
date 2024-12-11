class VisionAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.bucketName = PropertiesService.getScriptProperties().getProperty('BUCKET_NAME');
    if (!this.bucketName) {
      throw new Error('BUCKET_NAME not found in script properties');
    }
  }

  async extractText(fileId, pdfContent) {
    try {
      const operationId = await this.callVisionAPI(fileId, pdfContent);
      if (!operationId) return null;

      const result = await this.waitForOperation(operationId);
      if (!result) return null;

      return await this.fetchResult(fileId);
    } catch (error) {
      ErrorHandler.record(fileId, `Vision API Error: ${error.message}`);
      return null;
    }
  }

  async callVisionAPI(fileId, pdfContent) {
    const gcsFileUrl = await this.uploadPdfToGCS(fileId, pdfContent);
    if (!gcsFileUrl) return null;

    const outputFileName = `${fileId}-output.json`;
    const requestBody = {
      requests: [{
        inputConfig: {
          gcsSource: { uri: gcsFileUrl },
          mimeType: "application/pdf"
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        outputConfig: {
          gcsDestination: {
            uri: `gs://${this.bucketName}/${outputFileName}`
          },
          batchSize: 1
        }
      }]
    };

    const response = await UrlFetchApp.fetch(
      'https://vision.googleapis.com/v1/files:asyncBatchAnnotate',
      {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(requestBody),
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      }
    );

    const responseJson = JSON.parse(response.getContentText());
    return responseJson.name.split('/').pop();
  }

  async waitForOperation(operationId) {
    const visionApiUrl = `https://vision.googleapis.com/v1/operations/${operationId}`;
    
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await UrlFetchApp.fetch(visionApiUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() !== 200) {
        Logger.log(`Error checking operation status: ${response.getContentText()}`);
        return null;
      }

      const operation = JSON.parse(response.getContentText());
      if (operation.done) {
        return operation.response || operation.error;
      }

      await Utilities.sleep(5000); // 5秒待機
    }
    return null;
  }

  async fetchResult(fileId) {
    try {
      const bucketName = this.bucketName;
      // prefixを使用してファイルを検索
      const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o?prefix=${encodeURIComponent(fileId + '-output')}&fields=items(name)`;

      const response = await UrlFetchApp.fetch(gcsUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() !== 200) {
        Logger.log(`Error listing files: ${response.getContentText()}`);
        throw new Error(`Failed to list files: ${response.getResponseCode()}`);
      }

      const jsonResponse = JSON.parse(response.getContentText());
      const matchedFiles = jsonResponse.items?.filter(item => 
        item.name.match(new RegExp(`^${fileId}-output.*\\.json$`))
      );

      if (!matchedFiles?.length) {
        throw new Error(`No output files found for fileId: ${fileId}`);
      }

      // 全ての結果を結合するための配列
      const resultTexts = [];

      // 各ファイルの内容を取得
      for (const matchedFile of matchedFiles) {
        const resultUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(matchedFile.name)}`;
        const fileResponse = await UrlFetchApp.fetch(resultUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
          muteHttpExceptions: true
        });

        if (fileResponse.getResponseCode() === 200) {
          const resultJson = JSON.parse(fileResponse.getContentText());
          if (resultJson.responses?.[0]?.fullTextAnnotation?.text) {
            resultTexts.push(resultJson.responses[0].fullTextAnnotation.text);
          }
        } else {
          Logger.log(`Error fetching file ${matchedFile.name}: ${fileResponse.getContentText()}`);
        }
      }

      if (resultTexts.length === 0) {
        throw new Error('No text content found in any of the response files');
      }

      // 全ての結果を結合して返す
      return resultTexts.join('\n');

    } catch (error) {
      Logger.log(`Error in fetchResult: ${error.message}`);
      return null;
    }
  }

  async uploadPdfToGCS(fileId, pdfBlob) {
    const fileName = `${fileId}.pdf`;
    const gcsUrl = `https://storage.googleapis.com/upload/storage/v1/b/${this.bucketName}/o?uploadType=media&name=${fileName}`;

    const response = await UrlFetchApp.fetch(gcsUrl, {
      method: 'POST',
      contentType: 'application/pdf',
      payload: pdfBlob.getBytes(),
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    if (response.getResponseCode() === 200) {
      return `gs://${this.bucketName}/${fileName}`;
    }
    return null;
  }
} 