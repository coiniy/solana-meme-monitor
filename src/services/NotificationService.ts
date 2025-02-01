import axios from 'axios';
import { CONFIG } from '../config';

export class NotificationService {
    async sendAlert(message: string) {
        await Promise.all([
            this.sendTelegramMessage(message),
            this.sendDiscordMessage(message)
        ]);
    }

    private async sendTelegramMessage(message: string) {
        try {
            const url = `https://api.telegram.org/bot${CONFIG.NOTIFICATIONS.TELEGRAM_BOT_TOKEN}/sendMessage`;
            await axios.post(url, {
                chat_id: CONFIG.NOTIFICATIONS.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
        } catch (error) {
            console.error('发送Telegram消息失败:', error);
        }
    }

    private async sendDiscordMessage(message: string) {
        try {
            await axios.post(CONFIG.NOTIFICATIONS.DISCORD_WEBHOOK_URL, {
                content: message
            });
        } catch (error) {
            console.error('发送Discord消息失败:', error);
        }
    }
} 