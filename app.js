// GearCalc - Live Calculation Engine

const DOM = {
  priceUsd: document.getElementById('price-usd'),
  shippingUsd: document.getElementById('shipping-usd'),
  domesticKrw: document.getElementById('domestic-krw'),
  exchangeRate: document.getElementById('exchange-rate'),
  forwardingUsd: document.getElementById('forwarding-usd'),
  platformFee: document.getElementById('platform-fee'),
  headerRate: document.getElementById('header-rate'),
  
  // Displays
  customsBadge: document.getElementById('customs-badge'),
  customsDesc: document.getElementById('customs-desc'),
  netMarginDisplay: document.getElementById('net-margin-display'),
  marginRateDisplay: document.getElementById('margin-rate-display'),
  decisionBadge: document.getElementById('decision-badge'),
  itemSubtotalDisplay: document.getElementById('item-subtotal-display'),
  taxDisplay: document.getElementById('tax-display'),
  forwardingDisplay: document.getElementById('forwarding-display'),
  feeDisplay: document.getElementById('fee-display'),
  totalCostDisplay: document.getElementById('total-cost-display'),
  breakevenDisplay: document.getElementById('breakeven-display'),
  copyToast: document.getElementById('copy-toast'),
};

function formatKrw(num) {
  return Math.round(num).toLocaleString('ko-KR') + '원';
}

function formatUsd(num) {
  return '$' + Number(num).toFixed(2);
}

function calculate() {
  const price = parseFloat(DOM.priceUsd.value) || 0;
  const shipping = parseFloat(DOM.shippingUsd.value) || 0;
  const domestic = parseFloat(DOM.domesticKrw.value) || 0;
  const rate = parseFloat(DOM.exchangeRate.value) || 1360;
  const forwarding = parseFloat(DOM.forwardingUsd.value) || 0;
  const feeRate = parseFloat(DOM.platformFee.value) || 0;

  DOM.headerRate.textContent = rate.toLocaleString('ko-KR') + '원';

  // 미국 내 총 결제액
  const usSubtotal = price + shipping;

  // 관부가세 계산
  let taxRate = 0;
  let taxLabel = '';
  let taxDesc = '';

  if (usSubtotal <= 200.0) {
    taxRate = 0.0;
    taxLabel = '면세 ($200 이하)';
    taxDesc = '미국 직구 $200 이하(상품+미국배송비)로 한미 FTA 목록통관 전액 면세 대상입니다.';
    DOM.customsBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/80 border border-emerald-800/60 text-emerald-300';
  } else if (usSubtotal <= 1000.0) {
    taxRate = 0.10;
    taxLabel = '부가세 10% ($200~$1,000)';
    taxDesc = '미국 직구 $200 초과 $1,000 이하로 한미 FTA 원산지 인정 시 관세 면제 후 부가세 10%만 부과됩니다.';
    DOM.customsBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-950/80 border border-blue-800/60 text-blue-300';
  } else {
    taxRate = 0.188;
    taxLabel = '관부가세 18.8% ($1,000 초과)';
    taxDesc = '$1,000 초과 고가품으로 기본 관세(8%) 및 부가세(10%)가 합산 부과됩니다.';
    DOM.customsBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-950/80 border border-amber-800/60 text-amber-300';
  }

  DOM.customsBadge.textContent = taxLabel;
  DOM.customsDesc.textContent = taxDesc;

  const taxUsd = usSubtotal * taxRate;
  const taxKrw = Math.round(taxUsd * rate);

  // 총 조달원가 (해외결제액 + 관세 + 배대지)
  const totalCostUsd = usSubtotal + taxUsd + forwarding;
  const totalCostKrw = Math.round(totalCostUsd * rate);

  // 국내 판매 수수료
  const domesticFeeKrw = Math.round(domestic * feeRate);
  const netRevenueKrw = domestic - domesticFeeKrw;

  // 순마진 및 마진율
  const netMarginKrw = netRevenueKrw - totalCostKrw;
  const marginRate = totalCostKrw > 0 ? (netMarginKrw / totalCostKrw) * 100 : 0;

  // 손익분기점 (수수료 포함 최소 판매가)
  const breakevenKrw = feeRate < 1 ? Math.round(totalCostKrw / (1 - feeRate)) : totalCostKrw;

  // UI 업데이트
  DOM.itemSubtotalDisplay.textContent = `${formatUsd(usSubtotal)} (${formatKrw(usSubtotal * rate)})`;
  DOM.taxDisplay.textContent = taxRate === 0 ? '0원 (면세)' : `${formatKrw(taxKrw)} (${formatUsd(taxUsd)})`;
  DOM.forwardingDisplay.textContent = `${formatUsd(forwarding)} (${formatKrw(forwarding * rate)})`;
  DOM.feeDisplay.textContent = feeRate === 0 ? '0원 (직거래)' : `${formatKrw(domesticFeeKrw)} (${(feeRate * 100).toFixed(1)}%)`;
  DOM.totalCostDisplay.textContent = formatKrw(totalCostKrw);
  DOM.breakevenDisplay.textContent = formatKrw(breakevenKrw);

  // 순마진 디스플레이 스타일
  if (netMarginKrw >= 30000) {
    DOM.netMarginDisplay.textContent = `+${formatKrw(netMarginKrw)}`;
    DOM.netMarginDisplay.className = 'text-3xl font-extrabold text-emerald-400 tracking-tight font-mono mb-1.5';
    DOM.marginRateDisplay.textContent = `마진율 +${marginRate.toFixed(1)}%`;
    DOM.marginRateDisplay.className = 'text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-950/80 border border-emerald-800/60 text-emerald-300';
    DOM.decisionBadge.textContent = '🚀 매수 추천 (3만 원 이상)';
    DOM.decisionBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/40';
  } else if (netMarginKrw > 0) {
    DOM.netMarginDisplay.textContent = `+${formatKrw(netMarginKrw)}`;
    DOM.netMarginDisplay.className = 'text-3xl font-extrabold text-yellow-400 tracking-tight font-mono mb-1.5';
    DOM.marginRateDisplay.textContent = `마진율 +${marginRate.toFixed(1)}%`;
    DOM.marginRateDisplay.className = 'text-xs px-2.5 py-0.5 rounded-full font-mono bg-yellow-950/80 border border-yellow-800/60 text-yellow-300';
    DOM.decisionBadge.textContent = '⚠️ 소액 마진 (신중)';
    DOM.decisionBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700/40';
  } else {
    DOM.netMarginDisplay.textContent = formatKrw(netMarginKrw);
    DOM.netMarginDisplay.className = 'text-3xl font-extrabold text-rose-400 tracking-tight font-mono mb-1.5';
    DOM.marginRateDisplay.textContent = `마진율 ${marginRate.toFixed(1)}%`;
    DOM.marginRateDisplay.className = 'text-xs px-2.5 py-0.5 rounded-full font-mono bg-rose-950/80 border border-rose-800/60 text-rose-300';
    DOM.decisionBadge.textContent = '🛑 적자 주의';
    DOM.decisionBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-900/40 text-rose-300 border border-rose-700/40';
  }
}

