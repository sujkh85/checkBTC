// 피보나치 비율 계산
function calculateFibonacciRatio(price1, price2) {
  return Math.abs((price2 - price1) / price1);
}

// 극점 찾기
function findExtremePoints(highs, lows) {
  const points = [];

  for (let i = 2; i < highs.length - 2; i++) {
    // 고점 찾기
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      points.push({ type: 'high', price: highs[i], index: i });
    }

    // 저점 찾기
    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      points.push({ type: 'low', price: lows[i], index: i });
    }
  }

  return points.sort((a, b) => a.index - b.index);
}

// Gartley 패턴 확인
function checkGartleyPattern(data) {
  const { highs, lows } = data;
  const points = findExtremePoints(highs, lows);

  if (points.length < 5) return 'Gartley 패턴 없음';

  const X = points[0];
  const A = points[1];
  const B = points[2];
  const C = points[3];
  const D = points[4];

  // Gartley 패턴 비율 확인
  const AB = calculateFibonacciRatio(A.price, B.price);
  const BC = calculateFibonacciRatio(B.price, C.price);
  const CD = calculateFibonacciRatio(C.price, D.price);
  const XA = calculateFibonacciRatio(X.price, A.price);

  // Gartley 패턴 조건
  if (
    Math.abs(AB - 0.618) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 0.786) < 0.1 &&
    Math.abs(XA - 0.786) < 0.1
  ) {
    return 'Gartley 매수 패턴 발견';
  } else if (
    Math.abs(AB - 0.618) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 0.786) < 0.1 &&
    Math.abs(XA - 0.786) < 0.1
  ) {
    return 'Gartley 매도 패턴 발견';
  }

  return 'Gartley 패턴 없음';
}

// Butterfly 패턴 확인
function checkButterflyPattern(data) {
  const { highs, lows } = data;
  const points = findExtremePoints(highs, lows);

  if (points.length < 5) return 'Butterfly 패턴 없음';

  const X = points[0];
  const A = points[1];
  const B = points[2];
  const C = points[3];
  const D = points[4];

  const AB = calculateFibonacciRatio(A.price, B.price);
  const BC = calculateFibonacciRatio(B.price, C.price);
  const CD = calculateFibonacciRatio(C.price, D.price);
  const XA = calculateFibonacciRatio(X.price, A.price);

  if (
    Math.abs(AB - 0.786) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 1.618) < 0.1 &&
    Math.abs(XA - 0.786) < 0.1
  ) {
    return 'Butterfly 매수 패턴 발견';
  } else if (
    Math.abs(AB - 0.786) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 1.618) < 0.1 &&
    Math.abs(XA - 0.786) < 0.1
  ) {
    return 'Butterfly 매도 패턴 발견';
  }

  return 'Butterfly 패턴 없음';
}

// Bat 패턴 확인
function checkBatPattern(data) {
  const { highs, lows } = data;
  const points = findExtremePoints(highs, lows);

  if (points.length < 5) return 'Bat 패턴 없음';

  const X = points[0];
  const A = points[1];
  const B = points[2];
  const C = points[3];
  const D = points[4];

  const AB = calculateFibonacciRatio(A.price, B.price);
  const BC = calculateFibonacciRatio(B.price, C.price);
  const CD = calculateFibonacciRatio(C.price, D.price);
  const XA = calculateFibonacciRatio(X.price, A.price);

  if (
    Math.abs(AB - 0.382) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 0.886) < 0.1 &&
    Math.abs(XA - 0.886) < 0.1
  ) {
    return 'Bat 매수 패턴 발견';
  } else if (
    Math.abs(AB - 0.382) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 0.886) < 0.1 &&
    Math.abs(XA - 0.886) < 0.1
  ) {
    return 'Bat 매도 패턴 발견';
  }

  return 'Bat 패턴 없음';
}

// Crab 패턴 확인
function checkCrabPattern(data) {
  const { highs, lows } = data;
  const points = findExtremePoints(highs, lows);

  if (points.length < 5) return 'Crab 패턴 없음';

  const X = points[0];
  const A = points[1];
  const B = points[2];
  const C = points[3];
  const D = points[4];

  const AB = calculateFibonacciRatio(A.price, B.price);
  const BC = calculateFibonacciRatio(B.price, C.price);
  const CD = calculateFibonacciRatio(C.price, D.price);
  const XA = calculateFibonacciRatio(X.price, A.price);

  if (
    Math.abs(AB - 0.382) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 1.618) < 0.1 &&
    Math.abs(XA - 1.618) < 0.1
  ) {
    return 'Crab 매수 패턴 발견';
  } else if (
    Math.abs(AB - 0.382) < 0.1 &&
    Math.abs(BC - 0.382) < 0.1 &&
    Math.abs(CD - 1.618) < 0.1 &&
    Math.abs(XA - 1.618) < 0.1
  ) {
    return 'Crab 매도 패턴 발견';
  }

  return 'Crab 패턴 없음';
}

// Shark 패턴 확인
function checkSharkPattern(data) {
  const { highs, lows } = data;
  const points = findExtremePoints(highs, lows);

  if (points.length < 5) return 'Shark 패턴 없음';

  const X = points[0];
  const A = points[1];
  const B = points[2];
  const C = points[3];
  const D = points[4];

  const AB = calculateFibonacciRatio(A.price, B.price);
  const BC = calculateFibonacciRatio(B.price, C.price);
  const CD = calculateFibonacciRatio(C.price, D.price);
  const XA = calculateFibonacciRatio(X.price, A.price);

  if (
    Math.abs(AB - 1.13) < 0.1 &&
    Math.abs(BC - 1.618) < 0.1 &&
    Math.abs(CD - 1.27) < 0.1 &&
    Math.abs(XA - 1.618) < 0.1
  ) {
    return 'Shark 매수 패턴 발견';
  } else if (
    Math.abs(AB - 1.13) < 0.1 &&
    Math.abs(BC - 1.618) < 0.1 &&
    Math.abs(CD - 1.27) < 0.1 &&
    Math.abs(XA - 1.618) < 0.1
  ) {
    return 'Shark 매도 패턴 발견';
  }

  return 'Shark 패턴 없음';
}

export function analyzeHarmonicPattern(prices) {
  const highs = prices.map((p) => p.high);
  const lows = prices.map((p) => p.low);

  // 최근 20개 봉의 데이터를 사용하여 분석
  const recentData = {
    highs: highs.slice(-20),
    lows: lows.slice(-20)
  };

  // 각 패턴 확인
  const gartley = checkGartleyPattern(recentData);
  const butterfly = checkButterflyPattern(recentData);
  const bat = checkBatPattern(recentData);
  const crab = checkCrabPattern(recentData);
  const shark = checkSharkPattern(recentData);

  return {
    gartley,
    butterfly,
    bat,
    crab,
    shark
  };
}
