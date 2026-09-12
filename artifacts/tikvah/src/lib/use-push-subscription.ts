import { useCallback, useEffect, useState } from 'react';
import { useGetPushVapidPublicKey, useSubscribeToPush, useUnsubscribeFromPush } from '@workspace/api-client-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function subscriptionToRequest(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Push subscription is missing required fields.');
  }
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
}

/** 'blocked' means the browser permission itself was denied, not just that we haven't asked yet. */
export type PushSubscriptionState = 'unsupported' | 'checking' | 'available' | 'subscribed' | 'blocked';

const isPushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

/**
 * Drives browser push notification opt-in: checks support, tracks whether this
 * device already has a live subscription, and exposes subscribe/unsubscribe
 * actions that talk to the /push/* endpoints.
 */
export function usePushSubscription() {
  const supported = isPushSupported();
  // No auth or side effects on this GET, so it's harmless to always fetch it —
  // avoids fighting the generated hook's non-partial UseQueryOptions type for
  // a conditional `enabled` flag.
  const { data: vapid } = useGetPushVapidPublicKey();
  const subscribeMutation = useSubscribeToPush();
  const unsubscribeMutation = useUnsubscribeFromPush();

  const [state, setState] = useState<PushSubscriptionState>(supported ? 'checking' : 'unsupported');

  useEffect(() => {
    if (!supported) return;
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }

    let cancelled = false;
    navigator.serviceWorker.ready
      .then(registration => registration.pushManager.getSubscription())
      .then(subscription => {
        if (!cancelled) setState(subscription ? 'subscribed' : 'available');
      })
      .catch(() => {
        if (!cancelled) setState('available');
      });

    return () => {
      cancelled = true;
    };
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !vapid?.publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setState('blocked');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    });
    await subscribeMutation.mutateAsync({ data: subscriptionToRequest(subscription) });
    setState('subscribed');
  }, [supported, vapid, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribeMutation.mutateAsync({ data: { endpoint: subscription.endpoint } });
      await subscription.unsubscribe();
    }
    setState('available');
  }, [supported, unsubscribeMutation]);

  return {
    state,
    // Nothing to offer if the browser can't do push, or the server has no VAPID keys configured.
    canOffer: supported && Boolean(vapid?.publicKey),
    subscribe,
    unsubscribe,
    isBusy: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}
