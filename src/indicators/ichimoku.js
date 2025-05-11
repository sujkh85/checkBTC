import { analyzeIchimokuSignals } from './ichimokuSignals.js';

// 전환선 계산
function calculateConversionLine(highs, lows) {
    const period = 9;
    const high = Math.max(...highs.slice(-period));
    const low = Math.min(...lows.slice(-period));
    return (high + low) / 2;
}

// 기준선 계산
function calculateBaseLine(highs, lows) {
    const period = 26;
    const high = Math.max(...highs.slice(-period));
    const low = Math.min(...lows.slice(-period));
    return (high + low) / 2;
}

// 선행스팬 A 계산
function calculateLeadingSpanA(conversionLine, baseLine) {
    return (conversionLine + baseLine) / 2;
}

// 선행스팬 B 계산
function calculateLeadingSpanB(highs, lows) {
    const period = 52;
    const high = Math.max(...highs.slice(-period));
    const low = Math.min(...lows.slice(-period));
    return (high + low) / 2;
}

// 후행스팬 계산
function calculateLaggingSpan(closes) {
    return closes[closes.length - 26];
}

// 일목구름표 분석 함수
function analyzeIchimoku(prices) {
    const closes = prices.map(p => p.close);
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    
    // 전환선 (Tenkan-sen)
    const conversionLine = calculateConversionLine(highs, lows);
    
    // 기준선 (Kijun-sen)
    const baseLine = calculateBaseLine(highs, lows);
    
    // 선행스팬 1 (Senkou Span A)
    const leadingSpanA = calculateLeadingSpanA(conversionLine, baseLine);
    
    // 선행스팬 2 (Senkou Span B)
    const leadingSpanB = calculateLeadingSpanB(highs, lows);
    
    // 후행스팬 (Chikou Span)
    const laggingSpan = calculateLaggingSpan(closes);

    // 매매 신호 분석
    const signalAnalysis = analyzeIchimokuSignals(
        closes[closes.length - 1],
        conversionLine,
        baseLine,
        leadingSpanA,
        leadingSpanB,
        laggingSpan
    );

    return {
        conversionLine,
        baseLine,
        leadingSpanA,
        leadingSpanB,
        laggingSpan,
        signals: signalAnalysis.signals,
        strongSignals: signalAnalysis.strongSignals,
        trend: signalAnalysis.trend
    };
}

export { analyzeIchimoku }; 