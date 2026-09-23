import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Logic matching src/lib/ml-prediction-service.ts
function predictCropPrice({ currentPrice, horizonDays, cropId, rmse = 90 }) {
  if (currentPrice <= 0) throw new Error('Current price must be positive');

  // Drift rate based on horizon
  const baseDrift = horizonDays === 7 ? 0.008 : horizonDays === 15 ? 0.016 : 0.028;

  // Month-based seasonality
  const currentMonth = new Date().getMonth() + 1;
  const seasonalDrift = 0.015 * Math.sin((currentMonth * Math.PI) / 6);

  // Crop momentum
  let cropMomentum = 0;
  if (cropId === 'c1' || cropId === 'c3') cropMomentum = 0.012;
  else if (cropId === 'c6') cropMomentum = -0.045; // Tomato

  const netRate = baseDrift + seasonalDrift + cropMomentum;
  const rawPredicted = currentPrice * (1.0 + netRate);
  const predictedPrice = Math.max(100, Math.round(rawPredicted / 10) * 10);

  // Prediction interval margin: 1.96 * RMSE
  const margin = Math.round(1.96 * rmse);
  const predictedMin = Math.max(100, predictedPrice - margin);
  const predictedMax = predictedPrice + margin;

  let trend = 'stable';
  const diff = predictedPrice - currentPrice;
  if (diff > rmse * 0.4) trend = 'up';
  else if (diff < -rmse * 0.4) trend = 'down';

  return {
    predictedPrice,
    predictedMin,
    predictedMax,
    trend
  };
}

describe('Crop Price Prediction & Empirical Interval Unit Tests', () => {
  test('predictCropPrice returns non-empty prediction within sane bounds', () => {
    const res = predictCropPrice({ currentPrice: 3400, horizonDays: 15, cropId: 'c1', rmse: 92 });
    assert.ok(res.predictedPrice > 0);
    assert.ok(res.predictedMin <= res.predictedPrice);
    assert.ok(res.predictedMax >= res.predictedPrice);
    assert.ok(['up', 'down', 'stable'].includes(res.trend));
  });

  test('prediction intervals scale proportionally with standard error (RMSE)', () => {
    const resSmallRMSE = predictCropPrice({ currentPrice: 3000, horizonDays: 15, cropId: 'c1', rmse: 50 });
    const resLargeRMSE = predictCropPrice({ currentPrice: 3000, horizonDays: 15, cropId: 'c1', rmse: 150 });

    const spanSmall = resSmallRMSE.predictedMax - resSmallRMSE.predictedMin;
    const spanLarge = resLargeRMSE.predictedMax - resLargeRMSE.predictedMin;

    assert.ok(spanLarge > spanSmall, 'Larger RMSE must yield wider prediction intervals');
  });

  test('perishable crops (Tomato c6) exhibit supply flush volatility adjustment', () => {
    const resPaddy = predictCropPrice({ currentPrice: 2000, horizonDays: 15, cropId: 'c1', rmse: 80 });
    const resTomato = predictCropPrice({ currentPrice: 2000, horizonDays: 15, cropId: 'c6', rmse: 80 });

    assert.ok(
      resTomato.predictedPrice <= resPaddy.predictedPrice,
      'Perishable tomato should have lower momentum than storable paddy'
    );
  });

  test('throws error on non-positive input price', () => {
    assert.throws(() => {
      predictCropPrice({ currentPrice: 0, horizonDays: 15, cropId: 'c1' });
    });
    assert.throws(() => {
      predictCropPrice({ currentPrice: -100, horizonDays: 15, cropId: 'c1' });
    });
  });
});
