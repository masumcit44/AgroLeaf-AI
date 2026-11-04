// Renders the feature slots. Owned by the lead: feature agents only fill their own folder.
// A slot renders a feature only when its flag is on, and inside an error boundary, so a broken
// feature disappears instead of breaking the diagnosis screen.
import React from 'react';
import { isFeatureOn } from './flags.js';
import { SLOT_LAYOUT, FEATURE_ROUTES, RESULT_SECONDARY } from './slotLayout.js';
import useT from '../i18n/useT.js';

export class SlotBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(`[feature:${this.props.name}] hidden after an error:`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Renders every enabled feature of one slot ('app' | 'home' | 'result'). */
export function FeatureSlot({ slot, scan = null }) {
  const entries = (SLOT_LAYOUT[slot] || []).filter(([name]) => isFeatureOn(name));
  const render = ([name, Component]) => (
    <SlotBoundary key={`${slot}-${name}`} name={name}>
      <Component scan={scan} context={slot} />
    </SlotBoundary>
  );
  // Result screen: the farmer first sees what to do; deeper analysis stays one tap away
  const secondary = slot === 'result' ? entries.filter(([name]) => RESULT_SECONDARY.has(name)) : [];
  const primary = entries.filter((e) => !secondary.includes(e));
  const items = primary.map(render);
  if (secondary.length > 0) {
    items.push(<MoreAnalysis key={`${slot}-more`}>{secondary.map(render)}</MoreAnalysis>);
  }
  return items;
}

function MoreAnalysis({ children }) {
  const { t } = useT();
  return (
    <details className="w-full max-w-sm sm:max-w-md mx-auto rounded-2xl border border-gray-200 bg-white" data-testid="more-analysis">
      <summary className="min-h-[48px] px-4 py-3 cursor-pointer font-semibold text-sm text-leaf-800 select-none">
        🔍 {t('moreAnalysis')}
      </summary>
      <div className="px-2 pb-3 space-y-4">{children}</div>
    </details>
  );
}

/** The page of a feature route when that feature is on; otherwise `fallback`. */
export function FeaturePage({ route, fallback = null }) {
  const entry = FEATURE_ROUTES[route];
  if (!entry || !isFeatureOn(entry[0])) return fallback;
  const Page = entry[1];
  return (
    <SlotBoundary name={entry[0]}>
      <Page scan={null} context="route" />
    </SlotBoundary>
  );
}
