import React, { useState, useSyncExternalStore } from 'react';
import { joinPilot, leavePilot, pilotState, subscribePilot } from '../services/pilot.js';

export default function PilotPanel() {
  const value = useSyncExternalStore(subscribePilot, pilotState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = value.startsWith('withdraw:');
  async function change() {
    setBusy(true);
    setMessage('');
    try {
      if (value) await leavePilot();
      else await joinPilot();
    } catch {
      setMessage(
        pilotState().startsWith('withdraw:')
          ? 'Collection stopped. Retry deletion when connected.'
          : 'Could not join the pilot. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card" aria-label="Training data pilot">
      <h3>Optional learning research pilot</h3>
      <p>
        Share future problem views, judge results, hints and recommendations under a random learner ID.
        Explanations are shared only when you select them for human review. The pilot database does not store
        submission code. You can leave and delete your pilot records from this browser. Personal practice is
        separate.
      </p>
      <button className="btn btn-secondary btn-sm" onClick={change} disabled={busy}>
        {pending ? 'Retry pilot deletion' : value ? 'Leave pilot and delete my data' : 'Join training pilot'}
      </button>{' '}
      <span role="status">{message || (value && !pending ? 'Participating' : 'Collection off')}</span>
    </section>
  );
}
