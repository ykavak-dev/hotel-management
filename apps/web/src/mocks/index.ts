async function enableMocking() {
  if (typeof window === 'undefined') return;

  const { worker } = await import('./browser');

  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

export { enableMocking };
