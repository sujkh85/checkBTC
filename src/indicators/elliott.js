// 파동 식별 함수
function identifyWaves(closes) {
    const waves = [];
    let currentWave = {
        type: null,
        start: 0,
        end: 0,
        high: closes[0],
        low: closes[0]
    };

    for (let i = 1; i < closes.length; i++) {
        const price = closes[i];
        
        // 상승 파동 식별
        if (price > currentWave.high) {
            if (currentWave.type === 'down') {
                waves.push({...currentWave});
                currentWave = {
                    type: 'up',
                    start: i - 1,
                    end: i,
                    high: price,
                    low: currentWave.low
                };
            } else {
                currentWave.type = 'up';
                currentWave.end = i;
                currentWave.high = price;
            }
        }
        // 하락 파동 식별
        else if (price < currentWave.low) {
            if (currentWave.type === 'up') {
                waves.push({...currentWave});
                currentWave = {
                    type: 'down',
                    start: i - 1,
                    end: i,
                    high: currentWave.high,
                    low: price
                };
            } else {
                currentWave.type = 'down';
                currentWave.end = i;
                currentWave.low = price;
            }
        }
    }
    
    if (currentWave.type) {
        waves.push(currentWave);
    }
    
    return waves;
}

// 파동 패턴 분석
function analyzeWavePattern(waves) {
    if (waves.length < 5) return '파동 패턴 불충분';

    const recentWaves = waves.slice(-5);
    const pattern = recentWaves.map(wave => wave.type).join('-');
    
    // 임펄스 파동 (상승 5파)
    if (pattern === 'up-up-down-up-up') {
        return '임펄스 상승 5파 완성';
    }
    // 하락 5파
    else if (pattern === 'down-down-up-down-down') {
        return '임펄스 하락 5파 완성';
    }
    // 조정 파동 (A-B-C)
    else if (pattern === 'down-up-down' || pattern === 'up-down-up') {
        return '조정 파동 A-B-C 완성';
    }
    
    return '파동 패턴 진행 중';
}

// 현재 파동 분석
function analyzeCurrentWave(waves) {
    if (waves.length === 0) return '파동 데이터 없음';
    
    const lastWave = waves[waves.length - 1];
    const waveCount = waves.length;
    
    let analysis = {
        currentPhase: null,
        nextExpectedWave: null,
        potentialTarget: null
    };
    
    // 5파 완성 후 조정 국면
    if (waveCount >= 5 && waves[waveCount-1].type === 'up') {
        analysis.currentPhase = '상승 5파 완성 후 조정 국면';
        analysis.nextExpectedWave = '하락 A-B-C';
    }
    else if (waveCount >= 5 && waves[waveCount-1].type === 'down') {
        analysis.currentPhase = '하락 5파 완성 후 조정 국면';
        analysis.nextExpectedWave = '상승 A-B-C';
    }
    // 진행 중인 파동
    else {
        const lastType = lastWave.type;
        analysis.currentPhase = `${lastType === 'up' ? '상승' : '하락'} 파동 진행 중`;
        analysis.nextExpectedWave = lastType === 'up' ? '상승' : '하락';
        
        // 피보나치 목표가 계산
        if (waves.length >= 2) {
            const prevWave = waves[waves.length - 2];
            const waveHeight = Math.abs(prevWave.high - prevWave.low);
            analysis.potentialTarget = lastType === 'up' 
                ? lastWave.high + waveHeight * 0.618
                : lastWave.low - waveHeight * 0.618;
        }
    }
    
    return analysis;
}

// 엘리어트 파동 분석 함수
function analyzeElliottWave(prices) {
    const closes = prices.map(p => p.close);
    
    // 파동 식별
    const waves = identifyWaves(closes);
    
    // 파동 패턴 분석
    const pattern = analyzeWavePattern(waves);
    
    // 현재 파동 분석
    const currentWave = analyzeCurrentWave(waves);
    
    return {
        waves,
        pattern,
        currentWave
    };
}

module.exports = {
    analyzeElliottWave
}; 