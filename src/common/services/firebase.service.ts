import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { env } from '@/env';

export interface FcmSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidToken?: boolean;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.initialized = true;
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin initialized');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Firebase Admin initialization failed: ${errMsg}`);
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<FcmSendResult> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping push');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const messageId = await admin.messaging().send({
        token,
        notification: { title, body },
        data: data ?? {},
      });
      this.logger.debug(`FCM sent: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      let code = '';
      if (error && typeof error === 'object' && 'code' in error) {
        const rawCode = (error as { code: unknown }).code;
        if (typeof rawCode === 'string') code = rawCode;
      }
      const invalidToken =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument';

      this.logger.error(`FCM send failed (${code || 'unknown'}): ${errMsg}`);
      return { success: false, error: errMsg, invalidToken };
    }
  }
}
