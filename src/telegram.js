import TelegramBot from 'node-telegram-bot-api';

// 텔레그램 봇 설정
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// 정확도 메시지 전송 함수
export async function sendAccuracyMessage({ accuracyStats, currentPrediction, actualTrend, priceChange }) {
    // 정확도 메시지 생성
    let accuracyMessage = `\n*예측 정확도 분석 (30분봉 기준)*\n`;
    accuracyMessage += `• 예측: ${currentPrediction.predictedTrend}\n`;
    accuracyMessage += `• 실제: ${actualTrend}\n`;
    accuracyMessage += `• 가격 변동: ${priceChange.toFixed(2)}%\n`;
    accuracyMessage += `• 결과: ${currentPrediction.predictedTrend === actualTrend ? '✅ 정확' : '❌ 부정확'}\n\n`;
    
    // 누적 통계 메시지 추가
    accuracyMessage += `*누적 예측 통계*\n`;
    accuracyMessage += `• 총 예측: ${accuracyStats.total}회\n`;
    accuracyMessage += `• 정확: ${accuracyStats.correct}회\n`;
    accuracyMessage += `• 부정확: ${accuracyStats.incorrect}회\n`;
    accuracyMessage += `• 정확도: ${accuracyStats.accuracy}%\n`;
    
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, accuracyMessage, { parse_mode: 'Markdown' });
}

// 추세 분석 메시지 전송 함수
export async function sendTrendAnalysisMessage({ 
    symbol,
    timeFrameTrends,
    weightedTrends,
    dominantTrend,
    currentPrice,
    indicators,
    harmonic,
    ichimoku,
    elliott
}) {
    let message = `*${symbol} 추세 분석*(스윙 전략)\n\n`;

    // 각 시간대별 분석 결과 추가
    for (const [timeFrame, data] of Object.entries(timeFrameTrends)) {
        const trendIcon = data.trend === '상승' ? '📈' : data.trend === '하락' ? '📉' : '⚖️';
        message += `*--${timeFrame} ${trendIcon} (가중치: ${data.weight})*\n`;
        message += `• 종합 추세: *${data.trend}* (강도: ${data.strength}%)\n\n`;
        
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
        message += `• 일목구름표: ${ichimoku.signals.join(', ') || '없음'}\n`;
        message += `• 엘리어트 파동: ${elliott.pattern || '없음'}\n`;
        if (elliott.currentWave) {
            message += `  - 현재 단계: ${elliott.currentWave.currentPhase}\n`;
            message += `  - 예상 다음 파동: *${elliott.currentWave.nextExpectedWave}*\n\n`;
        }
    }

    // 추세에 따른 이모지 선택
    let overallEmoji = '';
    if (dominantTrend === '상승') overallEmoji = '📈';
    else if (dominantTrend === '하락') overallEmoji = '📉';
    else overallEmoji = '⚖️';

    message += `\n*종합 추세 분석 ${overallEmoji}*\n`;

    // 각 점수 출력 (가장 높은 점수는 추가 강조)
    const maxWeightedScore = Math.max(weightedTrends['상승'], weightedTrends['하락'], weightedTrends['횡보']);
    Object.entries(weightedTrends).forEach(([trend, score]) => {
        const emoji = trend === '상승' ? '📈' : trend === '하락' ? '📉' : '⚖️';
        const scoreText = score === maxWeightedScore ? `${score}점⭐️` : `${score}점`;
        message += `${emoji} ${trend}: *${scoreText}*\n`;
    });

    console.log(`텔레그램으로 알림 전송: ${message}`);
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
} 