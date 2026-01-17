/**
 * WebView Bypass Component
 * 
 * Wrapper that uses PuppeteerWebView for server-side browser session.
 * Opens a real browser on the server, streams screenshots to the client,
 * and extracts cookies after the user solves any challenges.
 */

import PuppeteerWebView from './PuppeteerWebView';

interface WebViewBypassProps {
    open: boolean;
    onClose: () => void;
    url: string;
    pluginId: string;
    onSuccess?: () => void;
}

export default function WebViewBypass(props: WebViewBypassProps) {
    return <PuppeteerWebView {...props} />;
}
