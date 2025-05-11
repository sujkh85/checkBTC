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
import { MA_PERIODS, TECHNICAL_SETTINGS } from '../settings.js';

/**
 * 기술적 지표를 계산하는 함수
 * @param {Array} prices - 가격 데이터 배열
 * @returns {Object} 계산된 기술적 지표들
 */
export function calculateIndicators(prices) {
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

/**
 * 이동평균선을 계산하는 함수
 * @param {Array} data - 가격 데이터 배열
 * @param {number} period - 기간
 * @returns {Array} 이동평균선 값 배열
 */
export function calculateMA(data, period) {
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
