# Predictive Traffic Forecasting ML Engine

This module implements the 15-minute, 30-minute, and 45-minute congestion forecasting engine for **Route Wise (Team Cyber Knight)**.

## Public Open-Source Repository Used
- **GitHub Repository**: [https://github.com/zemlyansky/arima](https://github.com/zemlyansky/arima)
- **NPM Package**: `arima` (`npm install arima`)
- **Author**: Anton Zemlyansky
- **License**: MIT
- **Architecture**: WebAssembly (WASM) accelerated Autoregressive Integrated Moving Average (ARIMA) & SARIMA model.

## Model Parameters & Methodology
1. **Model Order**: `ARIMA(p=1, d=0, q=1)`
   - $p=1$: First-order autoregression capturing immediate corridor momentum and junction queues.
   - $d=0$: Integrated differencing on velocity state space.
   - $q=1$: First-order moving average smoothing short-term GPS sensor noise.
2. **Historical Context Window**: 12 sliding time-steps ($T - 180\text{ min}$ to $T_0$ in 15-minute intervals).
3. **Diurnal Scaling & BPR Function**:
   - Continuous diurnal volume curves modeling urban Indian peak hours (08:00–10:00 & 17:00–19:30).
   - Non-linear Bureau of Public Roads (BPR) impedance calculation to estimate transit slowdowns:
     $$T_{\text{predicted}} = T_{\text{free}} \times \left(1 + \alpha \cdot \left(\frac{V}{C}\right)^\beta\right)$$
4. **Multi-Horizon Output**:
   - `0 min (Live)`
   - `+15 min (Target Horizon)`
   - `+30 min (Mid Horizon)`
   - `+45 min (Extended Horizon)`

## Verification
Run tests anytime from the server root:
```bash
npm test
```
