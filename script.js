// ==================== SA BOND CALCULATOR ====================
// National Credit Act (NCA) compliant affordability calculations
// Transfer Duty: SARS 2024/2025 tables
// Attorney fees: Legal Practice Council prescribed tariff estimates

const BLOUKLOOF_MIN_PRICE = 1095000;
const NCA_RATIO = 0.30; // 30% of gross income — standard SA bank rule

function formatNum(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatR(n) {
    return 'R ' + formatNum(n);
}

function calcMonthlyRepayment(principal, annualRate, years) {
    if (principal <= 0) return 0;
    const r = annualRate / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function loanFromRepayment(monthly, annualRate, years) {
    if (monthly <= 0) return 0;
    const r = annualRate / 12;
    const n = years * 12;
    if (r === 0) return monthly * n;
    return monthly * (1 - Math.pow(1 + r, -n)) / r;
}

// SARS Transfer Duty 2024/2025
function transferDuty(value) {
    if (value <= 1100000) return 0;
    if (value <= 1512500) return (value - 1100000) * 0.03;
    if (value <= 2117500) return 12375 + (value - 1512500) * 0.06;
    if (value <= 2722500) return 48675 + (value - 2117500) * 0.08;
    if (value <= 12100000) return 97075 + (value - 2722500) * 0.11;
    return 1128600 + (value - 12100000) * 0.13;
}

// Bond registration costs: LPC prescribed tariffs + Deeds Office + VAT (est.)
function bondRegCosts(bondAmt) {
    let fee;
    if (bondAmt <= 100000)      fee = 5200;
    else if (bondAmt <= 250000) fee = 7800;
    else if (bondAmt <= 500000) fee = 10500;
    else if (bondAmt <= 750000) fee = 13200;
    else if (bondAmt <= 1000000) fee = 15600;
    else if (bondAmt <= 1500000) fee = 19200;
    else if (bondAmt <= 2000000) fee = 22800;
    else if (bondAmt <= 3000000) fee = 28500;
    else fee = bondAmt * 0.0092;
    const vat = fee * 0.15;
    const deeds = Math.min(1800 + bondAmt * 0.001, 7500);
    return Math.round(fee + vat + deeds);
}

// Transfer attorney costs: LPC tariffs + Deeds Office + VAT (est.)
function transferAttyCosts(propValue) {
    let fee;
    if (propValue <= 100000)      fee = 5000;
    else if (propValue <= 250000) fee = 7200;
    else if (propValue <= 500000) fee = 9800;
    else if (propValue <= 750000) fee = 12400;
    else if (propValue <= 1000000) fee = 15000;
    else if (propValue <= 1500000) fee = 18600;
    else if (propValue <= 2000000) fee = 22200;
    else if (propValue <= 3000000) fee = 27000;
    else fee = propValue * 0.0088;
    const vat = fee * 0.15;
    const deeds = Math.min(1600 + propValue * 0.0008, 6500);
    return Math.round(fee + vat + deeds);
}

function setSliderTrack(slider) {
    const pct = ((parseFloat(slider.value) - parseFloat(slider.min)) / (parseFloat(slider.max) - parseFloat(slider.min))) * 100;
    slider.style.background = `linear-gradient(to right, #e74c3c ${pct}%, rgba(255,255,255,0.18) ${pct}%)`;
}

function calculateBond() {
    const salary  = parseFloat(document.getElementById('salarySlider').value) || 0;
    const debt    = parseFloat(document.getElementById('debtInput').value)    || 0;
    const deposit = parseFloat(document.getElementById('depositSlider').value) || 0;
    const term    = parseFloat(document.getElementById('termSlider').value)    || 20;
    const rate    = parseFloat(document.getElementById('rateSlider').value) / 100 || 0.1175;

    // Update slider display labels
    document.getElementById('salaryDisplay').textContent  = formatNum(salary);
    document.getElementById('depositDisplay').textContent = formatNum(deposit);
    document.getElementById('termDisplay').textContent    = term;
    document.getElementById('termYearsDisplay').textContent = term;
    document.getElementById('rateDisplay').textContent    = parseFloat(document.getElementById('rateSlider').value).toFixed(2);

    // Animate slider tracks
    ['salarySlider','depositSlider','termSlider','rateSlider'].forEach(id => {
        setSliderTrack(document.getElementById(id));
    });

    // ── Core NCA affordability ──
    const maxMonthly = Math.max(0, salary * NCA_RATIO - debt);
    const bondAmt    = Math.round(loanFromRepayment(maxMonthly, rate, term) / 1000) * 1000;
    const propValue  = bondAmt + deposit;
    const actualMonthly = calcMonthlyRepayment(bondAmt, rate, term);
    const totalRepay    = actualMonthly * term * 12;
    const totalInterest = totalRepay - bondAmt;

    // ── Results ──
    document.getElementById('bondAmountResult').textContent    = formatNum(bondAmt);
    document.getElementById('propertyValueResult').textContent = formatR(propValue);
    document.getElementById('monthlyRepayResult').textContent  = formatR(actualMonthly);
    document.getElementById('totalRepayResult').textContent    = formatR(totalRepay);
    document.getElementById('totalInterestResult').textContent = formatR(totalInterest);

    // ── Affordability gauge ──
    const ratioPct = salary > 0 ? (maxMonthly / salary) * 100 : 0;
    const fillPct  = Math.min((ratioPct / 35) * 100, 100);
    const fill     = document.getElementById('affordabilityFill');
    fill.style.width = fillPct + '%';
    let gaugeColor = ratioPct > 30 ? '#e74c3c' : ratioPct > 25 ? '#f39c12' : '#27ae60';
    fill.style.background = gaugeColor;
    document.getElementById('affordabilityPct').textContent = ratioPct.toFixed(1) + '%';
    document.getElementById('affordabilityPct').style.color = gaugeColor;

    // ── Bloukloof qualifier ──
    const qualifier = document.getElementById('bkQualifier');
    const qIcon     = document.getElementById('bkQualIcon');
    const qTitle    = document.getElementById('bkQualTitle');
    const qSub      = document.getElementById('bkQualSub');
    const shortfall = BLOUKLOOF_MIN_PRICE - propValue;

    if (propValue >= BLOUKLOOF_MIN_PRICE) {
        qualifier.className = 'bk-qualifier qualify-yes';
        qIcon.textContent  = '✓';
        qTitle.textContent = 'You Qualify for Bloukloof@69!';
        qSub.textContent   = `Your budget of ${formatR(propValue)} covers homes from R1,095,000`;
    } else if (shortfall <= 200000) {
        qualifier.className = 'bk-qualifier qualify-close';
        qIcon.textContent  = '≈';
        qTitle.textContent = 'Almost There!';
        qSub.textContent   = `Only ${formatR(shortfall)} short — a larger deposit could bridge the gap`;
    } else {
        qualifier.className = 'bk-qualifier qualify-no';
        qIcon.textContent  = '✗';
        qTitle.textContent = 'Keep Building Towards Bloukloof';
        qSub.textContent   = `You need ${formatR(shortfall)} more — increase income or deposit`;
    }

    // ── Cost breakdown ──
    const duty    = transferDuty(propValue);
    const bondReg = bondAmt > 0 ? bondRegCosts(bondAmt) : 0;
    const transAtty = propValue > 0 ? transferAttyCosts(propValue) : 0;

    document.getElementById('transferDutyResult').textContent = formatR(duty);
    document.getElementById('transferDutyNote').textContent =
        propValue <= 1100000 ? 'Properties under R1.1M are SARS exempt — great news!'
                             : `Progressive SARS rate on property value of ${formatR(propValue)}`;

    document.getElementById('bondRegResult').textContent      = formatR(bondReg);
    document.getElementById('transferAttyResult').textContent = formatR(transAtty);
    document.getElementById('totalAdditionalResult').textContent = formatR(duty + bondReg + transAtty);
}

// ==================== NAVIGATION ====================

function scrollToCalculator() {
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function startFullQuiz() {
    alert('Welcome to the Bloukloof Pre-Qualification Quiz!\n\nFor full pre-qualification, contact us at 060 984 5300 or WhatsApp us now.');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('salarySlider')) return;
    const sliderIds = ['salarySlider', 'depositSlider', 'termSlider', 'rateSlider'];

    sliderIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateBond);
            setSliderTrack(el);
        }
    });

    const debtInput = document.getElementById('debtInput');
    if (debtInput) debtInput.addEventListener('input', calculateBond);

    calculateBond();
});
