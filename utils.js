export const SYSTEM_CONSTANTS() {
  return {
    lambda_1: 0.0001,
    lambda_2: 0.00005,
    lambda_3: 0.0002,
    lambda_4: 0.00015,
  };
}

export const toNum = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

export const calculateDamage = (inputs) => {
  const {
    skill_multiplier, D, E, b_c, d_c, R, h, b_d, b_s, b_e, flow_percent,
    damage_increase, skill_damage_increase, d_s, d_f, d_d, d_e, b_b, hp,
    b_c_defense, d_c_defense, flow_resist_percent, damage_reduction,
    skill_damage_reduction, lambda_1, lambda_2, lambda_3, lambda_4, W, gold_i
  } = Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, toNum(value)])
  );

  const c = b_c - b_c_defense;
  const p_c = Math.min(1, Math.max(0, lambda_1 * c));
  const r_h = Math.min(1, Math.max(0, lambda_2 * h));
  const r_b = Math.min(1, Math.max(0, lambda_3 * b_b));
  const p_h = p_c * r_h * (1 - r_b);
  const m_c = p_h * d_c;
  const d_mul = skill_multiplier * (1 + m_c + flow_percent + damage_increase + skill_damage_increase + gold_i);
  const G = Math.max(1, 1 - lambda_4 * (b_s - d_s));
  const A = (D + E * W) * G;
  const gamma = Math.min(0.9, d_d / (d_d + b_d + 1000));
  const beta = Math.min(0.9, d_e / (d_e + b_e + 500));
  const baseDamage = A * d_mul * (1 - gamma) * (1 - beta);
  const finalDamage = baseDamage * (1 - damage_reduction - skill_damage_reduction);
  const totalReduction = 1 - (finalDamage / (A * d_mul));
  const ehp = hp / (1 - totalReduction);
  const base_elementalDamage = E * W * d_mul * (1 - gamma) * (1 - beta);
  const elementalDamage = base_elementalDamage * (1 - damage_reduction - skill_damage_reduction);
  const base_elementalDamagePrecentage = baseDamage ? base_elementalDamage / baseDamage : 0;
  const elementalDamagePrecentage = finalDamage ? elementalDamage / finalDamage : 0;

  return {
    c: c.toFixed(2),
    p_c: p_c.toFixed(4),
    r_h: r_h.toFixed(4),
    r_b: r_b.toFixed(4),
    p_h: p_h.toFixed(4),
    m_c: m_c.toFixed(4),
    d_mul: d_mul.toFixed(2),
    G: G.toFixed(2),
    A: A.toFixed(2),
    gamma: gamma.toFixed(4),
    beta: beta.toFixed(4),
    baseDamage: baseDamage.toFixed(2),
    finalDamage: finalDamage.toFixed(2),
    totalReduction: totalReduction.toFixed(4),
    ehp: ehp.toFixed(2),
    base_elementalDamage: base_elementalDamage.toFixed(2),
    elementalDamage: elementalDamage.toFixed(2),
    base_elementalDamagePrecentage: (base_elementalDamagePrecentage * 100).toFixed(2) + '%',
    elementalDamagePrecentage: (elementalDamagePrecentage * 100).toFixed(2) + '%'
  };
};

export const generateDefenseChartData = (inputs) => {
  const deltaData = [];
  const reductionData = [];
  const points = Array.from({ length: 101 }, (_, i) => i * 100);

  for (const point of points) {
    const baseInputs = { ...inputs, d_s: point, d_d: point, d_f: point, d_e: point, b_b: point };
    const baseResult = calculateDamage({ ...inputs, d_s: 0, d_d: 0, d_f: 0, d_e: 0, b_b: 0 });
    const results = {
      ds: calculateDamage({ ...baseInputs, d_s: point, d_d: 0, d_f: 0, d_e: 0, b_b: 0 }),
      dd: calculateDamage({ ...baseInputs, d_s: 0, d_d: point, d_f: 0, d_e: 0, b_b: 0 }),
      df: calculateDamage({ ...baseInputs, d_s: 0, d_d: 0, d_f: point, d_e: 0, b_b: 0 }),
      de: calculateDamage({ ...baseInputs, d_s: 0, d_d: 0, d_f: 0, d_e: point, b_b: 0 }),
      bb: calculateDamage({ ...baseInputs, d_s: 0, d_d: 0, d_f: 0, d_e: 0, b_b: point })
    };

    deltaData.push({
      point,
      ds: (baseResult.totalReduction - results.ds.totalReduction),
      dd: (baseResult.totalReduction - results.dd.totalReduction),
      df: (baseResult.totalReduction - results.df.totalReduction),
      de: (baseResult.totalReduction - results.de.totalReduction),
      bb: (baseResult.totalReduction - results.bb.totalReduction)
    });

    reductionData.push({
      point,
      ds: results.ds.totalReduction,
      dd: results.dd.totalReduction,
      df: results.df.totalReduction,
      de: results.de.totalReduction,
      bb: results.bb.totalReduction
    });
  }

  return { deltaData, reductionData };
};

export const generateAttackChartData = (inputs) => {
  const deltaData = [];
  const cumulativeData = [];
  const points = Array.from({ length: 101 }, (_, i) => i * 100);

  for (const point of points) {
    const baseInputs = { ...inputs, b_d: point, b_e: point, D: point };
    const baseResult = calculateDamage({ ...inputs, b_d: 0, b_e: 0, D: inputs.D });
    const results = {
      b_d: calculateDamage({ ...baseInputs, b_d: point, b_e: 0, D: inputs.D }),
      b_e: calculateDamage({ ...baseInputs, b_d: 0, b_e: point, D: inputs.D }),
      D: calculateDamage({ ...baseInputs, b_d: 0, b_e: 0, D: point })
    };

    const baseDamage = baseResult.finalDamage;
    deltaData.push({
      point,
      b_d: (results.b_d.finalDamage - baseDamage) / baseDamage,
      b_e: (results.b_e.finalDamage - baseDamage) / baseDamage,
      D: (results.D.finalDamage - baseDamage) / baseDamage
    });

    cumulativeData.push({
      point,
      b_d: (results.b_d.finalDamage - baseDamage) / baseDamage,
      b_e: (results.b_e.finalDamage - baseDamage) / baseDamage,
      D: (results.D.finalDamage - baseDamage) / baseDamage
    });
  }

  return { deltaData, cumulativeData };
};