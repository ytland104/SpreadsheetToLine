class GeminiAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async summarize(text) {
    const sanitizedText = this._sanitizeText(text);
    const prompt = this._createPrompt(sanitizedText);
    
    try {
      const response = await this._callGeminiAPI(prompt);
      if (response.getResponseCode() !== 200) {
        Logger.log(`API request failed with status code: ${response.getResponseCode()}`);
        return null;
      }

      const data = JSON.parse(response.getContentText());
      if (data.error) {
        Logger.log('Error from Generative Language API: ' + JSON.stringify(data.error));
        return null;
      }

      const summary = data.candidates[0].content.parts[0].text;
      return summary.replace(/```/g, '').trim();

    } catch (error) {
      Logger.log('Error during Gemini API call: ' + error);
      return null;
    }
  }

  _sanitizeText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .trim();
  }

  _createPrompt(sanitizedText) {
    return {
      contents: [{
        parts: [{
          text: `
              # AIボット設定プロンプト：LINE公式情報要約bot

              ## 基本設定
              - 目的：ユーザーに簡潔で魅力的な情報を提供
              - スタイル：親しみやすく、明るく、簡潔な日本語
              - 対象：一般ユーザー、地域に根ざす50-70代の自治会員

              ## 入力テキスト処理ガイドライン
              1. 以下のテキストを分析：
              \`\`\`
              ${sanitizedText}
              \`\`\`

              2. 出力フォーマットを厳守

              ## 出力要件
              ### タイトル
              - 絵文字2つ必須
              - 20文字以内
              - 本質的でキャッチーな表現

              ### 要約セクション
              - 50文字以内
              - 最重要ポイントを抽出
              - 読み手の興味を即座に引く内容

              ### キーデータ
              - 重要日の特定
              - 配信日時を確実に計算(重要日付から２週間前の土曜日であること)
              - 形式は(yyyy-mm-dd)
              - 重要日付と配信日時は異なる
              - トレンドワード2つ抽出
              - ハッシュタグ形式で提示
              
              ## 最終出力フォーマット
              \`\`\`
              🗻📊 [タイトル]

              🕒 重要日付：[日付]
              📍 注目ポイント：[簡潔なポイント]
              📅 配信日時：[日時]
              

              要約：
              [85文字以内の本質的な要約]

              #トレンドワード1 #トレンドワード2
              \`\`\`
          `
        }]
      }]
    };
  }

  _callGeminiAPI(payload) {
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'headers': {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      'payload': JSON.stringify(payload),
    };

    return UrlFetchApp.fetch(this.apiUrl, options);
  }
} 