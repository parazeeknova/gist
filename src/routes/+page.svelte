<script lang="ts">
	import Dithering from '../lib/Dithering.svelte';
	import gsap from 'gsap';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let isDarkMode = true;
	let leftPanel: HTMLDivElement;
	let ditheringContainer: HTMLDivElement;
	let mainContainer: HTMLDivElement;
	let isMobile = false;
	let portfolioLink: HTMLAnchorElement;
	let zephyrLink: HTMLAnchorElement;
	let singularityLink: HTMLAnchorElement;
	let githubLink: HTMLAnchorElement;
	let linkedinLink: HTMLAnchorElement;
	let twitterLink: HTMLAnchorElement;
	let ditheringColorBack = isDarkMode ? 'hsl(0, 0%, 0%)' : 'hsl(0, 0%, 95%)';
	let ditheringColorFront = isDarkMode ? 'hsl(360, 0%, 76%)' : 'hsl(220, 100%, 70%)';

	function toggleTheme() {
		isDarkMode = !isDarkMode;
	}


	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 1024;
		}
	}

	onMount(() => {
		checkMobile();
		if (browser) {
			initLinkAnimations();
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});

	function initLinkAnimations() {
		const links = [
			portfolioLink,
			zephyrLink,
			singularityLink,
			githubLink,
			linkedinLink,
			twitterLink
		].filter(Boolean);

		links.forEach((link) => {
			if (!link) return;
			const tl = gsap.timeline({ paused: true });
			tl.fromTo(
				link,
				{ '--underline-width': '0%' },
				{
					'--underline-width': '100%',
					duration: 0.3,
					ease: 'power2.out'
				}
			);

			link.addEventListener('mouseenter', () => tl.play());
			link.addEventListener('mouseleave', () => tl.reverse());
		});
	}

	$: if (browser && mainContainer && leftPanel && ditheringContainer) {
		const tl = gsap.timeline();

		tl.to([leftPanel, ditheringContainer], {
			opacity: 0.6,
			duration: 0.2,
			ease: 'power2.in'
		});

		tl.to(leftPanel,
			{
				backgroundColor: isDarkMode ? '#000000' : 'hsl(0, 0%, 95%)',
				color: isDarkMode ? '#ffffff' : '#000000',
				duration: 0.8,
				ease: 'power2.inOut'
			},
			0.1
		);

		tl.to({}, {
			duration: 0.8,
			ease: 'power2.inOut',
			onUpdate: function() {
				const progress = this.progress();
				const startBack = isDarkMode ? [0, 0, 95] : [0, 0, 0];
				const endBack = isDarkMode ? [0, 0, 0] : [0, 0, 95];
				const startFront = isDarkMode ? [220, 100, 70] : [360, 0, 76];
				const endFront = isDarkMode ? [360, 0, 76] : [220, 100, 70];

				const currentBack = startBack.map((start, i) =>
					Math.round(start + (endBack[i] - start) * progress)
				);
				const currentFront = startFront.map((start, i) =>
					Math.round(start + (endFront[i] - start) * progress)
				);

				ditheringColorBack = `hsl(${currentBack[0]}, ${currentBack[1]}%, ${currentBack[2]}%)`;
				ditheringColorFront = `hsl(${currentFront[0]}, ${currentFront[1]}%, ${currentFront[2]}%)`;
			}
		}, 0.1);

		tl.to(
			mainContainer,
			{
				scale: 0.98,
				duration: 0.4,
				ease: 'power2.inOut',
				yoyo: true,
				repeat: 1
			},
			0.1
		);

		tl.to(
			[leftPanel, ditheringContainer],
			{
				opacity: 1,
				duration: 0.3,
				ease: 'power2.out'
			},
			0.7
		);
	}
</script>

<div
	class="relative grid min-h-screen grid-cols-1 overflow-hidden lg:h-screen lg:grid-cols-2"
	bind:this={mainContainer}
>
	<div
		bind:this={leftPanel}
		class="relative z-10 cursor-default p-4 font-mono select-none sm:p-6 lg:p-8 {isDarkMode
			? 'bg-black text-white'
			: 'bg-[hsl(0,0%,95%)] text-black'}"
	>
		<button
			on:click={toggleTheme}
			class="absolute top-4 right-4 rounded-full p-2 transition-colors sm:top-6 sm:right-6 lg:top-8 lg:right-8 {isDarkMode
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

		<div class="mb-8 sm:mb-12">
			<h1 class="text-xl font-normal sm:text-2xl">Harsh Sahu</h1>
			<p class="mb-6 text-sm sm:mb-8 sm:text-base">
				<a
					bind:this={portfolioLink}
					href="https://folio.zephyyrr.in"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline"
				>
					designer portfolio
					<span class="ml-1">↗</span>
				</a>
			</p>
			<p class="text-sm leading-relaxed sm:text-base">
				Engineer and founder, building web platforms, infrastructure, and tools. Creator of <a
					bind:this={zephyrLink}
					href="https://zephyyrr.in"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline">Zephyr</a
				>. Runs
				<a
					bind:this={singularityLink}
					href="https://singularityworks.xyz"
					target="_blank"
					rel="noopener noreferrer"
					class="link-underline">Singularity Works</a
				>, a freelance design and development studio. CS undergrad, active in open-source and
				hackathons.
			</p>
		</div>

		<div class="mb-8 space-y-3 sm:mb-12 sm:space-y-4">
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					Co-Founder <span class="mx-1 text-base font-light opacity-80">⟶</span> Singularity Works
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">
					On-Site (Bhopal, India) | August 2025–Present
				</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					Full Stack Developer Intern <span class="mx-1 text-base font-light opacity-80">⟶</span> amasQIS.ai
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">Remote (Muscat, Oman) | April 2025–Present</p>
			</div>
			<div>
				<h3 class="text-xs font-medium sm:text-sm">
					President <span class="mx-1 text-base font-light opacity-80">⟶</span> Mozilla Firefox Club
				</h3>
				<p class="text-xs text-gray-500 sm:text-sm">On-Site (Bhopal, India) | June 2025–Present</p>
			</div>
		</div>

		<div
			class="absolute bottom-4 left-4 flex space-x-6 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8"
		>
			<a
				bind:this={githubLink}
				href="https://github.com/parazeeknova"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="GitHub"
			>
				GitHub
			</a>
			<a
				bind:this={linkedinLink}
				href="https://www.linkedin.com/in/hashk"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="LinkedIn"
			>
				LinkedIn
			</a>
			<a
				bind:this={twitterLink}
				href="https://x.com/hashcodes_"
				target="_blank"
				rel="noopener noreferrer"
				class="link-underline text-xs sm:text-sm"
				aria-label="X"
			>
				X
			</a>
		</div>
	</div>

	<div class="relative" bind:this={ditheringContainer}>
		<Dithering
			width="100%"
			height="100%"
			fit="cover"
			colorBack={ditheringColorBack}
			colorFront={ditheringColorFront}
			shape={isMobile ? 'wave' : 'simplex'}
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
	.link-underline {
		position: relative;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.link-underline::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: var(--underline-width, 0%);
		height: 1px;
		background-color: currentColor;
		transition: width 0.3s ease;
	}

	.link-underline:hover {
		opacity: 1;
	}
</style>
