// 저항선 찾기
function findResistanceLevels(data) {
  const levels = [];
  const { highs } = data;

  // 최근 5개의 고점을 찾아서 저항선으로 설정
  for (let i = 2; i < highs.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      levels.push(highs[i]);
    }
  }

  // 가장 최근의 3개 저항선만 반환
  return levels.sort((a, b) => b - a).slice(0, 3);
}

// 지지선 찾기
function findSupportLevels(data) {
  const levels = [];
  const { lows } = data;

  // 최근 5개의 저점을 찾아서 지지선으로 설정
  for (let i = 2; i < lows.length - 2; i++) {
    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      levels.push(lows[i]);
    }
  }

  // 가장 최근의 3개 지지선만 반환
  return levels.sort((a, b) => a - b).slice(0, 3);
}

// 돌파 분석
function analyzeBreakout(currentPrice, supportLevels, resistanceLevels) {
  const result = {
    supportBreak: false,
    resistanceBreak: false,
    nearestSupport: null,
    nearestResistance: null,
    distanceToSupport: null,
    distanceToResistance: null,
    signals: []
  };

  // 가장 가까운 지지선 찾기
  if (supportLevels.length > 0) {
    result.nearestSupport = supportLevels[0];
    result.distanceToSupport = (
      ((currentPrice - result.nearestSupport) / result.nearestSupport) *
      100
    ).toFixed(2);

    // 지지선 돌파 확인 (2% 이상 하락)
    if (currentPrice < result.nearestSupport * 0.98) {
      result.supportBreak = true;
      result.signals.push('지지선 하향 돌파');
    }
  }

  // 가장 가까운 저항선 찾기
  if (resistanceLevels.length > 0) {
    result.nearestResistance = resistanceLevels[0];
    result.distanceToResistance = (
      ((result.nearestResistance - currentPrice) / currentPrice) *
      100
    ).toFixed(2);

    // 저항선 돌파 확인 (2% 이상 상승)
    if (currentPrice > result.nearestResistance * 1.02) {
      result.resistanceBreak = true;
      result.signals.push('저항선 상향 돌파');
    }
  }

  return result;
}

export function analyzeSupportResistance(prices) {
  const closes = prices.map((p) => p.close);
  const highs = prices.map((p) => p.high);
  const lows = prices.map((p) => p.low);

  // 최근 20개 봉의 데이터를 사용하여 분석
  const recentData = {
    closes: closes.slice(-20),
    highs: highs.slice(-20),
    lows: lows.slice(-20)
  };

  // 저항선 찾기 (최근 고점들)
  const resistanceLevels = findResistanceLevels(recentData);

  // 지지선 찾기 (최근 저점들)
  const supportLevels = findSupportLevels(recentData);

  // 현재 가격과의 관계 분석
  const currentPrice = recentData.closes[recentData.closes.length - 1];
  const analysis = analyzeBreakout(
    currentPrice,
    supportLevels,
    resistanceLevels
  );

  return {
    currentPrice,
    supportLevels,
    resistanceLevels,
    analysis
  };
}
