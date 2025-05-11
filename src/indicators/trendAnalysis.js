import { TREND_WEIGHTS } from '../settings.js';

// 종합 추세 분석 함수
function analyzeOverallTrend(indicators, harmonic, ichimoku, elliott, supportResistance, prices, timeframe) {
    const trendScores = {
        상승: 0,
        하락: 0,
        횡보: 0
    };

    // 1. 기본 지표 분석 (가중치 2)
    const { rsi, macd, bb, stoch, obv, adx, maCross } = indicators;

    // RSI 분석
    if (rsi > 70) trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    else if (rsi < 30) trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    else if (rsi >= 45 && rsi <= 55) trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    else trendScores.횡보 += 1 * TREND_WEIGHTS.technical;

    // MACD 분석
    const macdDiff = Math.abs(macd.MACD - macd.signal);
    if (macdDiff < Math.abs(macd.signal * 0.1)) { // 10% 이내 차이면 횡보
        trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    } else if (macd.MACD > macd.signal) {
        trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    } else {
        trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    }

    // 볼린저 밴드 분석
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    if (bbWidth < 0.03) { // 3% 이내로 완화
        trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    } else if (bbWidth < 0.05) { // 5% 이내도 약한 횡보로 판단
        trendScores.횡보 += 1 * TREND_WEIGHTS.technical;
    } else if (macd.MACD > 0) {
        trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    } else {
        trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    }

    // 스토캐스틱 분석
    if (stoch.k > 80) trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    else if (stoch.k < 20) trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    else if (stoch.k >= 40 && stoch.k <= 60) trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    else trendScores.횡보 += 1 * TREND_WEIGHTS.technical;

    // OBV 분석 (횡보 조건 추가)
    if (Math.abs(obv) < 1000) { // OBV 변화가 작을 때 횡보로 판단
        trendScores.횡보 += 1 * TREND_WEIGHTS.technical;
    } else if (obv > 0) {
        trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    } else {
        trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    }

    // ADX 분석
    if (adx < 20) { // 20 미만일 때 강한 횡보
        trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    } else if (adx < 25) { // 25 미만일 때 약한 횡보
        trendScores.횡보 += 1 * TREND_WEIGHTS.technical;
    } else {
        if (macd.MACD > 0) trendScores.상승 += 1 * TREND_WEIGHTS.technical;
        else trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    }

    // 이평선 크로스 분석
    const maDiff = Math.abs(maCross.fast - maCross.slow);
    if (maDiff < maCross.slow * 0.02) { // 2% 이내 차이로 완화
        trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
    } else if (maDiff < maCross.slow * 0.03) { // 3% 이내도 약한 횡보로 판단
        trendScores.횡보 += 1 * TREND_WEIGHTS.technical;
    } else if (maCross.fast > maCross.slow) {
        trendScores.상승 += 1 * TREND_WEIGHTS.technical;
    } else {
        trendScores.하락 += 1 * TREND_WEIGHTS.technical;
    }

    // 2. 하모닉 패턴 분석 (가중치 5)
    const harmonicPatterns = Object.values(harmonic);
    const hasBuySignal = harmonicPatterns.some(pattern => pattern.includes('매수'));
    const hasSellSignal = harmonicPatterns.some(pattern => pattern.includes('매도'));
    
    if (hasBuySignal && !hasSellSignal) {
        trendScores.상승 += 1 * TREND_WEIGHTS.harmonic;
    } else if (!hasBuySignal && hasSellSignal) {
        trendScores.하락 += 1 * TREND_WEIGHTS.harmonic;
    } else if (hasBuySignal && hasSellSignal) {
        trendScores.횡보 += 1 * TREND_WEIGHTS.harmonic;
    }

    // 3. 일목구름표 분석 (가중치 6)
    const hasBullishSignal = ichimoku.signals.some(signal => 
        signal.includes('상향돌파') || 
        signal.includes('구름대 위') || 
        signal.includes('선행스팬 상향')
    );
    const hasBearishSignal = ichimoku.signals.some(signal => 
        signal.includes('하향돌파') || 
        signal.includes('구름대 아래') || 
        signal.includes('선행스팬 하향')
    );
    
    if (hasBullishSignal && !hasBearishSignal) {
        trendScores.상승 += 1 * TREND_WEIGHTS.ichimoku;
    } else if (!hasBullishSignal && hasBearishSignal) {
        trendScores.하락 += 1 * TREND_WEIGHTS.ichimoku;
    } else if (hasBullishSignal && hasBearishSignal) {
        trendScores.횡보 += 1 * TREND_WEIGHTS.ichimoku;
    }

    // 4. 엘리어트 파동 분석 (가중치 4)
    try {
        // 패턴 분석
        if (elliott?.pattern && typeof elliott.pattern === 'string') {
            if (elliott.pattern.includes('임펄스')) {
                trendScores.상승 += 1 * TREND_WEIGHTS.elliott;
            } else if (elliott.pattern.includes('조정')) {
                trendScores.하락 += 1 * TREND_WEIGHTS.elliott;
            } else {
                trendScores.횡보 += 1 * TREND_WEIGHTS.elliott;
            }
        }

        // 현재 파동 분석
        const currentWave = elliott?.currentWave;
        if (currentWave && typeof currentWave === 'object') {
            // 현재 파동 단계 분석
            const phase = currentWave.currentPhase;
            if (phase && typeof phase === 'string') {
                if (phase === '상승 파동 진행 중' || phase === '상승 5파 완성 후 조정 국면') {
                    trendScores.상승 += 1 * TREND_WEIGHTS.elliott;
                } else if (phase === '하락 파동 진행 중' || phase === '하락 5파 완성 후 조정 국면') {
                    trendScores.하락 += 1 * TREND_WEIGHTS.elliott;
                }
            }

            // 다음 예상 파동 분석
            const nextWave = currentWave.nextExpectedWave;
            if (nextWave && typeof nextWave === 'string') {
                if (nextWave === '상승' || nextWave === '상승 A-B-C') {
                    trendScores.상승 += 1 * TREND_WEIGHTS.elliott;
                } else if (nextWave === '하락' || nextWave === '하락 A-B-C') {
                    trendScores.하락 += 1 * TREND_WEIGHTS.elliott;
                }
            }
        }

        // 파동 배열 분석
        const waves = elliott?.waves;
        if (waves && Array.isArray(waves) && waves.length > 0) {
            const lastWave = waves[waves.length - 1];
            if (lastWave?.type && typeof lastWave.type === 'string') {
                if (lastWave.type === 'up') {
                    trendScores.상승 += 1 * TREND_WEIGHTS.elliott;
                } else if (lastWave.type === 'down') {
                    trendScores.하락 += 1 * TREND_WEIGHTS.elliott;
                }
            }
        }
    } catch (error) {
        console.log('엘리어트 파동 분석 중 에러:', error.message);
        // 에러 발생 시 엘리어트 파동 분석은 건너뛰고 계속 진행
    }

    // 5. 피보나치 분석
    const fibonacci = analyzeFibonacciRatios(prices);
    if (fibonacci.currentLevel) {
        if (fibonacci.currentLevel.ratio <= 0.382) {
            trendScores.상승 += 2 * TREND_WEIGHTS.technical;
        } else if (fibonacci.currentLevel.ratio >= 0.618) {
            trendScores.하락 += 2 * TREND_WEIGHTS.technical;
        } else if (fibonacci.currentLevel.ratio === 0.5) {
            trendScores.횡보 += 2 * TREND_WEIGHTS.technical;
        }
        
        // 다음 레벨까지의 거리 분석
        if (fibonacci.nextLevel) {
            const distanceToNext = (fibonacci.nextLevel.price - prices[prices.length - 1].close) / prices[prices.length - 1].close;
            if (distanceToNext < 0.01) { // 다음 레벨에 근접
                if (fibonacci.nextLevel.ratio > fibonacci.currentLevel.ratio) {
                    trendScores.상승 += 1 * TREND_WEIGHTS.technical;
                } else {
                    trendScores.하락 += 1 * TREND_WEIGHTS.technical;
                }
            }
        }
    }

    // 최종 추세 결정
    const maxScore = Math.max(...Object.values(trendScores));
    const finalTrend = Object.entries(trendScores)
        .find(([_, score]) => score === maxScore)[0];

    // 추세 강도 계산
    const totalScore = Object.values(trendScores).reduce((a, b) => a + b, 0);
    let trendStrength = 0;
    
    if (totalScore > 0) {
        // 기본 강도 계산 (최대 점수 / 총 점수)
        const baseStrength = (maxScore / totalScore) * 100;
        
        // 시간대별 가중치 적용
        const timeframeWeight = TREND_WEIGHTS.timeframe[timeframe] || 1;
        const maxTimeframeWeight = Math.max(...Object.values(TREND_WEIGHTS.timeframe));
        
        // 최종 강도 계산 (0-100 범위로 제한)
        trendStrength = Math.min(100, Math.max(0, 
            (baseStrength * timeframeWeight / maxTimeframeWeight)
        )).toFixed(1);
    }

    return {
        trend: finalTrend,
        strength: trendStrength,
        scores: trendScores,
        fibonacci: {
            currentLevel: fibonacci.currentLevel,
            nextLevel: fibonacci.nextLevel,
            prevLevel: fibonacci.prevLevel
        }
    };
}

