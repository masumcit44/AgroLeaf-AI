// Renders the feature slots. Owned by the lead: feature agents only fill their own folder.
// A slot renders a feature only when its flag is on, and inside an error boundary, so a broken
// feature disappears instead of breaking the diagnosis screen.
import React from 'react';
import { isFeatureOn } from './flags.js';
import { SLOT_LAYOUT, FEATURE_ROUTES } from './slotLayout.js';

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
  return (SLOT_LAYOUT[slot] || [])
    .filter(([name]) => isFeatureOn(name))
    .map(([name, Component]) => (
      <SlotBoundary key={`${slot}-${name}`} name={name}>
        <Component scan={scan} context={slot} />
      </SlotBoundary>
    ));
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
