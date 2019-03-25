import { UserProfile, UserProviderId } from '@sheetbase/models';

import { GoogleUserInfo, FacebookUserInfo } from './types';

export class OauthService {

  constructor() {}

  getUserInfo(providerId: UserProviderId, accessToken: string) {
    let url: string;
    // prepare url
    if (providerId === 'google.com') {
      url = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=' + accessToken;
    } else if (providerId === 'facebook.com') {
      url = 'https://graph.facebook.com/me?fields=id,email,name,picture' +
        '&access_token=' + accessToken;
    }
    // fetch result
    const response = UrlFetchApp.fetch(url);
    // return result
    return JSON.parse(response.getContentText('UTF-8'));
  }

  processUserInfo(providerId: UserProviderId, data: any): UserProfile {
    const profile: UserProfile = {};
    // extract data
    if (providerId === 'google.com') {
      const { name, link, picture } = data as GoogleUserInfo;
      profile.displayName = name;
      profile.url = link;
      profile.photoURL = picture;
    } else if (providerId === 'facebook.com') {
      const { name, picture } = data as FacebookUserInfo;
      profile.displayName = name;
      profile.photoURL = (!!picture && !!picture.data) ? picture.data.url : '';
    }
    // return result
    return profile;
  }

}