// Stepper and Value Controls
function adjustValue(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  let val = parseFloat(el.value) || 0;
  val = Math.max(0, val + delta);
  if (id === 'price-usd' || id === 'shipping-usd') {
    el.value = (Math.round(val * 100) / 100).toFixed(2);
  } else {
    el.value = Math.round(val);
  }
  calculate();
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = val;
  calculate();
}

// Quick Presets
const PRESETS = {
  kot: { price: 580, shipping: 0, domestic: 1150000 },
  hxone: { price: 189.99, shipping: 0, domestic: 370000 },
  secret: { price: 179.99, shipping: 0, domestic: 320000 },
  halo: { price: 209.99, shipping: 0, domestic: 320000 },
};

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  DOM.priceUsd.value = p.price;
  DOM.shippingUsd.value = p.shipping;
  DOM.domesticKrw.value = p.domestic;
  calculate();
}

// Copy URL with query params
function copyShareLink() {
  const params = new URLSearchParams({
    price: DOM.priceUsd.value,
    shipping: DOM.shippingUsd.value,
    domestic: DOM.domesticKrw.value,
    rate: DOM.exchangeRate.value,
    forwarding: DOM.forwardingUsd.value,
  });
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

  navigator.clipboard.writeText(url).then(() => {
    DOM.copyToast.classList.remove('hidden');
    setTimeout(() => {
      DOM.copyToast.classList.add('hidden');
    }, 2500);
  });
}

// Initialize from URL params if present
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('price')) DOM.priceUsd.value = params.get('price');
  if (params.has('shipping')) DOM.shippingUsd.value = params.get('shipping');
  if (params.has('domestic')) DOM.domesticKrw.value = params.get('domestic');
  if (params.has('rate')) DOM.exchangeRate.value = params.get('rate');
  if (params.has('forwarding')) DOM.forwardingUsd.value = params.get('forwarding');
}

// Event Listeners
[
  DOM.priceUsd,
  DOM.shippingUsd,
  DOM.domesticKrw,
  DOM.exchangeRate,
  DOM.forwardingUsd,
  DOM.platformFee,
].forEach(el => {
  el.addEventListener('input', calculate);
  el.addEventListener('change', calculate);
});

// Run on load
initFromUrl();
calculate();
