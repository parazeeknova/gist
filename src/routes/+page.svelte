<script lang="ts">
	import Dithering from '../lib/Dithering.svelte';

	let isDarkMode = true;

	function toggleTheme() {
		isDarkMode = !isDarkMode;
	}
</script>

<div class="relative flex min-h-screen overflow-hidden">
	<div
		class="relative z-10 w-1/2 p-8 font-mono {isDarkMode
			? 'bg-black text-white'
			: 'bg-white text-black'}"
	>
		<button
			on:click={toggleTheme}
			class="absolute top-8 right-8 rounded-full p-2 transition-colors {isDarkMode
				? 'hover:bg-white/10'
				: 'hover:bg-black/10'}"
			aria-label="Toggle theme"
		>
			{#if isDarkMode}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="5" />
					<path
						d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
					/>
				</svg>
			{:else}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			{/if}
		</button>

		<div class="mb-12">
			<h1 class="text-lg font-normal">Harsh Sahu</h1>
			<p class="mb-8 text-sm">
				<a
					href="https://folio.zephyyrr.in"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:underline"
				>
					folio.zephyyrr.in (portfolio)
				</a>
			</p>
			<p class="text-sm leading-relaxed">
				Third-year CS undergrad at VIT ('27) · Fullstack & DevOps Engineer. President of the Mozilla
				Firefox Club @ VITB. Building Zephyr a social aggregator with 18K+ views since its dev
				preview and founder of Singularity Works, a freelance design & dev studio. Previously a
				Fullstack Intern in Musqat, Oman. Active in open-source, national hackathon winner, and
				published research author (CICBA '25, AI).
			</p>
		</div>

		<div class="mb-12 space-y-4">
			<div>
				<h3 class="font-bold">Full Stack Developer Intern -&gt; amasQIS.ai</h3>
				<p class="text-xs text-gray-500">Remote (Muscat, Oman) | April 2025–Present</p>
			</div>
			<div>
				<h3 class="font-bold">President -&gt; Mozilla Firefox Club</h3>
				<p class="text-xs text-gray-500">On-Site (Bhopal, India) | June 2025–Present</p>
			</div>
			<div>
				<h3 class="font-bold">Co-Founder -&gt; Singularity Works (Freelance web design agency)</h3>
				<p class="text-xs text-gray-500">Remote (Bhopal, India) | August 2025–Present</p>
			</div>
		</div>

		<div class="absolute bottom-8 left-8 flex space-x-6">
			<a
				href="https://github.com/parazeeknova"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm transition-opacity hover:opacity-70"
				aria-label="GitHub"
			>
				GitHub
			</a>
			<a
				href="https://linkedin.com/in/hashkharshsahu"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm transition-opacity hover:opacity-70"
				aria-label="LinkedIn"
			>
				LinkedIn
			</a>
			<a
				href="https://x.com/hashcodes_"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm transition-opacity hover:opacity-70"
				aria-label="X"
			>
				X
			</a>
		</div>
	</div>

	<div class="relative w-1/2">
		<Dithering
			width="100%"
			height="100%"
			colorBack={isDarkMode ? 'hsl(0, 0%, 0%)' : 'hsl(0, 0%, 95%)'}
			colorFront={isDarkMode ? 'hsl(320, 100%, 70%)' : 'hsl(220, 100%, 70%)'}
			shape="simplex"
			type="4x4"
			pxSize={3}
			offsetX={0}
			offsetY={0}
			scale={0.8}
			rotation={0}
			speed={0.1}
		/>
	</div>
</div>

<style>
	.text-gray-500 {
		color: rgb(107 114 128);
	}

	.text-sm {
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	.text-lg {
		font-size: 1.125rem;
		line-height: 1.75rem;
	}

	.font-normal {
		font-weight: 400;
	}

	.font-bold {
		font-weight: 700;
	}

	.font-mono {
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
	}

	.leading-relaxed {
		line-height: 1.625;
	}

	.space-y-4 > * + * {
		margin-top: 1rem;
	}

	.space-x-6 > * + * {
		margin-left: 1.5rem;
	}

	.hover\:underline:hover {
		text-decoration-line: underline;
	}

	.hover\:opacity-70:hover {
		opacity: 0.7;
	}

	.hover\:bg-white\/10:hover {
		background-color: rgb(255 255 255 / 0.1);
	}

	.hover\:bg-black\/10:hover {
		background-color: rgb(0 0 0 / 0.1);
	}

	.transition-colors {
		transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.transition-opacity {
		transition-property: opacity;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.p-2 {
		padding: 0.5rem;
	}

	.p-8 {
		padding: 2rem;
	}

	.mb-8 {
		margin-bottom: 2rem;
	}

	.mb-12 {
		margin-bottom: 3rem;
	}

	.absolute {
		position: absolute;
	}

	.relative {
		position: relative;
	}

	.top-8 {
		top: 2rem;
	}

	.right-8 {
		right: 2rem;
	}

	.bottom-8 {
		bottom: 2rem;
	}

	.left-8 {
		left: 2rem;
	}

	.flex {
		display: flex;
	}

	.w-1\/2 {
		width: 50%;
	}

	.min-h-screen {
		min-height: 100vh;
	}

	.overflow-hidden {
		overflow: hidden;
	}

	.z-10 {
		z-index: 10;
	}

	.rounded-full {
		border-radius: 9999px;
	}

	.bg-black {
		background-color: rgb(0 0 0);
	}

	.bg-white {
		background-color: rgb(255 255 255);
	}

	.text-black {
		color: rgb(0 0 0);
	}

	.text-white {
		color: rgb(255 255 255);
	}
</style>
