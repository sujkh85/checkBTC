import axios from 'axios';
import { API_SETTINGS } from '../settings.js';

const { OKX_API_URL, SYMBOL } = API_SETTINGS;

/**
 * OKX에서 가격 데이터를 가져오는 함수
 * @param {Object} timeFrame - 시간대 설정
 * @param {string} timeFrame.name - 시간대 이름 (예: '30분봉')
 * @param {string} timeFrame.interval - 시간대 간격 (예: '30m')
 * @param {number} timeFrame.limit - 가져올 캔들 개수
 * @returns {Promise<Array|null>} 가격 데이터 배열 또는 null
 */
export async function getPriceData(timeFrame) {
  try {
    console.log(`OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 요청 중...`);
    const response = await axios.get(
      `${OKX_API_URL}/market/candles?instId=${SYMBOL}&bar=${timeFrame.interval}&limit=${timeFrame.limit}`
    );
    const prices = response.data.data.map((candle) => ({
      timestamp: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
    console.log(
      `OKX에서 ${SYMBOL} ${timeFrame.name} 데이터 수신 완료 (${prices.length}개 캔들)`
    );
    return prices;
  } catch (error) {
    console.error(`${timeFrame.name} 데이터 가져오기 실패:`, error.message);
    return null;
  }
}
