// 시간대별 설정
const TIME_FRAMES = [
  { name: '1분봉', interval: '1m', limit: 200, weight: 1 }, // 낮은 가중치 - 참고용
  { name: '5분봉', interval: '5m', limit: 200, weight: 2 }, // 중간 가중치 - 단기 방향성
  { name: '30분봉', interval: '30m', limit: 200, weight: 4 }, // 가장 높은 가중치 - 스윙의 핵심
  { name: '1시간봉', interval: '1H', limit: 200, weight: 3 }, // 높은 가중치 - 중기 추세
  { name: '4시간봉', interval: '4H', limit: 200, weight: 2 }, // 중간 가중치 - 장기 추세
  { name: '12시간봉', interval: '12H', limit: 200, weight: 2 }, // 중간 가중치 - 장기 추세
  { name: '1일봉', interval: '1D', limit: 200, weight: 2 } // 중간 가중치 - 장기 추세
];

// 이평선 기간 설정
const MA_PERIODS = {
  short: [10, 20, 50], // 단기 이평선 기간 증가
  medium: [100, 120], // 중기 이평선 기간 증가
  long: [200] // 장기 이평선 추가
};

// 기술적 지표 설정
const TECHNICAL_SETTINGS = {
  rsi: {
    period: 14 // RSI 기간 유지
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  },
  bb: {
    period: 20,
    stdDev: 2
  },
  stoch: {
    period: 14,
    signalPeriod: 3
  },
  adx: {
    period: 14
  },
  ma: {
    fastPeriod: 20, // 단기 이평선 기간 증가
    slowPeriod: 50 // 장기 이평선 기간 증가
  }
};

// API 설정
const API_SETTINGS = {
  OKX_API_URL: 'https://www.okx.com/api/v5',
  SYMBOL: 'BTC-USDT'
};

// 트렌드 분석용 가중치 설정 (지표별, 시간대별)
const TREND_WEIGHTS = {
  harmonic: 5, // 하모닉 패턴 가중치 증가
  ichimoku: 6, // 일목구름표 가중치 증가
  elliott: 4, // 엘리어트 파동 가중치 증가
  technical: 2, // 기본 기술적 지표 가중치 증가
  timeframe: {
    // 시간대별 가중치 추가
    '1m': 1,
    '5m': 1,
    '30m': 2,
    '1H': 3,
    '4H': 4,
    '12H': 5,
    '1D': 6
  }
};

export {
  TIME_FRAMES,
  MA_PERIODS,
  TECHNICAL_SETTINGS,
  API_SETTINGS,
  TREND_WEIGHTS
};
