import { getPriceData } from '../api/okx.js';
import { sendTrendAnalysisMessage } from '../telegram.js';
import { calculateIndicators } from '../indicators/technical.js';
import { analyzeHarmonicPattern } from '../indicators/harmonic.js';
import { analyzeIchimoku } from '../indicators/ichimoku.js';
import { analyzeElliottWave } from '../indicators/elliott.js';
import { analyzeSupportResistance } from '../indicators/supportResistance.js';
import { analyzeOverallTrend } from '../indicators/trendAnalysis.js';
import { setCurrentPrediction } from '../analysis/accuracy.js';
import { TIME_FRAMES, API_SETTINGS } from '../settings.js';

const { SYMBOL } = API_SETTINGS;

// 이전 추세 점수를 저장할 변수
let previousWeightedTrends = null;

/**
 * 가격 정보를 가져오고 알림을 보내는 함수
 */
export async function checkPriceAndNotify() {
  try {
    const timeFrameTrends = {};
    let currentPrice = null;
    let currentIndicators = null;
    let currentHarmonic = null;
    let currentIchimoku = null;
    let currentElliott = null;

    // 각 시간대별로 분석
    for (const timeFrame of TIME_FRAMES) {
      const prices = await getPriceData(timeFrame);
      if (!prices || prices.length === 0) continue;

      // 현재 가격 저장 (5분봉 기준)
      if (timeFrame.interval === '5m') {
        currentPrice = prices[prices.length - 1].close;
      }

      const indicators = calculateIndicators(prices);

      // 하모닉 패턴 분석
      const harmonic = analyzeHarmonicPattern(prices);

      // 일목구름표 분석
      const ichimoku = analyzeIchimoku(prices);

      // 엘리어트 파동 분석
      const elliott = analyzeElliottWave(prices);

      // 지지/저항 분석
      const supportResistance = analyzeSupportResistance(prices);

      // 종합 추세 분석
      const trend = analyzeOverallTrend(
        indicators,
        harmonic,
        ichimoku,
        elliott,
        supportResistance,
        prices,
        timeFrame.interval
      );

      // 현재 분석 결과 저장 (5분봉 기준)
      if (timeFrame.interval === '5m') {
        currentIndicators = indicators;
        currentHarmonic = harmonic;
        currentIchimoku = ichimoku;
        currentElliott = elliott;
      }

      // 시간대별 추세 저장
      timeFrameTrends[timeFrame.name] = {
        trend: trend.trend,
        strength: trend.strength,
        weight: timeFrame.weight
      };
    }

    // 가중치를 고려한 종합 추세 판단
    const weightedTrends = {
      상승: 0,
      하락: 0,
      횡보: 0
    };

    for (const [name, data] of Object.entries(timeFrameTrends)) {
      weightedTrends[data.trend] += data.weight;
    }

    // 이전 추세와 비교
    if (previousWeightedTrends) {
      // 모든 점수가 동일한지 확인
      const isAllScoresEqual =
        previousWeightedTrends['상승'] === weightedTrends['상승'] &&
        previousWeightedTrends['하락'] === weightedTrends['하락'] &&
        previousWeightedTrends['횡보'] === weightedTrends['횡보'];

      if (isAllScoresEqual) {
        console.log(
          '모든 추세 점수가 동일하여 추세 분석 메시지를 보내지 않습니다.'
        );
      }
    }

    // 가장 높은 점수 찾기
    const maxWeightedScore = Math.max(
      weightedTrends['상승'],
      weightedTrends['하락'],
      weightedTrends['횡보']
    );
    const dominantTrend = Object.entries(weightedTrends).find(
      ([_, score]) => score === maxWeightedScore
    )[0];

    // 현재 예측 정보 저장 (추세가 변경되지 않아도 저장)
    console.log('예측 정보 저장 시작:', {
      timestamp: new Date(),
      predictedTrend: dominantTrend,
      price: currentPrice
    });
    setCurrentPrediction({
      timestamp: new Date(),
      predictedTrend: dominantTrend,
      price: currentPrice
    });
    console.log('예측 정보 저장 완료');

    // 추세가 변경된 경우에만 추세 분석 메시지 전송
    if (!previousWeightedTrends || !isAllScoresEqual) {
      // 텔레그램으로 추세 분석 메시지 전송
      await sendTrendAnalysisMessage({
        symbol: SYMBOL,
        timeFrameTrends,
        weightedTrends,
        dominantTrend,
        currentPrice,
        indicators: currentIndicators,
        harmonic: currentHarmonic,
        ichimoku: currentIchimoku,
        elliott: currentElliott
      });
    }

    // 현재 추세 점수를 이전 추세 점수로 저장
    previousWeightedTrends = weightedTrends;
  } catch (error) {
    console.error('에러 발생:', error.message);
  }
}

/**
 * 프로그램 상태를 출력하는 함수
 */
export function printStatus() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  console.log(`[${timeString}] 프로그램 동작중... ${SYMBOL} 모니터링 중`);
}
