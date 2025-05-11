import 'dotenv/config';
import axios from 'axios';
import {
  SMA,
  RSI,
  MACD,
  BollingerBands,
  Stochastic,
  OBV,
  ADX,
  EMA
} from 'technicalindicators';
import { analyzeHarmonicPattern } from './src/indicators/harmonic.js';
import { analyzeIchimoku } from './src/indicators/ichimoku.js';
import { analyzeElliottWave } from './src/indicators/elliott.js';
import { analyzeSupportResistance } from './src/indicators/supportResistance.js';
import { analyzeOverallTrend } from './src/indicators/trendAnalysis.js';
import {
  sendAccuracyMessage,
  sendTrendAnalysisMessage
} from './src/telegram.js';
import {
  TIME_FRAMES,
  MA_PERIODS,
  TECHNICAL_SETTINGS,
  API_SETTINGS
} from './src/settings.js';

// API 설정
const { OKX_API_URL, SYMBOL } = API_SETTINGS;

// 이전 추세 점수를 저장할 변수
let previousWeightedTrends = null;

// 예측 기록을 저장할 배열
let predictionHistory = [];

// 누적 정확도 통계
let accuracyStats = {
  total: 0,
  correct: 0,
  incorrect: 0,
  accuracy: 0
};

// 전역 변수로 예측 정보 저장
let currentPrediction = null;

// 가격 데이터를 가져오는 함수
async function getPriceData(timeFrame) {
  try {
    console.log(`OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 요청 중...`);
    const response = await axios.get(
      `${OKX_API_URL}/market/candles?instId=${SYMBOL}&bar=${timeFrame.interval}&limit=${timeFrame.limit}`
    );
    const prices = response.data.data.map((candle) => ({
      timestamp: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
    console.log(
      `OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 수신 완료 (${prices.length}개 캔들)`
    );
    return prices;
  } catch (error) {
    console.error(`${timeFrame.name} 데이터 가져오기 실패:`, error.message);
    return null;
  }
}

// 기술적 지표 계산 함수
function calculateIndicators(prices) {
  const closes = prices.map((p) => p.close);
  const highs = prices.map((p) => p.high);
  const lows = prices.map((p) => p.low);
  const volumes = prices.map((p) => p.volume);

  // 이평선 계산
  const movingAverages = {};

  // 단기 이평선
  MA_PERIODS.short.forEach((period) => {
    movingAverages[`ma${period}`] = calculateMA(closes, period);
  });

  // 중기 이평선
  MA_PERIODS.medium.forEach((period) => {
    if (closes.length >= period) {
      movingAverages[`ma${period}`] = calculateMA(closes, period);
    }
  });

  // 장기 이평선
  MA_PERIODS.long.forEach((period) => {
    if (closes.length >= period) {
      movingAverages[`ma${period}`] = calculateMA(closes, period);
    }
  });

  // RSI 계산
  const rsi = RSI.calculate({
    values: closes,
    period: TECHNICAL_SETTINGS.rsi.period
  });

  // MACD 계산
  const macd = MACD.calculate({
    values: closes,
    ...TECHNICAL_SETTINGS.macd
  });

  // 볼린저 밴드 계산
  const bb = BollingerBands.calculate({
    values: closes,
    ...TECHNICAL_SETTINGS.bb
  });

  // 스토캐스틱 계산
  const stoch = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    ...TECHNICAL_SETTINGS.stoch
  });

  // OBV 계산
  const obv = OBV.calculate({
    close: closes,
    volume: volumes
  });

  // ADX 계산
  const adx = ADX.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: TECHNICAL_SETTINGS.adx.period
  });

  // 이평선 크로스 계산
  const fastMA = SMA.calculate({
    values: closes,
    period: TECHNICAL_SETTINGS.ma.fastPeriod
  });
  const slowMA = SMA.calculate({
    values: closes,
    period: TECHNICAL_SETTINGS.ma.slowPeriod
  });

  return {
    rsi: rsi[rsi.length - 1],
    macd: macd[macd.length - 1],
    bb: bb[bb.length - 1],
    stoch: stoch[stoch.length - 1],
    obv: obv[obv.length - 1],
    adx: adx[adx.length - 1],
    maCross: {
      fast: fastMA[fastMA.length - 1],
      slow: slowMA[slowMA.length - 1]
    },
    movingAverages
  };
}

// 이평선 계산 함수
function calculateMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

// 예측 정확도 분석 함수
async function analyzePredictionAccuracy() {
  try {
    console.log('예측 정확도 분석 시작...');
    // 30분봉 데이터 가져오기
    const thirtyMinData = await getPriceData({
      name: '30분봉',
      interval: '30m',
      limit: 3
    });
    if (!thirtyMinData || thirtyMinData.length < 3) {
      console.log('데이터가 부족하여 분석을 건너뜁니다.');
      return;
    }

    const currentPrice = thirtyMinData[thirtyMinData.length - 1].close;
    const ninetyMinutesAgoPrice = thirtyMinData[0].close;

    // 가격 변동률 계산
    const priceChange =
      ((currentPrice - ninetyMinutesAgoPrice) / ninetyMinutesAgoPrice) * 100;

    // 실제 추세 판단 (30분봉 기준으로 임계값 조정)
    let actualTrend;
    if (priceChange > 0.5) {
      actualTrend = '상승';
    } else if (priceChange < -0.5) {
      actualTrend = '하락';
    } else {
      actualTrend = '횡보';
    }

    // 예측 정보가 있으면 정확도 분석
    if (currentPrediction) {
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

      // 텔레그램으로 정확도 메시지 전송
      await sendAccuracyMessage({
        accuracyStats,
        currentPrediction,
        actualTrend,
        priceChange
      });

      // 현재 예측 정보 초기화
      currentPrediction = null;
    }
  } catch (error) {
    console.error('예측 정확도 분석 중 에러 발생:', error.message);
  }
}

// 가격 정보를 가져오고 알림을 보내는 함수
async function checkPriceAndNotify() {
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

      // 현재 가격 저장 (30분봉 기준)
      if (timeFrame.interval === '30m') {
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

      // 현재 분석 결과 저장 (30분봉 기준)
      if (timeFrame.interval === '30m') {
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
        console.log('모든 추세 점수가 동일하여 메시지를 보내지 않습니다.');
        previousWeightedTrends = weightedTrends;
        return;
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

    // 현재 예측 정보 저장
    currentPrediction = {
      timestamp: new Date(),
      predictedTrend: dominantTrend,
      price: currentPrice
    };

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

    // 현재 추세 점수를 이전 추세 점수로 저장
    previousWeightedTrends = weightedTrends;
  } catch (error) {
    console.error('에러 발생:', error.message);
  }
}

// 프로그램 상태 출력 함수
function printStatus() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  console.log(`[${timeString}] 프로그램 동작중... ${SYMBOL} 모니터링 중`);
}

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
