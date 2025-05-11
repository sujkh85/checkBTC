import 'dotenv/config';
import {
  checkPriceAndNotify,
  printStatus
} from './src/monitoring/priceMonitor.js';
import { analyzePredictionAccuracy } from './src/analysis/accuracy.js';
import { API_SETTINGS } from './src/settings.js';

const { SYMBOL } = API_SETTINGS;

// 5초마다 상태 출력
setInterval(printStatus, 30000);

// 초기 실행
console.log(`${SYMBOL} 모니터링 프로그램 시작`);
checkPriceAndNotify();

const priceCheckInterval = 60000 * 5; // 5분
const accuracyCheckInterval = 60000 * 30; // 30분

// 5분마다 가격을 확인
setInterval(checkPriceAndNotify, priceCheckInterval);

// 30분마다 예측 정확도 분석 실행
setInterval(analyzePredictionAccuracy, accuracyCheckInterval);
