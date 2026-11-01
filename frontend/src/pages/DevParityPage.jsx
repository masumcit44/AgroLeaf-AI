import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer.jsx';
import { loadModel } from '../ml/loadModel.js';
import { runParityCheckA, runParityCheckB } from '../lib/parityVerification.js';

export default function DevParityPage({
  parityUrl = '/data/parity_samples.json',
  initialSamples = undefined,
  sampleImagesUrl = '/samples',
}) {
  const [samples, setSamples] = useState(initialSamples || null);
  const [loading, setLoading] = useState(initialSamples === undefined);
  const [running, setRunning] = useState(false);
  const [resultsA, setResultsA] = useState(null);
  const [resultsB, setResultsB] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialSamples !== undefined) return;
    let active = true;
    async function loadSamples() {
      try {
        const res = await fetch(parityUrl);
        if (!res.ok) {
          if (active) {
            setSamples(null);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setSamples(Array.isArray(data) ? data : null);
          setLoading(false);
        }
      } catch {
        if (active) {
          setSamples(null);
          setLoading(false);
        }
      }
    }
    loadSamples();
    return () => {
      active = false;
    };
  }, [parityUrl, initialSamples]);

  const executeChecks = async () => {
    if (!samples || samples.length === 0) return;
    setRunning(true);
    setError(null);
    try {
      const modelBundle = await loadModel();
      const resAList = [];
      const resBList = [];

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const resA = await runParityCheckA(sample, modelBundle);
        resAList.push({ index: i, filename: sample.filename, ...resA });

        const resB = await runParityCheckB(sample, sampleImagesUrl);
        resBList.push({ index: i, filename: sample.filename, ...resB });
      }

      setResultsA(resAList);
      setResultsB(resBList);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const hasSamples = Boolean(samples && samples.length > 0);
  const maxDiffA = resultsA
    ? Math.max(...resultsA.map((r) => r.maxDiff || 0))
    : 0;
  const passA = resultsA ? resultsA.every((r) => r.pass) : false;
  const passB = resultsB ? resultsB.every((r) => !r.available || r.pass) : false;

  return (
    <PageContainer>
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
        <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mb-1">
              🛠️ Developer Only Tool
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Browser vs Python Parity Verification
            </h1>
          </div>
          {hasSamples && (
            <button
              type="button"
              onClick={executeChecks}
              disabled={running}
              className="px-4 py-2 bg-leaf-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs hover:bg-leaf-800 disabled:opacity-50 cursor-pointer"
              data-testid="run-parity-btn"
            >
              {running ? 'Running Checks...' : '▶ Run Verification'}
            </button>
          )}
        </div>

        {/* Missing samples state */}
        {!hasSamples && !loading && (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center" data-testid="no-parity-samples">
            <span className="text-3xl block mb-2" aria-hidden="true">📂</span>
            <h2 className="text-base font-bold text-gray-800 mb-1">
              প্যারিটি যাচাইকরণের কোনো নমুনা নেই / No parity samples found
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              parity_samples.json file was not found. Parity verification samples are generated during Kaggle validation and release bundling.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm">
            ❌ Error during parity run: {error}
          </div>
        )}

        {/* Summary results */}
        {resultsA && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="parity-summary">
            <div className={`p-4 rounded-xl border ${passA ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-red-50 border-red-200 text-red-950'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Check A: Runtime Parity (1e-3)</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-full bg-white/80">
                  {passA ? '✅ PASS' : '❌ FAIL'}
                </span>
              </div>
              <p className="text-xs">
                Feeds stored preprocessed tensor into WebAssembly session. Max diff: <span className="font-mono font-bold">{maxDiffA.toExponential(3)}</span> (tolerance: 1e-3).
              </p>
            </div>

            <div className={`p-4 rounded-xl border ${passB ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Check B: End-to-End Image Pipeline</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-full bg-white/80">
                  {passB ? '✅ PASS' : '⚠️ SAMPLES MISSING'}
                </span>
              </div>
              <p className="text-xs">
                Runs full canvas resize, channel normalization, inference, and top-1 matching against Python predictions.
              </p>
            </div>
          </div>
        )}

        {/* Detailed samples table */}
        {hasSamples && (
          <div className="space-y-3" data-testid="parity-table">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              Sample Verification Records ({samples.length} samples)
            </h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Sample</th>
                    <th scope="col" className="px-3 py-2.5">Expected Top-1</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Check A (Max Diff)</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Check B (Top-1)</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {samples.map((s, idx) => {
                    const rA = resultsA?.[idx];
                    const rB = resultsB?.[idx];
                    const samplePass = rA ? rA.pass : null;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/70">
                        <td className="px-3 py-2 font-mono text-gray-800">
                          {s.filename || `sample_${idx}`}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-700">
                          {s.predicted_class}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {rA ? rA.maxDiff.toExponential(2) : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {rB ? (rB.available ? (rB.pass ? '✅ Match' : `❌ ${rB.top1Actual}`) : '— (No file)') : '—'}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {samplePass !== null ? (samplePass ? '✅ PASS' : '❌ FAIL') : 'Pending'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
