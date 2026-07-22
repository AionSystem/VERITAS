const { CERTUSEngine } = require('./certus-engine-v3.2.2.js');
const assert = (name, cond, detail='') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ['+detail+']' : ''}`);

(async () => {
  const eng = new CERTUSEngine();
  // README's documented initialization form — previously broken (C-02/init)
  const init = await eng.initialize(null, null, {
    photoModel: { id: 'openrouter/gpt-4o-mini+claude-3.5-sonnet', type: 'openrouter', calibration_status: 'UNCALIBRATED', calibration_samples: 0 }
  });
  assert('initialize() accepts options object', init.success === true, `storage=${init.storage}`);
  assert('photo model registered (C-02)', eng._photoModelConfig && eng._photoModelConfig.trust_score === 0);

  const now = new Date().toISOString();
  const rpt = { uuid: 'r1', timestamp: now, internalTier: 'Partially damaged', infraType: 'Residential',
                lat: 10, lng: 10, photo: 'data:image/jpeg;base64,AAAABBBB', photoAiScore: 1.0, photoAiConf: 0.95, reporter_id: 'rep1' };
  const nearby = [
    { uuid: 'n1', lat: 10.0001, lng: 10.0001, internalTier: 'Partially damaged', timestamp: now, reporter_id: 'rep2' },
    { uuid: 'n2', lat: 10.0002, lng: 10.0002, internalTier: 'Partially damaged', timestamp: now, reporter_id: 'rep3' }
  ];

  // F-02: perfect inputs must cap at 0.95
  const res = await eng.score(rpt, nearby, true, {});
  assert('F-02 epistemic ceiling enforced', res.dci <= 0.95, `dci=${res.dci}`);
  // H-02: flat lat/lng no longer kills corroboration
  assert('H-02 COR evaluable with flat lat/lng', res.dci_cor !== null, `cor=${res.dci_cor}`);
  // C-02: UNCALIBRATED real model carries documented 0.20 penalty
  assert('C-02 UNCALIBRATED penalty applied', res.dci_uncertainty_mass >= 0.15, `um=${res.dci_uncertainty_mass}`);
  // H-04: no ground truth -> null, not someone else's id
  assert('H-04 fcl_entry_id null w/o ground truth', res.fcl_entry_id === null);
  // Seal present, SHA-256, version-consistent
  assert('seal SHA-256 + version match', res.integrity_seal.algorithm === 'SHA-256' && res.integrity_seal.payload.includes(res.version), res.version);

  // C-02: trust progression reduces penalty with zero code changes
  await eng.updateModelCalibration(300, 'PARTIAL');
  assert('C-02 trust after 300 samples in 0.60–0.85', eng._photoModelConfig.trust_score >= 0.60 && eng._photoModelConfig.trust_score <= 0.85, `trust=${eng._photoModelConfig.trust_score}`);
  const res2 = await eng.score({ ...rpt, uuid: 'r1b' }, nearby, true, {});
  assert('C-02 penalty drops with calibration', res2.dci_uncertainty_mass < res.dci_uncertainty_mass, `${res.dci_uncertainty_mass} -> ${res2.dci_uncertainty_mass}`);

  // C-01: calibrateWeights exists and behaves on both paths
  const cw1 = eng.calibrateWeights(20);
  assert('C-01 calibrateWeights insufficient path', cw1.calibrated === false && cw1.reason === 'INSUFFICIENT_GROUND_TRUTH');
  for (let i = 0; i < 25; i++) {
    eng._logFCLEntry({ _reportUuid: 'g'+i, dci: 0.7, tier: 'high', dci_validity_status: 'VALID', dci_uncertainty_mass: 0.2,
      dci_pes: 0.8, dci_cor: 0.6, dci_tfr: 0.9, dci_cci: 1.0 },
      { damage_level: 'Partially damaged', verified_by: 'field', verification_date: now, outcome: 'CONFIRMED' }, 'h'+i);
  }
  const cw2 = eng.calibrateWeights(20);
  const wSum = Object.values(cw2.updated_weights_dampened).reduce((a,b)=>a+b,0);
  assert('C-01 calibrateWeights computes + normalizes', cw2.calibrated === true && Math.abs(wSum - 1) < 0.01, `sum=${wSum.toFixed(4)}`);

  // C-03: witness extraction
  const w = eng._extractDamageFromWitness({ text: 'the building is destroyed, total rubble everywhere, emergency' });
  assert('C-03 witness extraction', w && w.damage_level === 'Completely damaged' && w.is_urgent === true, `conf=${w && w.confidence}`);
  const viaNLP = await eng.scoreWithNLP({ uuid: 'r3', timestamp: now, witness_statement: 'house destroyed, rubble, emergency', description: 'my house', lat: 10, lng: 10 }, [], false, {});
  assert('C-03 scoreWithNLP no longer throws', typeof viaNLP === 'object' && viaNLP.dci !== undefined, `dci=${viaNLP.dci}`);

  // C-04: appeals with cumulative ceiling
  const ap1 = await eng.processAppeal({ ...rpt, uuid: 'r4', appeal_count: 0 }, ['field'], { nearbyReports: nearby, isRealModel: true });
  assert('C-04 appeal accepted + ceiling held', ap1.accepted === true && ap1.dci <= 0.95, `dci=${ap1.dci} boost=${ap1.appeal_record.boost_applied}`);
  const apMax = await eng.processAppeal({ ...rpt, uuid: 'r4', appeal_count: 3 }, ['field'], {});
  assert('C-04 max appeals enforced', apMax.accepted === false && apMax.reason === 'MAX_APPEALS_REACHED');
  const apNoEv = await eng.processAppeal({ ...rpt, uuid: 'r5', appeal_count: 0 }, [], {});
  assert('C-04 new evidence required', apNoEv.accepted === false && apNoEv.reason === 'NEW_EVIDENCE_REQUIRED');

  // H-01: reputation weights bounded, no negatives
  eng._reputationStore.set('hero', { score: 80, banned: false, verified_reports: 8, false_reports: 0 });
  eng._reputationStore.set('shaky', { score: -40, banned: false, verified_reports: 0, false_reports: 2 });
  const cor = eng.computeCOR(
    [{ internalTier: 'Partially damaged', reporter_id: 'hero', lat: 1, lng: 1 },
     { internalTier: 'Completely damaged', reporter_id: 'shaky', lat: 1, lng: 1 }],
    'Partially damaged', 'x', (rid) => eng._reputationStore.get(rid) || { score: 0, banned: false });
  assert('H-01 COR sane in [0,1] with mixed reputations', cor.value >= 0 && cor.value <= 1, `cor=${cor.value} signal=${cor.signal_type}`);

  // M-03: big cluster needs 60% severe, not a fixed 3
  const mk = (i, tier) => ({ uuid: 'c'+i, lat: 20 + i*0.0001, lng: 20, internalTier: tier, timestamp: now });
  const bigMild = [...Array(17)].map((_,i)=>mk(i,'Partially damaged')).concat([mk(17,'Completely damaged'), mk(18,'Completely damaged'), mk(19,'Completely damaged')]);
  const cl = eng.detectSpatialCluster(bigMild);
  assert('M-03 3/20 severe is ELEVATED not MASS_CASUALTY', cl.cluster_detected === true && cl.severity === 'ELEVATED', `severity=${cl.severity}`);

  // M-04: photoAiScore of 0 is a real score
  const pesZero = eng.computePES({ photo: 'x', photoAiScore: 0, photoAiConf: 0.9 }, true);
  assert('M-04 score 0 evaluable', pesZero.evaluable === true && pesZero.value === 0, `class=${pesZero.measurement_class}`);

  // H-03: Overpass gated off by default (test = no network call crash, radius default)
  assert('H-03 density lookup off by default', res.dci_cor_radius_source === 'default' && eng.PRODUCTION.enableDensityRadiusLookup === false);

  // exportMetrics now reflects real calibration state
  const m = eng.exportMetrics();
  assert('exportMetrics shows registered trust', m.calibration.model_trust_score > 0 && m.calibration.model_calibration_status === 'PARTIAL', `trust=${m.calibration.model_trust_score}`);

  console.log('\nAll checks complete.');
})().catch(e => { console.error('SMOKE TEST CRASHED:', e); process.exit(1); });
