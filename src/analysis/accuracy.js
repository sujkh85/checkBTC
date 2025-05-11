import { getPriceData } from '../api/okx.js';
import { sendAccuracyMessage } from '../telegram.js';

// 누적 정확도 통계
let accuracyStats = {
  total: 0,
  correct: 0,
  incorrect: 0,
  accuracy: 0
};

// 전역 변수로 예측 정보 저장
let currentPrediction = null;

/**
 * 예측 정확도를 분석하는 함수
 */
export async function analyzePredictionAccuracy() {
  try {
    console.log('예측 정확도 분석 시작...');
    console.log('현재 예측 정보:', currentPrediction);

    // 5분봉 데이터 가져오기
    const fiveMinData = await getPriceData({
      name: '5분봉',
      interval: '5m',
      limit: 3
    });
    if (!fiveMinData || fiveMinData.length < 3) {
      console.log('데이터가 부족하여 분석을 건너뜁니다.');
      return;
    }

    const currentPrice = fiveMinData[fiveMinData.length - 1].close;
    const fifteenMinutesAgoPrice = fiveMinData[0].close;

    // 가격 변동률 계산
    const priceChange =
      ((currentPrice - fifteenMinutesAgoPrice) / fifteenMinutesAgoPrice) * 100;

    // 실제 추세 판단 (5분봉 기준으로 임계값 조정)
    let actualTrend;
    if (priceChange > 0.1) {
      // 5분봉은 더 작은 변동률로 판단
      actualTrend = '상승';
    } else if (priceChange < -0.1) {
      actualTrend = '하락';
    } else {
      actualTrend = '횡보';
    }

    console.log('실제 추세:', actualTrend);
    console.log('가격 변동률:', priceChange);

    // 예측 정보가 있으면 정확도 분석
    if (currentPrediction) {
      console.log('예측 정보가 있어 정확도 분석을 시작합니다.');
      const isCorrect = currentPrediction.predictedTrend === actualTrend;

      // 누적 통계 업데이트
      accuracyStats.total++;
      if (isCorrect) {
        accuracyStats.correct++;
      } else {
        accuracyStats.incorrect++;
      }
      accuracyStats.accuracy = (
        (accuracyStats.correct / accuracyStats.total) *
        100
      ).toFixed(2);

      console.log('누적 통계:', accuracyStats);

      // 텔레그램으로 정확도 메시지 전송
      await sendAccuracyMessage({
        accuracyStats,
        currentPrediction,
        actualTrend,
        priceChange
      });

      // 현재 예측 정보 초기화
      currentPrediction = null;
    } else {
      console.log('예측 정보가 없어 분석을 건너뜁니다.');
    }
  } catch (error) {
    console.error('예측 정확도 분석 중 에러 발생:', error.message);
  }
}

/**
 * 현재 예측 정보를 설정하는 함수
 * @param {Object} prediction - 예측 정보
 */
export function setCurrentPrediction(prediction) {
  currentPrediction = prediction;
}

/**
 * 현재 예측 정보를 가져오는 함수
 * @returns {Object|null} 현재 예측 정보
 */
export function getCurrentPrediction() {
  return currentPrediction;
}

/**
 * 정확도 통계를 가져오는 함수
 * @returns {Object} 정확도 통계
 */
export function getAccuracyStats() {
  return accuracyStats;
}
