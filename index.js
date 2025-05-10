require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { SMA, RSI, MACD, BollingerBands, Stochastic, OBV, ADX, EMA } = require('technicalindicators');
const { analyzeHarmonicPattern } = require('./indicators/harmonic');
const { analyzeIchimoku } = require('./indicators/ichimoku');
const { analyzeElliottWave } = require('./indicators/elliott');
const { analyzeSupportResistance } = require('./indicators/supportResistance');
const { analyzeOverallTrend } = require('./indicators/trendAnalysis');

// 텔레그램 봇 설정
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// OKX API 엔드포인트
const OKX_API_URL = 'https://www.okx.com/api/v5';
const SYMBOL = 'BTC-USDT';

// 지표 가중치 설정
const INDICATOR_WEIGHTS = {
    technical: 4,   // 기본 기술적 지표 가중치 증가
    harmonic: 3,    // 하모닉 패턴 가중치 감소
    ichimoku: 5,    // 일목구름표 가중치 증가
    elliott: 4      // 엘리어트 파동 가중치 유지
};

// 시간대별 설정
const TIME_FRAMES = [
    { name: '1분봉', interval: '1m', limit: 200, weight: 1 },  // 낮은 가중치 - 참고용
    { name: '5분봉', interval: '5m', limit: 200, weight: 2 },  // 중간 가중치 - 단기 방향성
    { name: '30분봉', interval: '30m', limit: 200, weight: 4 },  // 가장 높은 가중치 - 스윙의 핵심
    { name: '1시간봉', interval: '1H', limit: 200, weight: 3 },  // 높은 가중치 - 중기 추세
    { name: '4시간봉', interval: '4H', limit: 200, weight: 2 },  // 중간 가중치 - 장기 추세
    { name: '12시간봉', interval: '12H', limit: 200, weight: 2 },  // 중간 가중치 - 장기 추세
    { name: '1일봉', interval: '1D', limit: 200, weight: 2 }  // 중간 가중치 - 장기 추세
];

// 이평선 기간 설정
const MA_PERIODS = {
    short: [10, 20, 50],    // 단기 이평선 기간 증가
    medium: [100, 120, 200], // 중기 이평선 기간 증가
    long: [200, 300]        // 장기 이평선 추가
};

// 기술적 지표 설정
const rsiPeriod = 14;       // RSI 기간 유지
const macdSettings = {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
};
const bbSettings = {
    period: 20,
    stdDev: 2
};
const stochSettings = {
    period: 14,
    signalPeriod: 3
};
const adxSettings = {
    period: 14
};
const maSettings = {
    fastPeriod: 20,         // 단기 이평선 기간 증가
    slowPeriod: 50          // 장기 이평선 기간 증가
};

// 이전 추세 점수를 저장할 변수
let previousWeightedTrends = null;

// 가격 데이터를 가져오는 함수
async function getPriceData(timeFrame) {
    try {
        console.log(`OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 요청 중...`);
        const response = await axios.get(
            `${OKX_API_URL}/market/candles?instId=${SYMBOL}&bar=${timeFrame.interval}&limit=${timeFrame.limit}`
        );
        const prices = response.data.data.map(candle => ({
            timestamp: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
        }));
        console.log(`OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 수신 완료 (${prices.length}개 캔들)`);
        return prices;
    } catch (error) {
        console.error(`${timeFrame.name} 데이터 가져오기 실패:`, error.message);
        return null;
    }
}

