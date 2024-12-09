class OAuthService {
  static getOAuthService() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const clientId = scriptProperties.getProperty('CLIENT_ID');
    const clientSecret = scriptProperties.getProperty('CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('CLIENT_ID or CLIENT_SECRET not found in script properties.');
    }

    return OAuth2.createService('Oaut20test')
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://oauth2.googleapis.com/token')
      .setClientId(clientId)
      .setClientSecret(clientSecret)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope(['https://www.googleapis.com/auth/cloud-vision',
                'https://www.googleapis.com/auth/devstorage.read_write', 
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/generative-language.tuning.readonly',
                'https://www.googleapis.com/auth/cloud-platform'])
      .setParam('access_type', 'offline')
      .setParam('prompt', 'consent');
  }

  static getAccessToken() {
    const service = this.getOAuthService();
    if (service.hasAccess()) {
      return service.getAccessToken();
    }
    return null;
  }
}

function showAuthUrl() {
  const service = OAuthService.getOAuthService();
  if (!service.hasAccess()) {
    const authorizationUrl = service.getAuthorizationUrl();
    const template = HtmlService.createTemplate(
      '<a href="<?= authorizationUrl ?>" target="_blank">認証ページを開く</a>' +
      '<p>認証が完了したら、このウィンドウを閉じてスプレッドシートを更新してください。</p>'
    );
    template.authorizationUrl = authorizationUrl;
    const html = template.evaluate()
      .setWidth(400)
      .setHeight(200);
    SpreadsheetApp.getUi().showModalDialog(html, 'OAuth認証');
  } else {
    SpreadsheetApp.getUi().alert('既に認証されています。');
  }
}

function authCallback(request) {
  const service = OAuthService.getOAuthService();
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('認証が完了しました。このウィンドウを閉じてスプレッドシートを更新してください。');
  } else {
    return HtmlService.createHtmlOutput('認証に失敗しました。もう一度お試しください。');
  }
} 