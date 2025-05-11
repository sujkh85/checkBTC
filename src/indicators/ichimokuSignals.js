// 추세 판단
function determineTrend(signals, strongSignals) {
  const bullishSignals = signals.filter(
    (s) => s.includes('상향돌파') || s.includes('위에 위치')
  ).length;

  const bearishSignals = signals.filter(
    (s) => s.includes('하향돌파') || s.includes('아래에 위치')
  ).length;

  if (strongSignals.includes('강력한 상승 신호')) {
    return '강력한 상승 추세';
  } else if (strongSignals.includes('강력한 하락 신호')) {
    return '강력한 하락 추세';
  } else if (bullishSignals > bearishSignals) {
    return '상승 추세';
  } else if (bearishSignals > bullishSignals) {
    return '하락 추세';
  } else {
    return '횡보 추세';
  }
}

export function analyzeIchimokuSignals(
  currentPrice,
  conversionLine,
  baseLine,
  leadingSpanA,
  leadingSpanB,
  laggingSpan
) {
  const signals = [];

  // 전환선과 기준선 크로스
  if (conversionLine > baseLine) {
    signals.push('전환선이 기준선을 상향돌파');
  } else if (conversionLine < baseLine) {
    signals.push('전환선이 기준선을 하향돌파');
  }

  // 가격과 구름대 관계
  if (currentPrice > leadingSpanA && currentPrice > leadingSpanB) {
    signals.push('가격이 구름대 위에 위치');
  } else if (currentPrice < leadingSpanA && currentPrice < leadingSpanB) {
    signals.push('가격이 구름대 아래에 위치');
  }

  // 후행스팬과 가격 관계
  if (laggingSpan > currentPrice) {
    signals.push('후행스팬이 가격 위에 위치');
  } else if (laggingSpan < currentPrice) {
    signals.push('후행스팬이 가격 아래에 위치');
  }

  // 구름대 색상 분석
  if (leadingSpanA > leadingSpanB) {
    signals.push('구름대가 상승 추세');
  } else if (leadingSpanA < leadingSpanB) {
    signals.push('구름대가 하락 추세');
  }

  // 강력한 매매 신호 확인
  const strongSignals = [];
  if (
    currentPrice > conversionLine &&
    currentPrice > baseLine &&
    currentPrice > leadingSpanA &&
    currentPrice > leadingSpanB
  ) {
    strongSignals.push('강력한 상승 신호');
  } else if (
    currentPrice < conversionLine &&
    currentPrice < baseLine &&
    currentPrice < leadingSpanA &&
    currentPrice < leadingSpanB
  ) {
    strongSignals.push('강력한 하락 신호');
  }

  return {
    signals,
    strongSignals,
    trend: determineTrend(signals, strongSignals)
  };
}
