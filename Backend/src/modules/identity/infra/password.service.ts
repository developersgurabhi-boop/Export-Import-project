import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private dummyHash: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Spends the same time as a real verification, so an unknown email cannot be
   * distinguished from a wrong password by response timing.
   */
  async burnVerifyTime(password: string): Promise<void> {
    this.dummyHash ??= argon2.hash('timing-equalisation-only');
    await this.verify(await this.dummyHash, password);
  }
}
