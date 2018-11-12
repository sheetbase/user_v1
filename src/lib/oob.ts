import { User } from './types';
import { DatabaseService } from './database';

export class OobService {
  private databaseService: DatabaseService;

  constructor (
    databaseService: DatabaseService,
  ) {
    this.databaseService = databaseService;
  }

  verifyCode(oobCode: string) {
      if (!oobCode) {
        throw new Error('auth/missing');
      }
      const users = this.databaseService.getUsers();
      let user: User;
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        if (u._oob && u._oob['code'] === oobCode && (
          Math.floor(( (new Date() as any) - (new Date(u._oob['obtainedAt']) as any) ) / 86400000) < 0
        )) {
          user = u;
        }
      }
      if (!user) {
        throw new Error('auth/invalid-oob-code');
      }
      return { valid: true, user };
    }

}