// 피보나치 비율 분석 함수
function analyzeFibonacciRatios(prices) {
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    
    // 최근 20개 캔들의 고점과 저점 찾기
    const recentHighs = highs.slice(-20);
    const recentLows = lows.slice(-20);
    
    const maxHigh = Math.max(...recentHighs);
    const minLow = Math.min(...recentLows);
    const currentPrice = prices[prices.length - 1].close;
    
    // 피보나치 레벨 계산
    const range = maxHigh - minLow;
    const levels = {
        0: minLow,
        0.236: minLow + range * 0.236,
        0.382: minLow + range * 0.382,
        0.5: minLow + range * 0.5,
        0.618: minLow + range * 0.618,
        0.786: minLow + range * 0.786,
        1: maxHigh
    };
    
    // 현재 가격이 어느 레벨에 있는지 확인
    let currentLevel = null;
    let nextLevel = null;
    let prevLevel = null;
    
    const levelEntries = Object.entries(levels);
    
    // 현재 가격이 최저점보다 낮은 경우
    if (currentPrice <= minLow) {
        currentLevel = { ratio: 0, price: minLow };
        nextLevel = {
            ratio: parseFloat(levelEntries[1][0]),
            price: levelEntries[1][1]
        };
    }
    // 현재 가격이 최고점보다 높은 경우
    else if (currentPrice >= maxHigh) {
        currentLevel = { ratio: 1, price: maxHigh };
        prevLevel = {
            ratio: parseFloat(levelEntries[levelEntries.length - 2][0]),
            price: levelEntries[levelEntries.length - 2][1]
        };
    }
    // 현재 가격이 레벨 사이에 있는 경우
    else {
        for (let i = 0; i < levelEntries.length - 1; i++) {
            const [currentRatio, currentPrice] = levelEntries[i];
            const [nextRatio, nextPrice] = levelEntries[i + 1];
            
            if (currentPrice <= prices[prices.length - 1].close && prices[prices.length - 1].close < nextPrice) {
                currentLevel = {
                    ratio: parseFloat(currentRatio),
                    price: currentPrice
                };
                nextLevel = {
                    ratio: parseFloat(nextRatio),
                    price: nextPrice
                };
                if (i > 0) {
                    prevLevel = {
                        ratio: parseFloat(levelEntries[i - 1][0]),
                        price: levelEntries[i - 1][1]
                    };
                }
                break;
            }
        }
    }
    
    return {
        levels,
        currentLevel,
        nextLevel,
        prevLevel,
        range
    };
}

export {
    analyzeOverallTrend
}; 