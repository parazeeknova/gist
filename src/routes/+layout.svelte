<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>gist - parazeeknova</title>
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="manifest" href="/manifest.json" />
	<link rel="mask-icon" href="/gist.svg" color="#000000" />
	<link rel="shortcut icon" href="/gist.svg" />
	<meta name="msapplication-TileColor" content="#000000" />
	<meta name="msapplication-config" content="/browserconfig.xml" />
	<meta name="theme-color" content="#ffffff" />
	<meta name="description" content="third year undergrad, full stack and devops engineer" />
	<meta name="keywords" content="gist, parazeeknova, developer, fullstack, devops" />
	<meta name="author" content="parazeeknova" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="gist - parazeeknova" />
	<meta property="og:description" content="third year undergrad, fullstack & devops engineer" />
	<meta property="og:image" content="/android-chrome-512x512.png" />
	<meta property="og:url" content="https://folio.zephyyrr.in" />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content="gist - parazeeknova" />
	<meta
		property="twitter:description"
		content="third year undergrad, fullstack & devops engineer"
	/>
	<meta property="twitter:image" content="/android-chrome-512x512.png" />
	<meta name="application-name" content="gist - parazeeknova" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="gist" />
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

{@render children?.()}