// 기술적 지표 계산 함수
function calculateIndicators(prices) {
    const closes = prices.map(p => p.close);
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    const volumes = prices.map(p => p.volume);
    
    // 이평선 계산
    const movingAverages = {};
    
    // 단기 이평선
    MA_PERIODS.short.forEach(period => {
        movingAverages[`ma${period}`] = calculateMA(closes, period);
    });
    
    // 중기 이평선
    MA_PERIODS.medium.forEach(period => {
        if (closes.length >= period) {
            movingAverages[`ma${period}`] = calculateMA(closes, period);
        }
    });
    
    // 장기 이평선
    MA_PERIODS.long.forEach(period => {
        if (closes.length >= period) {
            movingAverages[`ma${period}`] = calculateMA(closes, period);
        }
    });
    
    // RSI 계산
    const rsi = RSI.calculate({
        values: closes,
        period: rsiPeriod
    });
    
    // MACD 계산
    const macd = MACD.calculate({
        values: closes,
        ...macdSettings
    });
    
    // 볼린저 밴드 계산
    const bb = BollingerBands.calculate({
        values: closes,
        ...bbSettings
    });

    // 스토캐스틱 계산
    const stoch = Stochastic.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: stochSettings.period,
        signalPeriod: stochSettings.signalPeriod
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
        period: adxSettings.period
    });

    // 이평선 크로스 계산
    const fastMA = SMA.calculate({
        values: closes,
        period: maSettings.fastPeriod
    });
    const slowMA = SMA.calculate({
        values: closes,
        period: maSettings.slowPeriod
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

// 추세 판단 함수
function determineTrend(indicators) {
    const { rsi, macd, bb, stoch, obv, adx, maCross } = indicators;
    
    // RSI 기반 판단 (스윙에 맞게 민감도 감소)
    const rsiTrend = rsi > 60 ? '상승' : rsi < 40 ? '하락' : '횡보';
    
    // MACD 기반 판단 (중기 추세 강조)
    const macdDiff = Math.abs(macd.MACD - macd.signal);
    const macdTrend = macdDiff < 0.1 ? '횡보' : 
                     (macd.MACD > macd.signal ? '상승' : '하락');
    
    // 볼린저 밴드 기반 판단 (중기 변동성 강조)
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    const currentPrice = bb.middle;
    const bbTrend = bbWidth < 0.02 ? '횡보' : 
                   (currentPrice > bb.upper ? '상승' : 
                   (currentPrice < bb.lower ? '하락' : '횡보'));

    // 스토캐스틱 기반 판단 (중기 변동성 강조)
    const stochTrend = stoch.k > 80 ? '상승' : stoch.k < 20 ? '하락' : '횡보';

    // OBV 기반 판단 (중기 거래량 강조)
    const obvTrend = obv > 0 ? '상승' : '하락';

    // ADX 기반 판단 (중기 추세 강도 강조)
    const adxTrend = adx > 25 ? 
                    (macd.MACD > macd.signal ? '상승' : '하락') : 
                    '횡보';

    // 이평선 크로스 기반 판단 (중기 변동성 강조)
    const maDiff = Math.abs(maCross.fast - maCross.slow);
    const maCrossTrend = maDiff < maCross.slow * 0.02 ? '횡보' : 
                        (maCross.fast > maCross.slow ? '상승' : '하락');
    
    // 종합 판단 (중기 지표에 더 높은 가중치)
    const trends = [
        rsiTrend,           // 1배 가중치
        macdTrend,          // 2배 가중치
        bbTrend,            // 1.5배 가중치
        stochTrend,         // 1배 가중치
        obvTrend,           // 1.5배 가중치
        adxTrend,           // 2배 가중치
        maCrossTrend        // 2배 가중치
    ];
    
    // 가중치 적용
    const weightedTrends = {
        '상승': 0,
        '하락': 0,
        '횡보': 0
    };
    
    // 가중치 적용
    trends.forEach((trend, index) => {
        const weight = index === 1 || index === 5 || index === 6 ? 2 : 
                      index === 2 || index === 4 ? 1.5 : 1;
        weightedTrends[trend] += weight;
    });
    
    // 가장 높은 가중치를 가진 추세 반환
    return Object.entries(weightedTrends)
        .sort((a, b) => b[1] - a[1])[0][0];
}

// 가격 정보를 가져오고 알림을 보내는 함수
async function checkPriceAndNotify() {
    try {
        const timeFrameTrends = {};
        let message = `*${SYMBOL} 추세 분석*(스윙 전략)\n\n`;

        // 각 시간대별로 분석
        for (const timeFrame of TIME_FRAMES) {
            const prices = await getPriceData(timeFrame);
            if (!prices || prices.length === 0) continue;

            const currentPrice = prices[prices.length - 1].close;
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

            // 추세 아이콘 선택
            const trendIcon = trend.trend === '상승' ? '📈' : trend.trend === '하락' ? '📉' : '⚖️';
            
            // 시간대별 메시지 추가
            message += `*--${timeFrame.name} ${trendIcon} (가중치: ${timeFrame.weight})*\n`;
            message += `• 종합 추세: *${trend.trend}* (강도: ${trend.strength}%)\n\n`;
            
            // 지표별 상세 정보 추가
            message += `*🔍 지표별 분석*\n`;
            message += `• RSI: ${indicators.rsi.toFixed(2)} (${indicators.rsi > 70 ? '과매수' : indicators.rsi < 30 ? '과매도' : '중립'})\n`;
            
            // 이평선 크로스 분석
            const maDiff = Math.abs(indicators.maCross.fast - indicators.maCross.slow);
            const maDiffPercent = (maDiff / indicators.maCross.slow * 100).toFixed(2);
            if (maDiffPercent < 0.5) {
                message += `• 이평선 크로스: *골든크로스 임박* (차이: ${maDiffPercent}%)\n`;
            } else if (maDiffPercent < 1.0) {
                message += `• 이평선 크로스: *데드크로스 임박* (차이: ${maDiffPercent}%)\n`;
            }

            // 패턴 분석 정보 추가
            message += `*🔍 패턴 분석*\n`;
            const harmonicPatterns = Object.values(harmonic).filter(v => v && v.indexOf('없음') === -1);
            if (harmonicPatterns.length > 0) {
                message += `• 하모닉 패턴: ${harmonicPatterns.join(', ')}\n`;
            }
            console.log(harmonicPatterns);
            message += `• 일목구름표: ${ichimoku.signals.join(', ') || '없음'}\n`;
            message += `• 엘리어트 파동: ${elliott.pattern || '없음'}\n`;
            if (elliott.currentWave) {
                message += `  - 현재 단계: ${elliott.currentWave.currentPhase}\n`;
                message += `  - 예상 다음 파동: *${elliott.currentWave.nextExpectedWave}*\n\n`;
            }

            // 시간대별 추세 저장
            timeFrameTrends[timeFrame.interval] = {
                trend: trend.trend,
                strength: trend.strength,
                weight: timeFrame.weight
            };
        }

        // 가중치를 고려한 종합 추세 판단
        const weightedTrends = {
            '상승': 0,
            '하락': 0,
            '횡보': 0
        };

        for (const [name, data] of Object.entries(timeFrameTrends)) {
            weightedTrends[data.trend] += data.weight;
        }

        // 이전 추세와 비교
        if (previousWeightedTrends) {
            // 모든 점수가 동일한지 확인
            const isAllScoresEqual = previousWeightedTrends['상승'] === weightedTrends['상승'] && 
                                   previousWeightedTrends['하락'] === weightedTrends['하락'] && 
                                   previousWeightedTrends['횡보'] === weightedTrends['횡보'];
            
            if (isAllScoresEqual) {
                console.log('모든 추세 점수가 동일하여 메시지를 보내지 않습니다.');
                previousWeightedTrends = weightedTrends;
                return;
            }
        }
        
        // 가장 높은 점수 찾기
        const maxWeightedScore = Math.max(weightedTrends['상승'], weightedTrends['하락'], weightedTrends['횡보']);
        const dominantTrend = Object.entries(weightedTrends)
            .find(([_, score]) => score === maxWeightedScore)[0];
        
        // 추세에 따른 이모지 선택
        let overallEmoji = '';
        if (dominantTrend === '상승') overallEmoji = '📈';
        else if (dominantTrend === '하락') overallEmoji = '📉';
        else overallEmoji = '⚖️';

        message += `\n*종합 추세 분석 ${overallEmoji}*\n`;

        // 각 점수 출력 (가장 높은 점수는 추가 강조)
        Object.entries(weightedTrends).forEach(([trend, score]) => {
            const emoji = trend === '상승' ? '📈' : trend === '하락' ? '📉' : '⚖️';
            const scoreText = score === maxWeightedScore ? `${score}점⭐️` : `${score}점`;
            message += `${emoji} ${trend}: *${scoreText}*\n`;
        });

        console.log(`텔레그램으로 알림 전송: ${message}`);
        await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });

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

const time = 60000 * 5;

// 5분마다 가격을 확인
setInterval(checkPriceAndNotify, time);