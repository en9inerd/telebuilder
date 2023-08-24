import { ConfigService } from './services/config.service.js';

export const config = await ConfigService.instance;
